'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Clock, 
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';

const Sidebar = ({ collapsed, onToggle }) => {
  const { 
    sessions, 
    currentSession, 
    loadSession, 
    deleteSession, 
    fetchSessions 
  } = useSessionStore();
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('Sidebar: Fetching sessions on mount');
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Sidebar render:', {
    sessionsCount: sessions.length,
    currentSessionId: currentSession?._id,
    filteredCount: filteredSessions.length
  });

  const handleSessionClick = async (sessionId) => {
    const { chatMessages } = useSessionStore.getState();
    const hasMessages = chatMessages && chatMessages.length > 0;
    
    console.log('Sidebar: Session clicked', {
      sessionId,
      currentSessionId: currentSession?._id,
      hasMessages,
      messagesCount: chatMessages?.length || 0,
      shouldLoad: currentSession?._id !== sessionId || !hasMessages
    });
    
    if (currentSession?._id !== sessionId || !hasMessages) {
      console.log('Sidebar: Loading session...', {
        reason: currentSession?._id !== sessionId ? 'different session' : 'no messages loaded'
      });
      try {
        const result = await loadSession(sessionId);
        console.log('Sidebar: Load session result:', result);
      } catch (error) {
        console.error('Sidebar: Load session error:', error);
      }
    } else {
      console.log('Sidebar: Session already active and loaded');
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        <div className="mt-4 space-y-2">
          <div className="p-2 text-gray-400" title="Chat Sessions">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="p-4 text-center">
            {searchTerm ? (
              <div className="text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions yet</p>
                <p className="text-xs text-gray-400 mt-1">Start chatting with AI to create your first session</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSessions.map((session) => (
              <div
                key={session._id}
                onClick={() => handleSessionClick(session._id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentSession?._id === session._id 
                    ? 'bg-blue-50 border-r-2 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {session.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteSession(e, session._id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
