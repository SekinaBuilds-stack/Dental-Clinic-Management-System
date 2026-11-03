import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateGrnDto } from './dto/create-grn.dto';

@Controller('api/v1/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  findAllItems() {
    return this.inventoryService.findAllItems();
  }

  @Post('items')
  createItem(@Body() dto: any) {
    return this.inventoryService.createItem(dto);
  }

  @Get('suppliers')
  findAllSuppliers() {
    return this.inventoryService.findAllSuppliers();
  }

  @Post('suppliers')
  createSupplier(@Body() dto: any) {
    return this.inventoryService.createSupplier(dto);
  }

  @Post('grns')
  createGrn(@Body() dto: CreateGrnDto, @Request() req: any) {
    return this.inventoryService.createGrn(dto, req.user.userId);
  }

  @Get('ledger')
  getStockLedger() {
    return this.inventoryService.getStockLedger();
  }

  @Get('batches')
  getBatches() {
    return this.inventoryService.getBatches();
  }
}