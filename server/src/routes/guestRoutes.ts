import { Router } from 'express';
import { registerGuest, getGuestCoupons, getGuestDashboard, toggleGuestClaimedStatus } from '../controllers/guestController';
import { protect, authorize } from '../controllers/userController';

const router = Router();

router.post('/register', registerGuest); // Guest registration does not require JWT
router.get('/:guestId/coupons', getGuestCoupons);
router.get('/:guestId/dashboard', getGuestDashboard);
router.put('/:guestId/toggle-claimed', protect, authorize('admin'), toggleGuestClaimedStatus);

export default router;