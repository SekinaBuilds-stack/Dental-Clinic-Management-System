import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseRequisition, RequisitionStatus } from './entities/purchase-requisition.entity';
import { Rfq } from './entities/rfq.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { MaterialConsumption } from './entities/material-consumption.entity';
import { StockAdjustment, AdjustmentStatus } from './entities/stock-adjustment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(PurchaseRequisition) private reqRepo: Repository<PurchaseRequisition>,
    @InjectRepository(Rfq) private rfqRepo: Repository<Rfq>,
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(MaterialConsumption) private consumptionRepo: Repository<MaterialConsumption>,
    @InjectRepository(StockAdjustment) private adjustmentRepo: Repository<StockAdjustment>,
    @InjectRepository(InventoryItem) private itemRepo: Repository<InventoryItem>,
    private dataSource: DataSource,
  ) {}

  // TR-INV-003: Requisition Management
  async createRequisition(dto: any, userId: string) {
    const req = this.reqRepo.create({ ...dto, requestedByUserId: userId });
    return this.reqRepo.save(req);
  }

  async findAllRequisitions() {
    return this.reqRepo.find();
  }

  // TR-INV-003: Convert Requisition to PO via RFQ
  async convertToPo(requisitionId: string, supplierId: string, quotedPrice: number) {
    const req = await this.reqRepo.findOne({ where: { id: requisitionId } });
    if (!req) throw new NotFoundException('Requisition not found');

    const po = this.poRepo.create({
      poNumber: `PO-${Date.now()}`,
      supplierId,
      inventoryItemId: req.inventoryItemId,
      quantity: req.quantityRequested,
      totalCost: quotedPrice * req.quantityRequested,
      status: 'ISSUED',
    });

    req.status = RequisitionStatus.CONVERTED_TO_PO;
    await this.reqRepo.save(req);
    return this.poRepo.save(po);
  }

  // TR-INV-009: Chairside Material Consumption & Atomic Stock Deduction
  async recordConsumption(dto: { treatmentId: string; inventoryItemId: string; quantityConsumed: number }, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const consumption = queryRunner.manager.create(MaterialConsumption, {
        ...dto,
        consumedByUserId: userId,
      });
      await queryRunner.manager.save(consumption);

      const item = await queryRunner.manager.findOne(InventoryItem, { where: { id: dto.inventoryItemId } });
      if (!item) throw new NotFoundException('Inventory item not found');
      
      item.currentStock -= dto.quantityConsumed;
      await queryRunner.manager.save(item);

      const movement = queryRunner.manager.create(StockMovement, {
        inventoryItemId: dto.inventoryItemId,
        quantity: -dto.quantityConsumed,
        movementType: MovementType.CONSUMPTION,
        reference: `Chairside Treatment: ${dto.treatmentId}`,
        userId,
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return consumption;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-INV-008: Stock Adjustments & Wastage Approval
  async createStockAdjustment(dto: any, userId: string) {
    const adj = this.adjustmentRepo.create({ ...dto, requestedByUserId: userId });
    return this.adjustmentRepo.save(adj);
  }

  async approveAdjustment(id: string, managerId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adj = await queryRunner.manager.findOne(StockAdjustment, { where: { id } });
      if (!adj) throw new NotFoundException('Stock adjustment record not found');

      adj.status = AdjustmentStatus.APPROVED;
      adj.approvedByUserId = managerId;
      await queryRunner.manager.save(adj);

      const item = await queryRunner.manager.findOne(InventoryItem, { where: { id: adj.inventoryItemId } });
      if (!item) throw new NotFoundException('Inventory item not found');
      item.currentStock += adj.adjustmentQuantity;
      await queryRunner.manager.save(item);

      const movement = queryRunner.manager.create(StockMovement, {
        inventoryItemId: adj.inventoryItemId,
        quantity: adj.adjustmentQuantity,
        movementType: MovementType.ADJUSTMENT,
        reference: `Adjustment Reason: ${adj.reasonCode}`,
        userId: managerId,
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return adj;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllAdjustments() {
    return this.adjustmentRepo.find();
  }
}