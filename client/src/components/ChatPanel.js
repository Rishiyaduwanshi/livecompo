'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Code,
  Sparkles
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';

const ChatPanel = ({ collapsed, onToggle }) => {
  const { 
    currentSession, 
    chatMessages, 
    isLoading, 
    sendMessage,
    clearSession
  } = useSessionStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    try {
      // sendMessage will automatically create a session if none exists
      await sendMessage(inputValue.trim());
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const suggestedPrompts = [
    "Create a modern button component with hover effects",
    "Build a responsive card component with image and text", 
    "Design a navigation header with dropdown menu",
    "Make a form component with validation styling",
    "Create a modal dialog with backdrop blur"
  ];

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Expand chat"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="mt-4">
          <button
            onClick={() => {
              clearSession();
              onToggle();
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Start New Chat"
          >
            <Bot className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Chat</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Collapse chat"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {currentSession && (
          <p className="text-sm text-gray-500 mt-1">
            Session: {currentSession.name}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto text-blue-500 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Components
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Describe the React component you want to create. I'll generate JSX code and CSS styling for you!
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Try asking for:
              </p>
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors text-sm text-gray-700 hover:text-blue-700"
                >
                  <Sparkles className="h-3 w-3 inline mr-2 text-blue-500" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 text-blue-100" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Generating component...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-2">
            {/* Text Input */}
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Describe the React component you want to create..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
          
          {/* Helper Text */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Code className="h-3 w-3" />
              <span>Generates JSX + CSS automatically</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
