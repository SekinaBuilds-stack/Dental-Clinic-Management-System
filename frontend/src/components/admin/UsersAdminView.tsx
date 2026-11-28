import { useState } from 'react';
import { CheckCircle2, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api';
import { errMsg, useList } from '../../lib/useApi';
import { currentUserId } from '../../lib/auth';
import { EmptyRow, ErrorNote, SuccessNote } from '../common/Feedback';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string | null;
  status: 'PENDING' | 'ACTIVE' | 'DEACTIVATED';
  createdAt: string;
  lastLoginAt: string | null;
}
interface RoleInfo { name: string; permissions: string[] }

const TABS = [
  { key: 'PENDING', label: 'Waiting for approval' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DEACTIVATED', label: 'Deactivated' },
] as const;

const BADGE = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  DEACTIVATED: 'bg-gray-100 text-gray-600',
} as const;

export function UsersAdminView() {
  const users = useList<UserRow>('/api/v1/users');
  const roles = useList<RoleInfo>('/api/v1/users/roles');
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('PENDING');
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const me = currentUserId();

  const rows = users.data.filter((u) => u.status === tab);
  const pendingCount = users.data.filter((u) => u.status === 'PENDING').length;

  const act = async (id: string, label: string, call: () => Promise<unknown>) => {
    setBusy(id);
    setError('');
    setOk('');
    try {
      await call();
      setOk(label);
      users.reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const roleSelect = (u: UserRow, value: string, onChange: (v: string) => void) => (
    <select
      aria-label={`Role for ${u.fullName}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-w-[12rem] rounded-xl border border-gray-300 bg-white p-2 text-xs font-semibold"
    >
      <option value="">Choose a role…</option>
      {roles.data.map((r) => (
        <option key={r.name} value={r.name}>{r.name}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-500">Approve new sign-ups and decide what each person can access</p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{pendingCount} waiting</span>
        )}
      </div>

      <ErrorNote message={error || users.error || roles.error} />
      <SuccessNote message={ok} />

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div role="tablist" className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${tab === t.key ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.label} ({users.data.filter((u) => u.status === t.key).length})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <EmptyRow cols={5} loading={users.loading} text={tab === 'PENDING' ? 'Nobody is waiting for approval.' : 'No users here.'} />}
              {rows.map((u) => {
                const isMe = u.id === me;
                const pick = choice[u.id] ?? u.role ?? '';
                return (
                  <tr key={u.id} className="align-middle hover:bg-gray-50/50">
                    <td className="py-3 font-bold text-gray-900">{u.fullName}{isMe && <span className="ml-2 text-[10px] font-bold text-emerald-600">(you)</span>}</td>
                    <td className="py-3 text-gray-600">{u.email}</td>
                    <td className="py-3">
                      {u.status === 'DEACTIVATED' ? (
                        <span className="text-gray-500">{u.role ?? '—'}</span>
                      ) : (
                        roleSelect(u, pick, (v) => {
                          setChoice({ ...choice, [u.id]: v });
                          // Active users: changing the dropdown changes the role straight away.
                          if (u.status === 'ACTIVE' && v && v !== u.role) {
                            void act(u.id, `${u.fullName} is now ${v}.`, () => api.patch(`/api/v1/users/${u.id}/role`, { role: v }));
                          }
                        })
                      )}
                    </td>
                    <td className="py-3"><span className={`rounded-xl px-2.5 py-1 text-[10px] font-bold ${BADGE[u.status]}`}>{u.status === 'PENDING' ? 'Waiting' : u.status === 'ACTIVE' ? 'Active' : 'Deactivated'}</span></td>
                    <td className="py-3 text-right">
                      {u.status === 'PENDING' && (
                        <button
                          disabled={!pick || busy === u.id}
                          onClick={() => act(u.id, `${u.fullName} approved as ${pick}.`, () => api.patch(`/api/v1/users/${u.id}/approve`, { role: pick }))}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                        >
                          <UserCheck size={14} /> Approve
                        </button>
                      )}
                      {u.status === 'ACTIVE' && !isMe && (
                        <button
                          disabled={busy === u.id}
                          onClick={() => window.confirm(`Deactivate ${u.fullName}? They will be signed out and unable to sign in.`) && act(u.id, `${u.fullName} deactivated.`, () => api.patch(`/api/v1/users/${u.id}/status`, { status: 'DEACTIVATED' }))}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                        >
                          <UserX size={14} /> Deactivate
                        </button>
                      )}
                      {u.status === 'DEACTIVATED' && (
                        <button
                          disabled={busy === u.id}
                          onClick={() => act(u.id, `${u.fullName} reactivated.`, () => api.patch(`/api/v1/users/${u.id}/status`, { status: 'ACTIVE' }))}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
                        >
                          <CheckCircle2 size={14} /> Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900"><ShieldCheck size={16} className="text-emerald-600" /> What each role can do</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {roles.data.map((r) => (
            <details key={r.name} className="rounded-2xl border border-gray-100 p-3">
              <summary className="cursor-pointer text-xs font-bold text-gray-800">{r.name} <span className="font-medium text-gray-400">({r.permissions.length} permissions)</span></summary>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {r.permissions.map((p) => <span key={p} className="rounded-lg bg-gray-50 px-2 py-0.5 font-mono text-[10px] text-gray-600">{p}</span>)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
