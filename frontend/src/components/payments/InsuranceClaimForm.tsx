// frontend/src/components/payments/InsuranceClaimForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';

interface InsuranceClaimFormProps {
  patientId: string;
  onClaimSubmitted?: () => void;
}

export const InsuranceClaimForm: React.FC<InsuranceClaimFormProps> = ({ patientId, onClaimSubmitted }) => {
  const [insuranceProvider, setInsuranceProvider] = useState('Awash Insurance');
  const [policyNumber, setPolicyNumber] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [coveragePercent, setCoveragePercent] = useState('80');
  const [copayResult, setCopayResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculateCopay = async () => {
    if (!claimAmount) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/api/v1/payments/insurance-claims/copay',
        { totalAmount: Number(claimAmount), coveragePercent: Number(coveragePercent) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCopayResult(res.data);
    } catch (err) {
      console.error('Failed to calculate co-pay', err);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNumber || !claimAmount) {
      setError('Please fill in all policy and claim details.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/payments/insurance-claims',
        {
          patientId,
          insuranceProvider,
          policyNumber,
          claimAmount: Number(claimAmount),
          coveragePercent: Number(coveragePercent),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onClaimSubmitted) onClaimSubmitted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Insurance claim submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
          <Shield size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Insurance Claim & Co-Pay (`TR-PAY-004`)</h2>
          <p className="text-xs text-gray-500">Submit claims and compute patient co-payment rules</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmitClaim} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Insurance Provider</label>
            <input
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Policy / Member Number</label>
            <input
              type="text"
              placeholder="e.g. POL-993821"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Claim Amount ($)</label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => {
                setClaimAmount(e.target.value);
                handleCalculateCopay();
              }}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Coverage (%)</label>
            <input
              type="number"
              value={coveragePercent}
              onChange={(e) => {
                setCoveragePercent(e.target.value);
                handleCalculateCopay();
              }}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none"
            />
          </div>
        </div>

        {copayResult && (
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-1 text-xs text-blue-900 font-medium">
            <p className="font-bold flex items-center gap-1.5"><Calculator size={14} /> Co-Pay Calculation (`TR-PAY-006`):</p>
            <p>Insurance Coverage: <span className="font-mono font-bold">${copayResult.insuranceCoverage}</span></p>
            <p>Patient Co-Pay Due: <span className="font-mono font-extrabold text-blue-700">${copayResult.patientCopay}</span></p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
          >
            <CheckCircle size={18} /> {loading ? 'Submitting Claim...' : 'Submit Insurance Claim'}
          </button>
        </div>
      </form>
    </div>
  );
};