// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  requiredRole?: string;
  userRole?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  isLoading = false,
  requiredRole,
  userRole,
  children,
}) => {
  // Automatically fall back to localStorage if props are not passed
  const authStatus = isAuthenticated ?? !!localStorage.getItem('token');
  const currentRole = userRole || localStorage.getItem('role') || 'Dentist';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 space-y-3">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium">Verifying clinical session credentials...</p>
      </div>
    );
  }

  if (!authStatus) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentRole !== requiredRole && currentRole !== 'Admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center space-y-4">
          <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-2xl">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-600">
            Your current role (<span className="font-semibold text-gray-900">{currentRole}</span>) does not have permission to access this clinical module (Requires <span className="font-semibold text-blue-600">{requiredRole}</span>).
          </p>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};