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
const io = new Server(server, {
  cors: {
    origin: "*", // Still allow all origins for flexibility during testing
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Add CORS middleware with specific origins if needed in production
app.use(cors({
  origin: ["https://server-production-22f7.up.railway.app", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;

mongoose.connect('mongodb://localhost:27017/soola-sessions')
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
