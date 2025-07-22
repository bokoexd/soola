import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, List, ListItem, ListItemText, Paper, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Collapse } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import api from '../api'; // Import the centralized API instance
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('https://server-production-22f7.up.railway.app');

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
        api.get<Order[]>(`/admin/event/${eventId}/orders`)
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

    socket.on('newOrder', (order: Order) => {
      if (selectedEvent && order.guest.event._id === selectedEvent._id) {
        setOrders((prevOrders) => [...prevOrders, order]);
      }
    });

    socket.on('orderCompleted', (completedOrder: Order) => {
      if (selectedEvent && completedOrder.guest.event._id === selectedEvent._id) {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== completedOrder._id)
        );
        fetchEventData(selectedEvent._id);
      }
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderCompleted');
    };
  }, [selectedEvent]);

  const handleAddCocktail = () => {
    setCocktails([...cocktails, { name: '', description: '' }]);
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
        defaultCoupons: cocktails.length,
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

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/complete`);
    } catch (error) {
      console.error('Error completing order:', error);
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Button variant="contained" onClick={handleLogout}>Logout</Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          {!selectedEvent && (
            <Button fullWidth variant="contained" onClick={() => setOpenNewEventForm(!openNewEventForm)} sx={{ mb: 2 }}>
              {openNewEventForm ? 'Close Form' : 'Create New Event'}
            </Button>
          )}
          <Collapse in={openNewEventForm && !selectedEvent}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>Create New Event</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Guest Emails (comma-separated)"
                    value={guestEmails}
                    onChange={(e) => setGuestEmails(e.target.value)}
                    helperText="e.g., guest1@example.com, guest2@example.com"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Cocktails</Typography>
                  {cocktails.map((cocktail, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                      <TextField
                        label="Cocktail Name"
                        value={cocktail.name}
                        onChange={(e) => handleCocktailChange(index, 'name', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Cocktail Description"
                        value={cocktail.description}
                        onChange={(e) => handleCocktailChange(index, 'description', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      {cocktails.length > 1 && (
                        <IconButton onClick={() => handleRemoveCocktail(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button startIcon={<AddIcon />} onClick={handleAddCocktail}>
                    Add Cocktail
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleCreateEvent}>
                    Create Event
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Collapse>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Events</Typography>
            <List>
              {events.map((event) => (
                <ListItem key={event._id} divider button onClick={() => handleSelectEvent(event)}>
                  <ListItemText primary={event.name} secondary={new Date(event.date).toLocaleDateString()} />
                  <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id); }} color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          {selectedEvent ? (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Button variant="contained" onClick={() => setSelectedEvent(null)} sx={{ mb: 2 }}>
                Back to Events
              </Button>
              <Typography variant="h5" gutterBottom>{selectedEvent.name} Details</Typography>
              <Typography variant="body1">Date: {new Date(selectedEvent.date).toLocaleDateString()}</Typography>
              <Typography variant="body1">Description: {selectedEvent.description}</Typography>
              <Typography variant="body1">Default Coupons: {selectedEvent.defaultCoupons}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Cocktails:</Typography>
                <List dense>
                  {selectedEvent.cocktails.map((cocktail, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={cocktail.name} secondary={cocktail.description} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">QR Code:</Typography>
                <img src={selectedEvent.qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
              </Box>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>Guests Overview</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenGuestDialog}
                  sx={{ mb: 2 }}
                >
                  Manage Guests
                </Button>
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="guests table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Coupons</TableCell>
                        <TableCell align="right">Claimed</TableCell>
                        <TableCell>Used Coupons</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {guests.map((guest) => (
                        <TableRow
                          key={guest._id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
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
                              {guest.couponHistory && guest.couponHistory.length > 0 ? (
                                guest.couponHistory.map((item, idx) => (
                                  <ListItem key={idx} disablePadding>
                                    <ListItemText primary={`${item.cocktail} (${new Date(item.timestamp).toLocaleTimeString()})`} />
                                  </ListItem>
                                ))
                              ) : (
                                <ListItem><ListItemText primary="No coupons used" /></ListItem>
                              )}
                            </List>
                          </TableCell>
                          <TableCell align="right">
                            <Button onClick={() => handleToggleClaimed(guest._id)} color="info" sx={{ mr: 1 }}>
                              Toggle Claimed
                            </Button>
                            <Button onClick={() => handleRevokeCoupons(guest._id)} color="warning" sx={{ mr: 1 }}>
                              Revoke Coupons
                            </Button>
                            <Button onClick={() => handleDisableAccount(guest._id)} color="error">
                              Disable Account
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>Pending Orders</Typography>
                <List>
                  {orders.length === 0 ? (
                    <ListItem><ListItemText primary="No pending orders." /></ListItem>
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
                                color={order.status === 'pending' ? 'warning' : 'success'}
                                size="small"
                              />
                            </Box>
                          }
                        />
                        <Button variant="contained" onClick={() => handleCompleteOrder(order._id)}>
                          Complete Order
                        </Button>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            </Paper>
          ) : (
            <Typography>Select an event to view details</Typography>
          )}
        </Grid>
      </Grid>

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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGuestDialog}>Cancel</Button>
          <Button onClick={handleAddGuestToEvent} startIcon={<AddIcon />}>Add Guest</Button>
          <Button onClick={handleRemoveGuestFromEvent} startIcon={<RemoveIcon />} color="error">Remove Guest</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
