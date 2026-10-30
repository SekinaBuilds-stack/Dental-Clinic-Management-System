// frontend/src/components/billing/DayBookView.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';

export const DayBookView: React.FC = () => {
  const [summary, setSummary] = useState<any>({ totalCollected: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDayBook = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/v1/billing/day-book', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch day-book summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDayBook();
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Day-Book Reconciliation (`TR-BIL-005`)</h2>
            <p className="text-xs text-gray-500">Daily financial ledger and cash collection summary</p>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 text-right">
          <span className="text-[10px] font-bold text-blue-600 uppercase block">Today's Collection</span>
          <span className="text-lg font-extrabold text-blue-700 font-mono">${summary.totalCollected}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-6">Loading day-book records...</p>
      ) : summary.transactions.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No transactions recorded for today.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {summary.transactions.map((tx: any) => (
            <div key={tx.id} className="p-4 flex items-center justify-between bg-white">
              <div>
                <span className="text-xs font-bold text-gray-900 block">{tx.transactionType} ({tx.paymentMethod})</span>
                <span className="text-[10px] text-gray-400">Ref: {tx.referenceId.slice(0, 8)} • {tx.createdAt}</span>
              </div>
              <span className="font-mono font-bold text-emerald-600 text-sm">+${tx.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};