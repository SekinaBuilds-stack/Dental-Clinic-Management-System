// frontend/src/components/patients/PatientSearchInput.tsx
import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patient.service';
import type { Patient } from '../../services/patient.service';
import { Search, AlertCircle, User } from 'lucide-react';

interface PatientSearchInputProps {
  onSelectPatient: (patient: Patient) => void;
}

export const PatientSearchInput: React.FC<PatientSearchInputProps> = ({ onSelectPatient }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await patientService.searchPatients(query);
        setResults(data);
      } catch (err) {
        console.error('Failed to search patients', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm text-sm"
          placeholder="Search by name, phone number, or file number (e.g., DCMS-2026-0001)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search size={20} />
        </div>
      </div>

      {loading && (
        <div className="absolute z-10 w-full bg-white shadow-xl mt-1 p-3 text-sm text-gray-500 rounded-xl border border-gray-100 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Searching patients...
        </div>
      )}

      {results.length > 0 && query.trim() !== '' && (
        <ul className="absolute z-10 w-full bg-white shadow-2xl mt-1 border border-gray-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-gray-100">
          {results.map((patient) => (
            <li
              key={patient.id}
              onClick={() => {
                onSelectPatient(patient);
                setQuery('');
                setResults([]);
              }}
              className="px-4 py-3 hover:bg-blue-50/60 cursor-pointer flex justify-between items-center transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{patient.fullName}</p>
                  <p className="text-xs text-gray-500">File: <span className="font-medium text-blue-600">{patient.fileNumber}</span> | Phone: {patient.phoneNumber}</p>
                </div>
              </div>
              {patient.medicalAlerts.length > 0 && (
                <span className="flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">
                  <AlertCircle size={13} /> {patient.medicalAlerts.length} Alert(s)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};