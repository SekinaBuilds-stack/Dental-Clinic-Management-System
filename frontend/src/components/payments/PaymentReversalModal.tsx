// frontend/src/components/payments/PaymentReversalModal.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { RotateCcw, ShieldAlert, AlertTriangle } from 'lucide-react';

interface PaymentReversalModalProps {
  paymentId: string;
  onSuccess?: () => void;
}

export const PaymentReversalModal: React.FC<PaymentReversalModalProps> = ({ paymentId, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [managerId, setManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !managerId) {
      setError('Please provide a reason and manager ID for audit logging.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/v1/payments/${paymentId}/reverse`,
        { reason, managerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment reversal failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
          <RotateCcw size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Reversal (`TR-PAY-003`)</h2>
          <p className="text-xs text-gray-500">Manager-approved reversal with immutable audit trail</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleReverse} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Manager ID / Authorization Key</label>
          <input
            type="text"
            placeholder="e.g. MGR-8802"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Reason for Reversal (Required for Audit)</label>
          <textarea
            rows={3}
            placeholder="e.g. Incorrect billing amount charged / Duplicate transaction..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/25 transition flex items-center gap-2"
          >
            <ShieldAlert size={18} /> {loading ? 'Processing Reversal...' : 'Approve & Reverse Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};