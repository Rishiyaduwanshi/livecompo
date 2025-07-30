'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, Maximize2, Eye, Download, Copy } from 'lucide-react';
import { Sandpack } from '@codesandbox/sandpack-react';
import JSZip from 'jszip';

// Helper: detect exported component name
const detectComponentName = (code) => {
  const match = code.match(/(?:function|const)\s+([A-Z][A-Za-z0-9_]*)/);
  return match ? match[1] : 'App';
};


const CodePreview = ({ jsx = '', css = '' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [copyType, setCopyType] = useState(null);
  // Export/copy handlers
  const handleCopy = async (type) => {
    const content = type === 'jsx' ? jsx : css;
    try {
      await navigator.clipboard.writeText(content);
      setCopyType(type);
      setTimeout(() => setCopyType(null), 1200);
    } catch (err) {
      setCopyType('error');
      setTimeout(() => setCopyType(null), 1200);
    }
  };

  const handleDownload = () => {
    const zip = new JSZip();
    if (jsx) zip.file('Component.jsx', jsx);
    if (css) zip.file('Component.css', css);
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

  // Prepare the component code for Sandpack
  const componentCode = useMemo(() => {
    let code = jsx || '';
    code = code.replace(/import\s+['\"]\.\/[\w-]+\.css['\"];?/g, "import './App.css';");
    if (!code.includes('export default')) {
      code += `\n\nexport default ${detectComponentName(code)};`;
    }
    return code;
  }, [jsx]);

  // Sandpack files
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
    // In real scenario, you might re-trigger state or rerender
  };

  const EmptyComponent = () => (
    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="text-4xl mb-4">🎨</div>
        <p className="text-gray-500">Start a conversation with AI to generate your component</p>
        <p className="text-sm text-gray-400 mt-1">Your component will appear here in real-time</p>
      </div>
    </div>
  );

  const PreviewControls = () => (
    <div className="flex items-center justify-end px-2 py-1 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-1">
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
        <button
          onClick={() => handleCopy('jsx')}
          className={`p-2 rounded-md transition-colors ${copyType==='jsx' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          title="Copy JSX"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleCopy('css')}
          className={`p-2 rounded-md transition-colors ${copyType==='css' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          title="Copy CSS"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 rounded-md transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          title="Download ZIP"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <PreviewControls />
      <div className={`flex-1 relative ${isFullscreen ? 'bg-white' : ''}`}
        style={isFullscreen ? {padding: 0, margin: 0} : {}}>
        {!jsx.trim() ? (
          <div className="p-8">
            <EmptyComponent />
          </div>
        ) : (
          <div
            className={`flex-1 p-0 md:p-0 overflow-auto bg-white`}
            style={{
              minHeight: isFullscreen ? '100vh' : 320,
            }}
          >
            <div className={`${isFullscreen ? 'w-full h-[calc(100vh-48px)]' : 'max-w-3xl'} mx-auto rounded-2xl shadow-lg border border-gray-100 bg-white`} style={isFullscreen ? {height: 'calc(100vh - 48px)', maxWidth: '100vw'} : {}}>
              <Sandpack
                template="react"
                files={files}
                options={{
                  showNavigator: false,
                  showTabs: true,
                  showLineNumbers: true,
                  showInlineErrors: true,
                  wrapContent: true,
                  editorHeight: isFullscreen ? 'calc(100vh - 80px)' : 340,
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
      {/* Removed bottom bar for a cleaner, more compact UI */}
    </div>
  );
};

export default CodePreview;
