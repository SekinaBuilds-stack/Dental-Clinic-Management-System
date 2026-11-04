import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Truck } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface GrnItemInput {
  inventoryItemId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

export function GRNEntryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [grnNumber, setGrnNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [grnItems, setGrnItems] = useState<GrnItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Fetch items and suppliers
    fetch('http://localhost:3000/api/v1/inventory/items', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(data => setItems(data)).catch(console.error);

    fetch('http://localhost:3000/api/v1/inventory/suppliers', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(data => setSuppliers(data)).catch(console.error);
  }, []);

  const addItemRow = () => {
    setGrnItems([...grnItems, { inventoryItemId: items[0]?.id || '', batchNumber: '', quantity: 1, expiryDate: '' }]);
  };

  const removeItemRow = (index: number) => {
    setGrnItems(grnItems.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof GrnItemInput, value: any) => {
    const updated = [...grnItems];
    updated[index] = { ...updated[index], [field]: value };
    setGrnItems(updated);
  };

  const handleSubmitGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/inventory/grns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grnNumber, supplierId, items: grnItems })
      });
      if (!res.ok) throw new Error('Failed to submit GRN');
      setSuccessMsg('Goods Receipt Note recorded successfully! Stock batches and ledger updated.');
      setGrnNumber('');
      setGrnItems([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Goods Receipt Note (GRN) Entry</h1>
          <p className="text-xs text-gray-500">Record incoming shipments, batch numbers, and expiry dates from suppliers</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-2xl">
          <Truck size={16} /> TR-INV-002 & TR-INV-005
        </div>
      </div>

      <form onSubmit={handleSubmitGrn} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">GRN Number Reference</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. GRN-2026-001" 
              value={grnNumber} 
              onChange={e => setGrnNumber(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Supplier</label>
            <select 
              required 
              value={supplierId} 
              onChange={e => setSupplierId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs font-semibold bg-gray-50 outline-none"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Received Line Items</h3>
            <button 
              type="button" 
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
            >
              <Plus size={14} /> Add Item Batch
            </button>
          </div>

          <div className="space-y-3">
            {grnItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8 bg-gray-50 rounded-2xl border border-dashed">No items added to this GRN yet. Click "Add Item Batch" above.</p>
            ) : (
              grnItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-2xl items-center">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Inventory Item</label>
                    <select 
                      value={item.inventoryItemId} 
                      onChange={e => handleRowChange(idx, 'inventoryItemId', e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs bg-white font-medium"
                    >
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Batch Number</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Batch # e.g. B2026" 
                      value={item.batchNumber} 
                      onChange={e => handleRowChange(idx, 'batchNumber', e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs font-mono bg-white" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={item.quantity} 
                      onChange={e => handleRowChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full p-2 border rounded-xl text-xs bg-white font-bold" 
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Expiry Date</label>
                      <input 
                        type="date" 
                        required 
                        value={item.expiryDate} 
                        onChange={e => handleRowChange(idx, 'expiryDate', e.target.value)}
                        className="w-full p-2 border rounded-xl text-xs bg-white" 
                      />
                    </div>
                    <button type="button" onClick={() => removeItemRow(idx)} className="p-2 text-red-400 hover:text-red-600 self-end"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || grnItems.length === 0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md text-xs transition"
        >
          {loading ? 'Processing GRN...' : 'Commit Goods Receipt Note'}
        </button>
      </form>
    </div>
  );
}