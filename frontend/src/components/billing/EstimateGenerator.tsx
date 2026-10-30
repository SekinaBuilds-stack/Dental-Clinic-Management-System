// frontend/src/components/billing/EstimateGenerator.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileSpreadsheet, History } from 'lucide-react';

interface EstimateGeneratorProps {
  patientId: string;
}

export const EstimateGenerator: React.FC<EstimateGeneratorProps> = ({ patientId }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [plansRes, estRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/v1/emr/treatment-plans/${patientId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:3000/api/v1/billing/estimates/patient/${patientId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPlans(plansRes.data);
      setEstimates(estRes.data);
    } catch (err) {
      console.error('Failed to fetch estimate data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleGenerateEstimate = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/billing/estimates/from-plan',
        { patientId, treatmentPlanId: selectedPlanId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPlanId('');
      fetchData();
    } catch (err) {
      console.error('Failed to generate estimate', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
          <FileSpreadsheet size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Treatment Estimates Engine (`TR-BIL-003`)</h2>
          <p className="text-xs text-gray-500">Generate and review itemized cost estimates from treatment plans</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
        >
          <option value="">Select Treatment Plan to Estimate...</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
          ))}
        </select>
        <button
          onClick={handleGenerateEstimate}
          disabled={loading || !selectedPlanId}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow transition"
        >
          {loading ? 'Generating...' : 'Generate Estimate'}
        </button>
      </div>

      {/* Estimates History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <History size={14} /> Estimate History (`TR-BIL-004`)
        </h3>
        {estimates.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No estimates generated yet.</p>
        ) : (
          <div className="space-y-3">
            {estimates.map((est) => (
              <div key={est.id} className="border border-gray-100 rounded-2xl p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Estimate ID: {est.id.slice(0, 8)}</span>
                  <span className="text-sm font-bold text-purple-600">Total: ${est.totalEstimate}</span>
                </div>
                <div className="divide-y divide-gray-50 text-xs text-gray-600">
                  {est.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-1 flex justify-between">
                      <span>{item.description} (x{item.quantity})</span>
                      <span className="font-mono">${item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};