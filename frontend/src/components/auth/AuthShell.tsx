import type { ReactNode } from 'react';
import { CalendarCheck, ShieldCheck, Stethoscope, Wallet } from 'lucide-react';

const POINTS = [
  { icon: CalendarCheck, text: 'Appointments, chairs and waitlists in one place' },
  { icon: Stethoscope, text: 'Odontogram, treatment plans and clinical notes' },
  { icon: Wallet, text: 'Billing, payments, insurance and stock under control' },
  { icon: ShieldCheck, text: 'Every screen restricted to the people who need it' },
];

/** Shared split-screen layout for the sign-in and sign-up pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-400/20" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/30">🦷</span>
          <div>
            <p className="text-lg font-extrabold leading-tight">DCMS</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-100">Dental Clinic Management</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Run the whole clinic from one calm screen.</h2>
          <ul className="space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-emerald-50">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-100/80">Secure, role-based access for every member of the team.</p>
      </aside>

      <main className="flex items-center justify-center bg-gray-50 p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-lg shadow-md shadow-emerald-600/30">🦷</span>
            <span className="text-lg font-extrabold text-gray-900">DCMS</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';
