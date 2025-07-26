import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.mid.js';

const router = Router();

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/profile', deleteProfile);

export default router;