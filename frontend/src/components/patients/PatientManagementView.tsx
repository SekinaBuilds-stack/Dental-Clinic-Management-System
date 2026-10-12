// frontend/src/components/patients/PatientManagementView.tsx
import React, { useState } from 'react';
import { PatientSearchInput } from './PatientSearchInput';
import { PatientRegistrationForm } from './PatientRegistrationForm';
import { PatientProfileView } from './PatientProfileView';
import type { Patient } from '../../services/patient.service';

export const PatientManagementView: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management & Front Desk</h1>
          <p className="text-sm text-gray-600">Search records, register walk-ins, and manage patient profiles (TR-PAT-001 through TR-PAT-005).</p>
        </div>
        {!showRegistrationModal && !selectedPatient && (
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
          >
            + Register New Patient
          </button>
        )}
      </div>

      {showRegistrationModal ? (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <PatientRegistrationForm
            onSuccess={() => {
              setShowRegistrationModal(false);
              alert('Patient registered successfully!');
            }}
            onCancel={() => setShowRegistrationModal(false)}
          />
        </div>
      ) : selectedPatient ? (
        <PatientProfileView
          patient={selectedPatient}
          onBack={() => setSelectedPatient(null)}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Patient Lookup</h2>
            <PatientSearchInput onSelectPatient={(patient) => setSelectedPatient(patient)} />
          </div>
        </div>
      )}
    </div>
  );
};