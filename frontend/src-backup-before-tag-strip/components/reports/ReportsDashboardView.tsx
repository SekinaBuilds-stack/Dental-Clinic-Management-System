import { DollarSign, Users, Activity, Clock } from 'lucide-react';
import { useList, useObject } from '../../lib/useApi';
import { ErrorNote } from '../common/Feedback';

interface Collections { totalCollected: number; transactionCount: number }
interface Production { totalProduction: number; totalBills: number }
interface TreatmentRow { procedure: string; totalProcedures: number; totalRevenue: number }
interface AgingRow { billId: string; daysOpen: number; agingCategory: string; balance: number; totalAmount: number }

const money = (n: unknown) => `$${Number(n || 0).toFixed(2)}`;

export function ReportsDashboardView() {
  const collections = useObject<Collections>('/api/v1/reports/collections');
  const production = useObject<Production>('/api/v1/reports/doctor-production');
  const treatments = useList<TreatmentRow>('/api/v1/reports/treatment-analysis');
  const aging = useList<AgingRow>('/api/v1/reports/receivables-aging');

  const firstError = collections.error || production.error || treatments.error || aging.error;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">Reports</h1>
        <p className="text-xs text-gray-500">Collections, production, treatments and receivables</p>
      </div>

      <ErrorNote message={firstError} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Collections</h2>
            <DollarSign className="text-emerald-600" size={20} />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{money(collections.data?.totalCollected)}</div>
          <p className="text-xs text-gray-400">{collections.data?.transactionCount ?? 0} payments received this year</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Production</h2>
            <Users className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{money(production.data?.totalProduction)}</div>
          <p className="text-xs text-gray-400">{production.data?.totalBills ?? 0} bills raised this year</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Treatment Volume</h2>
            <Activity className="text-purple-600" size={20} />
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 font-bold uppercase">
                <th className="pb-2">Procedure</th><th className="pb-2">Count</th><th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {treatments.data.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-gray-400">No treatments recorded yet.</td></tr>
              )}
              {treatments.data.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-bold text-gray-900">{t.procedure}</td>
                  <td className="py-2.5 font-semibold text-gray-600">{t.totalProcedures}</td>
                  <td className="py-2.5 font-extrabold text-right text-emerald-600">{money(t.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Receivables Aging</h2>
            <Clock className="text-amber-600" size={20} />
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 font-bold uppercase">
                <th className="pb-2">Bill</th><th className="pb-2">Days Open</th><th className="pb-2">Tier</th><th className="pb-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {aging.data.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">No outstanding bills.</td></tr>
              )}
              {aging.data.map((a, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-mono text-gray-500">{String(a.billId).slice(0, 8)}…</td>
                  <td className="py-2.5 font-semibold text-gray-700">{a.daysOpen} days</td>
                  <td className="py-2.5"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px]">{a.agingCategory}</span></td>
                  <td className="py-2.5 font-extrabold text-right text-gray-900">{money(a.balance ?? a.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
