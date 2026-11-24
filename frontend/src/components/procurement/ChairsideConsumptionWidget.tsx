import React, { useState } from 'react';
import { PackageMinus } from 'lucide-react';
import api from '../../services/api';
import { useList, errMsg } from '../../lib/useApi';
import { ErrorNote, SuccessNote } from '../common/Feedback';

interface InventoryItem { id: string; name: string; sku: string; currentStock: number; unit: string }

export function ChairsideConsumptionWidget() {
  const { data: items, error: loadError, reload } = useList<InventoryItem>('/api/v1/inventory/items');
  const [treatmentId, setTreatmentId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityConsumed, setQuantityConsumed] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleRecordConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setSubmitError('');
    try {
      await api.post('/api/v1/procurement/consumptions', { treatmentId, inventoryItemId, quantityConsumed: Number(quantityConsumed) });
      setSuccessMsg('Consumption recorded and stock deducted.');
      setTreatmentId('');
      setQuantityConsumed(1);
      reload();
    } catch (err) {
      setSubmitError(errMsg(err));
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-sm font-bold text-gray-900">Chairside Consumption</h2>
        <p className="text-xs text-gray-500">Deduct materials used during a procedure</p>
      </div>

      <ErrorNote message={loadError} />

      <form onSubmit={handleRecordConsumption} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cc-treatment" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Treatment / Procedure ID</label>
            <input id="cc-treatment" type="text" required placeholder="e.g. TRMT-1024" value={treatmentId}
              onChange={(e) => setTreatmentId(e.target.value)} className="w-full p-3 border rounded-xl text-xs outline-none font-mono" />
          </div>
          <div>
            <label htmlFor="cc-item" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Material</label>
            <select id="cc-item" required value={inventoryItemId} onChange={(e) => setInventoryItemId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs font-semibold bg-gray-50">
              <option value="">Select item…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.currentStock} {item.unit} available)</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cc-qty" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quantity Used</label>
            <input id="cc-qty" type="number" min="1" required value={quantityConsumed}
              onChange={(e) => setQuantityConsumed(Number(e.target.value))} className="w-full p-3 border rounded-xl text-xs font-bold" />
          </div>
        </div>

        <ErrorNote message={submitError} />
        <SuccessNote message={successMsg} />

        <button type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
          <PackageMinus size={16} /> Record Consumption
        </button>
      </form>
    </div>
  );
}
