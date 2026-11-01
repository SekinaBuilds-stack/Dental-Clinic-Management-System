// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  Activity, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  FileCheck, 
  Image, 
  Edit3, 
  PenTool, 
  Search, 
  UserPlus, 
  ShieldAlert, 
  Calculator 
} from 'lucide-react';

// --- BILLING COMPONENTS ---
import { DayBookView } from './components/billing/DayBookView';
import { EstimateGenerator } from './components/billing/EstimateGenerator';

// --- EMR COMPONENTS ---
import { ClinicalNotesEditor } from './components/emr/ClinicalNotesEditor';
import { DigitalConsentPad } from './components/emr/DigitalConsentPad';
import { ImagingUploader } from './components/emr/ImagingUploader';
import { OdontogramCanvas } from './components/emr/OdontogramCanvas';
import { PrescriptionWriter } from './components/emr/PrescriptionWriter';
import { TreatmentPlanBuilder } from './components/emr/TreatmentPlanBuilder';

// --- PATIENTS COMPONENTS ---
import { MedicalAlertBanner } from './components/patients/MedicalAlertBanner';
import { PatientManagementView } from './components/patients/PatientManagementView';
import { PatientProfileView } from './components/patients/PatientProfileView';
import { PatientRegistrationForm } from './components/patients/PatientRegistrationForm';
import { PatientSearchInput } from './components/patients/PatientSearchInput';

// --- PAYMENTS COMPONENTS ---
import { CheckoutTerminal } from './components/payments/CheckoutTerminal';
import { PaymentReversalModal } from './components/payments/PaymentReversalModal';
import { InsuranceClaimForm } from './components/payments/InsuranceClaimForm';

// --- SCHEDULER COMPONENTS ---
import { AppointmentBookingModal } from './components/scheduler/AppointmentBookingModal';
import { AppointmentList } from './components/scheduler/AppointmentList';
import { AppointmentStatusWidget } from './components/scheduler/AppointmentStatusWidget';
import { ChairSchedulerView } from './components/scheduler/ChairSchedulerView';
import { DoctorSchedulerView } from './components/scheduler/DoctorSchedulerView';
import { WaitlistModal } from './components/scheduler/WaitlistModal';

function BillManagement() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Bill Management</h2>
      <p className="mt-2 text-sm text-gray-500">Bill management is unavailable.</p>
    </div>
  );
}

// --- HOME / DASHBOARD OVERVIEW ---
function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight">DCMS Command Dashboard</h1>
        <p className="mt-2 text-emerald-100 text-sm max-w-xl">
          Dental Clinic Management System — Fully synchronized with Billing, EMR, Patient Records, POS Payments, and Schedule Control.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Patient Management</h3>
          <p className="text-xs text-gray-500">Register, search, view profiles, and track medical alerts.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Scheduler & Chairs</h3>
          <p className="text-xs text-gray-500">Manage doctor schedules, chair allocation, bookings, and waitlists.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
            <CreditCard size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Checkout & Insurance</h3>
          <p className="text-xs text-gray-500">Process multi-method payments, claims, co-pays, and audited reversals.</p>
        </div>
      </div>
    </div>
  );
}

// --- SIDEBAR NAVIGATION SHELL ---
function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
            🦷
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900 text-sm">DCMS Enterprise</h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Clinical Suite</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto text-xs font-semibold text-gray-600">
          {/* General */}
          <div>
            <p className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Overview</p>
            <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition ${isActive('/') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          </div>

          {/* Patients */}
          <div>
            <p className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Patients</p>
            <div className="space-y-1">
              <Link to="/patients" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/patients') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Users size={15} /> Management View</Link>
              <Link to="/patients/register" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/patients/register') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><UserPlus size={15} /> Registration Form</Link>
              <Link to="/patients/search" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/patients/search') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Search size={15} /> Search & Alerts</Link>
              <Link to="/patients/profile" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/patients/profile') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Activity size={15} /> Patient Profile</Link>
            </div>
          </div>

          {/* Scheduler */}
          <div>
            <p className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Scheduler</p>
            <div className="space-y-1">
              <Link to="/scheduler/doctors" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/scheduler/doctors') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Calendar size={15} /> Doctor Schedule</Link>
              <Link to="/scheduler/chairs" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/scheduler/chairs') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Clock size={15} /> Chair View</Link>
              <Link to="/scheduler/appointments" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/scheduler/appointments') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><FileCheck size={15} /> Appointments & Status</Link>
            </div>
          </div>

          {/* EMR */}
          <div>
            <p className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Clinical EMR</p>
            <div className="space-y-1">
              <Link to="/emr/odontogram" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/emr/odontogram') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Activity size={15} /> Odontogram Canvas</Link>
              <Link to="/emr/treatment-plan" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/emr/treatment-plan') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><FileText size={15} /> Treatment Plan Builder</Link>
              <Link to="/emr/clinical-notes" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/emr/clinical-notes') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Edit3 size={15} /> Clinical Notes Editor</Link>
              <Link to="/emr/prescriptions" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/emr/prescriptions') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><PenTool size={15} /> Prescription Writer</Link>
              <Link to="/emr/imaging" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/emr/imaging') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Image size={15} /> Imaging Uploader</Link>
              <Link to="/emr/consents" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/emr/consents') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><ShieldCheck size={15} /> Digital Consent Pad</Link>
            </div>
          </div>

          {/* Billing & Payments */}
          <div>
            <p className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Finance & POS</p>
            <div className="space-y-1">
              <Link to="/billing/bills" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/billing/bills') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><DollarSign size={15} /> Bill Management</Link>
              <Link to="/billing/estimates" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/billing/estimates') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><Calculator size={15} /> Estimate Generator</Link>
              <Link to="/billing/daybook" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/billing/daybook') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><FileText size={15} /> Day Book Ledger</Link>
              <Link to="/payments/checkout" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/payments/checkout') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><CreditCard size={15} /> Checkout Terminal</Link>
              <Link to="/payments/insurance" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/payments/insurance') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><ShieldCheck size={15} /> Insurance Claims</Link>
              <Link to="/payments/reversals" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isActive('/payments/reversals') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}><ShieldAlert size={15} /> Payment Reversal</Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-sm font-bold text-gray-800">Dental Clinic Management System (DCMS)</h1>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-bold border border-emerald-100">
            Frontend Live Mode
          </span>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardHome />} />

            {/* Patients Routes */}
            <Route path="/patients" element={<PatientManagementView />} />
            <Route path="/patients/register" element={<PatientRegistrationForm onSuccess={() => navigate('/patients')} onCancel={() => navigate('/patients')} />} />
            <Route path="/patients/search" element={<div className="space-y-6"><PatientSearchInput onSelectPatient={() => navigate('/patients/profile')} /><MedicalAlertBanner alerts={[]} /></div>} />
            <Route path="/patients/profile" element={<PatientProfileView patient={{ id: 'sample-id' } as React.ComponentProps<typeof PatientProfileView>['patient']} onBack={() => navigate('/patients')} />} />

            {/* Scheduler Routes */}
            <Route path="/scheduler/doctors" element={<DoctorSchedulerView />} />
            <Route path="/scheduler/chairs" element={<ChairSchedulerView />} />
            <Route path="/scheduler/appointments" element={<div className="space-y-6"><AppointmentStatusWidget appointmentId="sample-id" currentStatus="scheduled" onStatusUpdated={() => {}} /><AppointmentList appointments={[]} loading={false} selectedDate={new Date().toISOString().slice(0, 10)} onRefresh={() => {}} /><AppointmentBookingModal onClose={() => {}} onSuccess={() => {}} /><WaitlistModal onClose={() => {}} /></div>} />

            {/* EMR Routes */}
            <Route path="/emr/odontogram" element={<OdontogramCanvas patientId="sample-id" />} />
            <Route path="/emr/treatment-plan" element={<TreatmentPlanBuilder patientId="sample-id" />} />
            <Route path="/emr/clinical-notes" element={<ClinicalNotesEditor patientId="sample-id" />} />
            <Route path="/emr/prescriptions" element={<PrescriptionWriter patientId="sample-id" prescriberId="sample-prescriber-id" />} />
            <Route path="/emr/imaging" element={<ImagingUploader patientId="sample-id" />} />
            <Route path="/emr/consents" element={<DigitalConsentPad patientId="sample-id" />} />

            {/* Billing Routes */}
            <Route path="/billing/bills" element={<BillManagement />} />
            <Route path="/billing/estimates" element={<EstimateGenerator patientId="sample-patient-id" />} />
            <Route path="/billing/daybook" element={<DayBookView />} />

            {/* Payments Routes */}
            <Route path="/payments/checkout" element={<CheckoutTerminal billId="sample-bill-id" totalDue={250} />} />
            <Route path="/payments/insurance" element={<InsuranceClaimForm patientId="sample-patient-id" />} />
            <Route path="/payments/reversals" element={<PaymentReversalModal paymentId="sample-payment-id" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}