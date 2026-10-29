// frontend/src/components/emr/TreatmentPlanBuilder.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Plus, Trash2, DollarSign, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TreatmentItem {
  procedureName: string;
  toothNumber?: number;
  cost: number;
  status: 'PROPOSED' | 'ACCEPTED' | 'COMPLETED';
}

interface TreatmentPlanBuilderProps {
  patientId: string;
  onPlanCreated?: () => void;
}

export const TreatmentPlanBuilder: React.FC<TreatmentPlanBuilderProps> = ({ patientId, onPlanCreated }) => {
  const [planTitle, setPlanTitle] = useState('Comprehensive Dental Care Plan');
  const [items, setItems] = useState<TreatmentItem[]>([]);
  
  // Form state for new item
  const [procedureName, setProcedureName] = useState('');
  const [toothNumber, setToothNumber] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureName || cost === '') return;

    const newItem: TreatmentItem = {
      procedureName,
      toothNumber: toothNumber !== '' ? Number(toothNumber) : undefined,
      cost: Number(cost),
      status: 'PROPOSED',
    };

    setItems([...items, newItem]);
    // Reset item inputs
    setProcedureName('');
    setToothNumber('');
    setCost('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

  const handleSavePlan = async () => {
    if (items.length === 0) {
      setError('Please add at least one treatment procedure to the plan.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/emr/treatment-plans',
        {
          patientId,
          title: planTitle,
          items,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onPlanCreated) {
        onPlanCreated();
      }
      setItems([]);
      setPlanTitle('Comprehensive Dental Care Plan');
    } catch (err: any) {
      console.error('Failed to create treatment plan', err);
      setError(err.response?.data?.message || 'Failed to save treatment plan. Please check connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Treatment Plan Builder (`TR-EMR-001`)</h2>
            <p className="text-xs text-gray-500">Design multi-stage care workflows and estimates</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Plan Title Input */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Plan Title</label>
        <input
          type="text"
          value={planTitle}
          onChange={(e) => setPlanTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
        />
      </div>

      {/* Add Procedure Form */}
      <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-2xl space-y-4">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Add Procedure Item</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Procedure Name (e.g. Root Canal)"
            value={procedureName}
            onChange={(e) => setProcedureName(e.target.value)}
            className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Tooth # (Optional)"
            value={toothNumber}
            onChange={(e) => setToothNumber(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Cost ($)"
              value={cost}
              onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </form>

      {/* Added Items List */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Proposed Procedures ({items.length})</span>
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl text-xs font-medium">
            No procedures added to this plan yet. Use the form above to add items.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                    {item.toothNumber ? `Tooth #${item.toothNumber}` : 'General'}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.procedureName}</h4>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{item.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900 text-sm">${item.cost.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Total & Submit */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <DollarSign size={20} className="text-emerald-600" />
          <span className="text-sm font-bold text-gray-700">
            Total Estimated Cost: <span className="text-lg font-black text-gray-900">${totalCost.toFixed(2)}</span>
          </span>
        </div>
        <button
          onClick={handleSavePlan}
          disabled={saving || items.length === 0}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
        >
          <ShieldCheck size={18} /> {saving ? 'Saving Plan...' : 'Finalize & Save Treatment Plan'}
        </button>
      </div>
    </div>
  );
};