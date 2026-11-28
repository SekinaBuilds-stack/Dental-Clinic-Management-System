import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { UserSearch } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import type { SelectedPatient } from '../../context/PatientContext';

// Pages that work on one patient render through this. Without a selected
// patient the user is sent to search instead of seeing a fake "sample-id" page.
export function RequirePatient({ children }: { children: (patient: SelectedPatient) => ReactNode }) {
  const { patient } = usePatient();

  if (!patient) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <UserSearch size={22} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Select a patient first</h2>
        <p className="mt-1 text-sm text-gray-500">This page works on one patient's record. Search for a patient to continue.</p>
        <Link
          to="/patients/search"
          className="mt-5 inline-flex rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Search patients
        </Link>
      </div>
    );
  }

  return <>{children(patient)}</>;
}
