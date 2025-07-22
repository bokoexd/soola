
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (userRole && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // If token exists but role is not allowed, redirect to login or an unauthorized page
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
