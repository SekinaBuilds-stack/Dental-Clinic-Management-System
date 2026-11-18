import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { makeQueryRunner } from '../test-utils/mock-query-runner';

describe('InventoryService (FR-INV)', () => {
  let service: InventoryService;
  let qr: ReturnType<typeof makeQueryRunner>;
  let movementRepo: any;

  const grnDto: any = {
    grnNumber: 'GRN-1',
    supplierId: 's1',
    items: [{ inventoryItemId: 'i1', batchNumber: 'B1', quantity: 10, expiryDate: '2028-11-30' }],
  };

  beforeEach(() => {
    qr = makeQueryRunner();
    movementRepo = { find: vi.fn().mockResolvedValue([]) };
    service = new InventoryService(
      {} as any, // itemRepo
      movementRepo,
      {} as any, // supplierRepo
      {} as any, // batchRepo
      {} as any, // grnRepo
      qr.dataSource as any,
    );
  });

  describe('createGrn', () => {
    it('creates a batch, increments stock and records a GRN ledger movement', async () => {
      const item = { id: 'i1', currentStock: 5 };
      qr.manager.findOne.mockResolvedValue(item);

      await service.createGrn(grnDto, 'u1');

      expect(qr.manager.create).toHaveBeenCalledWith(
        StockBatch,
        expect.objectContaining({ inventoryItemId: 'i1', batchNumber: 'B1', quantity: 10 }),
      );
      expect(item.currentStock).toBe(15);
      expect(qr.manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          inventoryItemId: 'i1',
          quantity: 10,
          movementType: MovementType.GRN,
          reference: 'GRN: GRN-1',
          userId: 'u1',
        }),
      );
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back when an inventory item does not exist', async () => {
      qr.manager.findOne.mockResolvedValue(null);

      await expect(service.createGrn(grnDto, 'u1')).rejects.toThrow(NotFoundException);

      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getStockLedger', () => {
    it('returns movements newest first', async () => {
      await service.getStockLedger();
      expect(movementRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });
});