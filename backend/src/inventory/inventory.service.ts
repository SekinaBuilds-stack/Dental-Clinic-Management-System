import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Supplier } from './entities/supplier.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { Grn } from './entities/grn.entity';
import { CreateGrnDto } from './dto/create-grn.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem) private itemRepo: Repository<InventoryItem>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(StockBatch) private batchRepo: Repository<StockBatch>,
    @InjectRepository(Grn) private grnRepo: Repository<Grn>,
    private dataSource: DataSource,
  ) {}

  // TR-INV-001: Item Master
  async findAllItems() {
    return this.itemRepo.find();
  }

  async createItem(data: Partial<InventoryItem>) {
    const item = this.itemRepo.create(data);
    return this.itemRepo.save(item);
  }

  // TR-INV-004: Supplier Directory
  async findAllSuppliers() {
    return this.supplierRepo.find();
  }

  async createSupplier(data: Partial<Supplier>) {
    const supplier = this.supplierRepo.create(data);
    return this.supplierRepo.save(supplier);
  }

  // TR-INV-002 & TR-INV-005 & TR-INV-010: GRN & Batch Creation with Ledger Audit
  async createGrn(dto: CreateGrnDto, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const grn = queryRunner.manager.create(Grn, {
        grnNumber: dto.grnNumber,
        supplierId: dto.supplierId,
        receivedByUserId: userId,
      });
      const savedGrn = await queryRunner.manager.save(grn);

      for (const itemDto of dto.items) {
        // 1. Create Stock Batch (TR-INV-005)
        const batch = queryRunner.manager.create(StockBatch, {
          inventoryItemId: itemDto.inventoryItemId,
          batchNumber: itemDto.batchNumber,
          quantity: itemDto.quantity,
          expiryDate: new Date(itemDto.expiryDate),
        });
        await queryRunner.manager.save(batch);

        // 2. Increment Inventory Item Current Stock
        const invItem = await queryRunner.manager.findOne(InventoryItem, { where: { id: itemDto.inventoryItemId } });
        if (!invItem) throw new NotFoundException(`Inventory item ${itemDto.inventoryItemId} not found`);
        invItem.currentStock += itemDto.quantity;
        await queryRunner.manager.save(invItem);

        // 3. Record Stock Movement Ledger Entry (TR-INV-010)
        const movement = queryRunner.manager.create(StockMovement, {
          inventoryItemId: itemDto.inventoryItemId,
          quantity: itemDto.quantity,
          movementType: MovementType.GRN,
          reference: `GRN: ${dto.grnNumber}`,
          userId,
        });
        await queryRunner.manager.save(movement);
      }

      await queryRunner.commitTransaction();
      return savedGrn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-INV-010: Stock Ledger History
  async getStockLedger() {
    return this.movementRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getBatches() {
    return this.batchRepo.find({ relations: ['inventoryItem'], order: { expiryDate: 'ASC' } });
  }
}