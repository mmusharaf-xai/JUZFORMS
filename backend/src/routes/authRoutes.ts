import { Router } from 'express';
import {
  signup,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/account', authenticate, deleteAccount);

export default router;
