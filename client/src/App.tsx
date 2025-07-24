import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import GuestPage from './pages/GuestPage';
import ClaimPage from './pages/ClaimPage';
import GuestLoginPage from './pages/GuestLoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token && userRole) {
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        // If token exists but role is not admin, redirect to login
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
      <Route element={<ProtectedRoute allowedRoles={[ 'admin' ]} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default function WrappedApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
