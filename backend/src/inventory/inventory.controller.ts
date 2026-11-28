import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CreateGrnDto } from './dto/create-grn.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @RequirePermissions('inventory:read')
  findAllItems() {
    return this.inventoryService.findAllItems();
  }

  @Post('items')
  @RequirePermissions('inventory:manage')
  createItem(@Body() dto: any) {
    return this.inventoryService.createItem(dto);
  }

  @Get('suppliers')
  @RequirePermissions('inventory:read')
  findAllSuppliers() {
    return this.inventoryService.findAllSuppliers();
  }

  @Post('suppliers')
  @RequirePermissions('inventory:manage')
  createSupplier(@Body() dto: any) {
    return this.inventoryService.createSupplier(dto);
  }

  @Post('grns')
  @RequirePermissions('inventory:manage')
  createGrn(@Body() dto: CreateGrnDto, @Request() req: any) {
    return this.inventoryService.createGrn(dto, req.user.userId);
  }

  @Get('ledger')
  @RequirePermissions('inventory:read')
  getStockLedger() {
    return this.inventoryService.getStockLedger();
  }

  @Get('batches')
  @RequirePermissions('inventory:read')
  getBatches() {
    return this.inventoryService.getBatches();
  }
}
