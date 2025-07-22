import { Router } from 'express';
import { createOrder, getPendingOrders, completeOrder, setIoInstance } from '../controllers/orderController';
import { protect, authorize } from '../controllers/userController';
import { Server } from 'socket.io';

const router = Router();

// This is a bit of a hack to pass the io instance to the controller
// A more robust solution would be to use dependency injection
export const setIoInstanceForOrders = (ioInstance: Server) => {
  setIoInstance(ioInstance);
};

router.post('/', createOrder);
router.get('/pending', protect, authorize('admin'), getPendingOrders);
router.put('/:orderId/complete', protect, authorize('admin'), completeOrder);

export default router;