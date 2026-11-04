import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { PurchaseRequisition } from './entities/purchase-requisition.entity';
import { Rfq } from './entities/rfq.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { MaterialConsumption } from './entities/material-consumption.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequisition,
      Rfq,
      PurchaseOrder,
      MaterialConsumption,
      StockAdjustment,
      InventoryItem,
      StockMovement,
    ]),
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}