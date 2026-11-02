import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetailController } from './retail.controller';
import { RetailService } from './retail.service';
import { RetailProduct } from './entities/retail-product.entity';
import { RetailSale, RetailSaleItem } from './entities/retail-sale.entity';
import { RetailReturn } from './entities/retail-return.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetailProduct,
      RetailSale,
      RetailSaleItem,
      RetailReturn,
    ]),
    InventoryModule,
  ],
  controllers: [RetailController],
  providers: [RetailService],
  exports: [RetailService],
})
export class RetailModule {}