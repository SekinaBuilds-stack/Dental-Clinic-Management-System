import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useList, errMsg } from '../../lib/useApi';
import { ErrorNote, SuccessNote } from '../common/Feedback';

interface InventoryItem { id: string; name: string; sku: string; unit: string }
interface Supplier { id: string; name: string }
interface GrnItemInput { inventoryItemId: string; batchNumber: string; quantity: number; expiryDate: string }

export function GRNEntryView() {
  const itemsQ = useList<InventoryItem>('/api/v1/inventory/items');
  const suppliersQ = useList<Supplier>('/api/v1/inventory/suppliers');
  const items = itemsQ.data;
  const suppliers = suppliersQ.data;

  const [grnNumber, setGrnNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [grnItems, setGrnItems] = useState<GrnItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  const addItemRow = () =>
    setGrnItems([...grnItems, { inventoryItemId: items[0]?.id || '', batchNumber: '', quantity: 1, expiryDate: '' }]);
  const removeItemRow = (index: number) => setGrnItems(grnItems.filter((_, i) => i !== index));
  const handleRowChange = (index: number, field: keyof GrnItemInput, value: string | number) => {
    const updated = [...grnItems];
    updated[index] = { ...updated[index], [field]: value };
    setGrnItems(updated);
  };

  const handleSubmitGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setSubmitError('');
    try {
      await api.post('/api/v1/inventory/grns', { grnNumber, supplierId, items: grnItems });
      setSuccessMsg('Goods receipt recorded. Stock and ledger updated.');
      setGrnNumber('');
      setGrnItems([]);
    } catch (err) {
      setSubmitError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">Goods Receipt (GRN)</h1>
        <p className="text-xs text-gray-500">Record incoming stock with batch numbers and expiry dates</p>
      </div>

      <ErrorNote message={itemsQ.error || suppliersQ.error} />

      <form onSubmit={handleSubmitGrn} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="grn-number" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">GRN Number</label>
            <input id="grn-number" type="text" required placeholder="e.g. GRN-2026-001" value={grnNumber}
              onChange={(e) => setGrnNumber(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label htmlFor="grn-supplier" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Supplier</label>
            <select id="grn-supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs font-semibold bg-gray-50 outline-none">
              <option value="">Select supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Received Items</h3>
            <button type="button" onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition">
              <Plus size={14} /> Add Item Batch
            </button>
          </div>

          <div className="space-y-3">
            {grnItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8 bg-gray-50 rounded-2xl border border-dashed">
                No items added yet. Click "Add Item Batch".
              </p>
            ) : (
              grnItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-2xl items-center">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Inventory Item</label>
                    <select value={item.inventoryItemId} onChange={(e) => handleRowChange(idx, 'inventoryItemId', e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs bg-white font-medium">
                      {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Batch Number</label>
                    <input type="text" required placeholder="e.g. B2026" value={item.batchNumber}
                      onChange={(e) => handleRowChange(idx, 'batchNumber', e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs font-mono bg-white" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Quantity</label>
                    <input type="number" min="1" required value={item.quantity}
                      onChange={(e) => handleRowChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full p-2 border rounded-xl text-xs bg-white font-bold" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Expiry Date</label>
                      <input type="date" required value={item.expiryDate}
                        onChange={(e) => handleRowChange(idx, 'expiryDate', e.target.value)}
                        className="w-full p-2 border rounded-xl text-xs bg-white" />
                    </div>
                    <button type="button" aria-label="Remove row" onClick={() => removeItemRow(idx)} className="p-2 text-red-400 hover:text-red-600 self-end">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ErrorNote message={submitError} />
        <SuccessNote message={successMsg} />

        <button type="submit" disabled={loading || grnItems.length === 0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md text-xs transition">
          {loading ? 'Saving…' : 'Save Goods Receipt'}
        </button>
      </form>
    </div>
  );
}
