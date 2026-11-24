import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Bill } from '../billing/entities/bill.entity';
import { TreatmentPlanItem } from '../emr/entities/treatment-plan-item.entity';

/** "2026-12-31" must include the whole of 31 December, not stop at its midnight. */
function range(startDate: string, endDate: string): [Date, Date] {
  const start = new Date(startDate);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? new Date(`${endDate}T23:59:59.999Z`) : new Date(endDate);
  return [start, end];
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(TreatmentPlanItem) private itemRepo: Repository<TreatmentPlanItem>,
  ) {}

  async getDailyCollections(startDate: string, endDate: string) {
    const [s, e] = range(startDate, endDate);
    const payments = await this.paymentRepo.find({ where: { createdAt: Between(s, e) } });
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return { startDate, endDate, totalCollected, transactionCount: payments.length, payments };
  }

  async getDoctorProduction(startDate: string, endDate: string) {
    const [s, e] = range(startDate, endDate);
    const bills = await this.billRepo.find({ where: { createdAt: Between(s, e) } });
    const totalProduction = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    return { startDate, endDate, totalProduction, totalBills: bills.length, bills };
  }

  async getTreatmentAnalysis() {
    const items = await this.itemRepo.find();
    const counts: Record<string, { count: number; revenue: number }> = {};
    for (const item of items) {
      const entry = (counts[item.procedureName] ??= { count: 0, revenue: 0 });
      entry.count += 1;
      entry.revenue += Number(item.estimatedCost || 0);
    }
    return Object.entries(counts).map(([procedure, d]) => ({
      procedure,
      totalProcedures: d.count,
      totalRevenue: d.revenue,
    }));
  }

  /** Open bills only (UNPAID / PARTIAL); the amount shown is the outstanding balance. */
  async getReceivablesAging() {
    const open = await this.billRepo.find({ where: { status: In(['UNPAID', 'PARTIAL']) } });
    const now = Date.now();
    return open
      .map((bill) => {
        const balance = Number(bill.totalAmount) - Number(bill.paidAmount || 0);
        const daysOpen = Math.floor((now - new Date(bill.createdAt).getTime()) / (1000 * 3600 * 24));
        return {
          billId: bill.id,
          patientId: bill.patientId,
          totalAmount: Number(bill.totalAmount),
          paidAmount: Number(bill.paidAmount || 0),
          balance,
          daysOpen,
          agingCategory: daysOpen > 60 ? 'Over 60 Days' : daysOpen > 30 ? '30-60 Days' : '0-30 Days',
        };
      })
      .filter((r) => r.balance > 0);
  }
}
