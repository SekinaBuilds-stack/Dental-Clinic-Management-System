// frontend/src/components/emr/DigitalConsentPad.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { PenTool, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DigitalConsentPadProps {
  patientId: string;
  onConsentSaved?: () => void;
}

export const DigitalConsentPad: React.FC<DigitalConsentPadProps> = ({ patientId, onConsentSaved }) => {
  const [procedureName, setProcedureName] = useState('Surgical Extraction & Implantation');
  const [signedBy, setSignedBy] = useState('');
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSimulateSign = () => {
    setSigned(true);
  };

  const handleClearSign = () => {
    setSigned(false);
  };

  const handleSaveConsent = async () => {
    if (!signed || !signedBy) {
      setError('Please provide patient signature and full name.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/emr/consents',
        {
          patientId,
          procedureName,
          signedBy,
          signatureData: 'data:image/png;base64,mock_signature_bytes...',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onConsentSaved) onConsentSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save digital consent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
          <PenTool size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Digital Consent Pad (`TR-EMR-008`)</h2>
          <p className="text-xs text-gray-500">Capture legally binding patient consent and signatures</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Procedure Requiring Consent</label>
          <input
            type="text"
            value={procedureName}
            onChange={(e) => setProcedureName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Patient / Guardian Full Name</label>
          <input
            type="text"
            placeholder="e.g., John Doe"
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none"
          />
        </div>

        {/* Signature Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Patient Signature Area</span>
            <button onClick={handleClearSign} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
              <RotateCcw size={12} /> Clear Pad
            </button>
          </div>
          <div
            onClick={handleSimulateSign}
            className={`border-2 border-dashed rounded-2xl h-36 flex items-center justify-center cursor-pointer transition ${
              signed ? 'border-emerald-400 bg-emerald-50/2id text-emerald-700 font-serif italic text-lg' : 'border-gray-300 bg-gray-50 text-gray-400 text-xs'
            }`}
          >
            {signed ? `Signed digitally by: ${signedBy || 'Patient'}` : 'Click here to sign / draw signature'}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveConsent}
            disabled={saving || !signed}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/25 transition flex items-center gap-2"
          >
            <ShieldCheck size={18} /> {saving ? 'Storing Consent...' : 'Finalize & Store Consent'}
          </button>
        </div>
      </div>
    </div>
  );
};