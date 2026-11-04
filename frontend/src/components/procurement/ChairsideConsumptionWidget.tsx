import React, { useState, useEffect } from 'react';
import { Scissors, CheckCircle, PackageMinus } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  unit: string;
}

export function ChairsideConsumptionWidget() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [treatmentId, setTreatmentId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityConsumed, setQuantityConsumed] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/v1/inventory/items', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(console.error);
  }, []);

  const handleRecordConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/procurement/consumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ treatmentId, inventoryItemId, quantityConsumed: Number(quantityConsumed) })
      });
      if (!res.ok) throw new Error('Failed to record chairside consumption');
      setSuccessMsg('Material consumption recorded and inventory deducted atomically (TR-INV-009)!');
      setTreatmentId('');
      setQuantityConsumed(1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Chairside Material Consumption Widget</h2>
          <p className="text-xs text-gray-500">Automatically deduct clinical consumables upon procedure completion (TR-INV-009)</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs">
          <Scissors size={14} /> Chairside EMR Link
        </div>
      </div>

      <form onSubmit={handleRecordConsumption} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Treatment / Procedure ID</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. TRMT-1024" 
              value={treatmentId} 
              onChange={e => setTreatmentId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs outline-none font-mono" 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Select Consumable Material</label>
            <select 
              required 
              value={inventoryItemId} 
              onChange={e => setInventoryItemId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs font-semibold bg-gray-50"
            >
              <option value="">Select Item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.currentStock} {item.unit} available)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quantity Consumed</label>
            <input 
              type="number" 
              min="1" 
              required 
              value={quantityConsumed} 
              onChange={e => setQuantityConsumed(Number(e.target.value))}
              className="w-full p-3 border rounded-xl text-xs font-bold" 
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <button 
          type="submit" 
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
        >
          <PackageMinus size={16} /> Record Consumption & Deduct Stock
        </button>
      </form>
    </div>
  );
}