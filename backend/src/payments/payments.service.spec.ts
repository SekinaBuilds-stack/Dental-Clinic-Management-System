import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
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
      find: vi.fn(async () => []),
      findOne: vi.fn(async () => null),
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

      const created = await service.createPaymentPlan({ patientId: 'p1', billId: 'b1', totalAmount: 900, installmentsCount: 3 });
      expect(planRepo.create).toHaveBeenCalledWith(expect.objectContaining({ installmentAmount: 300, status: 'ACTIVE' }));
      expect(created.id).toBe('plan-1');
    });
  });

  describe('processPayment validation', () => {
    const base = { billId: 'b1', amount: 100, paymentMethod: 'cash', cashierId: 'c1' };
    it('rejects zero, negative and unknown-method payments', async () => {
      await expect(service.processPayment({ ...base, amount: 0 })).rejects.toThrow(BadRequestException);
      await expect(service.processPayment({ ...base, amount: -5 })).rejects.toThrow(BadRequestException);
      await expect(service.processPayment({ ...base, paymentMethod: 'BITCOIN' })).rejects.toThrow(BadRequestException);
    });
    it('rejects cancelled, settled and over-balance payments', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 100, paidAmount: 0, status: 'CANCELLED' });
      await expect(service.processPayment(base)).rejects.toThrow(BadRequestException);
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 100, paidAmount: 100, status: 'PAID' });
      await expect(service.processPayment(base)).rejects.toThrow(BadRequestException);
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 100, paidAmount: 50, status: 'PARTIAL' });
      await expect(service.processPayment({ ...base, amount: 60 })).rejects.toThrow(/outstanding balance/);
    });
    it('normalises the method and records the payment', async () => {
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 100, paidAmount: 0, status: 'UNPAID' });
      await service.processPayment(base);
      expect(paymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'CASH', receivedBy: 'c1' }));
    });
  });

  describe('reversal effect on the bill', () => {
    it('subtracts the payment from the bill and reopens it', async () => {
      paymentRepo.findOne.mockResolvedValue({ id: 'p1', billId: 'b1', amount: 100, paymentMethod: 'CASH' });
      billRepo.findOne.mockResolvedValue({ id: 'b1', totalAmount: 100, paidAmount: 100, status: 'PAID' });
      await service.reversePayment('p1', 'wrong bill', 'm1');
      expect(billRepo.save).toHaveBeenCalledWith(expect.objectContaining({ paidAmount: 0, status: 'UNPAID' }));
    });
    it('refuses a second reversal and a blank reason', async () => {
      paymentRepo.findOne.mockResolvedValue({ id: 'p1', billId: 'b1', amount: 100 });
      reversalRepo.findOne.mockResolvedValue({ id: 'r1' });
      await expect(service.reversePayment('p1', 'again', 'm1')).rejects.toThrow(/already been reversed/);
      await expect(service.reversePayment('p1', '  ', 'm1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('insurance workflow (FR-PAY)', () => {
    it('calculates the co-pay split', () => {
      expect(service.calculateCopay(1000, 80)).toEqual({ totalAmount: 1000, coveragePercent: 80, insuranceAmount: 800, copayAmount: 200 });
      expect(() => service.calculateCopay(1000, 120)).toThrow(BadRequestException);
      expect(() => service.calculateCopay(0, 50)).toThrow(BadRequestException);
    });
    it('submits a claim as SUBMITTED with the insurer share and co-pay', async () => {
      await service.submitInsuranceClaim({ patientId: 'p1', insuranceProvider: 'Acme', policyNumber: 'POL-1', claimAmount: 500, coveragePercent: 70 });
      expect(claimRepo.create).toHaveBeenCalledWith(expect.objectContaining({ claimAmount: 350, copayAmount: 150, status: 'SUBMITTED' }));
    });
    it('only allows valid status transitions', async () => {
      claimRepo.findOne = vi.fn(async () => ({ id: 'c1', status: 'SUBMITTED' }));
      await expect(service.updateClaimStatus('c1', 'PAID')).rejects.toThrow(/cannot move/);
      await expect(service.updateClaimStatus('c1', 'bogus')).rejects.toThrow(BadRequestException);
      const ok = await service.updateClaimStatus('c1', 'approved');
      expect(ok.status).toBe('APPROVED');
      claimRepo.findOne = vi.fn(async () => null);
      await expect(service.updateClaimStatus('zz', 'APPROVED')).rejects.toThrow(NotFoundException);
    });
    it('rejects invalid payment plans', async () => {
      await expect(service.createPaymentPlan({ patientId: 'p', billId: 'b', totalAmount: 100, installmentsCount: 1 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('ledger', () => {
    it('flags reversed payments and computes net', async () => {
      paymentRepo.find.mockResolvedValue([
        { id: 'a', billId: 'b', amount: '100.00', paymentMethod: 'CASH', receivedBy: 'c', createdAt: new Date() },
        { id: 'b', billId: 'b', amount: '40.00', paymentMethod: 'CARD', receivedBy: 'c', createdAt: new Date() },
      ]);
      reversalRepo.find.mockResolvedValue([{ paymentId: 'b' }]);
      const l = await service.getPaymentLedger();
      expect(l.totals).toEqual({ gross: 140, refunded: 40, net: 100 });
      expect(l.payments.find((p) => p.id === 'b')?.reversed).toBe(true);
    });
  });

  it('lists all payments with their bills', async () => {
    paymentRepo.find.mockResolvedValue([{ id: 'pay-1' }]);
    await expect(service.findAllPayments()).resolves.toEqual([{ id: 'pay-1' }]);
    expect(paymentRepo.find).toHaveBeenCalledWith({ relations: ['bill'] });
  });
});
