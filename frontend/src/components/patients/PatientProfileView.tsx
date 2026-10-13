// frontend/src/components/patients/PatientProfileView.tsx
import React from 'react';
import type { Patient } from '../../services/patient.service';
import { MedicalAlertBanner } from './MedicalAlertBanner';
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, ShieldAlert, History } from 'lucide-react';

interface PatientProfileViewProps {
  patient: Patient;
  onBack: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({ patient, onBack }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <button 
        onClick={onBack} 
        className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2 bg-blue-50 px-3.5 py-2 rounded-lg w-fit transition"
      >
        <ArrowLeft size={16} /> Back to Search
      </button>

      <MedicalAlertBanner alerts={patient.medicalAlerts} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{patient.fullName}</h1>
          <p className="text-sm font-semibold text-blue-600 mt-1">File Number: {patient.fileNumber}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${patient.isPreRegistered ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {patient.isPreRegistered ? 'Pre-Registered' : 'Fully Registered'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-3">
            <Phone size={16} className="text-blue-600" /> Contact Details
          </div>
          <p className="text-gray-800 font-medium">Phone: {patient.phoneNumber}</p>
          <p className="text-gray-600 flex items-center gap-1.5 mt-1"><Mail size={14} className="text-gray-400" /> {patient.email || 'N/A'}</p>
          <p className="text-gray-600 flex items-center gap-1.5 mt-1"><MapPin size={14} className="text-gray-400" /> {patient.address || 'N/A'}</p>
        </div>

        <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-3">
            <User size={16} className="text-blue-600" /> Demographics
          </div>
          <p className="text-gray-800 font-medium">Gender: {patient.gender}</p>
          <p className="text-gray-600 flex items-center gap-1.5 mt-1"><Calendar size={14} className="text-gray-400" /> DOB: {patient.dateOfBirth}</p>
          <p className="text-gray-600 mt-1">Referral: {patient.referralSource || 'Direct'}</p>
        </div>

        <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-3">
            <ShieldAlert size={16} className="text-blue-600" /> Emergency Contact
          </div>
          <p className="text-gray-800 font-medium">{patient.emergencyContactName || 'N/A'}</p>
          <p className="text-gray-600 flex items-center gap-1.5 mt-1"><Phone size={14} className="text-gray-400" /> {patient.emergencyContactPhone || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History size={18} className="text-blue-600" /> Visit History
        </h3>
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
          No previous visits recorded yet. (Ready for Appointment Scheduler & EMR integration).
        </div>
      </div>
    </div>
  );
};