import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import Dashboard from './pages/dashboard/dashboard';
import RevenuePage from './pages/revenue';
import { authService } from './services/api';
import MembersPage from './pages/members/members';
import PaymentsPage from './pages/payments';
import Layout from './components/Layout';

// Create a protected route component
const ProtectedRoute = () => {
  const token = authService.getAuthToken();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout><Outlet /></Layout>,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          {
            path: '/revenue',
            element: <RevenuePage />,
          },
          {
            path: '/members',
            element: <MembersPage />,
          },
          {
            path: '/payments',
            element: <PaymentsPage />,
          },
        ],
      },
    ],
  },
  // Add a catch-all route that redirects to the login page
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;