
import { Router } from 'express';
import { getAdminOverview, revokeGuestCoupons, disableGuestAccount, getGuestsForEvent, getOrdersForEvent } from '../controllers/adminController';

const router = Router();

router.get('/overview', getAdminOverview);
router.get('/event/:eventId/guests', getGuestsForEvent);
router.get('/event/:eventId/orders', getOrdersForEvent);
router.put('/guest/:guestId/revoke-coupons', revokeGuestCoupons);
router.put('/guest/:guestId/disable-account', disableGuestAccount);

export default router;
