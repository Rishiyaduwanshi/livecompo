'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Maximize2, Eye } from 'lucide-react';
import { Sandpack } from '@codesandbox/sandpack-react';
import useSessionStore from '../store/sessionStore';

// Helper: detect exported component name
const detectComponentName = (code) => {
  const match = code.match(/(?:function|const)\s+([A-Z][A-Za-z0-9_]*)/);
  return match ? match[1] : 'App';
};

const CodePreview = ({ jsx = '', css = '' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const { selectElement } = useSessionStore();

  const componentCode = useMemo(() => {
    let code = jsx || '';
    // Replace any import './*.css' with import './App.css'
    code = code.replace(/import\s+['\"]\.\/[\w-]+\.css['\"];?/g, "import './App.css';");
    // Ensure export default is present
    if (!code.includes('export default')) {
      code += `\n\nexport default ${detectComponentName(code)};`;
    }
    return code;
  }, [jsx]);
  

  
  const files = {
    '/App.js': componentCode,
    '/App.css': css,
    '/index.js': `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import "./App.css";
      import App from "./App";

      const root = createRoot(document.getElementById("root"));
      root.render(<App />);
    `,
  };

  const refreshPreview = () => {
    console.log('Preview refreshed');
    // In real scenario, you might re-trigger state or rerender
  };

  const EmptyComponent = () => (
    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Component Preview</h3>
        <p className="text-gray-500">Start a conversation with AI to generate your component</p>
        <p className="text-sm text-gray-400 mt-1">Your component will appear here in real-time</p>
      </div>
    </div>
  );

  const PreviewControls = () => (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-900">Component Preview</h3>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-md transition-colors ${
            showGrid
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title={showGrid ? 'Hide grid' : 'Show grid'}
        >
          <Eye className="h-4 w-4" />
        </button>

        <button
          onClick={refreshPreview}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh preview"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <PreviewControls />

      <div className="flex-1 relative">
        {!jsx.trim() ? (
          <div className="p-8">
            <EmptyComponent />
          </div>
        ) : (
          <div
            className={`flex-1 p-6 overflow-auto ${
              showGrid ? 'bg-gray-50' : 'bg-white'
            }`}
            style={{
              backgroundImage: showGrid
                ? 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)'
                : 'none',
              backgroundSize: showGrid ? '20px 20px' : 'auto',
            }}
          >
            <div className="max-w-4xl mx-auto">
              <Sandpack
                template="react"
                files={files}
                options={{
                  showNavigator: false,
                  showTabs: true,
                  showLineNumbers: true,
                  showInlineErrors: true,
                  wrapContent: true,
                  editorHeight: 400,
                  editorWidthPercentage: 50,
                }}
                customSetup={{
                  dependencies: {
                    react: 'latest',
                    'react-dom': 'latest',
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}

      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <span>
          {jsx && css ? 'JSX + CSS' : jsx ? 'JSX only' : css ? 'CSS only' : 'No component'}
        </span>
      </div>
    </div>
  );
};

export default CodePreview;
