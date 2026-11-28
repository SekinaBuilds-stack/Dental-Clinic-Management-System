import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('requisitions')
  @RequirePermissions('inventory:manage')
  findAllRequisitions() {
    return this.procurementService.findAllRequisitions();
  }

  @Post('requisitions')
  @RequirePermissions('inventory:manage')
  createRequisition(@Body() dto: any, @Request() req: any) {
    return this.procurementService.createRequisition(dto, req.user.userId);
  }

  @Post('requisitions/:id/convert-po')
  @RequirePermissions('inventory:manage')
  convertToPo(@Param('id') id: string, @Body() body: { supplierId: string; quotedPrice: number }) {
    return this.procurementService.convertToPo(id, body.supplierId, body.quotedPrice);
  }

  // Dentists and assistants record the materials they used at the chair.
  @Post('consumptions')
  @RequirePermissions('inventory:consume')
  recordConsumption(@Body() dto: any, @Request() req: any) {
    return this.procurementService.recordConsumption(dto, req.user.userId);
  }

  @Get('adjustments')
  @RequirePermissions('inventory:manage')
  findAllAdjustments() {
    return this.procurementService.findAllAdjustments();
  }

  @Post('adjustments')
  @RequirePermissions('inventory:manage')
  createAdjustment(@Body() dto: any, @Request() req: any) {
    return this.procurementService.createStockAdjustment(dto, req.user.userId);
  }

  @Patch('adjustments/:id/approve')
  @RequirePermissions('inventory:manage')
  approveAdjustment(@Param('id') id: string, @Request() req: any) {
    return this.procurementService.approveAdjustment(id, req.user.userId);
  }
}
