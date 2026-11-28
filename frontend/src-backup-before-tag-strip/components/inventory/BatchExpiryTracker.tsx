import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useList } from '../../lib/useApi';
import { ErrorNote, EmptyRow } from '../common/Feedback';

interface StockBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  inventoryItem?: { name: string; sku: string; unit: string };
}

const DAY = 1000 * 60 * 60 * 24;

export function BatchExpiryTracker() {
  const { data: batches, loading, error } = useList<StockBatch>('/api/v1/inventory/batches');

  const daysLeft = (expiry: string) => Math.ceil((new Date(expiry).getTime() - Date.now()) / DAY);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">Batch & Expiry Tracker</h1>
        <p className="text-xs text-gray-500">Stock batches on hand and when they expire</p>
      </div>

      <ErrorNote message={error} />

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Batch Number</th>
              <th className="pb-3">Item (SKU)</th>
              <th className="pb-3">Quantity</th>
              <th className="pb-3">Expiry Date</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {batches.length === 0 && <EmptyRow cols={5} loading={loading} text="No batches recorded yet." />}
            {batches.map((batch) => {
              const d = daysLeft(batch.expiryDate);
              return (
                <tr key={batch.id} className="hover:bg-gray-50/50">
                  <td className="py-3 font-mono font-bold text-gray-700">{batch.batchNumber}</td>
                  <td className="py-3 font-bold text-gray-900">
                    {batch.inventoryItem?.name ?? 'Unknown item'}{' '}
                    <span className="text-[10px] text-gray-400 font-mono">({batch.inventoryItem?.sku ?? '—'})</span>
                  </td>
                  <td className="py-3 font-extrabold text-gray-900">
                    {batch.quantity} {batch.inventoryItem?.unit}
                  </td>
                  <td className="py-3 font-medium text-gray-600">{new Date(batch.expiryDate).toLocaleDateString()}</td>
                  <td className="py-3">
                    {d < 0 ? (
                      <span className="flex items-center gap-1 text-red-600 font-extrabold"><AlertTriangle size={14} /> Expired</span>
                    ) : d <= 30 ? (
                      <span className="flex items-center gap-1 text-amber-600 font-bold"><AlertTriangle size={14} /> Expires in {d} day{d === 1 ? '' : 's'}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold"><ShieldCheck size={14} /> OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
