
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import api from '../api'; // Import the centralized API instance

interface EventResponse {
  name: string;
  // Add other properties if needed from the event object
}

interface ClaimResponse {
  message: string;
  guest: {
    _id: string;
  };
  requiresLogin?: boolean; // Added for new flow
}

const ClaimPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // New state for password
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    const fetchEventName = async () => {
      try {
        const response = await api.get<EventResponse>(`/events/${eventId}`);
        setEventName(response.data.name);
      } catch (err) {
        console.error('Error fetching event name:', err);
        setEventName('Unknown event');
      }
    };
    if (eventId) {
      fetchEventName();
    }
  }, [eventId]);

  const handleClaim = async () => {
    if (!eventId) {
      setError('Event ID is missing.');
      return;
    }
    try {
      const response = await api.post<ClaimResponse>('/guests/register', {
        email,
        eventId,
        password, // Pass password to the backend
      });
      setMessage(response.data.message);
      setError('');
      // Assuming successful claim leads to guest dashboard
      navigate(`/guest/${response.data.guest._id}`);
    } catch (err: any) {
      setMessage('');
      const errorMessage = err.response?.data?.message || 'An error occurred during claiming.';
      setError(errorMessage);
      if (err.response?.data?.requiresLogin) {
        // If requires login, redirect to login page with email and eventId
        navigate(`/guest-login/${eventId}?email=${email}`);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Claim Coupons for {eventName}
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Your Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Set Your Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleClaim}
          >
            Claim My Cocktail Coupons
          </Button>
          {message && (
            <Typography color="success" variant="body1" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}
          {error && (
            <Typography color="error" variant="body1" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ClaimPage;
