import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const componentStateSchema = new mongoose.Schema({
  jsx: {
    type: String,
    default: '',
  },
  css: {
    type: String,
    default: '',
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [messageSchema],
  generatedComponent: componentStateSchema,
  status: {
    type: String,
    enum: ['active', 'completed', 'error'],
    default: 'active',
  },
  // Additional metadata
  messageCount: {
    type: Number,
    default: 0,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Update messageCount and lastActivity before saving
chatSessionSchema.pre('save', function(next) {
  this.messageCount = this.messages.length;
  this.lastActivity = new Date();
  next();
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;