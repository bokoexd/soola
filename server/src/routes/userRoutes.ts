import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/userController';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser); // New registration route

export default router;