// frontend/src/components/LoginView.tsx
import { useId, useState } from 'react';
import type { FC, FormEvent } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { jwtPayload, setSession } from '../lib/auth';
import { AuthShell, inputClass } from './auth/AuthShell';

interface LoginViewProps {
  onLoginSuccess?: (token: string, role: string) => void;
}

export const LoginView: FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const emailId = useId();
  const passwordId = useId();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      const token: string | undefined = res.data?.accessToken ?? res.data?.access_token;
      if (!token) throw new Error('No token in response');

      const payload = jwtPayload(token);
      const role = String(res.data?.user?.role ?? payload?.role ?? 'User');
      const permissions: string[] = res.data?.user?.permissions ?? [];
      setSession(token, role, permissions);

      if (onLoginSuccess) onLoginSuccess(token, role);
      else navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        // "waiting for approval" / "deactivated": the server's own wording is the useful part
        setError(String(err.response.data?.message ?? 'This account cannot sign in right now.'));
      } else if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError('Please enter a valid email and a password of at least 6 characters.');
      } else if (axios.isAxiosError(err) && !err.response) {
        setError('Cannot reach the server. Check your connection and try again.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your clinic workspace.">
      {params.get('expired') && !error && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
          Your session ended. Please sign in again.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor={emailId} className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Email address</label>
          <div className="relative">
            <input id={emailId} type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@clinic.com" />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><Mail size={18} /></div>
          </div>
        </div>

        <div>
          <label htmlFor={passwordId} className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Password</label>
          <div className="relative">
            <input id={passwordId} type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Enter your password" />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><Lock size={18} /></div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60">
          {loading ? (<><span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" /> Signing in…</>) : (<><LogIn size={18} /> Sign in</>)}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        New to the clinic?{' '}
        <Link to="/register" className="font-bold text-emerald-700 hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
};
