
import { Request, Response } from 'express';
import Guest from '../models/Guest';
import Event from '../models/Event';
import Order from '../models/Order';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};

export const guestLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const guest = await Guest.findOne({ email }).select('+password'); // Select password explicitly

    if (!guest) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await guest.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If login is successful, mark as claimed if not already
    if (!guest.claimed) {
      guest.claimed = true;
      // Assuming defaultCoupons are set during event creation or initial guest registration
      // If not, you might need to fetch event details here to set coupons
      await guest.save();
    }

    res.status(200).json({
      message: 'Logged in successfully',
      guest: {
        _id: guest._id,
        email: guest.email,
        claimed: guest.claimed,
        coupons: guest.coupons,
      },
      token: generateToken(guest._id),
    });

  } catch (error) {
    res.status(500).json({ message: 'Error logging in guest', error });
  }
};

export const registerGuest = async (req: Request, res: Response) => {
  try {
    const { email, eventId, password } = req.body;

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
        // If already claimed, they need to log in
        return res.status(400).json({ message: 'You have already claimed coupons for this event. Please log in.', requiresLogin: true });
      } else {
        // First time claiming, set password and claim coupons
        if (!password) {
          return res.status(400).json({ message: 'Password is required to claim coupons.' });
        }
        guest.password = password;
        guest.claimed = true;
        guest.coupons = event.defaultCoupons; // Use defaultCoupons from event
        await guest.save();
        return res.status(200).json({ message: 'Coupons claimed successfully!', guest });
      }
    } else {
      // Create a new guest entry if not found and email is on the list
      if (!password) {
        return res.status(400).json({ message: 'Password is required to claim coupons.' });
      }
      guest = new Guest({ email, event: eventId, password, claimed: true, coupons: event.defaultCoupons });
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

export const markCocktailAsClaimed = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { cocktailName } = req.body;

    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    if (guest.claimedCocktails.includes(cocktailName)) {
      return res.status(400).json({ message: 'Cocktail already claimed by this guest.' });
    }

    if (guest.coupons <= 0) {
      return res.status(400).json({ message: 'No coupons remaining for this guest.' });
    }

    guest.claimedCocktails.push(cocktailName);
    guest.coupons -= 1;
    guest.couponHistory.push({ cocktail: cocktailName, timestamp: new Date() });
    await guest.save();

    res.status(200).json({ message: 'Cocktail marked as claimed successfully!', guest });
  } catch (error) {
    res.status(500).json({ message: 'Error marking cocktail as claimed', error });
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
