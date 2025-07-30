'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Palette, 
  Type, 
  Move, 
  Square, 
  Circle,
  Sliders,
  Send
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';

const PropertyEditor = () => {
  const { 
    selectedElement, 
    closePropertyPanel, 
    updateComponent,
    sendMessage,
    generatedComponent 
  } = useSessionStore();

  const [properties, setProperties] = useState({
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '16',
    padding: '8',
    margin: '0',
    borderRadius: '4',
    borderWidth: '0',
    borderColor: '#000000',
    width: 'auto',
    height: 'auto',
    textAlign: 'left',
    fontWeight: 'normal',
    textContent: ''
  });

  const [chatPrompt, setChatPrompt] = useState('');

  useEffect(() => {
    if (selectedElement) {
      // Extract current styles from selected element
      const styles = selectedElement.styles;
      if (styles) {
        setProperties({
          backgroundColor: rgbToHex(styles.backgroundColor) || '#ffffff',
          color: rgbToHex(styles.color) || '#000000',
          fontSize: parseInt(styles.fontSize) || 16,
          padding: parseInt(styles.padding) || 8,
          margin: parseInt(styles.margin) || 0,
          borderRadius: parseInt(styles.borderRadius) || 4,
          borderWidth: parseInt(styles.borderWidth) || 0,
          borderColor: rgbToHex(styles.borderColor) || '#000000',
          width: styles.width === 'auto' ? 'auto' : parseInt(styles.width) || 'auto',
          height: styles.height === 'auto' ? 'auto' : parseInt(styles.height) || 'auto',
          textAlign: styles.textAlign || 'left',
          fontWeight: styles.fontWeight || 'normal',
          textContent: selectedElement.textContent || ''
        });
      }
    }
  }, [selectedElement]);

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
    
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#ffffff';
    
    const [r, g, b] = match.map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const handlePropertyChange = (property, value) => {
    setProperties(prev => ({ ...prev, [property]: value }));
    applyChangesToComponent(property, value);
  };

  const applyChangesToComponent = (property, value) => {
    if (!selectedElement || !generatedComponent.jsx) return;

    // This is a simplified implementation
    // In a real app, you'd want to parse the JSX and update the specific element
    const updatedCSS = updateCSSWithNewProperty(
      generatedComponent.css,
      selectedElement.className,
      property,
      value
    );

    updateComponent(undefined, updatedCSS);
  };

  const updateCSSWithNewProperty = (css, className, property, value) => {
    const cssProperty = camelCaseToKebabCase(property);
    let cssValue = value;

    // Format value based on property type
    switch (property) {
      case 'fontSize':
      case 'padding':
      case 'margin':
      case 'borderRadius':
      case 'borderWidth':
        cssValue = `${value}px`;
        break;
      case 'width':
      case 'height':
        cssValue = value === 'auto' ? 'auto' : `${value}px`;
        break;
    }

    if (!css) {
      return `.${className} {\n  ${cssProperty}: ${cssValue};\n}`;
    }

    // Try to find existing rule for this class
    const classRule = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
    const match = classRule.exec(css);

    if (match) {
      const existingProperties = match[1];
      const propertyRegex = new RegExp(`${cssProperty}\\s*:[^;]*;?`, 'g');
      
      let updatedProperties;
      if (propertyRegex.test(existingProperties)) {
        // Update existing property
        updatedProperties = existingProperties.replace(
          propertyRegex,
          `${cssProperty}: ${cssValue};`
        );
      } else {
        // Add new property
        updatedProperties = existingProperties.trim() + `\n  ${cssProperty}: ${cssValue};`;
      }

      return css.replace(match[0], `.${className} {${updatedProperties}\n}`);
    } else {
      // Add new CSS rule
      return css + `\n\n.${className} {\n  ${cssProperty}: ${cssValue};\n}`;
    }
  };

  const camelCaseToKebabCase = (str) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  };

  const handleChatSubmit = async () => {
    if (!chatPrompt.trim() || !selectedElement) return;

    const contextualPrompt = `Update the ${selectedElement.tagName.toLowerCase()} element with className "${selectedElement.className}" to: ${chatPrompt}`;
    
    try {
      await sendMessage(contextualPrompt, true, selectedElement);
      setChatPrompt('');
    } catch (error) {
      console.error('Failed to send contextual message:', error);
    }
  };

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <Square className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
          <p className="text-sm">Click on an element in the preview to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Element Properties</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedElement.tagName.toLowerCase()}
              {selectedElement.className && `.${selectedElement.className}`}
            </p>
          </div>
          <button
            onClick={closePropertyPanel}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Colors */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Palette className="h-4 w-4 text-gray-600" />
            <h4 className="text-xs font-medium text-gray-900">Colors</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Background
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={properties.backgroundColor}
                  onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  className="w-6 h-6 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={properties.backgroundColor}
                  onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  className="flex-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={properties.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="w-6 h-6 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={properties.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="flex-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Typography */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Type className="h-4 w-4 text-gray-600" />
            <h4 className="text-xs font-medium text-gray-900">Typography</h4>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Font Size ({properties.fontSize}px)
              </label>
              <input
                type="range"
                min="8"
                max="72"
                value={properties.fontSize}
                onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Font Weight
              </label>
              <select
                value={properties.fontWeight}
                onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Light</option>
                <option value="100">100</option>
                <option value="400">400</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="900">900</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Text Align
              </label>
              <select
                value={properties.textAlign}
                onChange={(e) => handlePropertyChange('textAlign', e.target.value)}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
          </div>
        </div>
        {/* Spacing */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Move className="h-4 w-4 text-gray-600" />
            <h4 className="text-xs font-medium text-gray-900">Spacing</h4>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Padding ({properties.padding}px)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={properties.padding}
                onChange={(e) => handlePropertyChange('padding', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Margin ({properties.margin}px)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={properties.margin}
                onChange={(e) => handlePropertyChange('margin', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        {/* Border */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Square className="h-4 w-4 text-gray-600" />
            <h4 className="text-xs font-medium text-gray-900">Border</h4>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Border Radius ({properties.borderRadius}px)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={properties.borderRadius}
                onChange={(e) => handlePropertyChange('borderRadius', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Border Width ({properties.borderWidth}px)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={properties.borderWidth}
                onChange={(e) => handlePropertyChange('borderWidth', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Border Color
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={properties.borderColor}
                  onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                  className="w-6 h-6 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={properties.borderColor}
                  onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                  className="flex-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* AI Chat for Element */}
      <div className="border-t border-gray-200 p-2">
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-900">AI Modifications</span>
          </div>
          <div className="flex space-x-1">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleChatSubmit();
                }
              }}
              placeholder="Modify this element..."
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatPrompt.trim()}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-500">
            Example: "Make this button larger with a blue gradient"
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyEditor;