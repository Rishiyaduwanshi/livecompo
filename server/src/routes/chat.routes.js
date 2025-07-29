import { Router } from 'express';
import {
  generateResponse,
  getChatSessions,
  getChatSession,
  deleteChatSession,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.mid.js';

const router = Router();

// Chat API routes
router.use(authenticate)
router.post('/', generateResponse);
router.get('/sessions', getChatSessions);
router.get('/sessions/:sessionId', getChatSession);
router.delete('/sessions/:sessionId', deleteChatSession);

export default router;
