import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('requisitions')
  findAllRequisitions() {
    return this.procurementService.findAllRequisitions();
  }

  @Post('requisitions')
  createRequisition(@Body() dto: any, @Request() req: any) {
    return this.procurementService.createRequisition(dto, req.user.userId);
  }

  @Post('requisitions/:id/convert-po')
  convertToPo(@Param('id') id: string, @Body() body: { supplierId: string; quotedPrice: number }) {
    return this.procurementService.convertToPo(id, body.supplierId, body.quotedPrice);
  }

  @Post('consumptions')
  recordConsumption(@Body() dto: any, @Request() req: any) {
    return this.procurementService.recordConsumption(dto, req.user.userId);
  }

  @Get('adjustments')
  findAllAdjustments() {
    return this.procurementService.findAllAdjustments();
  }

  @Post('adjustments')
  createAdjustment(@Body() dto: any, @Request() req: any) {
    return this.procurementService.createStockAdjustment(dto, req.user.userId);
  }

  @Patch('adjustments/:id/approve')
  approveAdjustment(@Param('id') id: string, @Request() req: any) {
    return this.procurementService.approveAdjustment(id, req.user.userId);
  }
}