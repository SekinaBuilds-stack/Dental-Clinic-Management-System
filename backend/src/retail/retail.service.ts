import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RetailProduct } from './entities/retail-product.entity';
import { RetailSale, RetailSaleItem, RetailSaleStatus } from './entities/retail-sale.entity';
import { RetailReturn } from './entities/retail-return.entity';
import { CreateRetailSaleDto } from './dto/create-retail-sale.dto';
import { CreateRetailReturnDto } from './dto/create-retail-return.dto';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';

@Injectable()
export class RetailService {
  constructor(
    @InjectRepository(RetailProduct)
    private retailProductRepo: Repository<RetailProduct>,
    @InjectRepository(RetailSale)
    private retailSaleRepo: Repository<RetailSale>,
    @InjectRepository(RetailReturn)
    private retailReturnRepo: Repository<RetailReturn>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepo: Repository<InventoryItem>,
    private dataSource: DataSource,
  ) {}

  async findAllProducts(): Promise<RetailProduct[]> {
    return this.retailProductRepo.find({ relations: ['inventoryItem'] });
  }

  async findProductByBarcode(barcode: string): Promise<RetailProduct> {
    const product = await this.retailProductRepo.findOne({
      where: { barcode },
      relations: ['inventoryItem'],
    });
    if (!product) throw new NotFoundException(`Product with barcode ${barcode} not found`);
    return product;
  }

  async createSale(dto: CreateRetailSaleDto, cashierId: string): Promise<RetailSale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let subtotal = 0;
      const saleItems: RetailSaleItem[] = [];

      for (const itemDto of dto.items) {
        const retailProduct = await queryRunner.manager.findOne(RetailProduct, {
          where: { id: itemDto.retailProductId },
          relations: ['inventoryItem'],
        });

        if (!retailProduct || !retailProduct.isActive) {
          throw new NotFoundException(`Retail product ID ${itemDto.retailProductId} not found or inactive`);
        }

        const inventoryItem = retailProduct.inventoryItem;
        if (inventoryItem.currentStock < itemDto.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${inventoryItem.name}. Available: ${inventoryItem.currentStock}`);
        }

        // Deduct stock atomically
        inventoryItem.currentStock -= itemDto.quantity;
        await queryRunner.manager.save(inventoryItem);

        // Record stock movement (outbound sale)
        const movement = queryRunner.manager.create(StockMovement, {
          inventoryItemId: inventoryItem.id,
          quantity: -itemDto.quantity,
          movementType: MovementType.SALE,
          reference: `POS-SALE-${Date.now()}`,
          userId: cashierId,
        });
        await queryRunner.manager.save(movement);

        const itemSubtotal = Number(retailProduct.retailPrice) * itemDto.quantity;
        subtotal += itemSubtotal;

        const saleItem = queryRunner.manager.create(RetailSaleItem, {
          retailProductId: retailProduct.id,
          productName: inventoryItem.name,
          quantity: itemDto.quantity,
          unitPrice: retailProduct.retailPrice,
          subtotal: itemSubtotal,
        });
        saleItems.push(saleItem);
      }

      const taxAmount = Number((subtotal * 0.15).toFixed(2)); // Standard 15% VAT example
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));

      const sale = queryRunner.manager.create(RetailSale, {
        receiptNumber: `REC-${Date.now()}`,
        patientId: dto.patientId || undefined,
        cashierId,
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod: dto.paymentMethod,
        status: RetailSaleStatus.COMPLETED,
        items: saleItems,
      });

      const savedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return savedSale;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async processReturn(dto: CreateRetailReturnDto, managerId: string): Promise<RetailReturn> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(RetailSale, {
        where: { id: dto.retailSaleId },
        relations: ['items'],
      });
      if (!sale) throw new NotFoundException('Retail sale not found');

      const saleItem = sale.items.find((i) => i.retailProductId === dto.retailProductId);
      if (!saleItem) throw new NotFoundException('Product not found in this sale receipt');

      if (dto.returnQuantity > saleItem.quantity) {
        throw new BadRequestException('Return quantity exceeds purchased quantity');
      }

      const refundAmount = Number((Number(saleItem.unitPrice) * dto.returnQuantity).toFixed(2));

      // Restore inventory stock
      const retailProduct = await queryRunner.manager.findOne(RetailProduct, {
        where: { id: dto.retailProductId },
        relations: ['inventoryItem'],
      });
      if (!retailProduct) throw new NotFoundException('Retail product not found');

      const inventoryItem = retailProduct.inventoryItem;
      inventoryItem.currentStock += dto.returnQuantity;
      await queryRunner.manager.save(inventoryItem);

      // Record inbound return stock movement
      const movement = queryRunner.manager.create(StockMovement, {
        inventoryItemId: inventoryItem.id,
        quantity: dto.returnQuantity,
        movementType: MovementType.RETURN,
        reference: `POS-RETURN-${sale.receiptNumber}`,
        userId: managerId,
      });
      await queryRunner.manager.save(movement);

      const retailReturn = queryRunner.manager.create(RetailReturn, {
        retailSaleId: sale.id,
        retailProductId: dto.retailProductId,
        returnQuantity: dto.returnQuantity,
        refundAmount,
        reason: dto.reason,
        approvedByUserId: managerId,
      });

      const savedReturn = await queryRunner.manager.save(retailReturn);
      await queryRunner.commitTransaction();
      return savedReturn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}