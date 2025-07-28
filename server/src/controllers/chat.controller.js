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

    chatSession.messages.push({
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    let result;

    if (config.MODEL_PROVIDER === 'gemini') {
      const { default: geminiService } = await import(
        '../services/gemini-llm.service.js'
      );
      result = await geminiService.handleRequest(
        prompt,
        chatSession.messages.slice(0, -1),
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

    
    const responseData = result.data;

    
    chatSession.messages.push({
      role: 'assistant',
      content: responseData.message || 'Component generated successfully',
      timestamp: new Date(),
    });

    
    if (responseData.type === 'component' && responseData.component) {
      chatSession.generatedComponent = {
        jsx: responseData.component.jsx || '',
        css: responseData.component.css || '',
        description: responseData.component.description || '',
        features: responseData.component.features || [],
        dependencies: responseData.component.dependencies || [],
        props: responseData.component.props || [],
        accessibility: responseData.component.accessibility || {},
        componentName:
          responseData.component.componentName || 'GeneratedComponent',
        lastModified: responseData.component.lastModified || new Date(),
      };
    }

    await chatSession.save();

    
    return appResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Response generated successfully',
      data: {
        sessionId: chatSession._id,
        component: chatSession.generatedComponent,
        type: responseData.type,
        metadata: responseData.metadata,
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


export const getProviderInfo = async (req, res, next) => {
  try {
    const providerInfo = {
      provider: config.MODEL_PROVIDER,
      supportsStructuredOutput:
        config.MODEL_PROVIDER === 'gemini' ||
        config.MODEL_PROVIDER === 'openai',
      status: 'active',
      recommendedFor: getRecommendation(config.MODEL_PROVIDER),
    };

    return appResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Provider info retrieved successfully',
      data: providerInfo,
    });
  } catch (error) {
    console.error('Get provider info error:', error);
    return next(
      new AppError({
        message: `Failed to get provider info: ${error.message}`,
        statusCode: 500,
      })
    );
  }
};

function getRecommendation(provider) {
  switch (provider) {
    case 'gemini':
      return 'Excellent for production - structured output, fast responses';
    case 'ollama':
      return 'Perfect for development - local, private, customizable';
    case 'openai':
      return 'Best for complex features - advanced capabilities';
    default:
      return 'Standard LLM capabilities';
  }
}
