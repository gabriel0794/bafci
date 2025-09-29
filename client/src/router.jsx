import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import Dashboard from './pages/dashboard/dashboard';
import { authService } from './services/api';

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
    element: <Signup />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
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