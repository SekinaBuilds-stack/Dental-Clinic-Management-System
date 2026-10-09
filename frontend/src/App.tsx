// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './components/LoginView'; // Adjust path if your LoginView is located elsewhere
import { ProtectedRoute } from './components/ProtectedRoute';

// Simple placeholder for your dashboard view
const DashboardView = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-800">DCMS Dashboard</h1>
    <p className="text-gray-600 mt-2">Welcome to the Dental Clinic Management System.</p>
  </div>
);

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginView />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardView />} />
          {/* Add other protected module routes here later (e.g., /patients, /scheduler, /billing) */}
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;