// frontend/src/components/emr/ClinicalNotesEditor.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, AlertTriangle, Stethoscope } from 'lucide-react';

interface ClinicalNotesEditorProps {
  patientId: string;
  onNoteSaved?: () => void;
}

export const ClinicalNotesEditor: React.FC<ClinicalNotesEditorProps> = ({ patientId, onNoteSaved }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [toothNumber, setToothNumber] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis || !notes) {
      setError('Please fill in both diagnosis and progress notes.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/emr/clinical-notes',
        {
          patientId,
          diagnosis,
          notes,
          toothNumber: toothNumber !== '' ? Number(toothNumber) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDiagnosis('');
      setNotes('');
      setToothNumber('');
      if (onNoteSaved) onNoteSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save clinical progress note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
          <Stethoscope size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clinical Progress Notes (`TR-EMR-003`)</h2>
          <p className="text-xs text-gray-500">Record visit diagnoses, observations, and procedures</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSaveNote} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Diagnosis</label>
            <input
              type="text"
              placeholder="e.g., Chronic Periodontitis / Pulpitis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tooth Number (Optional)</label>
            <input
              type="number"
              placeholder="e.g., 36"
              value={toothNumber}
              onChange={(e) => setToothNumber(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Progress Notes</label>
          <textarea
            rows={4}
            placeholder="Enter detailed clinical observations, anesthesia used, and treatment steps..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
          >
            <ShieldCheck size={18} /> {saving ? 'Saving Note...' : 'Save Clinical Note'}
          </button>
        </div>
      </form>
    </div>
  );
};