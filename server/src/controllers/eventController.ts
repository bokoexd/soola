import { Request, Response } from 'express';
import Event, { IEvent } from '../models/Event';
import Guest from '../models/Guest';
import qrcode from 'qrcode';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { name, date, description, guests, cocktails } = req.body;
    const newEvent: IEvent = new Event({ name, date, description, guests, cocktails });

    const qrCodeData = `http://localhost:3000/claim/${newEvent._id}`;
    newEvent.qrCode = await qrcode.toDataURL(qrCodeData);

    await newEvent.save();

    if (guests && guests.length > 0) {
      const guestDocs = guests.map((email: string) => ({
        email,
        event: newEvent._id,
        coupons: cocktails.length,
      }));
      await Guest.insertMany(guestDocs);
    }

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Optionally, delete associated guests and orders
    await Guest.deleteMany({ event: id });
    // Orders are linked to guests, so they might be implicitly deleted or need explicit handling

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error });
  }
};

export const addGuestToEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.guests.includes(email)) {
      return res.status(400).json({ message: 'Guest already exists in this event' });
    }

    event.guests.push(email);
    await event.save();

    // Create a new Guest entry if they don't exist yet for this event
    let guest = await Guest.findOne({ email, event: eventId });
    if (!guest) {
      guest = new Guest({ email, event: eventId, claimed: false, coupons: event.cocktails.length });
      await guest.save();
    }

    res.status(200).json({ message: 'Guest added to event successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error adding guest to event', error });
  }
};

export const removeGuestFromEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const initialGuestCount = event.guests.length;
    event.guests = event.guests.filter(g => g !== email);

    if (event.guests.length === initialGuestCount) {
      return res.status(404).json({ message: 'Guest not found in event' });
    }

    await event.save();

    // Optionally, you might want to disable or remove the Guest entry as well
    await Guest.deleteOne({ email, event: eventId });

    res.status(200).json({ message: 'Guest removed from event successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error removing guest from event', error });
  }
};