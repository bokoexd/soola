import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import eventRoutes from './routes/eventRoutes';
import guestRoutes from './routes/guestRoutes';
import orderRoutes, { setIoInstanceForOrders } from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import { protect } from './controllers/userController'; // Import protect middleware
import cors from 'cors'; // Add CORS middleware

const app = express();
const server = http.createServer(app);

// Define allowed origins for CORS
const allowedOrigins = [
  'https://soola-production.up.railway.app',
  'http://localhost:3000'
];

// Configure Socket.IO with appropriate CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  transports: ['websocket', 'polling'] // Explicitly define transports
});

// Add CORS middleware with specific origins for Express
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Use MongoDB connection string from environment variable in production
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soola-sessions';
const PORT = process.env.PORT || 3001;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Pass the io instance to the order controller
setIoInstanceForOrders(io);

// Routes
app.use('/api/users', userRoutes); // User routes (login/register) don't need protection
app.use('/api/events', eventRoutes); // Remove protect middleware here, we'll apply it in the route file
app.use('/api/guests', guestRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', protect, adminRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
