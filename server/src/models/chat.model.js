
class ChatModel {
  constructor() {
    this.conversations = {}; 
  }

  addMessage(userId, message) {
    if (!this.conversations[userId]) {
      this.conversations[userId] = [];
    }
    
    const newMessage = {
      id: this.conversations[userId].length + 1,
      content: message.content,
      role: message.role, 
      timestamp: new Date()
    };
    
    this.conversations[userId].push(newMessage);
    return newMessage;
  }

  getConversationHistory(userId) {
    return this.conversations[userId] || [];
  }

  clearConversationHistory(userId) {
    this.conversations[userId] = [];
    return true;
  }
}

export default new ChatModel();