// backend/src/scheduler/scheduler.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, MoreThan, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Waitlist } from './entities/waitlist.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Waitlist)
    private waitlistRepo: Repository<Waitlist>,
    private dataSource: DataSource,
  ) {}

  // TR-APT-001: Filter appointments by doctor
  async getAppointmentsByDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    const query = this.appointmentRepo.createQueryBuilder('apt')
      .leftJoinAndSelect('apt.patient', 'patient')
      .leftJoinAndSelect('apt.doctor', 'doctor')
      .leftJoinAndSelect('apt.chair', 'chair')
      .where('apt.doctorId = :doctorId', { doctorId });

    if (date) {
      query.andWhere('DATE(apt.startTime) = :date', { date });
    }

    return query.getMany();
  }

  // TR-APT-002: Filter appointments by treatment chair
  async getAppointmentsByChair(chairId: string, date?: string): Promise<Appointment[]> {
    const query = this.appointmentRepo.createQueryBuilder('apt')
      .leftJoinAndSelect('apt.patient', 'patient')
      .leftJoinAndSelect('apt.doctor', 'doctor')
      .leftJoinAndSelect('apt.chair', 'chair')
      .where('apt.chairId = :chairId', { chairId });

    if (date) {
      query.andWhere('DATE(apt.startTime) = :date', { date });
    }

    return query.getMany();
  }

  // TR-APT-003: Atomic Conflict Detection & Booking
  async createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);

      if (start >= end) {
        throw new ConflictException('Appointment start time must be before end time.');
      }

      // Check Doctor conflict: Overlapping time slot for the same doctor
      const doctorConflict = await queryRunner.manager.findOne(Appointment, {
        where: {
          doctorId: dto.doctorId,
          status: Not(AppointmentStatus.CANCELLED),
          startTime: LessThan(end),
          endTime: MoreThan(start),
        },
      });

      if (doctorConflict) {
        throw new ConflictException('Selected doctor is already booked during this time slot (TR-APT-003).');
      }

      // Check Chair conflict: Overlapping time slot for the same treatment chair
      const chairConflict = await queryRunner.manager.findOne(Appointment, {
        where: {
          chairId: dto.chairId,
          status: Not(AppointmentStatus.CANCELLED),
          startTime: LessThan(end),
          endTime: MoreThan(start),
        },
      });

      if (chairConflict) {
        throw new ConflictException('Selected treatment chair is already occupied during this time slot (TR-APT-003).');
      }

      const appointment = queryRunner.manager.create(Appointment, dto);
      const savedAppointment = await queryRunner.manager.save(Appointment, appointment);

      await queryRunner.commitTransaction();
      return savedAppointment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-APT-004: Appointment Status Lifecycle Transition
  async updateStatus(id: string, dto: UpdateAppointmentStatusDto): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found.`);
    }

    appointment.status = dto.status;
    return this.appointmentRepo.save(appointment);
  }

  // TR-APT-006: Waitlist Management
  async addToWaitlist(dto: CreateWaitlistDto): Promise<Waitlist> {
    const waitlistEntry = this.waitlistRepo.create(dto);
    return this.waitlistRepo.save(waitlistEntry);
  }

  async getWaitlist(): Promise<Waitlist[]> {
    return this.waitlistRepo.find({ order: { createdAt: 'ASC' } });
  }
}