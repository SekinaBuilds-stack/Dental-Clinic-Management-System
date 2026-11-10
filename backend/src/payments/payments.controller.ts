// backend/src/payments/payments.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards, NotImplementedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // TR-PAY-001: Payment Ledger
  @Get('ledger')
  @RequirePermissions('payments:read')
  async getPaymentLedger() {
    throw new NotImplementedException('Payment ledger retrieval is not implemented in PaymentsService');
  }

  // TR-PAY-002: Process Payment
  @Post()
  @RequirePermissions('payments:write')
  async processPayment(@Body() dto: { billId: string; amount: number; paymentMethod: string; transactionReference?: string; cashierId: string }) {
    return (this.paymentsService as any).processPayment(dto);
  }

  // TR-PAY-003: Payment Reversal (Manager Approved)
  @Post(':id/reverse')
  @RequirePermissions('payments:reverse')
  async reversePayment(@Param('id') paymentId: string, @Body() dto: { reason: string; managerId: string }) {
    return this.paymentsService.reversePayment(paymentId, dto.reason, dto.managerId);
  }

  // TR-PAY-004: Submit Insurance Claim
  @Post('insurance-claims')
  @RequirePermissions('insurance:manage')
  async submitInsuranceClaim(@Body() dto: { patientId: string; insuranceProvider: string; policyNumber: string; claimAmount: number; coveragePercent: number }) {
    return (this.paymentsService as any).submitInsuranceClaim(dto);
  }

  // TR-PAY-005: Update Insurance Claim Status
  @Patch('insurance-claims/:id/status')
  @RequirePermissions('insurance:manage')
  async updateClaimStatus(@Param('id') claimId: string, @Body('status') status: string) {
    return (this.paymentsService as any).updateClaimStatus(claimId, status);
  }

  // TR-PAY-006: Co-pay Calculator
  @Post('insurance-claims/copay')
  @RequirePermissions('insurance:read')
  async calculateCopay(@Body() dto: { totalAmount: number; coveragePercent: number }) {
    return (this.paymentsService as any).calculateCopay(dto.totalAmount, dto.coveragePercent);
  }

  // TR-PAY-007: Installment Payment Plans
  @Post('payment-plans')
  @RequirePermissions('payments:write')
  async createPaymentPlan(@Body() dto: { patientId: string; billId: string; totalAmount: number; installmentsCount: number }) {
    return this.paymentsService.createPaymentPlan(dto);
  }
}