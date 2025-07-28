import { Router } from 'express';
import {
  generateResponse,
  getUserSessions,
  getChatSessionById,
  deleteChatSession,
  updateSessionComponent,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.mid.js';

const router = Router();

router.use(authenticate);
router.post('/generate', generateResponse);
router.get('/sessions', getUserSessions);
router.get('/sessions/:id', getChatSessionById);
router.delete('/sessions/:id', deleteChatSession);
router.put('/sessions/:id/component', updateSessionComponent);

// router.get('/history', getConversationHistory);

export default router;
