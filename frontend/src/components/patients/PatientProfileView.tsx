// frontend/src/components/patients/PatientProfileView.tsx
import React from 'react';
import type{ Patient } from '../../services/patient.service';
import { MedicalAlertBanner } from './MedicalAlertBanner';

interface PatientProfileViewProps {
  patient: Patient;
  onBack: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({ patient, onBack }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <button onClick={onBack} className="mb-4 text-sm text-blue-600 hover:underline flex items-center">
        ← Back to Search
      </button>

      <MedicalAlertBanner alerts={patient.medicalAlerts} />

      <div className="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
          <p className="text-sm font-semibold text-blue-600">File Number: {patient.fileNumber}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${patient.isPreRegistered ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {patient.isPreRegistered ? 'Pre-Registered' : 'Fully Registered'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 font-medium">Contact Details</p>
          <p className="mt-1 font-semibold text-gray-800">Phone: {patient.phoneNumber}</p>
          <p className="text-gray-600">Email: {patient.email || 'N/A'}</p>
          <p className="text-gray-600">Address: {patient.address || 'N/A'}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 font-medium">Demographics</p>
          <p className="mt-1 font-semibold text-gray-800">Gender: {patient.gender}</p>
          <p className="text-gray-600">DOB: {patient.dateOfBirth}</p>
          <p className="text-gray-600">Referral: {patient.referralSource || 'Direct'}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 font-medium">Emergency Contact</p>
          <p className="mt-1 font-semibold text-gray-800">{patient.emergencyContactName || 'N/A'}</p>
          <p className="text-gray-600">{patient.emergencyContactPhone || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Visit History</h3>
        <div className="bg-gray-50 border rounded-lg p-4 text-center text-gray-500 text-sm">
          No previous visits recorded yet. (Ready for Appointment Scheduler & EMR integration).
        </div>
      </div>
    </div>
  );
};