// backend/src/payments/payments.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentReversal } from './entities/payment.entity';
import { InsuranceClaim } from './entities/insurance-claim.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Bill } from '../billing/entities/bill.entity';
import { DayBook } from '../billing/entities/day-book.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentReversal)
    private reversalRepo: Repository<PaymentReversal>,
    @InjectRepository(InsuranceClaim)
    private claimRepo: Repository<InsuranceClaim>,
    @InjectRepository(PaymentPlan)
    private planRepo: Repository<PaymentPlan>,
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
    private dataSource: DataSource,
  ) {}

  // TR-PAY-001: Payment Ledger
  async getPaymentLedger() {
    return this.paymentRepo.find({ relations: { bill: true }, order: { createdAt: 'DESC' } });
  }

  // TR-PAY-002: Process Multi-Method Payment
  async processPayment(dto: { billId: string; amount: number; paymentMethod: string; transactionReference?: string; cashierId: string }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bill = await queryRunner.manager.findOne(Bill, { where: { id: dto.billId } });
      if (!bill) throw new NotFoundException('Bill not found.');

      const payment = queryRunner.manager.create(Payment, {
        billId: dto.billId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionReference: dto.transactionReference,
        receivedBy: dto.cashierId,
      });
      const savedPayment = await queryRunner.manager.save(Payment, payment);

      bill.paidAmount = Number(bill.paidAmount) + Number(dto.amount);
      bill.status = Number(bill.paidAmount) >= Number(bill.totalAmount) ? 'PAID' : 'PARTIAL';
      await queryRunner.manager.save(Bill, bill);

      // Record in Day Book
      const today = new Date().toISOString().split('T')[0];
      const dayBook = queryRunner.manager.create(DayBook, {
        transactionDate: today,
        referenceId: savedPayment.id,
        transactionType: 'PAYMENT',
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        recordedBy: dto.cashierId,
      });
      await queryRunner.manager.save(DayBook, dayBook);

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-PAY-003: Audited Payment Reversal
  async reversePayment(paymentId: string, reason: string, managerId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, { where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Payment not found.');

      const bill = await queryRunner.manager.findOne(Bill, { where: { id: payment.billId } });
      if (bill) {
        bill.paidAmount = Math.max(0, Number(bill.paidAmount) - Number(payment.amount));
        bill.status = Number(bill.paidAmount) === 0 ? 'UNPAID' : 'PARTIAL';
        await queryRunner.manager.save(Bill, bill);
      }

      const reversal = queryRunner.manager.create(PaymentReversal, {
        paymentId,
        reason,
        approvedBy: managerId,
      });
      const savedReversal = await queryRunner.manager.save(PaymentReversal, reversal);

      await queryRunner.manager.delete(Payment, { id: paymentId });

      await queryRunner.commitTransaction();
      return { message: 'Payment successfully reversed with audit trail.', reversal: savedReversal };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-PAY-004 & 005: Insurance Claims
  async submitInsuranceClaim(dto: { patientId: string; insuranceProvider: string; policyNumber: string; claimAmount: number; coveragePercent: number }) {
    const copayAmount = dto.claimAmount * (1 - dto.coveragePercent / 100);
    const claim = this.claimRepo.create({
      patientId: dto.patientId,
      insuranceProvider: dto.insuranceProvider,
      policyNumber: dto.policyNumber,
      claimAmount: dto.claimAmount,
      copayAmount,
      status: 'SUBMITTED',
    });
    return this.claimRepo.save(claim);
  }

  async updateClaimStatus(claimId: string, status: string) {
    const claim = await this.claimRepo.findOne({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Insurance claim not found.');
    claim.status = status;
    return this.claimRepo.save(claim);
  }

  // TR-PAY-006: Co-pay Calculator
  async calculateCopay(totalAmount: number, coveragePercent: number) {
    const insuranceCoverage = totalAmount * (coveragePercent / 100);
    const patientCopay = totalAmount - insuranceCoverage;
    return { totalAmount, insuranceCoverage, patientCopay };
  }

  // TR-PAY-007: Payment Plans
  async createPaymentPlan(dto: { patientId: string; billId: string; totalAmount: number; installmentsCount: number }) {
    const installmentAmount = Number((dto.totalAmount / dto.installmentsCount).toFixed(2));
    const plan = this.planRepo.create({
      patientId: dto.patientId,
      billId: dto.billId,
      totalAmount: dto.totalAmount,
      installmentsCount: dto.installmentsCount,
      installmentAmount,
      status: 'ACTIVE',
    });
    return this.planRepo.save(plan);
  }
}