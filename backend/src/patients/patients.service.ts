// backend/src/patients/patients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const year = new Date().getFullYear();
    const count = await this.patientRepository.count();
    const fileNumber = `DCMS-${year}-${String(count + 1).padStart(4, '0')}`;

    const patient = this.patientRepository.create({
      ...createPatientDto,
      fileNumber,
    });

    return await this.patientRepository.save(patient);
  }

  async search(query: string): Promise<Patient[]> {
    const q = query?.trim();

    if (!q) {
      return await this.patientRepository.find({
        take: 50,
        relations: { medicalAlerts: true },
      });
    }

    return await this.patientRepository.find({
      where: [
        { fullName: ILike(`%${q}%`) },
        { phoneNumber: ILike(`%${q}%`) },
        { fileNumber: ILike(`%${q}%`) },
      ],
      relations: { medicalAlerts: true },
      take: 20,
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: { medicalAlerts: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found.`);
    }

    return patient;
  }
}