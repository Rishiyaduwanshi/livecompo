import { Router } from 'express';
import {
  generateResponse,
  getUserSessions,
  getChatSessionById,
  deleteChatSession,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.mid.js';

const router = Router();

router.use(authenticate);
router.post('/generate', generateResponse);
router.get('/sessions', getUserSessions);
router.get('/sessions/:id', getChatSessionById);
router.delete('/sessions/:id', deleteChatSession);

// router.get('/history', getConversationHistory);

export default router;
