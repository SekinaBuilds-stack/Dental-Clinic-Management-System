// frontend/src/components/patients/PatientManagementView.tsx
import React, { useState } from 'react';
import { PatientSearchInput } from './PatientSearchInput';
import { PatientRegistrationForm } from './PatientRegistrationForm';
import { PatientProfileView } from './PatientProfileView';
import type { Patient } from '../../services/patient.service';
import { UserPlus, Users, ShieldCheck } from 'lucide-react';

export const PatientManagementView: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Patient Management & Front Desk</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck size={14} className="text-emerald-600" /> SRS Compliant (TR-PAT-001 through TR-PAT-005)
            </p>
          </div>
        </div>
        {!showRegistrationModal && !selectedPatient && (
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/20 transition"
          >
            <UserPlus size={18} /> Register New Patient
          </button>
        )}
      </div>

      {showRegistrationModal ? (
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
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
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Quick Patient Lookup</h2>
          <p className="text-xs text-gray-500">Search patients in real-time by name, phone number, or unique file number.</p>
          <PatientSearchInput onSelectPatient={(patient) => setSelectedPatient(patient)} />
        </div>
      )}
    </div>
  );
};