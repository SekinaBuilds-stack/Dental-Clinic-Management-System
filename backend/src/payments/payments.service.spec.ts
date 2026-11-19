import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService (FR-PAY)', () => {
  let service: PaymentsService;
  let paymentRepo: any;
  let reversalRepo: any;
  let claimRepo: any;
  let planRepo: any;
  let billRepo: any;
  let dayBookRepo: any;

  beforeEach(() => {
    paymentRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'pay-1', ...x })),
    };
    reversalRepo = {
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'rev-1', ...x })),
    };
    claimRepo = {
      find: vi.fn(),
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'claim-1', ...x })),
    };
    planRepo = {
      find: vi.fn(),
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'plan-1', ...x })),
    };
    billRepo = { findOne: vi.fn(), save: vi.fn(async (x: any) => x) };
    dayBookRepo = { save: vi.fn(async (x: any) => x) };

    service = new PaymentsService(paymentRepo, reversalRepo, claimRepo, planRepo, billRepo, dayBookRepo);
  });

  describe('findPaymentById', () => {
    it('returns the payment when found', async () => {
      paymentRepo.findOne.mockResolvedValue({ id: 'pay-1' });
      await expect(service.findPaymentById('pay-1')).resolves.toEqual({ id: 'pay-1' });
      expect(paymentRepo.findOne).toHaveBeenCalledWith({ where: { id: 'pay-1' }, relations: ['bill'] });
    });

    it('throws NotFoundException when missing', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      await expect(service.findPaymentById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPayment (TR-PAY-002)', () => {
    const dto = { billId: 'b1', amount: 300, paymentMethod: 'CASH', receivedBy: 'cashier-1' };

    it('throws NotFoundException and saves nothing when the bill does not exist', async () => {
      billRepo.findOne.mockResolvedValue(null);
      await expect(service.createPayment(dto)).rejects.toThrow(NotFoundException);
      expect(paymentRepo.save).not.toHaveBeenCalled();
      expect(dayBookRepo.save).not.toHaveBeenCalled();
    });

    it('marks the bill PARTIAL when the payment does not cover the total', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 1000, paidAmount: 0, status: 'UNPAID' });
      await service.createPayment(dto);

      const saved = billRepo.save.mock.calls[0][0];
      expect(saved.paidAmount).toBe(300);
      expect(saved.status).toBe('PARTIAL');
    });

    it('marks the bill PAID when the payment settles the total', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 1000, paidAmount: 700, status: 'PARTIAL' });
      await service.createPayment(dto);

      const saved = billRepo.save.mock.calls[0][0];
      expect(saved.paidAmount).toBe(1000);
      expect(saved.status).toBe('PAID');
    });

    it('handles decimal strings returned by Postgres without string concatenation', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: '1000.00', paidAmount: '200.00', status: 'PARTIAL' });
      await service.createPayment(dto);

      expect(billRepo.save.mock.calls[0][0].paidAmount).toBe(500);
    });

    it('marks the bill PAID on overpayment', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 100, paidAmount: 0, status: 'UNPAID' });
      await service.createPayment({ ...dto, amount: 150 });

      expect(billRepo.save.mock.calls[0][0].status).toBe('PAID');
    });

    it('records the payment in the day book (TR-PAY-001)', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 1000, paidAmount: 0 });
      const result = await service.createPayment(dto);

      expect(result.id).toBe('pay-1');
      expect(dayBookRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceId: 'pay-1',
          transactionType: 'PAYMENT',
          amount: 300,
          paymentMethod: 'CASH',
          recordedBy: 'cashier-1',
        }),
      );
    });
  });

  describe('reversePayment (TR-PAY-003)', () => {
    it('throws NotFoundException and records nothing for an unknown payment', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      await expect(service.reversePayment('nope', 'wrong code', 'mgr-1')).rejects.toThrow(NotFoundException);
      expect(reversalRepo.save).not.toHaveBeenCalled();
      expect(dayBookRepo.save).not.toHaveBeenCalled();
    });

    it('creates an approved reversal for the full payment amount and logs a REFUND', async () => {
      paymentRepo.findOne.mockResolvedValue({ id: 'pay-9', amount: 450, paymentMethod: 'CARD' });

      const result = await service.reversePayment('pay-9', 'Incorrect billing code', 'mgr-1');

      expect(reversalRepo.create).toHaveBeenCalledWith({
        paymentId: 'pay-9',
        amount: 450,
        reason: 'Incorrect billing code',
        approvedByUserId: 'mgr-1',
      });
      expect(result.id).toBe('rev-1');
      expect(dayBookRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceId: 'pay-9',
          transactionType: 'REFUND',
          amount: 450,
          paymentMethod: 'CARD',
          recordedBy: 'mgr-1',
        }),
      );
    });
  });

  describe('insurance claims and payment plans (TR-PAY-004, TR-PAY-007)', () => {
    it('lists and creates insurance claims', async () => {
      claimRepo.find.mockResolvedValue([{ id: 'c1' }]);
      await expect(service.findAllInsuranceClaims()).resolves.toEqual([{ id: 'c1' }]);

      const created = await service.createInsuranceClaim({ policyNumber: 'POL-1' } as any);
      expect(claimRepo.create).toHaveBeenCalledWith({ policyNumber: 'POL-1' });
      expect(created.id).toBe('claim-1');
    });

    it('lists and creates payment plans', async () => {
      planRepo.find.mockResolvedValue([{ id: 'pl1' }]);
      await expect(service.findAllPaymentPlans()).resolves.toEqual([{ id: 'pl1' }]);

      const created = await service.createPaymentPlan({ totalAmount: 900 } as any);
      expect(planRepo.create).toHaveBeenCalledWith({ totalAmount: 900 });
      expect(created.id).toBe('plan-1');
    });
  });

  it('lists all payments with their bills', async () => {
    paymentRepo.find.mockResolvedValue([{ id: 'pay-1' }]);
    await expect(service.findAllPayments()).resolves.toEqual([{ id: 'pay-1' }]);
    expect(paymentRepo.find).toHaveBeenCalledWith({ relations: ['bill'] });
  });
});
