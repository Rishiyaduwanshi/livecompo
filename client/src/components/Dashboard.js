'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useSessionStore from '../store/sessionStore';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import CodeEditor from './CodeEditor';
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

  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'jsx', 'css'
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
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex space-x-8">
              {['preview', 'jsx', 'css'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Editor/Preview Area */}
            <div className="flex-1 flex flex-col">
              {activeTab === 'preview' && (
                <CodePreview 
                  jsx={generatedComponent.jsx}
                  css={generatedComponent.css}
                />
              )}
              
              {activeTab === 'jsx' && (
                <CodeEditor 
                  language="javascript"
                  value={generatedComponent.jsx}
                  onChange={(value) => {
                    // Handle JSX changes
                    const { updateComponent } = useSessionStore.getState();
                    updateComponent(value, undefined);
                  }}
                />
              )}
              
              {activeTab === 'css' && (
                <CodeEditor 
                  language="css"
                  value={generatedComponent.css}
                  onChange={(value) => {
                    // Handle CSS changes
                    const { updateComponent } = useSessionStore.getState();
                    updateComponent(undefined, value);
                  }}
                />
              )}

              {/* Export Bar */}
              {currentSession && (generatedComponent.jsx || generatedComponent.css) && (
                <ExportBar />
              )}
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

// Export Bar Component
const ExportBar = () => {
  const { exportComponent } = useSessionStore();
  
  const handleCopy = async (type) => {
    const component = exportComponent();
    const content = type === 'jsx' ? component.jsx : component.css;
    
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const component = exportComponent();
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    if (component.jsx) {
      zip.file('Component.jsx', component.jsx);
    }
    if (component.css) {
      zip.file('Component.css', component.css);
    }
    
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `component-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Export Component:</span>
          <button
            onClick={() => handleCopy('jsx')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Copy JSX
          </button>
          <button
            onClick={() => handleCopy('css')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Copy CSS
          </button>
        </div>
        
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Download ZIP
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
