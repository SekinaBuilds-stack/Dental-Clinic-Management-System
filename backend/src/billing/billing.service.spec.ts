import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Bill } from './entities/bill.entity';
import { DayBook } from './entities/day-book.entity';
import { makeQueryRunner } from '../test-utils/mock-query-runner';

describe('BillingService (FR-BIL)', () => {
  let service: BillingService;
  let qr: ReturnType<typeof makeQueryRunner>;
  let dayBookRepo: any;
  let estimateRepo: any;
  let treatmentPlanRepo: any;

  beforeEach(() => {
    qr = makeQueryRunner();
    dayBookRepo = { find: vi.fn() };
    estimateRepo = { create: vi.fn((x: any) => x), save: vi.fn(async (x: any) => x) };
    treatmentPlanRepo = { findOne: vi.fn() };
    service = new BillingService(
      {} as any, // priceRepo
      {} as any, // billRepo
      estimateRepo,
      dayBookRepo,
      treatmentPlanRepo,
      qr.dataSource as any,
    );
  });

  describe('createBill', () => {
    it('computes line totals and the bill total, and commits', async () => {
      await service.createBill({
        patientId: 'p1',
        items: [
          { description: 'Filling', quantity: 2, unitPrice: 100 },
          { description: 'Scaling', quantity: 1, unitPrice: 50 },
        ],
      });

      expect(qr.manager.create).toHaveBeenCalledWith(
        Bill,
        expect.objectContaining({ patientId: 'p1', totalAmount: 250, status: 'UNPAID' }),
      );
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back and releases when saving fails', async () => {
      qr.manager.save.mockRejectedValueOnce(new Error('db down'));

      await expect(
        service.createBill({ patientId: 'p1', items: [{ description: 'x', quantity: 1, unitPrice: 10 }] }),
      ).rejects.toThrow('db down');

      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('generateReceipt', () => {
    const dto = { billId: 'b1', amountPaid: 400, paymentMethod: 'CASH', cashierId: 'c1' };

    it('marks the bill PARTIAL when only part is paid', async () => {
      qr.manager.findOne.mockResolvedValue({ id: 'b1', totalAmount: 1000, paidAmount: 0 });

      const result = await service.generateReceipt(dto);

      expect(result.bill.status).toBe('PARTIAL');
      expect(result.bill.paidAmount).toBe(400);
      expect(result.receipt.receiptNumber).toMatch(/^RCP-/);
    });

    it('marks the bill PAID when the balance is cleared', async () => {
      qr.manager.findOne.mockResolvedValue({ id: 'b1', totalAmount: 1000, paidAmount: 600 });

      const result = await service.generateReceipt(dto);

      expect(result.bill.status).toBe('PAID');
    });

    it('records a PAYMENT entry in the day book', async () => {
      qr.manager.findOne.mockResolvedValue({ id: 'b1', totalAmount: 1000, paidAmount: 0 });

      await service.generateReceipt(dto);

      expect(qr.manager.create).toHaveBeenCalledWith(
        DayBook,
        expect.objectContaining({ transactionType: 'PAYMENT', amount: 400, recordedBy: 'c1' }),
      );
    });

    it('throws NotFoundException and rolls back for an unknown bill', async () => {
      qr.manager.findOne.mockResolvedValue(null);

      await expect(service.generateReceipt(dto)).rejects.toThrow(NotFoundException);
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getDayBookSummary', () => {
    it('sums transaction amounts (including decimal strings)', async () => {
      dayBookRepo.find.mockResolvedValue([{ amount: '100.50' }, { amount: 200 }]);

      const summary = await service.getDayBookSummary();

      expect(summary.totalCollected).toBeCloseTo(300.5);
      expect(summary.transactions).toHaveLength(2);
    });
  });

  describe('generateEstimateFromPlan', () => {
    it('throws NotFoundException when the plan does not exist', async () => {
      treatmentPlanRepo.findOne.mockResolvedValue(null);
      await expect(service.generateEstimateFromPlan('p1', 'tp1')).rejects.toThrow(NotFoundException);
    });

    // Expected to FAIL until the service is fixed (see note below the files).
    it('treats a plan item without a quantity as quantity 1', async () => {
      treatmentPlanRepo.findOne.mockResolvedValue({
        items: [{ procedureName: 'Root canal', estimatedCost: 3500 }],
      });

      const estimate = await service.generateEstimateFromPlan('p1', 'tp1');

      expect(estimate.totalEstimate).toBe(3500);
    });
  });
});