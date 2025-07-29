import { config } from '../../config/index.js';
import ChatSession from '../models/chat.model.js';
import { AppError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';


export const generateResponse = async (req, res, next) => {
  try {
    const { prompt, sessionId } = req.body;

    if (!prompt) {
      return next(
        new AppError({ message: 'prompt is required', statusCode: 400 })
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
      console.log(req.user);
      chatSession = await ChatSession.create({
        name: prompt.slice(0, 30),
        user: req.user?.id,
        messages: [],
        generatedComponent: null,
      });
    }

    // Add user message to conversation history
    chatSession.messages.push({
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    console.log(`Processing chat request - Session: ${chatSession._id}, Messages: ${chatSession.messages.length}, User: ${req.user?.id}`);

    let result;

    if (config.MODEL_PROVIDER === 'gemini') {
      const { default: geminiService } = await import(
        '../services/gemini-llm.service.js'
      );
      // Pass conversation history (excluding current user message) for context
      result = await geminiService.handleRequest(
        prompt,
        chatSession.messages.slice(0, -1), // Previous messages for context
        chatSession.generatedComponent
      );
    } else if (config.MODEL_PROVIDER === 'ollama') {
      const { default: ollamaService } = await import(
        '../services/ollama.service.js'
      );
      result = await ollamaService.handleRequest(
        prompt,
        chatSession.messages.slice(0, -1),
        chatSession.generatedComponent
      );
    } else {
      throw new AppError({
        message: 'OpenAI provider not yet implemented',
        statusCode: 500,
      });
    }

    if (!result.success) {
      return next(
        new AppError({
          message: 'Failed to generate response',
          statusCode: 500,
        })
      );
    }

    // Extract response data from result
    const responseData = result.data;

    // Add AI assistant response to conversation history
    chatSession.messages.push({
      role: 'assistant',
      content: responseData.message || responseData.component?.description || 'Component generated successfully',
      timestamp: new Date(),
      metadata: {
        componentGenerated: responseData.type === 'component',
        componentName: responseData.component?.componentName,
        hasCode: !!(responseData.component?.jsx && responseData.component?.css)
      }
    });

    // Update generated component if provided
    if (responseData.type === 'component' && responseData.component) {
      chatSession.generatedComponent = {
        jsx: responseData.component.jsx || '',
        css: responseData.component.css || '',
        description: responseData.component.description || '',
        features: responseData.component.features || [],
        dependencies: responseData.component.dependencies || [],
        props: responseData.component.props || [],
        accessibility: responseData.component.accessibility || {},
        componentName: responseData.component.componentName || 'GeneratedComponent',
        lastModified: new Date(),
      };
      
      console.log(`Component updated - Name: ${chatSession.generatedComponent.componentName}, JSX length: ${chatSession.generatedComponent.jsx.length}`);
    }

    // Save updated session to database
    await chatSession.save();

    // Return comprehensive response with chat history
    return appResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Response generated successfully',
      data: {
        sessionId: chatSession._id,
        reply: responseData.message || responseData.component?.description || 'Component generated successfully',
        component: chatSession.generatedComponent,
        type: responseData.type,
        metadata: {
          ...responseData.metadata,
          messageCount: chatSession.messages.length,
          conversationActive: true,
          lastActivity: new Date().toISOString()
        },
        conversationHistory: chatSession.messages.slice(-10), // Last 10 messages for context
      },
    });
  } catch (error) {
    console.error('Generate response error:', error);
    return next(
      new AppError({
        message: `Failed to generate response: ${error.message}`,
        statusCode: 500,
      })
    );
  }
};


export const getChatSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find()
      .select('name createdAt lastModified')
      .sort({ lastModified: -1 })
      .limit(50);

    return appResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Chat sessions retrieved successfully',
      data: sessions,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return next(
      new AppError({
        message: `Failed to retrieve sessions: ${error.message}`,
        statusCode: 500,
      })
    );
  }
};


export const getChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return next(
        new AppError({ message: 'Session not found', statusCode: 404 })
      );
    }

    return appResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Chat session retrieved successfully',
      data: session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return next(
      new AppError({
        message: `Failed to retrieve session: ${error.message}`,
        statusCode: 500,
      })
    );
  }
};


export const deleteChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findByIdAndDelete(sessionId);
    if (!session) {
      return next(
        new AppError({ message: 'Session not found', statusCode: 404 })
      );
    }

    return appResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return next(
      new AppError({
        message: `Failed to delete session: ${error.message}`,
        statusCode: 500,
      })
    );
  }
};


