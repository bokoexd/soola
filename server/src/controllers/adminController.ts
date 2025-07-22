
import { Request, Response } from 'express';
import Event from '../models/Event';
import Guest from '../models/Guest';
import Order from '../models/Order';

export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    const events = await Event.find();
    // const guests = await Guest.find().populate('event');
    // const orders = await Order.find().populate('guest');

    res.status(200).json({ events, guests: [], orders: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin overview', error });
  }
};

export const getGuestsForEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const guests = await Guest.find({ event: eventId }).populate('event');
    res.status(200).json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guests for event', error });
  }
}

export const getOrdersForEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const guests = await Guest.find({ event: eventId });
    const guestIds = guests.map(guest => guest._id);
    const orders = await Order.find({ guest: { $in: guestIds } }).populate('guest');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders for event', error });
  }
}

export const revokeGuestCoupons = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    guest.coupons = 0;
    await guest.save();

    res.status(200).json({ message: 'Guest coupons revoked', guest });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking coupons', error });
  }
};

export const disableGuestAccount = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // For simplicity, we'll mark them as not claimed and 0 coupons
    // In a real app, you might have a separate 'disabled' flag
    guest.claimed = false;
    guest.coupons = 0;
    await guest.save();

    res.status(200).json({ message: 'Guest account disabled', guest });
  } catch (error) {
    res.status(500).json({ message: 'Error disabling account', error });
  }
};
