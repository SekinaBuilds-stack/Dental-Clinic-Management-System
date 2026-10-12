// frontend/src/components/patients/PatientSearchInput.tsx
import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patient.service';
import type { Patient } from '../../services/patient.service';

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
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Search by name, phone number, or file number (e.g., DCMS-2026-0001)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading && <div className="absolute z-10 w-full bg-white shadow-lg mt-1 p-2 text-sm text-gray-500 rounded-lg">Searching...</div>}

      {results.length > 0 && query.trim() !== '' && (
        <ul className="absolute z-10 w-full bg-white shadow-xl mt-1 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
          {results.map((patient) => (
            <li
              key={patient.id}
              onClick={() => {
                onSelectPatient(patient);
                setQuery('');
                setResults([]);
              }}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-900">{patient.fullName}</p>
                <p className="text-xs text-gray-500">File: {patient.fileNumber} | Phone: {patient.phoneNumber}</p>
              </div>
              {patient.medicalAlerts.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {patient.medicalAlerts.length} Alert(s)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};