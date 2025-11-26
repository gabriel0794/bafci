import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import Dashboard from './pages/dashboard/dashboard';
import RevenuePage from './pages/revenue';
import { authService } from './services/api';
import MembersPage from './pages/members/members';
import AddBarangayMembers from './pages/members/AddBarangayMembers';
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
  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/signup',
        element: <Signup />,
      },
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
            path: '/add-barangay-members',
            element: <AddBarangayMembers />,
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