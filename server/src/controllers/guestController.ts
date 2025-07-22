
import { Request, Response } from 'express';
import Guest from '../models/Guest';
import Event from '../models/Event';
import Order from '../models/Order';

export const registerGuest = async (req: Request, res: Response) => {
  try {
    const { email, eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the email is in the event's guest list
    if (!event.guests.includes(email)) {
      return res.status(403).json({ message: 'Your email is not on the guest list for this event.' });
    }

    let guest = await Guest.findOne({ email, event: eventId });

    if (guest) {
      if (guest.claimed) {
        return res.status(400).json({ message: 'You have already claimed coupons for this event.' });
      } else {
        guest.claimed = true;
        guest.coupons = event.defaultCoupons; // Use defaultCoupons from event
        await guest.save();
        return res.status(200).json({ message: 'Coupons claimed successfully!', guest });
      }
    } else {
      // Create a new guest entry if not found and email is on the list
      guest = new Guest({ email, event: eventId, claimed: true, coupons: event.defaultCoupons });
      await guest.save();
      return res.status(201).json({ message: 'Registered and claimed coupons successfully!', guest });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error registering guest', error });
  }
};

export const getGuestCoupons = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.status(200).json({ coupons: guest.coupons });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guest coupons', error });
  }
};

export const getGuestDashboard = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const guest = await Guest.findById(guestId).populate('event');
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    const orders = await Order.find({ guest: guestId }).sort({ createdAt: 1 });

    res.status(200).json({ guest, orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guest dashboard', error });
  }
};

export const toggleGuestClaimedStatus = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    guest.claimed = !guest.claimed;
    await guest.save();

    res.status(200).json({ message: 'Guest claimed status toggled successfully', guest });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling guest claimed status', error });
  }
};
