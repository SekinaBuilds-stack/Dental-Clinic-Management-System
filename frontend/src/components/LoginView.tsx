// frontend/src/components/LoginView.tsx
import React, { useState } from 'react';
import { Mail, Lock, LogIn, Activity, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginViewProps {
  onLoginSuccess?: (token: string, role: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      setTimeout(() => {
        if (email && password) {
          const token = 'mock-jwt-token-12345';
          const role = 'Dentist';
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);

          if (onLoginSuccess) {
            onLoginSuccess(token, role);
          } else {
            navigate('/dashboard');
          }
        } else {
          setError('Please enter both email and password.');
          setLoading(false);
        }
      }, 800);
    } catch (err) {
      console.error('Login failed', err);
      setError('Invalid credentials or network error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 space-y-8">
        
        {/* Header / Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 mb-2">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dental Clinic Manager</h1>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" /> Secure Role-Based Access Control (RBAC)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="doctor@dcms.com"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition duration-200 text-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing in...
              </div>
            ) : (
              <>
                <LogIn size={18} /> Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-2 border-t">
          DCMS Enterprise Clinical Suite &bull; Version 2.0
        </div>
      </div>
    </div>
  );
};