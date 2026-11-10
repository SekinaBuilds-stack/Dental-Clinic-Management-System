import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentReversal } from './entities/payment-reversal.entity';
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
    @InjectRepository(DayBook)
    private dayBookRepo: Repository<DayBook>,
  ) {}

  async findAllPayments(): Promise<Payment[]> {
    return this.paymentRepo.find({ relations: ['bill'] });
  }

  async findPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id }, relations: ['bill'] });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async createPayment(createDto: {
    billId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    receivedBy: string;
  }): Promise<Payment> {
    const bill = await this.billRepo.findOne({ where: { id: createDto.billId } });
    if (!bill) {
      throw new NotFoundException(`Bill with ID ${createDto.billId} not found`);
    }

    const payment = this.paymentRepo.create(createDto);
    const savedPayment = await this.paymentRepo.save(payment);

    // Update bill's paid amount & status
    bill.paidAmount = Number(bill.paidAmount || 0) + Number(createDto.amount);
    if (bill.paidAmount >= bill.totalAmount) {
      bill.status = 'PAID';
    } else if (bill.paidAmount > 0) {
      bill.status = 'PARTIAL';
    }
    await this.billRepo.save(bill);

    // Record transaction in Day Book
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
    const payment = await this.findPaymentById(paymentId);

    const reversal = this.reversalRepo.create({
      paymentId: payment.id,
      amount: payment.amount,
      reason,
      approvedByUserId: approvedBy,
    });

    const savedReversal = await this.reversalRepo.save(reversal);

    // Record refund/reversal in Day Book
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

  async findAllInsuranceClaims(): Promise<InsuranceClaim[]> {
    return this.claimRepo.find();
  }

  async createInsuranceClaim(createDto: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
    const claim = this.claimRepo.create(createDto);
    return this.claimRepo.save(claim);
  }

  async findAllPaymentPlans(): Promise<PaymentPlan[]> {
    return this.planRepo.find();
  }

  async createPaymentPlan(createDto: Partial<PaymentPlan>): Promise<PaymentPlan> {
    const plan = this.planRepo.create(createDto);
    return this.planRepo.save(plan);
  }
}