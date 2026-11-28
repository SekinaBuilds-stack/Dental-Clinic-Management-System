import { useId, useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Mail, User, UserPlus } from 'lucide-react';
import api from '../../services/api';
import { errMsg } from '../../lib/useApi';
import { AuthShell, inputClass } from './AuthShell';

export function RegisterView() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const pwId = useId();
  const confirmId = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', { fullName, email, password });
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Request received" subtitle="Your account has been created.">
        <div role="status" className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <CheckCircle2 className="text-emerald-600" size={32} />
          <p className="text-sm leading-relaxed text-gray-700">
            Thank you, <strong>{fullName}</strong>. A clinic administrator must approve your account and assign your role (doctor,
            cashier, receptionist and so on) before you can sign in. Ask your manager to approve <strong>{email}</strong>.
          </p>
        </div>
        <Link to="/login" className="block rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  const field = (id: string, label: string, icon: ReactNode, props: InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">{label}</label>
      <div className="relative">
        <input id={id} required className={inputClass} {...props} />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">{icon}</div>
      </div>
    </div>
  );

  return (
    <AuthShell title="Create your account" subtitle="An administrator will approve it and give you the right access.">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        {field(nameId, 'Full name', <User size={18} />, { type: 'text', autoComplete: 'name', value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: 'Dr. Jane Wanjiru' })}
        {field(emailId, 'Email address', <Mail size={18} />, { type: 'email', autoComplete: 'username', value: email, onChange: (e) => setEmail(e.target.value), placeholder: 'name@clinic.com' })}
        {field(pwId, 'Password', <Lock size={18} />, { type: 'password', autoComplete: 'new-password', value: password, onChange: (e) => setPassword(e.target.value), placeholder: 'At least 8 characters' })}
        {field(confirmId, 'Confirm password', <Lock size={18} />, { type: 'password', autoComplete: 'new-password', value: confirm, onChange: (e) => setConfirm(e.target.value), placeholder: 'Repeat the password' })}
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60">
          {loading ? 'Creating account…' : (<><UserPlus size={18} /> Request access</>)}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500">
        Already approved? <Link to="/login" className="font-bold text-emerald-700 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
