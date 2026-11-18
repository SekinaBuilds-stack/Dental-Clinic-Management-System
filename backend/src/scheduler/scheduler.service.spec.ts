import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { AppointmentStatus } from './entities/appointment.entity';
import { makeQueryRunner } from '../test-utils/mock-query-runner';

describe('SchedulerService (FR-APT)', () => {
  let service: SchedulerService;
  let qr: ReturnType<typeof makeQueryRunner>;
  let appointmentRepo: any;
  let waitlistRepo: any;
  let gateway: any;

  const dto: any = {
    patientId: 'p1',
    doctorId: 'd1',
    chairId: 'c1',
    startTime: '2026-12-01T09:00:00.000Z',
    endTime: '2026-12-01T10:00:00.000Z',
  };

  beforeEach(() => {
    qr = makeQueryRunner();
    appointmentRepo = { findOne: vi.fn(), save: vi.fn(async (x: any) => x) };
    waitlistRepo = { create: vi.fn((x: any) => x), save: vi.fn(async (x: any) => x) };
    gateway = {
      broadcastAppointmentCreated: vi.fn(),
      broadcastAppointmentUpdate: vi.fn(),
      broadcastChairUpdate: vi.fn(),
    };
    service = new SchedulerService(appointmentRepo, waitlistRepo, qr.dataSource as any, gateway);
  });

  describe('createAppointment', () => {
    it('books when there is no doctor or chair conflict, and broadcasts', async () => {
      qr.manager.findOne.mockResolvedValue(null);
      qr.manager.save.mockResolvedValue({ id: 'a1', ...dto });

      const result = await service.createAppointment(dto);

      expect(result.id).toBe('a1');
      expect(qr.queryRunner.startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
      expect(gateway.broadcastAppointmentCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }));
    });

    it('rejects when start time is not before end time', async () => {
      await expect(
        service.createAppointment({ ...dto, startTime: dto.endTime, endTime: dto.startTime }),
      ).rejects.toThrow(ConflictException);

      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(gateway.broadcastAppointmentCreated).not.toHaveBeenCalled();
    });

    it('rejects a doctor double-booking', async () => {
      qr.manager.findOne.mockResolvedValueOnce({ id: 'existing' });

      await expect(service.createAppointment(dto)).rejects.toThrow(/doctor/i);
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.manager.save).not.toHaveBeenCalled();
    });

    it('rejects a chair double-booking', async () => {
      qr.manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'existing' });

      await expect(service.createAppointment(dto)).rejects.toThrow(/chair/i);
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.manager.save).not.toHaveBeenCalled();
    });

    it('always releases the query runner', async () => {
      qr.manager.findOne.mockResolvedValueOnce({ id: 'existing' });
      await service.createAppointment(dto).catch(() => undefined);
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException for an unknown appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing', { status: AppointmentStatus.CONFIRMED } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the status and broadcasts appointment and chair events', async () => {
      appointmentRepo.findOne.mockResolvedValue({ id: 'a1', chairId: 'c1', status: AppointmentStatus.BOOKED });

      const result = await service.updateStatus('a1', { status: AppointmentStatus.CONFIRMED } as any);

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(gateway.broadcastAppointmentUpdate).toHaveBeenCalled();
      expect(gateway.broadcastChairUpdate).toHaveBeenCalledWith({
        chairId: 'c1',
        status: AppointmentStatus.CONFIRMED,
      });
    });
  });

  describe('waitlist', () => {
    it('adds an entry to the waitlist', async () => {
      const entry: any = { patientId: 'p1' };
      const result = await service.addToWaitlist(entry);

      expect(waitlistRepo.create).toHaveBeenCalledWith(entry);
      expect(result).toEqual(entry);
    });
  });
});