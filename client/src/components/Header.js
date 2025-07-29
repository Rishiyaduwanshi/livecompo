'use client';

import { useState } from 'react';
import { 
  Menu, 
  MessageSquare, 
  User, 
  LogOut, 
  Settings, 
  Save,
  Download,
  Plus,
  Clock
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSessionStore from '../store/sessionStore';

const Header = ({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  chatPanelCollapsed, 
  setChatPanelCollapsed 
}) => {
  const { user, logout } = useAuthStore();
  const { 
    currentSession, 
    createSession, 
    autoSave, 
    toggleAutoSave, 
    lastSaved,
    saveSession 
  } = useSessionStore();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    await createSession();
    setIsCreatingSession(false);
  };

  const handleManualSave = async () => {
    await saveSession();
  };

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Logo and Session Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">LC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">LiveCompo</span>
            </div>

            {currentSession && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{currentSession.name}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Last saved: {formatLastSaved(lastSaved)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* New Session Button */}
          <button
            onClick={handleCreateSession}
            disabled={isCreatingSession}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isCreatingSession ? 'Creating...' : 'New Session'}</span>
          </button>

          {/* Auto-save Toggle */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={toggleAutoSave}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Auto-save</span>
            </label>
          </div>

          {/* Manual Save Button */}
          {!autoSave && currentSession && (
            <button
              onClick={handleManualSave}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Chat Panel Toggle */}
          <button
            onClick={() => setChatPanelCollapsed(!chatPanelCollapsed)}
            className={`p-2 rounded-md transition-colors ${
              chatPanelCollapsed 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500">Component Creator</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Could open settings modal
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
