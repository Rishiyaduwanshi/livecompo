'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useSessionStore from '../store/sessionStore';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
// import CodeEditor from './CodeEditor';
import CodePreview from './CodePreview';
import PropertyEditor from './PropertyEditor';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { 
    currentSession, 
    propertyPanelOpen, 
    fetchSessions,
    generatedComponent 
  } = useSessionStore();

  // Only preview tab is needed now
  const [activeTab, setActiveTab] = useState('preview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  if (!isAuthenticated) {
    return null; // This will be handled by the main App component
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        chatPanelCollapsed={chatPanelCollapsed}
        setChatPanelCollapsed={setChatPanelCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Central Content Area */}
        <div className="flex-1 flex flex-col min-w-0">


          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Editor/Preview Area */}
            <div className="flex-1 flex flex-col">
              <CodePreview 
                jsx={generatedComponent.jsx}
                css={generatedComponent.css}
              />


            </div>

            {/* Property Editor Panel */}
            {propertyPanelOpen && (
              <div className="w-80 border-l border-gray-200 bg-white">
                <PropertyEditor />
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <ChatPanel 
          collapsed={chatPanelCollapsed}
          onToggle={() => setChatPanelCollapsed(!chatPanelCollapsed)}
        />
      </div>
    </div>
  );
};

export default Dashboard;
