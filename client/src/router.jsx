import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import Dashboard from './pages/dashboard/dashboard';
import RevenuePage from './pages/revenue';
import { authService } from './services/api';
import MembersPage from './pages/members/members';
import PaymentsPage from './pages/payments';

// Create a protected route component
const ProtectedRoute = ({ children }) => {
  const token = authService.getAuthToken();
  return token ? children : <Navigate to="/login" />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: (
      <ProtectedRoute>
        <Signup />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/revenue',
    element: (
      <ProtectedRoute>
        <RevenuePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/members',
    element: (
      <ProtectedRoute>
        <MembersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payments',
    element: (
      <ProtectedRoute>
        <PaymentsPage />
      </ProtectedRoute>
    ),
  },

  // Add a catch-all route that redirects to the login page
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;