import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

interface RetailReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RetailReturnModal({ isOpen, onClose, onSuccess }: RetailReturnModalProps) {
  const [retailSaleId, setRetailSaleId] = useState('');
  const [retailProductId, setRetailProductId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/retail-sales/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          retailSaleId,
          retailProductId,
          returnQuantity: Number(returnQuantity),
          reason
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to process return');
      }

      setSuccess('Return processed successfully! Inventory stock restored.');
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
            <RotateCcw className="text-emerald-600" size={20} />
            <span>Process Retail Return</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleProcessReturn} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Retail Sale ID / UUID</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 5a12b3c4-..." 
              value={retailSaleId}
              onChange={e => setRetailSaleId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Retail Product ID / UUID</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 9f8e7d6c-..." 
              value={retailProductId}
              onChange={e => setRetailProductId(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Return Quantity</label>
            <input 
              type="number" 
              min="1"
              required
              value={returnQuantity}
              onChange={e => setReturnQuantity(Number(e.target.value))}
              className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Reason for Return</label>
            <textarea 
              rows={3}
              required
              placeholder="e.g. Defective packaging or customer exchange..." 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 text-xs transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md text-xs transition"
            >
              {loading ? 'Processing...' : 'Authorize & Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}