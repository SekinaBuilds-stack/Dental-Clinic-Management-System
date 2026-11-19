import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { RequisitionStatus } from './entities/purchase-requisition.entity';
import { AdjustmentStatus } from './entities/stock-adjustment.entity';
import { MovementType } from '../inventory/entities/stock-movement.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { makeQueryRunner } from '../test-utils/mock-query-runner';

describe('ProcurementService (FR-INV)', () => {
  let service: ProcurementService;
  let qr: ReturnType<typeof makeQueryRunner>;
  let reqRepo: any;
  let poRepo: any;
  let adjustmentRepo: any;

  beforeEach(() => {
    qr = makeQueryRunner();
    reqRepo = {
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'req-1', ...x })),
      find: vi.fn(),
      findOne: vi.fn(),
    };
    poRepo = { create: vi.fn((x: any) => ({ ...x })), save: vi.fn(async (x: any) => ({ id: 'po-1', ...x })) };
    adjustmentRepo = {
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'adj-1', ...x })),
      find: vi.fn(),
    };
    service = new ProcurementService(
      reqRepo,
      {} as any, // rfqRepo
      poRepo,
      {} as any, // consumptionRepo
      adjustmentRepo,
      {} as any, // itemRepo
      qr.dataSource as any,
    );
  });

  describe('requisitions (TR-INV-003)', () => {
    it('stamps the requesting user on a new requisition', async () => {
      const result = await service.createRequisition({ inventoryItemId: 'i1', quantityRequested: 20 }, 'user-1');
      expect(reqRepo.create).toHaveBeenCalledWith({ inventoryItemId: 'i1', quantityRequested: 20, requestedByUserId: 'user-1' });
      expect(result.id).toBe('req-1');
    });

    it('lists all requisitions', async () => {
      reqRepo.find.mockResolvedValue([{ id: 'r1' }]);
      await expect(service.findAllRequisitions()).resolves.toEqual([{ id: 'r1' }]);
    });

    it('throws NotFoundException when converting an unknown requisition', async () => {
      reqRepo.findOne.mockResolvedValue(null);
      await expect(service.convertToPo('nope', 's1', 10)).rejects.toThrow(NotFoundException);
      expect(poRepo.save).not.toHaveBeenCalled();
    });

    it('converts a requisition into an ISSUED purchase order with the quoted total', async () => {
      reqRepo.findOne.mockResolvedValue({ id: 'req-1', inventoryItemId: 'i1', quantityRequested: 20, status: 'PENDING' });

      const po = await service.convertToPo('req-1', 'sup-1', 12.5);

      expect(poRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ supplierId: 'sup-1', inventoryItemId: 'i1', quantity: 20, totalCost: 250, status: 'ISSUED' }),
      );
      expect(po.poNumber).toMatch(/^PO-\d+$/);
      expect(reqRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: RequisitionStatus.CONVERTED_TO_PO }));
    });
  });

  describe('recordConsumption (TR-INV-009)', () => {
    const dto = { treatmentId: 't1', inventoryItemId: 'i1', quantityConsumed: 3 };

    it('deducts stock and writes a negative CONSUMPTION movement atomically', async () => {
      const item = { id: 'i1', currentStock: 10 };
      qr.manager.findOne.mockResolvedValue(item);

      await service.recordConsumption(dto, 'user-1');

      expect(item.currentStock).toBe(7);
      expect(qr.manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          inventoryItemId: 'i1',
          quantity: -3,
          movementType: MovementType.CONSUMPTION,
          reference: 'Chairside Treatment: t1',
          userId: 'user-1',
        }),
      );
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back when the inventory item does not exist', async () => {
      qr.manager.findOne.mockResolvedValue(null);

      await expect(service.recordConsumption(dto, 'user-1')).rejects.toThrow(NotFoundException);

      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('stock adjustments (TR-INV-008)', () => {
    it('creates an adjustment request for the requesting user', async () => {
      await service.createStockAdjustment({ inventoryItemId: 'i1', adjustmentQuantity: -2, reasonCode: 'EXPIRED' }, 'user-1');
      expect(adjustmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ adjustmentQuantity: -2, requestedByUserId: 'user-1' }),
      );
    });

    it('lists adjustments', async () => {
      adjustmentRepo.find.mockResolvedValue([{ id: 'a1' }]);
      await expect(service.findAllAdjustments()).resolves.toEqual([{ id: 'a1' }]);
    });

    it('approves an adjustment, applies it to stock and logs an ADJUSTMENT movement', async () => {
      const adj: any = { id: 'adj-1', inventoryItemId: 'i1', adjustmentQuantity: -2, reasonCode: 'EXPIRED', status: 'PENDING' };
      const item = { id: 'i1', currentStock: 10 };
      qr.manager.findOne.mockResolvedValueOnce(adj).mockResolvedValueOnce(item);

      const result = await service.approveAdjustment('adj-1', 'mgr-1');

      expect(result.status).toBe(AdjustmentStatus.APPROVED);
      expect(result.approvedByUserId).toBe('mgr-1');
      expect(item.currentStock).toBe(8);
      expect(qr.manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({ quantity: -2, movementType: MovementType.ADJUSTMENT, userId: 'mgr-1' }),
      );
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('rolls back when the adjustment does not exist', async () => {
      qr.manager.findOne.mockResolvedValueOnce(null);
      await expect(service.approveAdjustment('nope', 'mgr-1')).rejects.toThrow(NotFoundException);
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back when the adjusted inventory item does not exist', async () => {
      qr.manager.findOne.mockResolvedValueOnce({ id: 'adj-1', inventoryItemId: 'gone', adjustmentQuantity: 1 }).mockResolvedValueOnce(null);
      await expect(service.approveAdjustment('adj-1', 'mgr-1')).rejects.toThrow(NotFoundException);
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
