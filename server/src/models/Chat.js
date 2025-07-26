import ChatSession from './schemas/chat.schema.js';
import aiService from '../services/ai.service.js';

class ChatModel {
  static async createSession(userId, name) {
    try {
      const session = new ChatSession({
        user: userId,
        name,
      });
      await session.save();
      return session;
    } catch (error) {
      throw error;
    }
  }

  static async getSession(sessionId, userId) {
    try {
      const session = await ChatSession.findOne({
        _id: sessionId,
        user: userId,
      });
      
      if (!session) {
        throw new Error('Chat session not found');
      }
      
      return session;
    } catch (error) {
      throw error;
    }
  }

  static async getUserSessions(userId) {
    try {
      return await ChatSession.find({ user: userId })
        .sort({ updatedAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  static async deleteSession(sessionId, userId) {
    try {
      const session = await ChatSession.findOneAndDelete({
        _id: sessionId,
        user: userId,
      });
      
      if (!session) {
        throw new Error('Chat session not found');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async addMessage(sessionId, userId, content, role = 'user') {
    try {
      const session = await this.getSession(sessionId, userId);
      
      session.messages.push({
        role,
        content,
        timestamp: new Date(),
      });
      
      await session.save();
      
      // If it's a user message, generate AI response
      if (role === 'user') {
        const aiResponse = await aiService.chatCompletion(session.messages);
        
        session.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        });
        
        await session.save();
      }
      
      return session;
    } catch (error) {
      throw error;
    }
  }

  static async generateComponent(sessionId, userId, prompt) {
    try {
      const session = await this.getSession(sessionId, userId);
      
      // Generate component using AI service
      const { jsx, css } = await aiService.generateComponent(prompt);
      
      // Update session with generated component
      session.generatedComponent = { jsx, css };
      session.status = 'completed';
      
      await session.save();
      
      return session;
    } catch (error) {
      throw error;
    }
  }
}

export default ChatModel;