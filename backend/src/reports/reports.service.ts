import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Bill } from '../billing/entities/bill.entity';
import { TreatmentPlanItem } from '../emr/entities/treatment-plan-item.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(TreatmentPlanItem) private itemRepo: Repository<TreatmentPlanItem>,
  ) {}

  // TR-REP-001: Daily Collection & Revenue Report
  async getDailyCollections(startDate: string, endDate: string) {
    const payments = await this.paymentRepo.find({
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
    });
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return { startDate, endDate, totalCollected, transactionCount: payments.length, payments };
  }

  // TR-REP-002: Doctor-Wise Production Report
  async getDoctorProduction(startDate: string, endDate: string) {
    const bills = await this.billRepo.find({
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
    });
    // Group production by doctor or billing summary
    const totalProduction = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    return { startDate, endDate, totalProduction, totalBills: bills.length, bills };
  }

  // TR-REP-003: Treatment-Type Analysis Report
  async getTreatmentAnalysis() {
    const items = await this.itemRepo.find();
    const procedureCounts: Record<string, { count: number; revenue: number }> = {};
    
    for (const item of items) {
      if (!procedureCounts[item.procedureName]) {
        procedureCounts[item.procedureName] = { count: 0, revenue: 0 };
      }
      procedureCounts[item.procedureName].count += 1;
procedureCounts[item.procedureName].revenue += Number(item.estimatedCost || 0);
    }

    return Object.entries(procedureCounts).map(([procedure, data]) => ({
      procedure,
      totalProcedures: data.count,
      totalRevenue: data.revenue,
    }));
  }

  // TR-REP-005: Receivables Aging Report
  async getReceivablesAging() {
    const unpaidBills = await this.billRepo.find({ where: { status: 'PENDING' } });
    const agingSummary = unpaidBills.map(bill => {
      const daysOpen = Math.floor((new Date().getTime() - new Date(bill.createdAt).getTime()) / (1000 * 3600 * 24));
      return {
        billId: bill.id,
        patientId: bill.patientId,
        totalAmount: bill.totalAmount,
        daysOpen,
        agingCategory: daysOpen > 60 ? 'Over 60 Days' : daysOpen > 30 ? '30-60 Days' : '0-30 Days',
      };
    });
    return agingSummary;
  }
}