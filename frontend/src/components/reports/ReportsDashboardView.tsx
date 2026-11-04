import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Users, Activity, Clock, FileSpreadsheet } from 'lucide-react';

export function ReportsDashboardView() {
  const [collections, setCollections] = useState<any>(null);
  const [production, setProduction] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [aging, setAging] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    fetch('http://localhost:3000/api/v1/reports/collections', { headers })
      .then(res => res.json()).then(setCollections).catch(console.error);

    fetch('http://localhost:3000/api/v1/reports/doctor-production', { headers })
      .then(res => res.json()).then(setProduction).catch(console.error);

    fetch('http://localhost:3000/api/v1/reports/treatment-analysis', { headers })
      .then(res => res.json()).then(setTreatments).catch(console.error);

    fetch('http://localhost:3000/api/v1/reports/receivables-aging', { headers })
      .then(res => res.json()).then(setAging).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Reports & Analytics Engine</h1>
          <p className="text-xs text-gray-500">Financial collections, doctor production, treatment volumes, and receivables aging</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-2xl">
          <BarChart3 size={16} /> TR-REP-001 → TR-REP-005
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collections Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Daily Collections (TR-REP-001)</h2>
            <DollarSign className="text-emerald-600" size={20} />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">${collections?.totalCollected?.toFixed(2) || '0.00'}</div>
          <p className="text-xs text-gray-400">Total processed payments across selected date range ({collections?.transactionCount || 0} transactions)</p>
        </div>

        {/* Doctor Production Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Doctor Production (TR-REP-002)</h2>
            <Users className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">${production?.totalProduction?.toFixed(2) || '0.00'}</div>
          <p className="text-xs text-gray-400">Total generated billing production ({production?.totalBills || 0} bills finalized)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treatment Analysis */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Treatment Volume Analysis (TR-REP-003)</h2>
            <Activity className="text-purple-600" size={20} />
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 font-bold uppercase">
                <th className="pb-2">Procedure</th>
                <th className="pb-2">Count</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {treatments.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-bold text-gray-900">{t.procedure}</td>
                  <td className="py-2.5 font-semibold text-gray-600">{t.totalProcedures}</td>
                  <td className="py-2.5 font-extrabold text-right text-emerald-600">${t.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Receivables Aging */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Receivables Aging (TR-REP-005)</h2>
            <Clock className="text-amber-600" size={20} />
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 font-bold uppercase">
                <th className="pb-2">Bill ID</th>
                <th className="pb-2">Days Open</th>
                <th className="pb-2">Aging Tier</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {aging.map((a, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-mono text-gray-500">{a.billId.slice(0, 8)}...</td>
                  <td className="py-2.5 font-semibold text-gray-700">{a.daysOpen} days</td>
                  <td className="py-2.5"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px]">{a.agingCategory}</span></td>
                  <td className="py-2.5 font-extrabold text-right text-gray-900">${Number(a.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}