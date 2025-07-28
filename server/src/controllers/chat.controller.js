import llm from '../services/llm.service.js';
import ChatSession from '../models/chat.model.js';
import { AppError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';

// POST /api/chat/generate
export const generateResponse = async (req, res, next) => {
  try {
    const { prompt, isStream = false, sessionId } = req.body;
    if (!prompt) {
      return next(
        new AppError({ message: 'Prompt is required', statusCode: 400 })
      );
    }

    let chatSession;
    if (sessionId) {
      chatSession = await ChatSession.findById(sessionId);
      if (!chatSession) {
        return next(
          new AppError({ message: 'Session not found', statusCode: 404 })
        );
      }
    } else {
      chatSession = await ChatSession.create({
        name: prompt.slice(0, 30),
        user: req.user.id,
        messages: [],
      });
    }

    // Append current user query
    chatSession.messages.push({ role: 'user', content: prompt });

    const history = chatSession.messages.map((m) => [
      m.role === 'user' ? 'human' : 'assistant',
      m.content,
    ]);

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const aiStream = await llm.stream([...history]);
      for await (const chunk of aiStream) {
        // chunk.content is standard per API
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
      res.write('event: end\ndata: done\n\n');
      res.end();
    } else {
      const aiMsg = await llm.invoke([...history]);
      const reply = aiMsg.content || aiMsg;

      chatSession.messages.push({ role: 'assistant', content: reply });
      await chatSession.save();

      return appResponse(res, {
        message: 'Response generated',
        data: { sessionId: chatSession._id, reply },
      });
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/sessions
export const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sessions = await ChatSession.find({ user: userId })
      .sort({ updatedAt: -1 })
      .select('_id name createdAt updatedAt');

    return appResponse(res, {
      message: 'Chat sessions fetched successfully',
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
};

export const getChatSessionById = async (req, res, next) => {
  
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const session = await ChatSession.findOne({ _id: id, user: userId });

    if (!session) {
      throw new AppError({
        message: 'Chat session not found',
        statusCode: 404,
      });
    }

    return appResponse(res, {
      message: 'Chat session fetched successfully',
      data: session,
    });
  } catch (err) {
    next(err);
  }
};


export const deleteChatSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await ChatSession.findOneAndDelete({ _id: id, user: userId });

    if (!deleted) {
      throw new AppError({ message: 'Chat session not found or already deleted', statusCode: 404 });
    }

    return appResponse(res,{
      message: 'Chat session deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
