// backend/src/billing/billing.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { ProcedurePrice } from './entities/procedure-price.entity';
import { Bill, BillItem } from './entities/bill.entity';
import { Estimate } from './entities/estimate.entity';
import { DayBook } from './entities/day-book.entity';
import { TreatmentPlan } from '../emr/entities/treatment-plan.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(ProcedurePrice)
    private priceRepo: Repository<ProcedurePrice>,
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
    @InjectRepository(Estimate)
    private estimateRepo: Repository<Estimate>,
    @InjectRepository(DayBook)
    private dayBookRepo: Repository<DayBook>,
    @InjectRepository(TreatmentPlan)
    private treatmentPlanRepo: Repository<TreatmentPlan>,
    private dataSource: DataSource,
  ) {}

  // TR-BIL-001: Set Procedure Price
  async setProcedurePrice(dto: { procedureId: string; toothNumber?: number; price: number }) {
    let existing = await this.priceRepo.findOne({
      where: { procedureId: dto.procedureId, toothNumber: dto.toothNumber ?? IsNull() },
    });
    if (existing) {
      existing.price = dto.price;
      return this.priceRepo.save(existing);
    }
    const newPrice = this.priceRepo.create(dto);
    return this.priceRepo.save(newPrice);
  }

  // TR-BIL-002: Create Bill
  async createBill(dto: { patientId: string; items: Array<{ description: string; quantity: number; unitPrice: number }> }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const billItems = dto.items.map((item) => {
        const totalPrice = item.quantity * item.unitPrice;
        totalAmount += totalPrice;
        return queryRunner.manager.create(BillItem, { ...item, totalPrice });
      });

      const bill = queryRunner.manager.create(Bill, {
        patientId: dto.patientId,
        totalAmount,
        items: billItems,
        status: 'UNPAID',
      });

      const savedBill = await queryRunner.manager.save(Bill, bill);
      await queryRunner.commitTransaction();
      return savedBill;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getBillsByPatient(patientId: string) {
    return this.billRepo.find({ where: { patientId }, relations: { items: true }, order: { createdAt: 'DESC' } });
  }

  // TR-BIL-003: Generate Estimate from Treatment Plan
  async generateEstimateFromPlan(patientId: string, treatmentPlanId: string) {
    const plan = await this.treatmentPlanRepo.findOne({ where: { id: treatmentPlanId }, relations: { items: true } });
    if (!plan) throw new NotFoundException('Treatment plan not found.');

    let totalEstimate = 0;
    const items = plan.items.map((item: any) => {
      const unitPrice = item.estimatedCost || 100; // fallback pricing
      const totalPrice = item.quantity * unitPrice;
      totalEstimate += totalPrice;
      return {
        description: item.procedureName || item.description,
        quantity: item.quantity || 1,
        unitPrice,
        totalPrice,
      };
    });

    const estimate = this.estimateRepo.create({
      patientId,
      treatmentPlanId,
      totalEstimate,
      items,
      status: 'CURRENT',
    });

    return this.estimateRepo.save(estimate);
  }

  // TR-BIL-004: Estimate History
  async getPatientEstimates(patientId: string) {
    return this.estimateRepo.find({ where: { patientId }, order: { createdAt: 'DESC' } });
  }

  // TR-BIL-005: Day Book Reconciliation
  async getDayBookSummary() {
    const today = new Date().toISOString().split('T')[0];
    const transactions = await this.dayBookRepo.find({ where: { transactionDate: today } });
    const totalCollected = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { date: today, totalCollected, transactions };
  }

  // TR-BIL-006: Receipt & Payment Recording
  async generateReceipt(dto: { billId: string; amountPaid: number; paymentMethod: string; cashierId: string }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bill = await queryRunner.manager.findOne(Bill, { where: { id: dto.billId } });
      if (!bill) throw new NotFoundException('Bill not found.');

      bill.paidAmount = Number(bill.paidAmount) + Number(dto.amountPaid);
      bill.status = Number(bill.paidAmount) >= Number(bill.totalAmount) ? 'PAID' : 'PARTIAL';
      await queryRunner.manager.save(Bill, bill);

      const today = new Date().toISOString().split('T')[0];
      const dayBookEntry = queryRunner.manager.create(DayBook, {
        transactionDate: today,
        referenceId: bill.id,
        transactionType: 'PAYMENT',
        amount: dto.amountPaid,
        paymentMethod: dto.paymentMethod,
        recordedBy: dto.cashierId,
      });
      await queryRunner.manager.save(DayBook, dayBookEntry);

      const receipt = {
        receiptNumber: `RCP-${Date.now()}`,
        billId: bill.id,
        amountPaid: dto.amountPaid,
        paymentMethod: dto.paymentMethod,
        date: new Date(),
      };

      await queryRunner.commitTransaction();
      return { message: 'Payment recorded and receipt generated successfully.', receipt, bill };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}