import React, { useState, useEffect } from 'react';

interface Requisition {
  id: string;
  requisitionNumber: string;
  inventoryItemId: string;
  quantityRequested: number;
  status: string;
}

export function ProcurementWorkflowView() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityRequested, setQuantityRequested] = useState(10);
  const [requisitionNumber, setRequisitionNumber] = useState('');

  const fetchRequisitions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/procurement/requisitions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRequisitions(await res.json());
    } catch (err) {
      console.error('Failed to load requisitions', err);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleCreateReq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/procurement/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requisitionNumber, inventoryItemId, quantityRequested: Number(quantityRequested) })
      });
      if (res.ok) {
        setShowModal(false);
        setRequisitionNumber('');
        fetchRequisitions();
      }
    } catch (err) {
      alert('Failed to create purchase requisition');
    }
  };

  const handleConvertToPo = async (id: string) => {
    const supplierId = prompt('Enter Supplier UUID for PO conversion:');
    const quotedPrice = prompt('Enter Quoted Unit Price ($):');
    if (!supplierId || !quotedPrice) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/v1/procurement/requisitions/${id}/convert-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supplierId, quotedPrice: Number(quotedPrice) })
      });
      if (res.ok) {
        alert('Requisition successfully converted to Purchase Order!');
        fetchRequisitions();
      }
    } catch (err) {
      alert('Failed to convert to PO');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Procurement Pipeline (Requisition → RFQ → PO)</h1>
          <p className="text-xs text-gray-500">Manage low-stock replenishment requisitions and purchase orders (TR-INV-003)</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition"
        >
          New Requisition
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Requisition #</th>
              <th className="pb-3">Item UUID</th>
              <th className="pb-3">Quantity</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requisitions.map(req => (
              <tr key={req.id} className="hover:bg-gray-50/50">
                <td className="py-3 font-mono font-bold text-gray-800">{req.requisitionNumber}</td>
                <td className="py-3 font-mono text-gray-500">{req.inventoryItemId}</td>
                <td className="py-3 font-extrabold">{req.quantityRequested}</td>
                <td className="py-3">
                  <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] ${req.status === 'CONVERTED_TO_PO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {req.status === 'PENDING' && (
                    <button 
                      onClick={() => handleConvertToPo(req.id)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-[10px] transition"
                    >
                      Convert to PO →
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
            <h3 className="font-bold text-sm text-gray-900 border-b pb-3">Create Purchase Requisition</h3>
            <form onSubmit={handleCreateReq} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Requisition Number</label>
                <input type="text" required value={requisitionNumber} onChange={e => setRequisitionNumber(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-mono" placeholder="REQ-2026-01" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Inventory Item UUID</label>
                <input type="text" required value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-mono" placeholder="Item ID..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quantity Requested</label>
                <input type="number" min="1" required value={quantityRequested} onChange={e => setQuantityRequested(Number(e.target.value))} className="w-full p-3 border rounded-xl text-xs font-bold" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-2xl text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md">Save Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}