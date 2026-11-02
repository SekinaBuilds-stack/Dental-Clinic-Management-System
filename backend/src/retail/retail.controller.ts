import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RetailService } from './retail.service';
import { CreateRetailSaleDto } from './dto/create-retail-sale.dto';
import { CreateRetailReturnDto } from './dto/create-retail-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('retail-sales')
export class RetailController {
  constructor(private readonly retailService: RetailService) {}

  @Get('products')
  @RequirePermissions('retail:manage')
  async getProducts() {
    return this.retailService.findAllProducts();
  }

  @Get('products/barcode/:barcode')
  @RequirePermissions('retail:manage')
  async getProductByBarcode(@Param('barcode') barcode: string) {
    return this.retailService.findProductByBarcode(barcode);
  }

  @Post()
  @RequirePermissions('retail:manage')
  async createSale(
    @Body() dto: CreateRetailSaleDto,
    @Req() req: Request & { user: { userId: number } },
  ) {
    const cashierId = req.user.userId;
    return this.retailService.createSale(dto, String(cashierId));
  }

  @Post('returns')
  @RequirePermissions('retail:return')
  async processReturn(
    @Body() dto: CreateRetailReturnDto,
    @Req() req: Request & { user: { userId: number } },
  ) {
    const managerId = req.user.userId;
    return this.retailService.processReturn(dto, String(managerId));
  }
}