import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, Paper, CircularProgress } from '@mui/material';
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
    claimedCocktails: string[]; // New field to store claimed cocktails
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

  const fetchGuestData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<GuestData>(`/guests/${guestId}/dashboard`);
      setGuestData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch guest data.');
      setLoading(false);
    }
  }, [guestId]); // Add guestId as a dependency

  useEffect(() => {
    fetchGuestData();

    if (guestId) {
      socket.emit('joinGuestRoom', guestId);
    }

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
      if (guestId === order.guest._id) {
        setGuestData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            orders: prevData.orders.map(o => o._id === order._id ? { ...o, status: 'complete' } : o)
          };
        });
      }
    });

    return () => {
      socket.off('couponUpdate');
      socket.off('orderCompleted');
    };
  }, [guestId, fetchGuestData]);

  const handleRedeemCocktail = async (cocktailName: string) => {
    if (!guestId) return;
    if (window.confirm(`Are you sure you want to claim ${cocktailName} now?`)) {
      try {
        await api.post('/orders', {
          guestId,
          cocktail: cocktailName,
        });
        alert('Order received!');
        fetchGuestData();
      } catch (err: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert(`Error placing order: ${(err as any).response?.data?.message || err.message}`);
      }
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  if (error) return <Typography color="error">{error}</Typography>;
  if (!guestData) return <Typography>No guest data found.</Typography>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
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
            {guestData.guest.event.cocktails.filter(cocktail => !guestData.guest.claimedCocktails.includes(cocktail.name)).map((cocktail) => (
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
          <Typography variant="h5" gutterBottom>Your Received Orders</Typography>
          <List>
            {guestData.orders.filter(o => o.status === 'received').length === 0 ? (
              <ListItem><ListItemText primary="No received orders yet." /></ListItem>
            ) : (
              guestData.orders.filter(o => o.status === 'received').map((order) => (
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

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>Your Completed Orders</Typography>
          <List>
            {guestData.orders.filter(o => o.status === 'complete').length === 0 ? (
              <ListItem><ListItemText primary="No completed orders yet." /></ListItem>
            ) : (
              guestData.orders.filter(o => o.status === 'complete').map((order) => (
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
    </Box>
  );
};

export default GuestPage;