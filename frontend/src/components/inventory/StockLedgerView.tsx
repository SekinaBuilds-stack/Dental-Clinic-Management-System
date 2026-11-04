import { useState, useEffect } from 'react';
import { ArrowDownRight } from 'lucide-react';

interface StockMovement {
  id: string;
  inventoryItemId: string;
  quantity: number;
  movementType: string;
  reference: string;
  createdAt: string;
}

export function StockLedgerView() {
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/v1/inventory/ledger', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMovements(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">Stock Movement Audit Ledger</h1>
        <p className="text-xs text-gray-500">Immutable audit history of all inbound GRNs and outbound stock transactions (TR-INV-010)</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Movement Type</th>
              <th className="pb-3">Reference</th>
              <th className="pb-3">Quantity Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {movements.map(mov => (
              <tr key={mov.id} className="hover:bg-gray-50/50">
                <td className="py-3 font-mono text-gray-500">{new Date(mov.createdAt).toLocaleString()}</td>
                <td className="py-3">
                  <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] ${mov.movementType === 'GRN' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                    {mov.movementType}
                  </span>
                </td>
                <td className="py-3 font-bold text-gray-800">{mov.reference}</td>
                <td className="py-3 font-extrabold flex items-center gap-1 text-emerald-600">
                  <ArrowDownRight size={14} /> +{mov.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}