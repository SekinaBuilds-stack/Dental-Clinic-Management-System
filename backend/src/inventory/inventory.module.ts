import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Grn } from './entities/grn.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { Supplier } from './entities/supplier.entity';

@Module({
 imports: [TypeOrmModule.forFeature([InventoryItem, StockMovement, Grn, StockBatch, Supplier])],
  exports: [TypeOrmModule],
})
export class InventoryModule {}