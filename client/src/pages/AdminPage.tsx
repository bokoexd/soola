import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Paper, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Collapse, BottomNavigation, BottomNavigationAction } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import api from '../api';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

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

interface Event {
  _id: string;
  name: string;
  date: string;
  description: string;
  qrCode: string;
  guests: string[];
  defaultCoupons: number;
  cocktails: { name: string; description: string; imageUrl?: string; }[];
}

interface Guest {
  _id: string;
  email: string;
  event: Event; // Use the full Event interface
  claimed: boolean;
  coupons: number;
  couponHistory: { cocktail: string; timestamp: Date; }[];
  claimedCocktails: string[]; // New field to store claimed cocktails
}

interface Order {
  _id: string;
  guest: Guest; // Use the full Guest interface
  cocktail: string;
  status: string;
  createdAt: string;
}

interface AdminOverviewResponse {
  events: Event[];
}

const AdminPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [guestEmails, setGuestEmails] = useState('');
  const [cocktails, setCocktails] = useState<{ name: string; description: string; imageUrl?: string; }[]>([{ name: '', description: '', imageUrl: '' }]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [openNewEventForm, setOpenNewEventForm] = useState(false);

  const [openGuestDialog, setOpenGuestDialog] = useState(false);
  const [guestEmailToAddRemove, setGuestEmailToAddRemove] = useState('');
  const [isLoading, setLoading] = useState(true); // Renamed to avoid unused variable
  const [selectedEventForGuestManagement, setSelectedEventForGuestManagement] = useState<string | ''>('');
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0); // 0: Events, 1: Guests, 2: Orders

  const [openClaimCocktailDialog, setOpenClaimCocktailDialog] = useState(false);
  const [selectedGuestForCocktailClaim, setSelectedGuestForCocktailClaim] = useState<Guest | null>(null);
  const [selectedCocktailToClaim, setSelectedCocktailToClaim] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await api.get<AdminOverviewResponse>('/admin/overview');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventData = async (eventId: string) => {
    try {
      setLoading(true);
      const [guestsResponse, ordersResponse] = await Promise.all([
        api.get<Guest[]>(`/admin/event/${eventId}/guests`),
        api.get<Order[]>(`/admin/event/${eventId}/orders?status=received`)
      ]);
      setGuests(guestsResponse.data);
      setOrders(ordersResponse.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();

    socket.emit('joinAdminRoom');

    socket.on('newOrder', (order: Order) => {
      if (selectedEvent && order.guest.event._id === selectedEvent._id) {
        setOrders((prevOrders) => [order, ...prevOrders]);
      }
    });

    socket.on('orderCompleted', (completedOrder: Order) => {
      if (selectedEvent && completedOrder.guest.event._id === selectedEvent._id) {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== completedOrder._id)
        );
      }
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderCompleted');
    };
  }, [selectedEvent]);

  const handleAddCocktail = () => {
    setCocktails([...cocktails, { name: '', description: '', imageUrl: '' }]);
  };

  const handleCocktailChange = (index: number, field: 'name' | 'description', value: string) => {
    const newCocktails = [...cocktails];
    newCocktails[index] = { ...newCocktails[index], [field]: value };
    setCocktails(newCocktails);
  };

  const handleRemoveCocktail = (index: number) => {
    const newCocktails = cocktails.filter((_, i) => i !== index);
    setCocktails(newCocktails);
  };

  const handleCreateEvent = async () => {
    try {
      const guestsArray = guestEmails.split(',').map(email => email.trim()).filter(email => email);
      
      // Log the token to ensure it exists
      console.log("Token exists:", !!localStorage.getItem('token'));
      
      const response = await api.post('/events', {
        name: eventName,
        date: eventDate,
        description: eventDescription,
        guests: guestsArray,
        defaultCoupons: 5, // Changed to 5
        cocktails,
      });
      console.log('Event created:', response.data);
      fetchAdminData();
      setEventName('');
      setEventDate('');
      setEventDescription('');
      setGuestEmails('');
      setCocktails([{ name: '', description: '', imageUrl: '' }]);
      setOpenNewEventForm(false);
    } catch (error: any) {
      console.error('Error creating event:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        alert(`Error creating event: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        alert("Error: No response received from server");
      } else {
        // Something happened in setting up the request that triggered an Error
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleToggleClaimed = async (guestId: string) => {
    try {
      await api.put(`/guests/${guestId}/toggle-claimed`);
      if (selectedEvent) {
        fetchEventData(selectedEvent._id);
      }
    } catch (error) {
      console.error('Error toggling claimed status:', error);
    }
  };

  const handleRevokeCoupons = async (guestId: string) => {
    try {
      await api.put(`/admin/guest/${guestId}/revoke-coupons`);
      if (selectedEvent) {
        fetchEventData(selectedEvent._id);
      }
    } catch (error) {
      console.error('Error revoking coupons:', error);
    }
  };

  const handleDisableAccount = async (guestId: string) => {
    try {
      await api.put(`/admin/guest/${guestId}/disable-account`);
      if (selectedEvent) {
        fetchEventData(selectedEvent._id);
      }
    } catch (error) {
      console.error('Error disabling account:', error);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/complete`);
      // Remove the completed order from the orders list
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/events/${eventId}`);
      fetchAdminData();
      setSelectedEvent(null);
      setGuests([]);
      setOrders([]);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleOpenGuestDialog = () => {
    setSelectedEventForGuestManagement(selectedEvent ? selectedEvent._id : '');
    setOpenGuestDialog(true);
  };

  const handleCloseGuestDialog = () => {
    setOpenGuestDialog(false);
    setGuestEmailToAddRemove('');
  };

  const handleAddGuestToEvent = async () => {
    if (!selectedEventForGuestManagement || !guestEmailToAddRemove) return;
    try {
      await api.put(`/events/${selectedEventForGuestManagement}/guests/add`, { email: guestEmailToAddRemove });
      alert('Guest added successfully!');
      if (selectedEvent) {
        fetchEventData(selectedEvent._id);
      }
      handleCloseGuestDialog();
    } catch (error: any) {
      alert(`Error adding guest: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRemoveGuestFromEvent = async () => {
    if (!selectedEventForGuestManagement || !guestEmailToAddRemove) return;
    try {
      await api.put(`/events/${selectedEventForGuestManagement}/guests/remove`, { email: guestEmailToAddRemove });
      alert('Guest removed successfully!');
      if (selectedEvent) {
        fetchEventData(selectedEvent._id);
      }
      handleCloseGuestDialog();
    } catch (error: any) {
      alert(`Error removing guest: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleOpenClaimCocktailDialog = (guest: Guest) => {
    setSelectedGuestForCocktailClaim(guest);
    setOpenClaimCocktailDialog(true);
  };

  const handleClaimCocktailForGuest = async () => {
    if (!selectedGuestForCocktailClaim || !selectedCocktailToClaim || !selectedEvent) return;
    try {
      await api.put(`/guests/${selectedGuestForCocktailClaim._id}/claim-cocktail`, {
        cocktailName: selectedCocktailToClaim,
      });
      alert(`${selectedCocktailToClaim} claimed for ${selectedGuestForCocktailClaim.email}`);
      setOpenClaimCocktailDialog(false);
      setSelectedCocktailToClaim('');
      fetchEventData(selectedEvent._id); // Refresh guest data
    } catch (error: any) {
      alert(`Error claiming cocktail: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    fetchEventData(event._id);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Typography variant="h6" component="h1">
          Admin Dashboard
        </Typography>
        <Button variant="contained" onClick={handleLogout} size="small">Logout</Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {selectedTab === 0 && ( // Events Tab
          <Box>
            {!selectedEvent && (
              <Button fullWidth variant="contained" onClick={() => setOpenNewEventForm(!openNewEventForm)} sx={{ mb: 2 }}>
                {openNewEventForm ? 'Close Form' : 'Create New Event'}
              </Button>
            )}
            <Collapse in={openNewEventForm && !selectedEvent}>
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Create New Event</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Event Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Guest Emails (comma-separated)"
                      value={guestEmails}
                      onChange={(e) => setGuestEmails(e.target.value)}
                      helperText="e.g., guest1@example.com, guest2@example.com"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Cocktails</Typography>
                    {cocktails.map((cocktail, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                        <TextField
                          label="Cocktail Name"
                          value={cocktail.name}
                          onChange={(e) => handleCocktailChange(index, 'name', e.target.value)}
                          sx={{ flex: 1 }}
                          size="small"
                        />
                        <TextField
                          label="Description"
                          value={cocktail.description}
                          onChange={(e) => handleCocktailChange(index, 'description', e.target.value)}
                          sx={{ flex: 1 }}
                          size="small"
                        />
                        {cocktails.length > 1 && (
                          <IconButton onClick={() => handleRemoveCocktail(index)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={handleAddCocktail} size="small">
                      Add Cocktail
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={handleCreateEvent} fullWidth>
                      Create Event
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Events</Typography>
              <List dense>
                {events.map((event) => (
                  <ListItem key={event._id} divider button onClick={() => handleSelectEvent(event)}>
                    <ListItemText primary={event.name} secondary={new Date(event.date).toLocaleDateString()} />
                    <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id); }} color="error" size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {selectedTab === 1 && ( // Guests Tab
          <Box>
            {selectedEvent ? (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Button variant="contained" onClick={() => setSelectedEvent(null)} sx={{ mb: 2 }} fullWidth>
                  Back to Events
                </Button>
                <Typography variant="h6" gutterBottom>{selectedEvent.name} Guests</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenGuestDialog}
                  sx={{ mb: 2 }}
                  fullWidth
                >
                  Manage Guests
                </Button>
                <TableContainer component={Paper}>
                  <Table size="small" aria-label="guests table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Coupons</TableCell>
                        <TableCell align="right">Claimed</TableCell>
                        <TableCell>Claimed Cocktails</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {guests.map((guest) => (
                        <TableRow key={guest._id}>
                          <TableCell component="th" scope="row">
                            {guest.email}
                          </TableCell>
                          <TableCell align="right">{guest.coupons}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={guest.claimed ? 'Yes' : 'No'}
                              color={guest.claimed ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <List dense>
                              {guest.claimedCocktails && guest.claimedCocktails.length > 0 ? (
                                guest.claimedCocktails.map((cocktailName, idx) => (
                                  <ListItem key={idx} disablePadding>
                                    <ListItemText primary={cocktailName} />
                                  </ListItem>
                                ))
                              ) : (
                                <ListItem><ListItemText primary="None" /></ListItem>
                              )}
                            </List>
                          </TableCell>
                          <TableCell align="right">
                            <Button onClick={() => handleToggleClaimed(guest._id)} color="info" size="small" sx={{ mb: 0.5 }}>
                              Toggle Claimed
                            </Button>
                            <Button onClick={() => handleRevokeCoupons(guest._id)} color="warning" size="small" sx={{ mb: 0.5 }}>
                              Revoke Coupons
                            </Button>
                            <Button onClick={() => handleDisableAccount(guest._id)} color="error" size="small" sx={{ mb: 0.5 }}>
                              Disable Account
                            </Button>
                            <Button onClick={() => handleOpenClaimCocktailDialog(guest)} color="primary" size="small">
                              Claim Cocktail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography>Select an event from the Events tab to view guests.</Typography>
              </Paper>
            )}
          </Box>
        )}

        {selectedTab === 2 && ( // Orders Tab
          <Box>
            {selectedEvent ? (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Button variant="contained" onClick={() => setSelectedEvent(null)} sx={{ mb: 2 }} fullWidth>
                  Back to Events
                </Button>
                <Typography variant="h6" gutterBottom>{selectedEvent.name} Received Orders</Typography>
                <List dense>
                  {orders.length === 0 ? (
                    <ListItem><ListItemText primary="No received orders." /></ListItem>
                  ) : (
                    orders.map((order) => (
                      <ListItem key={order._id} divider>
                        <ListItemText
                          primary={`${order.guest?.email || 'Unknown Guest'} - ${order.cocktail}`}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              Requested: {new Date(order.createdAt).toLocaleTimeString()}
                              <Chip
                                label={order.status}
                                color={order.status === 'received' ? 'primary' : 'success'}
                                size="small"
                              />
                            </Box>
                          }
                        />
                        <Button variant="contained" onClick={() => handleCompleteOrder(order._id)} size="small">
                          Complete Order
                        </Button>
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            ) : (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography>Select an event from the Events tab to view orders.</Typography>
              </Paper>
            )}
          </Box>
        )}

      </Box>

      <Dialog open={openGuestDialog} onClose={handleCloseGuestDialog}>
        <DialogTitle>Manage Guests for {selectedEvent?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Guest Email"
            type="email"
            fullWidth
            value={guestEmailToAddRemove}
            onChange={(e) => setGuestEmailToAddRemove(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGuestDialog}>Cancel</Button>
          <Button onClick={handleAddGuestToEvent} startIcon={<AddIcon />}>Add Guest</Button>
          <Button onClick={handleRemoveGuestFromEvent} startIcon={<RemoveIcon />} color="error">Remove Guest</Button>
        </DialogActions>
      </Dialog>

      <BottomNavigation
        value={selectedTab}
        onChange={(event, newValue) => {
          setSelectedTab(newValue);
        }}
        showLabels
        sx={{ width: '100%', position: 'sticky', bottom: 0, mt: 'auto', borderTop: '1px solid #e0e0e0' }}
      >
        <BottomNavigationAction label="Events" icon={<EventIcon />} />
        <BottomNavigationAction label="Guests" icon={<PeopleIcon />} />
        <BottomNavigationAction label="Orders" icon={<LocalBarIcon />} />
      </BottomNavigation>

      <Dialog open={openClaimCocktailDialog} onClose={() => setOpenClaimCocktailDialog(false)}>
        <DialogTitle>Claim Cocktail for {selectedGuestForCocktailClaim?.email}</DialogTitle>
        <DialogContent>
          <List>
            {selectedEvent?.cocktails.map((cocktail) => (
              <ListItem key={cocktail.name} button onClick={() => setSelectedCocktailToClaim(cocktail.name)}>
                <ListItemText primary={cocktail.name} />
              </ListItem>
            ))}
          </List>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Selected: {selectedCocktailToClaim || 'None'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClaimCocktailDialog(false)}>Cancel</Button>
          <Button onClick={handleClaimCocktailForGuest} disabled={!selectedCocktailToClaim}>Claim</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;

