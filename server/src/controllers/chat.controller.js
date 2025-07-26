import { BadRequestError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';
import ChatModel from '../models/chat.model.js';
import LLMService from '../services/llm.service.js';

// Send a message to the LLM and get a response
export const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message) {
      throw new BadRequestError('Message is required');
    }
    
    // Store user message
    const userMessage = ChatModel.addMessage(userId, {
      content: message,
      role: 'user'
    });
    
    // Get conversation history
    const conversationHistory = ChatModel.getConversationHistory(userId);
    
    // Generate response from LLM
    const llmResponse = await LLMService.generateResponse(message, conversationHistory);
    
    // Store assistant response
    const assistantMessage = ChatModel.addMessage(userId, llmResponse);
    
    appResponse(res, {
      message: 'Message sent successfully',
      data: {
        userMessage,
        assistantMessage
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get conversation history
export const getConversationHistory = (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const history = ChatModel.getConversationHistory(userId);
    
    appResponse(res, {
      message: 'Conversation history retrieved successfully',
      data: history
    });
  } catch (error) {
    next(error);
  }
};