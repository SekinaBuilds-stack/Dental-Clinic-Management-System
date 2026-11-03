export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
}

export interface RetailProduct {
  id: string;
  sku: string;
  barcode: string;
  retailPrice: number;
  isActive: boolean;
  inventoryItem: InventoryItem;
}

export interface RetailSaleItem {
  id: string;
  retailProductId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface RetailSale {
  id: string;
  receiptNumber: string;
  patientId?: string;
  cashierId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  items: RetailSaleItem[];
  createdAt: string;
}