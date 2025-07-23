import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import eventRoutes from './routes/eventRoutes';
import guestRoutes from './routes/guestRoutes';
import orderRoutes, { setIoInstanceForOrders } from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import seedAdmin from './seedAdmin';
import { protect } from './controllers/userController';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins with explicit values
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://soola-production.up.railway.app']
  : ['http://localhost:3000'];

// Log the current environment and allowed origins for debugging
console.log(`Current environment: ${process.env.NODE_ENV}`);
console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);

// Apply CORS middleware with proper configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200
}));

// Configure Socket.IO with appropriate CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  transports: ['websocket', 'polling']
});

// Ensure OPTIONS requests are properly handled
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Add manual CORS headers for all responses as fallback
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://soola-production.up.railway.app' 
    : 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Log incoming request origin for debugging
  console.log(`Request from origin: ${req.headers.origin}`);
  
  next();
});

app.use(express.json());

// Use MongoDB connection string from environment variable
const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/soola-sessions';
const PORT = process.env.PORT || 3001;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');
    if (process.env.SEED_ADMIN === 'true') {
      seedAdmin();
    }
  })
  .catch(err => console.log(err));

// Pass the io instance to the order controller
setIoInstanceForOrders(io);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', protect, adminRoutes);

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
  
  // Handle any errors on the socket
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});