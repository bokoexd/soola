import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Define a properly typed interface for props
interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  // Get authentication state from localStorage
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // If there's no token or role, redirect to login
  if (!token || !userRole) {
    return <Navigate to="/" replace />;
  }

  // Check if the user's role is in the allowed roles
  if (allowedRoles.includes(userRole)) {
    return <Outlet />; // Allow access to child routes
  }

  // User has a token but not the right role
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
