// frontend/src/App.tsx
import { useEffect, useState } from 'react';
import type { ComponentProps, ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  Calculator,
  Menu,
  X,
  ArrowRight,
  Bell,
  LogOut,
  Package,
  Truck,
  ShoppingCart,
  AlertTriangle,
  ArrowLeft,
  UserCog,
} from 'lucide-react';

// --- AUTH / SHARED ---
import { LoginView } from './components/LoginView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PatientProvider, usePatient } from './context/PatientContext';
import { RequirePatient } from './components/common/RequirePatient';
import { RecordPrompt } from './components/common/RecordPrompt';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import api from './services/api';
import './lib/sessionGuard';
import { canAccess } from './lib/access';
import { clearSession, currentUserId, getRole, getToken, isAuthenticated, setSession } from './lib/auth';
import { RegisterView } from './components/auth/RegisterView';
import { UsersAdminView } from './components/admin/UsersAdminView';

// --- INVENTORY / PROCUREMENT / RETAIL / REPORTS / AUDIT / NOTIFICATIONS ---
import { InventoryMasterView } from './components/inventory/InventoryMasterView';
import { GRNEntryView } from './components/inventory/GRNEntryView';
import { StockLedgerView } from './components/inventory/StockLedgerView';
import { BatchExpiryTracker } from './components/inventory/BatchExpiryTracker';
import { ProcurementWorkflowView } from './components/procurement/ProcurementWorkflowView';
import { StockAdjustmentModal } from './components/procurement/StockAdjustmentModal';
import { ChairsideConsumptionWidget } from './components/procurement/ChairsideConsumptionWidget';
import { RetailPOSView } from './components/retail/RetailPOSView';
import { ReportsDashboardView } from './components/reports/ReportsDashboardView';
import { AuditLogView } from './components/audit/AuditLogView';
import { NotificationCenter } from './components/notifications/NotificationCenter';

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
import { BillManagementView } from './components/billing/BillManagementView';
import { PatientManagementView } from './components/patients/PatientManagementView';
import { PatientProfileView } from './components/patients/PatientProfileView';
import { PatientRegistrationForm } from './components/patients/PatientRegistrationForm';
import { PatientSearchInput } from './components/patients/PatientSearchInput';

// --- PAYMENTS COMPONENTS ---
import { CheckoutTerminal } from './components/payments/CheckoutTerminal';
import { PaymentReversalModal } from './components/payments/PaymentReversalModal';
import { InsuranceClaimForm } from './components/payments/InsuranceClaimForm';

// --- SCHEDULER COMPONENTS ---
import { AppointmentsPage } from './components/scheduler/AppointmentsPage';
import { ChairSchedulerView } from './components/scheduler/ChairSchedulerView';
import { DoctorSchedulerView } from './components/scheduler/DoctorSchedulerView';

// ---------------------------------------------------------------------------
// Navigation config: one source of truth for the sidebar, the page title and
// the dashboard cards. Add a page here and it shows up everywhere.
// ---------------------------------------------------------------------------
type Icon = ComponentType<{ size?: number; className?: string }>;
interface NavItem { to: string; label: string; icon: Icon }
interface NavGroup { title: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Patients',
    items: [
      { to: '/patients', label: 'Management View', icon: Users },
      { to: '/patients/register', label: 'Registration Form', icon: UserPlus },
      { to: '/patients/search', label: 'Search & Alerts', icon: Search },
      { to: '/patients/profile', label: 'Patient Profile', icon: Activity },
    ],
  },
  {
    title: 'Scheduler',
    items: [
      { to: '/scheduler/doctors', label: 'Doctor Schedule', icon: Calendar },
      { to: '/scheduler/chairs', label: 'Chair View', icon: Clock },
      { to: '/scheduler/appointments', label: 'Appointments & Status', icon: FileCheck },
    ],
  },
  {
    title: 'Clinical EMR',
    items: [
      { to: '/emr/odontogram', label: 'Odontogram Canvas', icon: Activity },
      { to: '/emr/treatment-plan', label: 'Treatment Plan Builder', icon: FileText },
      { to: '/emr/clinical-notes', label: 'Clinical Notes Editor', icon: Edit3 },
      { to: '/emr/prescriptions', label: 'Prescription Writer', icon: PenTool },
      { to: '/emr/imaging', label: 'Imaging Uploader', icon: Image },
      { to: '/emr/consents', label: 'Digital Consent Pad', icon: ShieldCheck },
    ],
  },
  {
    title: 'Finance & POS',
    items: [
      { to: '/billing/bills', label: 'Bill Management', icon: DollarSign },
      { to: '/billing/estimates', label: 'Estimate Generator', icon: Calculator },
      { to: '/billing/daybook', label: 'Day Book Ledger', icon: FileText },
      { to: '/payments/checkout', label: 'Checkout Terminal', icon: CreditCard },
      { to: '/payments/insurance', label: 'Insurance Claims', icon: ShieldCheck },
      { to: '/payments/reversals', label: 'Payment Reversal', icon: ShieldAlert },
    ],
  },
  {
    title: 'Inventory & Procurement',
    items: [
      { to: '/inventory/items', label: 'Item Master', icon: Package },
      { to: '/inventory/grn', label: 'Goods Receipt (GRN)', icon: Truck },
      { to: '/inventory/ledger', label: 'Stock Ledger', icon: FileText },
      { to: '/inventory/expiry', label: 'Batch & Expiry', icon: AlertTriangle },
      { to: '/procurement/requisitions', label: 'Requisitions & POs', icon: FileCheck },
      { to: '/procurement/adjustments', label: 'Stock Adjustments', icon: PenTool },
      { to: '/procurement/consumption', label: 'Chairside Consumption', icon: Activity },
    ],
  },
  {
    title: 'Retail',
    items: [{ to: '/retail/pos', label: 'Retail POS', icon: ShoppingCart }],
  },
  {
    title: 'Reports & Audit',
    items: [
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/audit', label: 'Audit Log', icon: ShieldCheck },
    ],
  },
  {
    title: 'Administration',
    items: [{ to: '/admin/users', label: 'User Management', icon: UserCog }],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);
const pageTitle = (path: string) => ALL_ITEMS.find((i) => i.to === path)?.label ?? 'DCMS';

// Literal class strings so Tailwind can see them at build time.
const TONES = {
  emerald: { chip: 'bg-emerald-50 text-emerald-600', hover: 'hover:border-emerald-300', link: 'text-emerald-700' },
  blue: { chip: 'bg-blue-50 text-blue-600', hover: 'hover:border-blue-300', link: 'text-blue-700' },
  teal: { chip: 'bg-teal-50 text-teal-600', hover: 'hover:border-teal-300', link: 'text-teal-700' },
  violet: { chip: 'bg-violet-50 text-violet-600', hover: 'hover:border-violet-300', link: 'text-violet-700' },
  amber: { chip: 'bg-amber-50 text-amber-600', hover: 'hover:border-amber-300', link: 'text-amber-700' },
  rose: { chip: 'bg-rose-50 text-rose-600', hover: 'hover:border-rose-300', link: 'text-rose-700' },
  indigo: { chip: 'bg-indigo-50 text-indigo-600', hover: 'hover:border-indigo-300', link: 'text-indigo-700' },
} as const;

interface ModuleCard {
  title: string;
  description: string;
  icon: Icon;
  tone: keyof typeof TONES;
  links: { to: string; label: string }[];
}

const MODULES: ModuleCard[] = [
  {
    title: 'Patients & Front Desk',
    description: 'Register, search, view profiles, and track medical alerts.',
    icon: Users,
    tone: 'emerald',
    links: [
      { to: '/patients', label: 'Patient list' },
      { to: '/patients/register', label: 'Register patient' },
      { to: '/patients/search', label: 'Search & alerts' },
    ],
  },
  {
    title: 'Scheduler & Chairs',
    description: 'Doctor schedules, chair allocation, bookings, and waitlists.',
    icon: Calendar,
    tone: 'blue',
    links: [
      { to: '/scheduler/doctors', label: 'Doctor schedule' },
      { to: '/scheduler/chairs', label: 'Chair view' },
      { to: '/scheduler/appointments', label: 'Appointments' },
    ],
  },
  {
    title: 'Clinical EMR',
    description: 'Odontogram, treatment plans, notes, prescriptions, imaging, and consent.',
    icon: Activity,
    tone: 'teal',
    links: [
      { to: '/emr/odontogram', label: 'Odontogram' },
      { to: '/emr/treatment-plan', label: 'Treatment plans' },
      { to: '/emr/clinical-notes', label: 'Clinical notes' },
    ],
  },
  {
    title: 'Billing & Estimates',
    description: 'Bills, itemised estimates, and the daily transaction ledger.',
    icon: DollarSign,
    tone: 'amber',
    links: [
      { to: '/billing/bills', label: 'Bills' },
      { to: '/billing/estimates', label: 'Estimates' },
      { to: '/billing/daybook', label: 'Day book' },
    ],
  },
  {
    title: 'Checkout & Insurance',
    description: 'Multi-method payments, claims, co-pays, and audited reversals.',
    icon: CreditCard,
    tone: 'violet',
    links: [
      { to: '/payments/checkout', label: 'Checkout' },
      { to: '/payments/insurance', label: 'Insurance claims' },
      { to: '/payments/reversals', label: 'Reversals' },
    ],
  },
  {
    title: 'Inventory & Procurement',
    description: 'Stock, goods receipt, batches and expiry, requisitions, adjustments, and consumption.',
    icon: Package,
    tone: 'rose',
    links: [
      { to: '/inventory/items', label: 'Items' },
      { to: '/inventory/grn', label: 'Receive stock' },
      { to: '/procurement/requisitions', label: 'Requisitions' },
    ],
  },
  {
    title: 'Retail & Reports',
    description: 'Over-the-counter sales and returns, management reports, and the audit trail.',
    icon: ShoppingCart,
    tone: 'indigo',
    links: [
      { to: '/retail/pos', label: 'Retail POS' },
      { to: '/reports', label: 'Reports' },
      { to: '/audit', label: 'Audit log' },
    ],
  },
  {
    title: 'Administration',
    description: 'Approve new sign-ups, assign roles, and deactivate accounts.',
    icon: UserCog,
    tone: 'blue',
    links: [{ to: '/admin/users', label: 'User management' }],
  },
];

const QUICK_ACTIONS: { to: string; label: string; icon: Icon }[] = [
  { to: '/patients/register', label: 'Register patient', icon: UserPlus },
  { to: '/scheduler/appointments', label: 'Book appointment', icon: Calendar },
  { to: '/billing/estimates', label: 'New estimate', icon: Calculator },
  { to: '/payments/checkout', label: 'Take payment', icon: CreditCard },
];

// --- HOME / DASHBOARD OVERVIEW ---
function DashboardHome() {
  // Show only what the signed-in role may open.
  const quick = QUICK_ACTIONS.filter((a) => canAccess(a.to));
  const modules = MODULES.map((m) => ({ ...m, links: m.links.filter((l) => canAccess(l.to)) })).filter((m) => m.links.length > 0);
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight">DCMS Command Dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-emerald-100">
          Dental Clinic Management System — synchronized with billing, EMR, patient records, payments, and schedule control.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {quick.map(({ to, label, icon: ActionIcon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ActionIcon size={15} /> {label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="modules-heading" className="space-y-4">
        <h2 id="modules-heading" className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Modules
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ title, description, icon: ModuleIcon, tone, links }) => {
            const t = TONES[tone];
            return (
              <article
                key={title}
                className={`group relative flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md ${t.hover}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${t.chip}`}>
                  <ModuleIcon size={20} />
                </div>
                <h3 className="mt-4 font-bold text-gray-900">
                  {/* The whole card is clickable through this stretched link */}
                  <Link to={links[0].to} className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-emerald-500">
                    {title}
                  </Link>
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
                <ul className="relative z-10 mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-4">
                  {links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className={`text-xs font-semibold hover:underline ${t.link}`}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ArrowRight size={16} className="absolute right-6 top-6 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500" />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// --- SIDEBAR ---
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
    isActive ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-gray-100 p-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-600/20">
          🦷
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">DCMS Enterprise</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Clinical Suite</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto p-4">
        {NAV.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(i.to)) }))
          .filter((g) => g.items.length > 0)
          .map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: ItemIcon }) => (
                <NavLink key={to} to={to} end className={linkClass} onClick={onNavigate}>
                  <ItemIcon size={15} /> {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

// --- LAYOUT SHELL ---
function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patient, select, clear } = usePatient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Desktop sidebar can be hidden to view a page full-width; the choice is remembered.
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebarOpen') !== 'false';
    } catch {
      return true;
    }
  });
  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarOpen((open) => {
        try {
          localStorage.setItem('sidebarOpen', String(!open));
        } catch {
          /* ignore */
        }
        return !open;
      });
    } else {
      setDrawerOpen(true);
    }
  };
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1));
  const role = getRole();
  const [, setTick] = useState(0);

  // Pick up role changes made by an administrator: re-read who I am whenever I move to another page.
  useEffect(() => {
    let live = true;
    api
      .get('/api/v1/auth/me')
      .then((res) => {
        if (!live) return;
        setSession(getToken(), String(res.data?.role ?? ''), res.data?.permissions ?? []);
        setTick((t) => t + 1);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [location.pathname]);
  const allowed = canAccess(location.pathname);

  const logout = () => {
    clearSession();
    clear();
    navigate('/login', { replace: true });
  };

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      {sidebarOpen && (
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-white shadow-2xl">
            <button
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button
            aria-label={sidebarOpen ? 'Hide menu' : 'Show menu'}
            title={sidebarOpen ? 'Hide menu' : 'Show menu'}
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          {location.pathname !== '/' && (
            <button
              aria-label="Go back"
              title="Go back"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="min-w-0">
            <p className="hidden text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:block">
              Dental Clinic Management System
            </p>
            <h1 className="truncate text-sm font-bold text-gray-900">{pageTitle(location.pathname)}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {patient && (
              <span className="hidden max-w-[14rem] items-center gap-2 truncate rounded-2xl border border-emerald-100 bg-emerald-50 py-1.5 pl-3 pr-1.5 text-xs font-bold text-emerald-800 sm:inline-flex">
                <span className="truncate">Patient: {patient.label}</span>
                <button aria-label="Clear selected patient" onClick={clear} className="rounded-lg p-1 hover:bg-emerald-100">
                  <X size={12} />
                </button>
              </span>
            )}
            <Link to="/notifications" aria-label="Notifications" className="rounded-xl p-2 text-gray-500 hover:bg-gray-100">
              <Bell size={18} />
            </Link>
            {role && <span className="hidden rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 sm:inline">{role}</span>}
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100">
              <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl p-4 sm:p-8">
          <ErrorBoundary key={location.pathname}>
          {!allowed ? (
            <NoAccess />
          ) : (
          <Routes>
            <Route path="/" element={<DashboardHome />} />

            {/* Patients Routes */}
            <Route path="/patients" element={<PatientManagementView />} />
            <Route path="/patients/register" element={<PatientRegistrationForm onSuccess={() => navigate('/patients')} onCancel={() => navigate('/patients')} />} />
            <Route
              path="/patients/search"
              element={
                <div className="space-y-6">
                  <PatientSearchInput
                    onSelectPatient={(p) => {
                      select(p);
                      navigate('/patients/profile');
                    }}
                  />
                  <MedicalAlertBanner alerts={[]} />
                </div>
              }
            />
            <Route
              path="/patients/profile"
              element={
                <RequirePatient>
                  {(p) => <PatientProfileView patient={p.raw as unknown as ComponentProps<typeof PatientProfileView>['patient']} onBack={() => navigate('/patients')} />}
                </RequirePatient>
              }
            />

            {/* Scheduler Routes */}
            <Route path="/scheduler/doctors" element={<DoctorSchedulerView />} />
            <Route path="/scheduler/chairs" element={<ChairSchedulerView />} />
            <Route path="/scheduler/appointments" element={<AppointmentsPage />} />

            {/* EMR Routes (work on the selected patient) */}
            <Route path="/emr/odontogram" element={<RequirePatient>{(p) => <OdontogramCanvas patientId={p.id} />}</RequirePatient>} />
            <Route path="/emr/treatment-plan" element={<RequirePatient>{(p) => <TreatmentPlanBuilder patientId={p.id} />}</RequirePatient>} />
            <Route path="/emr/clinical-notes" element={<RequirePatient>{(p) => <ClinicalNotesEditor patientId={p.id} />}</RequirePatient>} />
            <Route path="/emr/prescriptions" element={<RequirePatient>{(p) => <PrescriptionWriter patientId={p.id} prescriberId={currentUserId()} />}</RequirePatient>} />
            <Route path="/emr/imaging" element={<RequirePatient>{(p) => <ImagingUploader patientId={p.id} />}</RequirePatient>} />
            <Route path="/emr/consents" element={<RequirePatient>{(p) => <DigitalConsentPad patientId={p.id} />}</RequirePatient>} />

            {/* Billing Routes */}
            <Route path="/billing/bills" element={<RequirePatient>{(p) => <BillManagementView patientId={p.id} />}</RequirePatient>} />
            <Route path="/billing/estimates" element={<RequirePatient>{(p) => <EstimateGenerator patientId={p.id} />}</RequirePatient>} />
            <Route path="/billing/daybook" element={<DayBookView />} />

            {/* Payments Routes */}
            <Route path="/payments/checkout" element={<CheckoutPage />} />
            <Route path="/payments/insurance" element={<RequirePatient>{(p) => <InsuranceClaimForm patientId={p.id} />}</RequirePatient>} />
            <Route path="/payments/reversals" element={<ReversalPage />} />

            {/* Inventory & Procurement Routes */}
            <Route path="/inventory/items" element={<InventoryMasterView />} />
            <Route path="/inventory/grn" element={<GRNEntryView />} />
            <Route path="/inventory/ledger" element={<StockLedgerView />} />
            <Route path="/inventory/expiry" element={<BatchExpiryTracker />} />
            <Route path="/procurement/requisitions" element={<ProcurementWorkflowView />} />
            <Route path="/procurement/adjustments" element={<StockAdjustmentModal />} />
            <Route path="/procurement/consumption" element={<ChairsideConsumptionWidget />} />

            {/* Retail, Reports, Audit, Notifications */}
            <Route path="/retail/pos" element={<RetailPOSView />} />
            <Route path="/reports" element={<ReportsDashboardView />} />
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/notifications" element={<NotificationCenter />} />

            {/* Anything else */}
            <Route
              path="*"
              element={
                <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">Page not found</h2>
                  <p className="mt-1 text-sm text-gray-500">That page does not exist.</p>
                  <Link to="/" className="mt-4 inline-block text-sm font-bold text-emerald-700 hover:underline">
                    Back to dashboard
                  </Link>
                </div>
              }
            />
            <Route path="/admin/users" element={<UsersAdminView />} />
          </Routes>
          )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <ShieldAlert size={26} />
      </div>
      <h2 className="text-lg font-bold text-gray-900">You don't have access to this page</h2>
      <p className="mt-2 text-sm text-gray-500">Your role does not include it. If you think this is a mistake, ask a clinic administrator.</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">
        Back to dashboard
      </Link>
    </div>
  );
}

// A bill / payment id is needed for these pages. Ask for it when the page is
// opened from the sidebar; links can pre-fill it as /payments/checkout?bill=ID&total=250
function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const billId = params.get('bill');
  const total = Number(params.get('total'));

  if (!billId) {
    return (
      <RecordPrompt
        title="Open checkout"
        description="Enter the bill to settle and the amount due."
        idLabel="Bill ID"
        withAmount
        onOpen={(id, amount) => navigate(`/payments/checkout?bill=${encodeURIComponent(id)}&total=${amount ?? 0}`)}
      />
    );
  }
  return <CheckoutTerminal billId={billId} totalDue={Number.isFinite(total) ? total : 0} onSuccess={() => navigate('/billing/daybook')} />;
}

function ReversalPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = params.get('payment');

  if (!paymentId) {
    return (
      <RecordPrompt
        title="Reverse a payment"
        description="Enter the payment to reverse. Reversals need manager approval and are audited."
        idLabel="Payment ID"
        onOpen={(id) => navigate(`/payments/reversals?payment=${encodeURIComponent(id)}`)}
      />
    );
  }
  return <PaymentReversalModal paymentId={paymentId} onSuccess={() => navigate('/billing/daybook')} />;
}

function LoginRoute() {
  const navigate = useNavigate();
  if (isAuthenticated()) return <Navigate to="/" replace />;
  return <LoginView onLoginSuccess={() => navigate('/', { replace: true })} />;
}

function RegisterRoute() {
  if (isAuthenticated()) return <Navigate to="/" replace />;
  return <RegisterView />;
}

export default function App() {
  return (
    <BrowserRouter>
      <PatientProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<Layout />} />
          </Route>
        </Routes>
      </PatientProvider>
    </BrowserRouter>
  );
}
