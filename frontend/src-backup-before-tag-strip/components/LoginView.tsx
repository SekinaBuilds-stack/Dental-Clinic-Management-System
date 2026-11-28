// frontend/src/components/LoginView.tsx
import { useId, useState } from 'react';
import type { FC } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jwtPayload, setSession } from '../lib/auth';

interface LoginViewProps {
  onLoginSuccess?: (token: string, role: string) => void;
}

export const LoginView: FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
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
      const role = String(res.data?.role ?? res.data?.user?.role ?? payload?.role ?? 'User');
      setSession(token, role);

      if (onLoginSuccess) onLoginSuccess(token, role);
      else navigate('/', { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (axios.isAxiosError(err) && !err.response) {
        setError('Cannot reach the server. Check your connection and try again.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50/40 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl shadow-lg shadow-emerald-600/30">
            🦷
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Dental Clinic Manager</h1>
          <p className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <ShieldCheck size={14} className="text-emerald-600" /> Secure role-based access
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-r-xl border-l-4 border-red-500 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor={emailId} className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Email address
            </label>
            <div className="relative">
              <input
                id={emailId}
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="name@clinic.com"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail size={18} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor={passwordId} className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter your password"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock size={18} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition duration-200 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" /> Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign in
              </>
            )}
          </button>
        </form>

        <div className="border-t pt-2 text-center text-xs text-gray-400">DCMS Enterprise Clinical Suite</div>
      </div>
    </div>
  );
};
