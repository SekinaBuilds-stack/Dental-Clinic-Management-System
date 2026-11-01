// frontend/src/components/payments/CheckoutTerminal.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CheckoutTerminalProps {
  billId: string;
  totalDue: number;
  onSuccess?: () => void;
}

export const CheckoutTerminal: React.FC<CheckoutTerminalProps> = ({ billId, totalDue, onSuccess }) => {
  const [amount, setAmount] = useState(totalDue.toString());
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/payments',
        {
          billId,
          amount: Number(amount),
          paymentMethod,
          transactionReference: reference || undefined,
          cashierId: 'current-cashier-id',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
          <CreditCard size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cashier Checkout Terminal (`TR-PAY-002`)</h2>
          <p className="text-xs text-gray-500">Process multi-method bill settlements & generate receipts</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleCheckout} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="MOBILE_MONEY">Mobile Money / Telebirr</option>
            <option value="INSURANCE">Insurance Claim</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Amount to Pay ($)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none"
          />
        </div>

        {paymentMethod !== 'CASH' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Transaction Reference / Approval Code</label>
            <input
              type="text"
              placeholder="e.g. TXN-9982341"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none"
            />
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
          >
            <ShieldCheck size={18} /> {loading ? 'Processing...' : `Complete Payment ($${amount})`}
          </button>
        </div>
      </form>
    </div>
  );
};