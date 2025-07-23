import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, Button, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../api';

// Get the WebSocket URL from environment variables with a fallback
const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://server-production-22f7.up.railway.app' 
    : 'http://localhost:3001');

console.log(`WebSocket URL: ${websocketUrl}`);

// Create a socket.io client with robust error handling and reconnection logic
const socket = io(websocketUrl, {
  withCredentials: true,
  path: '/socket.io/',
  transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  autoConnect: true,
  forceNew: false
});

// Add comprehensive error handlers for socket connection
socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});

socket.on('connect_timeout', () => {
  console.error('Socket connection timeout');
});

// Add ping to keep connection alive
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 30000);

socket.on('reconnect_attempt', (attempt) => {
  console.log(`Socket reconnection attempt: ${attempt}`);
});

socket.on('reconnect_error', (err) => {
  console.error('Socket reconnection error:', err);
});

socket.on('reconnect_failed', () => {
  console.error('Socket reconnection failed');
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

interface EventDetails {
  _id: string;
  name: string;
  cocktails: { name: string; description: string; imageUrl?: string; }[];
}

interface GuestData {
  guest: {
    _id: string;
    email: string;
    coupons: number;
    event: EventDetails; // Add event details here
  };
  orders: {
    _id: string;
    cocktail: string;
    status: string;
    createdAt: string;
  }[];
}

const GuestPage: React.FC = () => {
  const { guestId } = useParams<{ guestId: string }>();
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuestData = async () => {
    try {
      setLoading(true);
      const response = await api.get<GuestData>(`/guests/${guestId}/dashboard`);
      setGuestData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch guest data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuestData();

    socket.on('couponUpdate', (data: { guestId: string; coupons: number }) => {
      setGuestData(prevData => {
        if (!prevData || data.guestId !== prevData.guest._id) return prevData;
        return {
          ...prevData,
          guest: { ...prevData.guest, coupons: data.coupons }
        };
      });
    });

    socket.on('orderCompleted', (order) => {
      // Re-fetch data to update order status and coupon count for the guest
      // This ensures the UI is consistent with the backend state after an order is completed.
      fetchGuestData();
    });

    return () => {
      socket.off('couponUpdate');
      socket.off('orderCompleted');
    };
  }, [guestId]);

  const handleRedeemCocktail = async (cocktailName: string) => {
    if (!guestId) return;
    try {
      await api.post('/orders', {
        guestId,
        cocktail: cocktailName,
      });
      alert('Order placed! Please wait for bartender to process.');
      // Optimistically update UI or re-fetch data
      fetchGuestData();
    } catch (err: any) {
      alert(`Error placing order: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!guestData) return <Typography>No guest data found.</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {guestData.guest.email}!
        </Typography>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Remaining Coupons: {guestData.guest.coupons}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Redeem a Cocktail:</Typography>
            {guestData.guest.event.cocktails.map((cocktail) => (
              <Button
                key={cocktail.name}
                variant="contained"
                sx={{ mr: 2, mb: 1 }}
                onClick={() => handleRedeemCocktail(cocktail.name)}
              >
                {cocktail.imageUrl && <img src={cocktail.imageUrl} alt={cocktail.name} style={{ width: 24, height: 24, marginRight: 8 }} />}
                {cocktail.name}
              </Button>
            ))}
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Your Orders</Typography>
          <List>
            {guestData.orders.length === 0 ? (
              <ListItem><ListItemText primary="No orders yet." /></ListItem>
            ) : (
              guestData.orders.map((order) => (
                <ListItem key={order._id} divider>
                  <ListItemText
                    primary={order.cocktail}
                    secondary={`Status: ${order.status} - ${new Date(order.createdAt).toLocaleString()}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default GuestPage;