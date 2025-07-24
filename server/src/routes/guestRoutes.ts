import { Router } from 'express';
import { registerGuest, guestLogin, getGuestCoupons, getGuestDashboard, toggleGuestClaimedStatus, markCocktailAsClaimed } from '../controllers/guestController';
import { protect, authorize } from '../controllers/userController';

const router = Router();

router.post('/register', registerGuest); // Guest registration does not require JWT
router.post('/login', guestLogin);
router.get('/:guestId/coupons', getGuestCoupons);
router.get('/:guestId/dashboard', getGuestDashboard);
router.put('/:guestId/toggle-claimed', protect, authorize('admin'), toggleGuestClaimedStatus);
router.put('/:guestId/claim-cocktail', protect, authorize('admin'), markCocktailAsClaimed);

export default router;