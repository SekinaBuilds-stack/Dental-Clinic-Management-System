// backend/src/payments/payments.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('ledger')
  @RequirePermissions('payments:read')
  getPaymentLedger() {
    return this.paymentsService.getPaymentLedger();
  }

  @Post()
  @RequirePermissions('payments:write')
  processPayment(
    @Body() dto: { billId: string; amount: number; paymentMethod: string; transactionReference?: string; cashierId?: string },
    @Request() req: any,
  ) {
    return this.paymentsService.processPayment({ ...dto, cashierId: req.user?.userId ?? dto.cashierId } as any);
  }

  @Post(':id/reverse')
  @RequirePermissions('payments:reverse')
  reversePayment(@Param('id') paymentId: string, @Body() dto: { reason: string; managerId?: string }, @Request() req: any) {
    return this.paymentsService.reversePayment(paymentId, dto?.reason, req.user?.userId ?? dto?.managerId ?? 'unknown');
  }

  @Get('insurance-claims')
  @RequirePermissions('insurance:read')
  listClaims() {
    return this.paymentsService.findAllInsuranceClaims();
  }

  @Post('insurance-claims')
  @RequirePermissions('insurance:manage')
  submitInsuranceClaim(
    @Body() dto: { patientId: string; insuranceProvider: string; policyNumber: string; claimAmount: number; coveragePercent: number },
  ) {
    return this.paymentsService.submitInsuranceClaim(dto);
  }

  // Declared before ':id' style routes would matter; this path is a distinct literal.
  @Post('insurance-claims/copay')
  @RequirePermissions('insurance:read')
  calculateCopay(@Body() dto: { totalAmount: number; coveragePercent: number }) {
    return this.paymentsService.calculateCopay(dto?.totalAmount, dto?.coveragePercent);
  }

  @Patch('insurance-claims/:id/status')
  @RequirePermissions('insurance:manage')
  updateClaimStatus(@Param('id') claimId: string, @Body('status') status: string) {
    return this.paymentsService.updateClaimStatus(claimId, status);
  }

  @Get('payment-plans')
  @RequirePermissions('payments:read')
  listPlans() {
    return this.paymentsService.findAllPaymentPlans();
  }

  @Post('payment-plans')
  @RequirePermissions('payments:write')
  createPaymentPlan(@Body() dto: { patientId: string; billId: string; totalAmount: number; installmentsCount: number }) {
    return this.paymentsService.createPaymentPlan(dto);
  }
}
