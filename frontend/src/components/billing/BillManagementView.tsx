// frontend/src/components/billing/BillManagementView.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, CreditCard } from 'lucide-react';

interface BillManagementViewProps {
  patientId: string;
}

export const BillManagementView: React.FC<BillManagementViewProps> = ({ patientId }) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3000/api/v1/billing/bills/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBills(res.data);
    } catch (err) {
      console.error('Failed to fetch bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [patientId]);

  const handlePay = async (billId: string) => {
    if (!amountPaid) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/billing/receipts',
        {
          billId,
          amountPaid: Number(amountPaid),
          paymentMethod,
          cashierId: 'current-cashier-id',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayingBillId(null);
      setAmountPaid('');
      fetchBills();
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bill Management & Checkout (`TR-BIL-002`)</h2>
            <p className="text-xs text-gray-500">View patient billing status and process secure settlements</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading bills...</p>
      ) : bills.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No bills recorded for this patient.</p>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="border border-gray-100 rounded-2xl p-5 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Bill ID: {bill.id.slice(0, 8)}</span>
                  <p className="text-sm font-bold text-gray-900">Total: ${bill.totalAmount} | Paid: ${bill.paidAmount}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {bill.status}
                </span>
              </div>

              {/* Bill Items */}
              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1">
                {bill.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span>{item.description} (x{item.quantity})</span>
                    <span className="font-mono">${item.totalPrice}</span>
                  </div>
                ))}
              </div>

              {bill.status !== 'PAID' && (
                <div className="pt-2 flex items-center justify-end gap-3">
                  {payingBillId === bill.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="px-3 py-1.5 border rounded-xl text-xs w-28 bg-white focus:outline-none"
                      />
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-none"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                      </select>
                      <button
                        onClick={() => handlePay(bill.id)}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPayingBillId(bill.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CreditCard size={14} /> Pay Bill
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};