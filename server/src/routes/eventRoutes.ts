import { Router } from 'express';
import { createEvent, getEvent, getEvents, deleteEvent, addGuestToEvent, removeGuestFromEvent } from '../controllers/eventController';
import { protect, authorize } from '../controllers/userController';

const router = Router();

router.post('/', protect, authorize('admin'), createEvent);
router.get('/:id', getEvent); // Make public to allow guest access
router.get('/', protect, getEvents);
router.delete('/:id', protect, authorize('admin'), deleteEvent);
router.put('/:eventId/guests/add', protect, authorize('admin'), addGuestToEvent);
router.put('/:eventId/guests/remove', protect, authorize('admin'), removeGuestFromEvent);

export default router;
