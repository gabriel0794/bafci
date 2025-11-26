import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

// Component to protect routes based on user role
const RoleProtectedRoute = ({ allowedRoles = [1, 2, 3] }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userProfile = await authService.getUserProfile();
        setUserRole(userProfile.role);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [location.pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Role 3 (Account Manager) can only access signup page
  if (userRole === 3 && location.pathname !== '/signup') {
    return <Navigate to="/signup" replace />;
  }

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/signup" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
