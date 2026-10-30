// backend/src/billing/billing.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // TR-BIL-001: Procedure Price Configuration
  @Post('procedure-prices')
  @RequirePermissions('billing:write')
  async setProcedurePrice(@Body() dto: { procedureId: string; toothNumber?: number; price: number }) {
    return this.billingService.setProcedurePrice(dto);
  }

  // TR-BIL-002: Bill Management
  @Post('bills')
  @RequirePermissions('billing:write')
  async createBill(@Body() dto: { patientId: string; items: Array<{ description: string; quantity: number; unitPrice: number }> }) {
    return this.billingService.createBill(dto);
  }

  @Get('bills/:patientId')
  @RequirePermissions('billing:read')
  async getBillsByPatient(@Param('patientId') patientId: string) {
    return this.billingService.getBillsByPatient(patientId);
  }

  // TR-BIL-003: Generate Treatment Estimate from Treatment Plan
  @Post('estimates/from-plan')
  @RequirePermissions('billing:write')
  async generateEstimateFromPlan(@Body() dto: { patientId: string; treatmentPlanId: string }) {
    return this.billingService.generateEstimateFromPlan(dto.patientId, dto.treatmentPlanId);
  }

  // TR-BIL-004: Estimate History
  @Get('estimates/patient/:id')
  @RequirePermissions('billing:read')
  async getPatientEstimates(@Param('id') patientId: string) {
    return this.billingService.getPatientEstimates(patientId);
  }

  // TR-BIL-005: Day Book Reconciliation
  @Get('day-book')
  @RequirePermissions('billing:read')
  async getDayBookSummary() {
    return this.billingService.getDayBookSummary();
  }

  // TR-BIL-006: Receipt Generation
  @Post('receipts')
  @RequirePermissions('billing:write')
  async generateReceipt(@Body() dto: { billId: string; amountPaid: number; paymentMethod: string; cashierId: string }) {
    return this.billingService.generateReceipt(dto);
  }
}