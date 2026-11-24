import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { PaymentsService } from './../src/payments/payments.service';
import { Bill } from './../src/billing/entities/bill.entity';

// Real-database proof of the payment lifecycle: pay -> partial -> settle -> reverse -> aging.
describe('Payments flow against the database (FR-PAY)', () => {
  let app: INestApplication;
  let payments: PaymentsService;
  let ds: DataSource;
  const patientId = `pat-pay-${Date.now()}`;
  let billId: string;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    payments = app.get(PaymentsService);
    ds = app.get(DataSource);
    const bill = await ds.getRepository(Bill).save({ patientId, totalAmount: 1000, paidAmount: 0, status: 'UNPAID' } as any);
    billId = bill.id;
  });
  afterAll(async () => {
    await app.close();
  });

  const bill = () => ds.getRepository(Bill).findOneByOrFail({ id: billId });

  it('takes a partial payment and marks the bill PARTIAL', async () => {
    await payments.processPayment({ billId, amount: 400, paymentMethod: 'cash', cashierId: 'cashier-1' });
    const b = await bill();
    expect(Number(b.paidAmount)).toBe(400);
    expect(b.status).toBe('PARTIAL');
  });

  it('refuses an amount above the balance', async () => {
    await expect(payments.processPayment({ billId, amount: 700, paymentMethod: 'CARD', cashierId: 'c' })).rejects.toThrow(BadRequestException);
  });

  it('settles the bill, then reverses that payment and reopens the balance', async () => {
    const second = await payments.processPayment({ billId, amount: 600, paymentMethod: 'CARD', cashierId: 'cashier-1' });
    expect((await bill()).status).toBe('PAID');

    await payments.reversePayment(second.id, 'Card declined later', 'manager-1');
    const b = await bill();
    expect(Number(b.paidAmount)).toBe(400);
    expect(b.status).toBe('PARTIAL');

    await expect(payments.reversePayment(second.id, 'again', 'manager-1')).rejects.toThrow(/already been reversed/);
  });

  it('shows the reversal in the ledger totals', async () => {
    const ledger = await payments.getPaymentLedger();
    const mine = ledger.payments.filter((p) => p.billId === billId);
    expect(mine).toHaveLength(2);
    expect(mine.filter((p) => p.reversed)).toHaveLength(1);
  });

  it('creates a payment plan with the installment amount filled in', async () => {
    const plan = await payments.createPaymentPlan({ patientId, billId, totalAmount: 600, installmentsCount: 3 });
    expect(Number(plan.installmentAmount)).toBe(200);
  });

  it('runs a claim through SUBMITTED -> APPROVED -> PAID', async () => {
    const claim = await payments.submitInsuranceClaim({
      patientId,
      insuranceProvider: 'Acme Health',
      policyNumber: `POL-${Date.now()}`,
      claimAmount: 500,
      coveragePercent: 80,
    });
    expect(Number(claim.claimAmount)).toBe(400);
    expect(Number(claim.copayAmount)).toBe(100);
    await payments.updateClaimStatus(claim.id, 'APPROVED');
    const paid = await payments.updateClaimStatus(claim.id, 'PAID');
    expect(paid.status).toBe('PAID');
  });
});
