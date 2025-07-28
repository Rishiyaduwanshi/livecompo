import llm from '../services/llm.service.js';
import ChatSession from '../models/chat.model.js';
import { AppError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';

// Helper function to extract code blocks from AI response
function extractCodeFromResponse(response) {
  const codeBlocks = {
    jsx: null,
    css: null
  };

  // Extract JSX/TSX
  const jsxRegex = /```(?:jsx|tsx|javascript|js)\s*\n([\s\S]*?)\n```/gi;
  const jsxMatch = jsxRegex.exec(response);
  if (jsxMatch) {
    codeBlocks.jsx = jsxMatch[1].trim();
  }

  // Extract CSS
  const cssRegex = /```css\s*\n([\s\S]*?)\n```/gi;
  const cssMatch = cssRegex.exec(response);
  if (cssMatch) {
    codeBlocks.css = cssMatch[1].trim();
  }

  return codeBlocks;
}

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
        generatedComponent: {
          jsx: '',
          css: '',
          lastModified: new Date()
        }
      });
    }

    // Enhanced prompt for better component generation
    const enhancedPrompt = `${prompt}

Please generate a React component with the following requirements:
1. Provide both JSX and CSS code
2. Make it a functional component using modern React patterns
3. Include proper styling and make it responsive
4. Use semantic HTML elements
5. Ensure accessibility with proper ARIA attributes where needed

Format your response with clear code blocks:
\`\`\`jsx
// Your JSX component here
\`\`\`

\`\`\`css
/* Your CSS styles here */
\`\`\``;

    // Append current user query
    chatSession.messages.push({ 
      role: 'user', 
      content: prompt,
      timestamp: new Date()
    });

    const history = chatSession.messages.map((m) => [
      m.role === 'user' ? 'human' : 'assistant',
      m.content,
    ]);

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let fullResponse = '';
      const aiStream = await llm.stream([...history.slice(-1), ['human', enhancedPrompt]]);
      
      for await (const chunk of aiStream) {
        fullResponse += chunk.content || '';
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }

      // Process and save the complete response
      const extractedCode = extractCodeFromResponse(fullResponse);
      
      chatSession.messages.push({ 
        role: 'assistant', 
        content: fullResponse,
        timestamp: new Date()
      });

      // Update component code if extracted
      if (extractedCode.jsx || extractedCode.css) {
        chatSession.generatedComponent = {
          jsx: extractedCode.jsx || chatSession.generatedComponent.jsx,
          css: extractedCode.css || chatSession.generatedComponent.css,
          lastModified: new Date()
        };
      }

      await chatSession.save();
      
      res.write('event: end\ndata: done\n\n');
      res.end();
    } else {
      const aiMsg = await llm.invoke([...history.slice(-1), ['human', enhancedPrompt]]);
      const reply = aiMsg.content || aiMsg;

      // Extract code from response
      const extractedCode = extractCodeFromResponse(reply);

      chatSession.messages.push({ 
        role: 'assistant', 
        content: reply,
        timestamp: new Date()
      });

      // Update component code if extracted
      if (extractedCode.jsx || extractedCode.css) {
        chatSession.generatedComponent = {
          jsx: extractedCode.jsx || chatSession.generatedComponent.jsx,
          css: extractedCode.css || chatSession.generatedComponent.css,
          lastModified: new Date()
        };
      }

      await chatSession.save();

      return appResponse(res, {
        message: 'Response generated',
        data: { 
          sessionId: chatSession._id, 
          reply,
          extractedCode,
          generatedComponent: chatSession.generatedComponent
        },
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
      .select('_id name createdAt updatedAt messageCount lastActivity status');

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
      throw new AppError({ 
        message: 'Chat session not found or already deleted', 
        statusCode: 404 
      });
    }

    return appResponse(res, {
      message: 'Chat session deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/chat/sessions/:id/component - Update component code
export const updateSessionComponent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { jsx, css } = req.body;

    const session = await ChatSession.findOne({ _id: id, user: userId });

    if (!session) {
      throw new AppError({
        message: 'Chat session not found',
        statusCode: 404,
      });
    }

    // Update component code
    session.generatedComponent = {
      jsx: jsx !== undefined ? jsx : session.generatedComponent.jsx,
      css: css !== undefined ? css : session.generatedComponent.css,
      lastModified: new Date()
    };

    await session.save();

    return appResponse(res, {
      message: 'Component updated successfully',
      data: session.generatedComponent,
    });
  } catch (err) {
    next(err);
  }
};
