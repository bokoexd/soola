import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Import the centralized API instance

interface LoginResponse {
  message: string;
  token: string; // Add token to the response interface
  user: {
    email: string;
    role: 'admin'; // Role is now fixed to 'admin'
  };
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login for:', email);
      const response = await api.post<LoginResponse>('/users/login', { email, password });
      console.log('Login response received:', response.status);
      
      const { token, user } = response.data;

      localStorage.setItem('token', token); // Store the token
      localStorage.setItem('userRole', user.role); // Store user role

      if (user.role === 'admin') {
        navigate('/admin');
      } else { // Should not happen if backend enforces single role, but good for type safety
        setError('Unauthorized role.');
      }
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error('Login error details:', err);
      
      if ((err as any).response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', (err as any).response.data);
        setError((err as any).response.data.message || `Server error: ${(err as any).response.status}`);
      } else if ((err as any).request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        setError(`Error: ${(err as any).message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;