import React, { useState, useEffect } from 'react';
interface Adjustment {
  id: string;
  inventoryItemId: string;
  adjustmentQuantity: number;
  reasonCode: string;
  status: string;
}

export function StockAdjustmentModal() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(-1);
  const [reasonCode, setReasonCode] = useState('DAMAGED');

  const fetchAdjustments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/procurement/adjustments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAdjustments(await res.json());
    } catch (err) {
      console.error('Failed to load stock adjustments', err);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/procurement/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inventoryItemId, adjustmentQuantity: Number(adjustmentQuantity), reasonCode })
      });
      if (res.ok) {
        setShowModal(false);
        setInventoryItemId('');
        fetchAdjustments();
      }
    } catch (err) {
      alert('Failed to submit adjustment request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/v1/procurement/adjustments/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Stock adjustment approved and inventory updated!');
        fetchAdjustments();
      }
    } catch (err) {
      alert('Failed to approve adjustment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Stock Adjustments & Wastage Approvals</h2>
          <p className="text-xs text-gray-500">Manager-approved stock discrepancies and wastage logs (TR-INV-008)</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-md transition"
        >
          Request Adjustment
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Item UUID</th>
              <th className="pb-3">Adjustment Qty</th>
              <th className="pb-3">Reason Code</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Manager Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {adjustments.map(adj => (
              <tr key={adj.id} className="hover:bg-gray-50/50">
                <td className="py-3 font-mono text-gray-500">{adj.inventoryItemId}</td>
                <td className={`py-3 font-extrabold ${adj.adjustmentQuantity < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{adj.adjustmentQuantity}</td>
                <td className="py-3"><span className="px-2.5 py-1 bg-gray-100 rounded-xl font-bold text-[10px]">{adj.reasonCode}</span></td>
                <td className="py-3">
                  <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] ${adj.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {adj.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {adj.status === 'PENDING' && (
                    <button 
                      onClick={() => handleApprove(adj.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl text-[10px] shadow-sm transition"
                    >
                      Approve Adjustment ✓
                    </button>
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
            <h3 className="font-bold text-sm text-gray-900 border-b pb-3">Request Stock Adjustment</h3>
            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Inventory Item UUID</label>
                <input type="text" required value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-mono" placeholder="Item ID..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Adjustment Quantity (+/-)</label>
                <input type="number" required value={adjustmentQuantity} onChange={e => setAdjustmentQuantity(Number(e.target.value))} className="w-full p-3 border rounded-xl text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason Code</label>
                <select value={reasonCode} onChange={e => setReasonCode(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-semibold bg-gray-50">
                  <option value="DAMAGED">Damaged / Broken</option>
                  <option value="EXPIRED">Expired Shelf Life</option>
                  <option value="COUNT_DISCREPANCY">Physical Count Discrepancy</option>
                  <option value="WASTAGE">Procedure Wastage</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-2xl text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-md">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}