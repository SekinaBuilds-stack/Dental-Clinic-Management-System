// frontend/src/components/emr/PrescriptionWriter.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Pill, Plus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface PrescriptionItem {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionWriterProps {
  patientId: string;
  prescriberId: string;
  onPrescribed?: () => void;
}

export const PrescriptionWriter: React.FC<PrescriptionWriterProps> = ({ patientId, prescriberId, onPrescribed }) => {
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('TID (3 times daily)');
  const [duration, setDuration] = useState('5 days');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName || !dosage) return;

    setItems([...items, { drugName, dosage, frequency, duration }]);
    setDrugName('');
    setDosage('');
  };

  const handleRemoveDrug = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    if (items.length === 0) {
      setError('Add at least one medication to the prescription.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/emr/prescriptions',
        { patientId, prescriberId, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems([]);
      if (onPrescribed) onPrescribed();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Pill size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Prescription Writer (`TR-EMR-004`)</h2>
            <p className="text-xs text-gray-500">Configurable drug dispensing & dosage instructions</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Add Medication Form */}
      <form onSubmit={handleAddDrug} className="bg-gray-50 p-4 rounded-2xl space-y-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Add Medication</span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Drug Name (e.g. Amoxicillin)"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="Dosage (e.g. 500mg)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="Frequency (e.g. TID)"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </form>

      {/* Items List */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Prescribed Medications ({items.length})</span>
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl text-xs font-medium">
            No medications added to prescription yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between bg-white">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.drugName} <span className="font-normal text-gray-600">({item.dosage})</span></h4>
                  <p className="text-xs text-gray-500">{item.frequency} • {item.duration}</p>
                </div>
                <button type="button" onClick={() => handleRemoveDrug(idx)} className="p-2 text-red-400 hover:text-red-600 rounded-xl transition">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={handleSavePrescription}
          disabled={saving || items.length === 0}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
        >
          <ShieldCheck size={18} /> {saving ? 'Issuing...' : 'Issue Prescription'}
        </button>
      </div>
    </div>
  );
};