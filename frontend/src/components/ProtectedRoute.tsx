// frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  requiredPermission?: string;
}

export const ProtectedRoute = ({ requiredPermission }: ProtectedRouteProps) => {
  const token = localStorage.getItem('accessToken');
  const userPermissions: string[] = JSON.parse(localStorage.getItem('userPermissions') || '[]');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">403 Forbidden</h2>
        <p className="text-gray-600 mt-2">You do not have the required permissions to access this clinical module.</p>
      </div>
    );
  }

  return <Outlet />;
};