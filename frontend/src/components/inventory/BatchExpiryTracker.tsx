import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StockBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  inventoryItem: {
    name: string;
    sku: string;
    unit: string;
  };
}

export function BatchExpiryTracker() {
  const [batches, setBatches] = useState<StockBatch[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/v1/inventory/batches', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBatches(data))
      .catch(console.error);
  }, []);

  const isExpiringSoon = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 39200 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Batch & Expiry Tracker</h1>
          <p className="text-xs text-gray-500">Monitor active stock batches and shelf life expiration dates (TR-INV-005)</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Batch Number</th>
              <th className="pb-3">Item Name (SKU)</th>
              <th className="pb-3">Batch Quantity</th>
              <th className="pb-3">Expiry Date</th>
              <th className="pb-3">Shelf-Life Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {batches.map(batch => (
              <tr key={batch.id} className="hover:bg-gray-50/50">
                <td className="py-3 font-mono font-bold text-gray-700">{batch.batchNumber}</td>
                <td className="py-3 font-bold text-gray-900">
                  {batch.inventoryItem?.name} <span className="text-[10px] text-gray-400 font-mono">({batch.inventoryItem?.sku})</span>
                </td>
                <td className="py-3 font-extrabold text-gray-900">{batch.quantity} {batch.inventoryItem?.unit}</td>
                <td className="py-3 font-medium text-gray-600">{new Date(batch.expiryDate).toLocaleDateString()}</td>
                <td className="py-3">
                  {isExpired(batch.expiryDate) ? (
                    <span className="flex items-center gap-1 text-red-600 font-extrabold"><AlertTriangle size={14} /> EXPIRED</span>
                  ) : isExpiringSoon(batch.expiryDate) ? (
                    <span className="flex items-center gap-1 text-amber-600 font-bold"><AlertTriangle size={14} /> Expiring Soon</span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold"><ShieldCheck size={14} /> Safe</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}