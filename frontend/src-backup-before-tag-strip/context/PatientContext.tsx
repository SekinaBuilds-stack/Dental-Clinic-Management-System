import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface SelectedPatient {
  id: string;
  label: string;
  raw: Record<string, unknown>;
}

interface PatientContextValue {
  patient: SelectedPatient | null;
  select: (patient: unknown) => void;
  clear: () => void;
}

const STORAGE_KEY = 'selectedPatient';
const PatientContext = createContext<PatientContextValue | null>(null);

function read(): SelectedPatient | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SelectedPatient) : null;
  } catch {
    return null;
  }
}

function labelOf(p: Record<string, unknown>): string {
  const full = p.fullName ?? [p.firstName, p.lastName].filter(Boolean).join(' ');
  return String(full || p.fileNumber || p.phoneNumber || p.id);
}

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<SelectedPatient | null>(read);

  const select = useCallback((value: unknown) => {
    const raw = (value ?? {}) as Record<string, unknown>;
    if (!raw.id) return;
    const next: SelectedPatient = { id: String(raw.id), label: labelOf(raw), raw };
    setPatient(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const clear = useCallback(() => {
    setPatient(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ patient, select, clear }), [patient, select, clear]);
  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside <PatientProvider>');
  return ctx;
}
