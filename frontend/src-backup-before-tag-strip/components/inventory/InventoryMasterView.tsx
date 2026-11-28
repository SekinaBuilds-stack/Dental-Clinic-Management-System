import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
}

export function InventoryMasterView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('CONSUMABLE');
  const [minStockLevel, setMinStockLevel] = useState(5);
  const [unit, setUnit] = useState('pcs');

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/inventory/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error('Failed to load inventory items', err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, sku, category, minStockLevel: Number(minStockLevel), unit })
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setSku('');
        fetchItems();
      }
    } catch (err) {
      alert('Failed to create inventory item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Inventory Master & Stock Management</h1>
          <p className="text-xs text-gray-500">Manage clinical consumables, equipment, and retail stock levels</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition"
        >
          <Plus size={16} /> Add Inventory Item
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">SKU</th>
              <th className="pb-3">Item Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Current Stock</th>
              <th className="pb-3">Min Level</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="py-3 font-mono font-bold text-gray-600">{item.sku}</td>
                <td className="py-3 font-bold text-gray-900">{item.name}</td>
                <td className="py-3"><span className="px-2.5 py-1 bg-gray-100 rounded-xl font-bold text-[10px]">{item.category}</span></td>
                <td className="py-3 font-extrabold text-gray-900">{item.currentStock} {item.unit}</td>
                <td className="py-3 text-gray-500">{item.minStockLevel} {item.unit}</td>
                <td className="py-3">
                  {item.currentStock <= item.minStockLevel ? (
                    <span className="flex items-center gap-1 text-red-600 font-bold"><ShieldAlert size={14} /> Low Stock</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">Optimal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <h3 className="font-bold text-sm text-gray-900 border-b pb-3">Create Inventory Item</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Item Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Composite Resin A2" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">SKU Code</label>
                <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className="w-full p-3 border rounded-xl text-xs outline-none font-mono" placeholder="e.g. INV-RES-02" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-semibold bg-gray-50">
                  <option value="CONSUMABLE">Clinical Consumable</option>
                  <option value="EQUIPMENT">Instrument / Equipment</option>
                  <option value="RETAIL">Retail Product</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Min Level</label>
                  <input type="number" required value={minStockLevel} onChange={e => setMinStockLevel(Number(e.target.value))} className="w-full p-3 border rounded-xl text-xs" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Unit</label>
                  <input type="text" required value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-3 border rounded-xl text-xs" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}