import { Router } from 'express';
import { sendMessage, getConversationHistory } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.mid.js';

const router = Router();

// Chat routes (all protected)
router.use(authenticate);
router.post('/message', sendMessage);
router.get('/history', getConversationHistory);

export default router;