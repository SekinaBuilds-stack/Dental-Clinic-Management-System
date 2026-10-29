// frontend/src/components/emr/OdontogramCanvas.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

interface ToothCondition {
  toothNumber: number;
  condition: 'healthy' | 'decayed' | 'filled' | 'missing' | 'crown';
  notes?: string;
}

interface OdontogramCanvasProps {
  patientId: string;
  onSaveSuccess?: () => void;
}

// Standard FDI World Dental Federation numbering
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const OdontogramCanvas: React.FC<OdontogramCanvasProps> = ({ patientId, onSaveSuccess }) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothConditions, setToothConditions] = useState<Record<number, ToothCondition['condition']>>({});
  const [activeCondition, setActiveCondition] = useState<ToothCondition['condition']>('decayed');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing odontogram records on mount or patient change
  useEffect(() => {
    const fetchOdontogram = async () => {
      if (!patientId) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3000/api/v1/emr/odontogram/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Map backend array to state object: { [toothNumber]: condition }
        if (res.data && Array.isArray(res.data)) {
          const mapped: Record<number, ToothCondition['condition']> = {};
          res.data.forEach((item: ToothCondition) => {
            mapped[item.toothNumber] = item.condition;
          });
          setToothConditions(mapped);
        }
      } catch (err: any) {
        console.error('Failed to load odontogram chart', err);
        // Non-blocking error if chart hasn't been initialized yet for patient
      } finally {
        setLoading(false);
      }
    };

    fetchOdontogram();
  }, [patientId]);

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setToothConditions((prev) => ({
      ...prev,
      [toothNumber]: activeCondition,
    }));
  };

  const getToothColor = (condition?: ToothCondition['condition']) => {
    switch (condition) {
      case 'decayed': return 'bg-red-100 border-red-400 text-red-700';
      case 'filled': return 'bg-blue-100 border-blue-400 text-blue-700';
      case 'missing': return 'bg-gray-200 border-gray-400 text-gray-400 line-through';
      case 'crown': return 'bg-amber-100 border-amber-400 text-amber-700';
      default: return 'bg-white border-gray-200 text-gray-700 hover:border-blue-300';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formattedData: ToothCondition[] = Object.entries(toothConditions).map(([tooth, condition]) => ({
        toothNumber: Number(tooth),
        condition,
      }));

      await axios.post(
        'http://localhost:3000/api/v1/emr/odontogram',
        {
          patientId,
          conditions: formattedData,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      console.error('Failed to save odontogram data', err);
      setError(err.response?.data?.message || 'Failed to save odontogram chart. Please check connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Interactive Odontogram Chart (`TR-EMR-002`)</h2>
          <p className="text-xs text-gray-500">FDI Numbering Standard • Click teeth to apply clinical conditions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setToothConditions({})}
            className="px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Reset Chart
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition flex items-center gap-1.5"
          >
            <ShieldCheck size={16} /> {saving ? 'Saving...' : 'Save Odontogram'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Condition Selector Toolbar */}
      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Select Tool:</span>
        {(['healthy', 'decayed', 'filled', 'missing', 'crown'] as const).map((cond) => (
          <button
            key={cond}
            onClick={() => setActiveCondition(cond)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${
              activeCondition === cond
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {cond}
          </button>
        ))}
      </div>

      {/* Dental Arch Display */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 space-y-2">
          <Loader2 size={32} className="mx-auto animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading patient odontogram records...</p>
        </div>
      ) : (
        <div className="space-y-6 py-4">
          {/* Upper Arch */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-center">Upper Arch (Maxillary)</span>
            <div className="grid grid-cols-16 gap-1.5 justify-center max-w-3xl mx-auto">
              {UPPER_TEETH.map((tooth) => (
                <button
                  key={tooth}
                  onClick={() => handleToothClick(tooth)}
                  className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-xs transition shadow-sm ${getToothColor(
                    toothConditions[tooth]
                  )}`}
                >
                  <span>{tooth}</span>
                  <span className="text-[9px] opacity-70 capitalize">{toothConditions[tooth] || 'ok'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="space-y-2">
            <div className="grid grid-cols-16 gap-1.5 justify-center max-w-3xl mx-auto">
              {LOWER_TEETH.map((tooth) => (
                <button
                  key={tooth}
                  onClick={() => handleToothClick(tooth)}
                  className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-xs transition shadow-sm ${getToothColor(
                    toothConditions[tooth]
                  )}`}
                >
                  <span>{tooth}</span>
                  <span className="text-[9px] opacity-70 capitalize">{toothConditions[tooth] || 'ok'}</span>
                </button>
              ))}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-center">Lower Arch (Mandibular)</span>
          </div>
        </div>
      )}

      {/* Selected Tooth Inspector Footer */}
      {selectedTooth && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-blue-900">
            Selected Tooth: <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200">#{selectedTooth}</span>
          </span>
          <span className="text-blue-700">
            Current Status: <strong className="capitalize">{toothConditions[selectedTooth] || 'Healthy'}</strong>
          </span>
        </div>
      )}
    </div>
  );
};