'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Maximize2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import useSessionStore from '../store/sessionStore';

const CodePreview = ({ jsx, css }) => {
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const iframeRef = useRef(null);
  const { selectElement } = useSessionStore();

  const refreshPreview = () => {
    setIsRefreshing(true);
    setError(null);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const generatePreviewHTML = () => {
    if (!jsx && !css) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Component Preview</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .placeholder {
              text-align: center;
              color: white;
              opacity: 0.8;
            }
            .placeholder h2 {
              font-size: 2rem;
              margin-bottom: 1rem;
              font-weight: 300;
            }
            .placeholder p {
              font-size: 1.1rem;
              margin-bottom: 0.5rem;
            }
          </style>
        </head>
        <body>
          <div class="placeholder">
            <h2>🎨 Component Preview</h2>
            <p>Start a conversation with AI to generate your component</p>
            <p>Your component will appear here in real-time</p>
          </div>
        </body>
        </html>
      `;
    }

    // Transform JSX to JavaScript (enhanced transformation)
    let processedJSX = jsx || '';
    
    // Remove all import statements
    processedJSX = processedJSX.replace(/import.*?from.*?;?\n/g, '');
    processedJSX = processedJSX.replace(/import\s+['"][^'"]+['"];?\n/g, '');
    
    // Remove single line comments
    processedJSX = processedJSX.replace(/\/\/.*\n/g, '');
    
    // Remove export statements
    processedJSX = processedJSX.replace(/export\s+default\s+/g, '');
    processedJSX = processedJSX.replace(/export\s+default\s+\w+;?\s*$/g, '');
    
    // Convert function declarations
    processedJSX = processedJSX.replace(
      /function\s+(\w+)/g,
      'function $1'
    );
    
    // Convert const arrow function components with basic props
    processedJSX = processedJSX.replace(
      /const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*/g,
      'function $1() '
    );
    
    // Convert arrow function components with props (more robust)
    processedJSX = processedJSX.replace(
      /const\s+(\w+)\s*=\s*\(\s*{\s*([^}]+)\s*}\s*\)\s*=>\s*/g,
      'function $1(props) {\n  const { $2 } = props;\n  '
    );
    
    // Fix return statements that lost their opening brace
    processedJSX = processedJSX.replace(
      /function\s+(\w+)[^{]*\n\s*return\s*\(/,
      'function $1(props) {\n  const { title, description, subtitle, imageSrc, data } = props || {};\n  return ('
    );
    
    // Ensure useState is handled
    processedJSX = processedJSX.replace(/const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useState/g, 
      'const [$1, $2] = React.useState');

    // Fix template literals in className (convert to string concatenation)
    // Handle complex template literals with multiple variables
    processedJSX = processedJSX.replace(
      /className=\{`([^`]*?)\$\{([^}]+?)\}([^`]*?)`\}/g,
      (match, before, variable, after) => {
        if (before && after) {
          return `className={"${before}" + (${variable}) + "${after}"}`;
        } else if (before) {
          return `className={"${before}" + (${variable})}`;
        } else if (after) {
          return `className={(${variable}) + "${after}"}`;
        } else {
          return `className={${variable}}`;
        }
      }
    );
    
    // Fix remaining template literals
    processedJSX = processedJSX.replace(
      /className=\{`([^$`]*)`\}/g,
      'className="$1"'
    );
    
    // Fix any remaining backticks in JSX
    processedJSX = processedJSX.replace(/`([^`]*)`/g, '"$1"');

    console.log('Processed JSX for preview (enhanced):', { 
      original: jsx?.substring(0, 100),
      processed: processedJSX.substring(0, 200),
      hasReturn: processedJSX.includes('return'),
      hasFunction: processedJSX.includes('function'),
      hasTemplateString: processedJSX.includes('`')
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Component Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: ${showGrid ? `
              radial-gradient(circle, #e5e5e5 1px, transparent 1px);
              background-size: 20px 20px;
              background-color: #fafafa;
            ` : '#fafafa'};
            min-height: 100vh;
          }
          
          .preview-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          /* Component styles */
          ${css || ''}
          
          /* Default styles for better preview */
          * {
            box-sizing: border-box;
          }
          
          /* Click detection for element selection */
          .selectable-element {
            cursor: pointer;
            position: relative;
          }
          
          .selectable-element:hover {
            outline: 2px dashed #3b82f6;
            outline-offset: 2px;
          }
          
          .selected-element {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
        </style>
      </head>
      <body>
        <div id="root" class="preview-container"></div>
        
        <script type="text/babel">
          const { useState, useEffect, useRef } = React;
          
          // Component code
          ${processedJSX}
          
          // Make component globally available if it has export default
          const exportMatch = \`${jsx || ''}\`.match(/export\\s+default\\s+(\\w+)/);
          if (exportMatch) {
            window[exportMatch[1]] = eval(exportMatch[1]);
          }
          
          // Wrap component to add click handlers for element selection
          function WrappedComponent() {
            const handleElementClick = (e, elementType) => {
              e.stopPropagation();
              
              // Remove previous selection
              document.querySelectorAll('.selected-element').forEach(el => {
                el.classList.remove('selected-element');
              });
              
              // Add selection to clicked element
              e.target.classList.add('selected-element');
              
              // Send message to parent about element selection
              window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                element: {
                  type: elementType,
                  tagName: e.target.tagName,
                  className: e.target.className,
                  styles: window.getComputedStyle(e.target)
                }
              }, '*');
            };
            
            // Get the component name (more robust detection)
            let ComponentName = null;
            
            // Try different patterns to find component name
            const patterns = [
              /function\\s+(\\w+)/,
              /const\\s+(\\w+)\\s*=/,
              /\\w+Component/,
              /\\w+Hero/,
              /\\w+Table/,
              /\\w+Card/,
              /\\w+Accordion/
            ];
            
            for (const pattern of patterns) {
              const match = \`${processedJSX}\`.match(pattern);
              if (match && match[1]) {
                ComponentName = match[1];
                break;
              }
            }
            
            console.log('Component detection:', { 
              found: ComponentName, 
              available: Object.keys(window).filter(k => typeof window[k] === 'function'),
              jsxSample: \`${processedJSX}\`.substring(0, 150)
            });
            
            if (ComponentName && typeof window[ComponentName] === 'function') {
              // Enhanced sample props
              const sampleProps = {
                title: "Sample Title",
                description: "This is a sample description for the component preview.",
                subtitle: "Sample Subtitle",
                image: "https://via.placeholder.com/300x150/4F46E5/FFFFFF?text=Sample+Image",
                imageSrc: "https://via.placeholder.com/400x200/6366F1/FFFFFF?text=Hero+Image",
                text: "Sample text content",
                content: "Sample content for the component",
                name: "Sample Name",
                value: "Sample Value",
                label: "Sample Label",
                placeholder: "Enter text here...",
                data: [
                  { id: 1, name: "Item 1", value: "Value 1" },
                  { id: 2, name: "Item 2", value: "Value 2" },
                  { id: 3, name: "Item 3", value: "Value 3" }
                ],
                onClick: (e) => handleElementClick(e, ComponentName),
                onToggle: () => console.log('Toggled'),
                children: "Sample content"
              };
              
              try {
                return React.createElement(window[ComponentName], sampleProps);
              } catch (error) {
                console.error('Component render error:', error);
                return React.createElement('div', { 
                  className: 'text-red-500 p-4 text-center border border-red-300 rounded' 
                }, \`Component render error: \${error.message}\`);
              }
            }
            
            return React.createElement('div', { 
              className: 'text-red-500 p-4 text-center' 
            }, 'Component could not be rendered');
          }
          
          // Render the component
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(WrappedComponent));
        </script>
        
        <script>
          // Error handling
          window.addEventListener('error', (e) => {
            window.parent.postMessage({
              type: 'PREVIEW_ERROR',
              error: e.message,
              stack: e.error?.stack
            }, '*');
          });
          
          // Send ready message
          window.parent.postMessage({
            type: 'PREVIEW_READY'
          }, '*');
        </script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (e) => {
      if (e.source !== iframe.contentWindow) return;
      
      switch (e.data.type) {
        case 'PREVIEW_ERROR':
          setError({
            message: e.data.error,
            stack: e.data.stack
          });
          break;
        case 'PREVIEW_READY':
          setError(null);
          break;
        case 'ELEMENT_SELECTED':
          selectElement(e.data.element);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectElement]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const html = generatePreviewHTML();
      iframe.srcdoc = html;
    }
  }, [jsx, css, showGrid]);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-900">Component Preview</h3>
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Render Error</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Grid Toggle */}
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

          {/* Refresh */}
          <button
            onClick={refreshPreview}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Preview Error</h4>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    Show stack trace
                  </summary>
                  <pre className="text-xs text-red-600 mt-1 overflow-x-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Component Preview"
        />
        
        {/* Loading overlay */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Refreshing preview...</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {jsx && css ? 'JSX + CSS' : jsx ? 'JSX only' : css ? 'CSS only' : 'No component'}
          </span>
          <span>Click elements to edit properties</span>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;