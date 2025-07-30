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
    <div className="absolute top-3 right-4 z-20 flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-lg shadow px-1 py-1 border border-gray-200">
      <button
        onClick={refreshPreview}
        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Refresh preview"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleCopy('jsx')}
        className={`p-1 rounded transition-colors ${copyType==='jsx' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
        title="Copy JSX"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleCopy('css')}
        className={`p-1 rounded transition-colors ${copyType==='css' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
        title="Copy CSS"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={handleDownload}
        className="p-1 rounded transition-colors text-gray-500 hover:text-blue-600 hover:bg-blue-50"
        title="Download ZIP"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className={`flex-1 relative ${isFullscreen ? 'bg-white' : ''}`} style={isFullscreen ? {padding: 0, margin: 0} : {}}>
        {!jsx.trim() ? (
          <div className="p-4 md:p-6">
            <EmptyComponent />
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-white relative ">
            <div className={`mx-auto rounded-xl shadow relative h-500 ${isFullscreen ? 'h-[calc(100vh-32px)]' : 'max-w-7xl'}`}
            >
              <PreviewControls />
              <Sandpack 
                template="react"
                files={files}
                options={{
                  showNavigator: false,
                  showTabs: true,
                  showLineNumbers: true,
                  showInlineErrors: true,
                  wrapContent: true,
                  editorHeight: isFullscreen ? 'calc(100vh - 80px)' : "calc(100vh - 20vh)",
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
    </div>
  );
};

export default CodePreview;
