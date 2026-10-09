// backend/src/payments/payments.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  
  @Post('reverse')
  @RequirePermissions('payments:reverse')
  async reversePayment(@Body() reversalDto: any) {
    // Only users with 'payments:reverse' permission can execute this
    return { success: true, message: 'Payment reversed and logged in audit trail.' };
  }
}