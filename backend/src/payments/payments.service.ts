import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentReversal } from './entities/payment-reversal.entity';
import { InsuranceClaim } from './entities/insurance-claim.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Bill } from '../billing/entities/bill.entity';
import { DayBook } from '../billing/entities/day-book.entity';

export const PAYMENT_METHODS = ['CASH', 'CARD', 'MOBILE_MONEY', 'INSURANCE', 'BANK_TRANSFER'] as const;

const CLAIM_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PAID', 'REJECTED'],
  REJECTED: [],
  PAID: [],
};

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentReversal) private reversalRepo: Repository<PaymentReversal>,
    @InjectRepository(InsuranceClaim) private claimRepo: Repository<InsuranceClaim>,
    @InjectRepository(PaymentPlan) private planRepo: Repository<PaymentPlan>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(DayBook) private dayBookRepo: Repository<DayBook>,
  ) {}

  async findAllPayments(): Promise<Payment[]> {
    return this.paymentRepo.find({ relations: ['bill'] });
  }

  async findPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id }, relations: ['bill'] });
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  /** FR-PAY ledger: newest first, each row flagged if reversed, with gross / refunded / net totals. */
  async getPaymentLedger() {
    const payments = await this.paymentRepo.find({ order: { createdAt: 'DESC' } });
    const reversals = await this.reversalRepo.find();
    const reversedIds = new Set(reversals.map((r) => r.paymentId));
    const rows = payments.map((p) => ({
      id: p.id,
      billId: p.billId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference ?? null,
      receivedBy: p.receivedBy,
      createdAt: p.createdAt,
      reversed: reversedIds.has(p.id),
    }));
    const gross = r2(rows.reduce((s, r) => s + r.amount, 0));
    const refunded = r2(rows.filter((r) => r.reversed).reduce((s, r) => s + r.amount, 0));
    return { totals: { gross, refunded, net: r2(gross - refunded) }, payments: rows };
  }

  /** Validating entry point used by POST /payments. */
  async processPayment(dto: {
    billId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    cashierId: string;
  }): Promise<Payment> {
    const amount = Number(dto?.amount);
    if (!dto?.billId) throw new BadRequestException('billId is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be greater than zero');
    const method = String(dto.paymentMethod ?? '').toUpperCase();
    if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
      throw new BadRequestException(`paymentMethod must be one of ${PAYMENT_METHODS.join(', ')}`);
    }
    if (!dto.cashierId) throw new BadRequestException('cashierId is required');

    const bill = await this.billRepo.findOne({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException(`Bill with ID ${dto.billId} not found`);
    if (bill.status === 'CANCELLED') throw new BadRequestException('Cannot pay a cancelled bill');
    const balance = r2(Number(bill.totalAmount) - Number(bill.paidAmount || 0));
    if (balance <= 0) throw new BadRequestException('Bill is already fully paid');
    if (amount > balance) throw new BadRequestException(`Amount exceeds the outstanding balance of ${balance.toFixed(2)}`);

    return this.createPayment({
      billId: dto.billId,
      amount,
      paymentMethod: method,
      transactionReference: dto.transactionReference,
      receivedBy: dto.cashierId,
    });
  }

  async createPayment(createDto: {
    billId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    receivedBy: string;
  }): Promise<Payment> {
    const bill = await this.billRepo.findOne({ where: { id: createDto.billId } });
    if (!bill) throw new NotFoundException(`Bill with ID ${createDto.billId} not found`);

    const payment = this.paymentRepo.create(createDto);
    const savedPayment = await this.paymentRepo.save(payment);

    bill.paidAmount = Number(bill.paidAmount || 0) + Number(createDto.amount);
    if (bill.paidAmount >= Number(bill.totalAmount)) bill.status = 'PAID';
    else if (bill.paidAmount > 0) bill.status = 'PARTIAL';
    await this.billRepo.save(bill);

    await this.dayBookRepo.save({
      transactionDate: new Date().toISOString().split('T')[0],
      referenceId: savedPayment.id,
      transactionType: 'PAYMENT',
      amount: createDto.amount,
      paymentMethod: createDto.paymentMethod,
      recordedBy: createDto.receivedBy,
    });

    return savedPayment;
  }

  async reversePayment(paymentId: string, reason: string, approvedBy: string): Promise<PaymentReversal> {
    if (!reason || !String(reason).trim()) throw new BadRequestException('A reason is required for a reversal');
    const payment = await this.findPaymentById(paymentId);

    const existing = await this.reversalRepo.findOne({ where: { paymentId: payment.id } });
    if (existing) throw new BadRequestException('This payment has already been reversed');

    const savedReversal = await this.reversalRepo.save(
      this.reversalRepo.create({
        paymentId: payment.id,
        amount: payment.amount,
        reason,
        approvedByUserId: approvedBy,
      }),
    );

    // Put the money back on the bill so balances and the aging report stay correct.
    const bill = await this.billRepo.findOne({ where: { id: payment.billId } });
    if (bill) {
      bill.paidAmount = Math.max(0, r2(Number(bill.paidAmount || 0) - Number(payment.amount)));
      if (bill.status !== 'CANCELLED') {
        bill.status = bill.paidAmount <= 0 ? 'UNPAID' : bill.paidAmount >= Number(bill.totalAmount) ? 'PAID' : 'PARTIAL';
      }
      await this.billRepo.save(bill);
    }

    await this.dayBookRepo.save({
      transactionDate: new Date().toISOString().split('T')[0],
      referenceId: payment.id,
      transactionType: 'REFUND',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      recordedBy: approvedBy,
    });

    return savedReversal;
  }

  /** Pure calculation: what the insurer pays and what the patient pays. */
  calculateCopay(totalAmount: number, coveragePercent: number) {
    const total = Number(totalAmount);
    const pct = Number(coveragePercent);
    if (!Number.isFinite(total) || total <= 0) throw new BadRequestException('totalAmount must be greater than zero');
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new BadRequestException('coveragePercent must be between 0 and 100');
    const insuranceAmount = r2((total * pct) / 100);
    return { totalAmount: total, coveragePercent: pct, insuranceAmount, copayAmount: r2(total - insuranceAmount) };
  }

  async findAllInsuranceClaims(): Promise<InsuranceClaim[]> {
    return this.claimRepo.find();
  }

  async createInsuranceClaim(createDto: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
    return this.claimRepo.save(this.claimRepo.create(createDto));
  }

  /** claimAmount in the request is the TREATMENT TOTAL; the stored claim holds the insurer's share + the co-pay. */
  async submitInsuranceClaim(dto: {
    patientId: string;
    insuranceProvider: string;
    policyNumber: string;
    claimAmount: number;
    coveragePercent: number;
  }): Promise<InsuranceClaim> {
    if (!dto?.patientId || !dto.insuranceProvider || !dto.policyNumber) {
      throw new BadRequestException('patientId, insuranceProvider and policyNumber are required');
    }
    const split = this.calculateCopay(dto.claimAmount, dto.coveragePercent);
    return this.claimRepo.save(
      this.claimRepo.create({
        patientId: dto.patientId,
        insuranceProvider: dto.insuranceProvider,
        policyNumber: dto.policyNumber,
        claimAmount: split.insuranceAmount,
        copayAmount: split.copayAmount,
        status: 'SUBMITTED',
      }),
    );
  }

  async updateClaimStatus(claimId: string, status: string): Promise<InsuranceClaim> {
    const next = String(status ?? '').toUpperCase();
    if (!(next in CLAIM_TRANSITIONS)) throw new BadRequestException(`status must be one of ${Object.keys(CLAIM_TRANSITIONS).join(', ')}`);
    const claim = await this.claimRepo.findOne({ where: { id: claimId } });
    if (!claim) throw new NotFoundException(`Insurance claim ${claimId} not found`);
    if (!CLAIM_TRANSITIONS[claim.status]?.includes(next)) {
      throw new BadRequestException(`A claim that is ${claim.status} cannot move to ${next}`);
    }
    claim.status = next;
    return this.claimRepo.save(claim);
  }

  async findAllPaymentPlans(): Promise<PaymentPlan[]> {
    return this.planRepo.find();
  }

  async createPaymentPlan(createDto: Partial<PaymentPlan>): Promise<PaymentPlan> {
    const total = Number(createDto.totalAmount);
    const count = Number(createDto.installmentsCount);
    if (!createDto.patientId || !createDto.billId) throw new BadRequestException('patientId and billId are required');
    if (!Number.isFinite(total) || total <= 0) throw new BadRequestException('totalAmount must be greater than zero');
    if (!Number.isInteger(count) || count < 2) throw new BadRequestException('installmentsCount must be a whole number of at least 2');
    return this.planRepo.save(
      this.planRepo.create({
        patientId: createDto.patientId,
        billId: createDto.billId,
        totalAmount: total,
        installmentsCount: count,
        installmentAmount: r2(total / count),
        status: 'ACTIVE',
      }),
    );
  }
}
