import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import GuestPage from './pages/GuestPage';
import ClaimPage from './pages/ClaimPage';
import GuestLoginPage from './pages/GuestLoginPage';

// Create the missing ProtectedRoute component
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token && userRole) {
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else { // If token exists but role is not admin, redirect to login
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/claim/:eventId" element={<ClaimPage />} />
      <Route path="/guest/:guestId" element={<GuestPage />} />
      <Route path="/guest-login/:eventId" element={<GuestLoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;
