import { Request, Response } from 'express';
import Order from '../models/Order';
import Guest, { IGuest } from '../models/Guest';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

// This will be passed from index.ts
let io: Server;
export const setIoInstance = (ioInstance: Server) => {
  io = ioInstance;
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { guestId, cocktail } = req.body;

    const guest = await Guest.findById(guestId) as IGuest | null;
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    if (guest.coupons <= 0) {
      return res.status(400).json({ message: 'No coupons remaining.' });
    }

    guest.coupons -= 1;
    await guest.save();

    // Convert MongoDB ObjectId to string explicitly before emitting
    const guestIdString = guest._id.toString();
    io.to(guestIdString).emit('couponUpdate', { guestId: guestIdString, coupons: guest.coupons }); // Notify guest

    // Fix: Change 'received' to 'pending' to match the Order model's enum
    const order = new Order({ guest: guestId, cocktail, status: 'pending' });
    await order.save();

    // Populate the guest field before emitting
    await order.populate('guest');

    io.to('admin').emit('newOrder', order); // Notify bartenders

    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error });
  }
};

export const getReceivedOrders = async (req: Request, res: Response) => {
  try {
    // Fix: Change 'received' to 'pending' to match the Order model's enum
    const orders = await Order.find({ status: 'pending' }).populate('guest').sort({ createdAt: 1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching received orders', error });
  }
};

export const completeOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('guest');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'complete') {
      return res.status(400).json({ message: 'Order already completed.' });
    }

    order.status = 'complete';
    await order.save();

    // Safely access order.guest._id by ensuring it's properly typed
    const guestId = order.guest._id?.toString();
    
    const guest = await Guest.findById(guestId);
    if (guest) {
      guest.couponHistory.push({ cocktail: order.cocktail, timestamp: new Date() });
      await guest.save();
    }

    if (guestId) {
      io.to(guestId).emit('orderCompleted', order); // Notify guest
    }
    io.to('admin').emit('orderCompleted', order); // Notify admin

    res.status(200).json({ message: 'Order completed successfully!', order });
  } catch (error) {
    res.status(500).json({ message: 'Error completing order', error });
  }
};
