import React, { useState } from 'react';
import api from '../services/api';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      localStorage.setItem('access_token', response.data.accessToken);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">DCMS Login</h2>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2"
            required
          />
        </div>
        <button type="submit" className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}