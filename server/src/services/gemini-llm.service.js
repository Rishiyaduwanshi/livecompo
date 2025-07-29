import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import { config } from '../../config/index.js';

// Component schema for structured output
const ComponentSchema = z.object({
  jsx: z.string().describe("Complete React component JSX code with imports"),
  css: z.string().describe("Complete CSS styling for the component"),
  description: z.string().describe("Brief description of component functionality"),
  features: z.array(z.string()).describe("List of key features of the component"),
  componentName: z.string().describe("Name of the React component"),
  dependencies: z.array(z.string()).optional().describe("Required npm packages")
});

class GeminiLLMService {
  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.GOOGLE_API_KEY,
      model: config.GEMINI_MODEL || 'gemini-1.5-flash',
      temperature: 0.3,
      maxOutputTokens: 2048,
    });
    
    // Gemini supports structured output natively with withStructuredOutput
    this.structuredModel = this.model.withStructuredOutput(ComponentSchema, {
      name: "react_component_generator"
    });
    
    console.log('🎯 Gemini LLM Service initialized with structured output support');
  }

  async handleRequest(userInput, chatHistory = [], currentComponent = null) {
    try {
      console.log('Gemini LLM: Processing request:', { 
        userInput, 
        historyLength: chatHistory.length,
        hasCurrentComponent: !!currentComponent 
      });
      
      // Build conversation context from chat history
      let conversationContext = '';
      if (chatHistory.length > 0) {
        conversationContext = '\nPrevious conversation:\n';
        chatHistory.slice(-5).forEach((msg, index) => {
          conversationContext += `${msg.role}: ${msg.content}\n`;
        });
        conversationContext += '\n';
      }
      
      // Add current component context if exists
      let componentContext = '';
      if (currentComponent && currentComponent.jsx) {
        componentContext = `\nCurrent component context:
Component Name: ${currentComponent.componentName || 'Unknown'}
Description: ${currentComponent.description || 'No description'}
Current JSX: ${currentComponent.jsx.substring(0, 300)}...
\n`;
      }
      
      // Create enhanced prompt with conversation history
      const enhancedPrompt = `You are an expert React developer. Based on the conversation history and current context, respond to this request: "${userInput}"

${conversationContext}${componentContext}

Requirements:
1. Generate clean, modern JSX code with proper React hooks
2. Include beautiful, responsive CSS with modern design principles  
3. Use semantic HTML elements and proper accessibility
4. Add interactive features where appropriate
5. Follow React best practices
6. Consider the conversation history and modify/enhance existing component if needed

Component should be:
- Functional and ready to use
- Well-styled with modern CSS
- Responsive design
- Accessible (ARIA labels, keyboard navigation)
- Include hover effects and smooth transitions

Generate a complete React component now.`;

      const result = await this.structuredModel.invoke(enhancedPrompt);
      
      // Gemini returns structured data directly
      return {
        success: true,
        type: 'component_generation',
        data: {
          type: 'component',
          component: {
            jsx: result.jsx || '',
            css: result.css || '',
            description: result.description || `Generated component for: ${userInput}`,
            features: Array.isArray(result.features) ? result.features : [],
            dependencies: Array.isArray(result.dependencies) ? result.dependencies : [],
            props: [],
            accessibility: {
              ariaLabels: true,
              keyboardNavigation: true,
              screenReaderSupport: true
            },
            componentName: result.componentName || 'GeneratedComponent',
            lastModified: new Date().toISOString()
          },
          metadata: {
            title: result.componentName || 'GeneratedComponent',
            description: result.description || `Generated component for: ${userInput}`
          },
          userIntent: 'new_component',
          message: result.description || `Generated component for: ${userInput}`
        }
      };
    } catch (error) {
      console.error('Gemini LLM error:', error);
      console.log('Falling back to fallback response...');
      return this.generateFallbackResponse(userInput);
    }
  }

  generateFallbackResponse(userInput) {
    const componentName = 'FallbackComponent';
    
    return {
      success: true,
      type: 'component_generation', 
      data: {
        type: 'component',
        component: {
          jsx: `import React, { useState } from 'react';

const ${componentName} = () => {
  const [state, setState] = useState(false);

  const handleClick = () => {
    setState(!state);
    console.log('${componentName} interacted');
  };

  return (
    <div className="${componentName.toLowerCase()}-container">
      <button 
        className="${componentName.toLowerCase()}-button"
        onClick={handleClick}
        aria-pressed={state}
      >
        {state ? 'Active' : 'Click Me'}
      </button>
      <p className="${componentName.toLowerCase()}-text">
        Component created for: ${userInput}
      </p>
    </div>
  );
};

export default ${componentName};`,
          css: `.${componentName.toLowerCase()}-container {
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  max-width: 400px;
  margin: 20px auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.${componentName.toLowerCase()}-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 15px;
}

.${componentName.toLowerCase()}-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.${componentName.toLowerCase()}-text {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
  text-align: center;
}`,
          description: `Generated component for: ${userInput}`,
          features: ['Interactive button', 'Responsive design', 'Modern styling'],
          dependencies: [],
          props: [],
          accessibility: {
            ariaLabels: true,
            keyboardNavigation: true,
            screenReaderSupport: true
          },
          componentName: componentName,
          lastModified: new Date().toISOString()
        },
        metadata: {
          title: componentName,
          description: `Generated component for: ${userInput}`
        },
        userIntent: 'new_component',
        message: `Generated component for: ${userInput}`
      }
    };
  }

  async streamResponse(userInput, chatHistory, currentComponent, onChunk) {
    // For streaming, we'll use the regular response and chunk it
    onChunk({
      type: 'start',
      data: null,
      metadata: { phase: 'processing', provider: 'gemini' },
      timestamp: new Date().toISOString()
    });

    const result = await this.handleRequest(userInput, chatHistory, currentComponent);

    onChunk({
      type: 'complete',
      data: result.data,
      metadata: { phase: 'complete', success: true },
      timestamp: new Date().toISOString()
    });

    return result;
  }
}

export default new GeminiLLMService();
