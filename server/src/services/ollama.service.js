import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import llm from './llm.service.js';
import { AppError } from '../utils/appError.js';

class OllamaCompatibleLLMService {
  constructor() {
    this.llm = llm;
  }

  async handleRequest(userInput, chatHistory, currentComponent = null) {
    try {
      console.log('Ollama LLM: Processing request:', userInput);
      
      const prompt = this.createComponentPrompt(userInput, chatHistory, currentComponent);
      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      
      // Parse the raw response and extract code
      const parsedResponse = this.parseResponse(response.content, userInput);
      
      return {
        success: true,
        type: 'component_generation',
        data: parsedResponse
      };
    } catch (error) {
      console.error('Ollama LLM error:', error);
      throw new AppError({message: `Failed to generate component: ${error.message}`});
    }
  }

  createComponentPrompt(userInput, chatHistory, currentComponent) {
    const hasExistingComponent = currentComponent && (currentComponent.jsx || currentComponent.css);
    
    let prompt = `You are an expert React developer. Generate a complete React component based on this request: "${userInput}"

REQUIREMENTS:
1. Create a functional React component using modern hooks
2. Include complete JSX code with proper imports
3. Include complete CSS with modern styling
4. Make it responsive and accessible
5. Add proper state management if needed

RESPONSE FORMAT:
Please provide the response in this exact format:

=== JSX START ===
[Complete React component code here]
=== JSX END ===

=== CSS START ===
[Complete CSS styling here]
=== CSS END ===

=== DESCRIPTION START ===
[Brief description of the component]
=== DESCRIPTION END ===

=== FEATURES START ===
[List of key features, one per line]
=== FEATURES END ===`;

    if (hasExistingComponent) {
      prompt += `

EXISTING COMPONENT:
JSX: ${currentComponent.jsx}
CSS: ${currentComponent.css}

Please modify or enhance the existing component based on the user request.`;
    }

    if (chatHistory && chatHistory.length > 0) {
      prompt += `

CONVERSATION HISTORY:
${chatHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
    }

    return prompt;
  }

  parseResponse(content, userInput) {
    try {
      // Extract JSX
      const jsxMatch = content.match(/=== JSX START ===([\s\S]*?)=== JSX END ===/);
      let jsx = jsxMatch ? jsxMatch[1].trim() : this.generateFallbackJSX(userInput);
      
      // Clean up JSX - remove markdown code blocks
      jsx = jsx.replace(/```jsx\n?/g, '').replace(/```\n?/g, '').trim();

      // Extract CSS  
      const cssMatch = content.match(/=== CSS START ===([\s\S]*?)=== CSS END ===/);
      let css = cssMatch ? cssMatch[1].trim() : this.generateFallbackCSS(userInput);
      
      // Clean up CSS - remove markdown code blocks
      css = css.replace(/```css\n?/g, '').replace(/```\n?/g, '').trim();

      // Extract description
      const descMatch = content.match(/=== DESCRIPTION START ===([\s\S]*?)=== DESCRIPTION END ===/);
      const description = descMatch ? descMatch[1].trim() : `Component generated for: ${userInput}`;

      // Extract features
      const featuresMatch = content.match(/=== FEATURES START ===([\s\S]*?)=== FEATURES END ===/);
      const featuresText = featuresMatch ? featuresMatch[1].trim() : '';
      const features = featuresText ? featuresText.split('\n').map(f => f.trim()).filter(f => f) : [];

      return {
        type: 'component',
        component: {
          jsx,
          css,
          description,
          features,
          dependencies: [],
          props: [],
          accessibility: {
            ariaLabels: true,
            keyboardNavigation: true,
            screenReaderSupport: true
          }
        },
        metadata: {
          title: this.extractComponentName(jsx) || 'GeneratedComponent',
          description
        },
        userIntent: 'new_component',
        message: description
      };
    } catch (error) {
      console.error('Parse error:', error);
      return this.getFallbackResponse(userInput);
    }
  }

  extractComponentName(jsx) {
    const match = jsx.match(/const\s+(\w+)\s*=|function\s+(\w+)\s*\(/);
    return match ? (match[1] || match[2]) : null;
  }

  generateFallbackJSX(userInput) {
    const componentName = this.generateComponentName(userInput);
    
    return `import React, { useState } from 'react';

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

export default ${componentName};`;
  }

  generateFallbackCSS(userInput) {
    return `.component-container {
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  max-width: 400px;
  margin: 20px auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.component-button {
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

.component-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.component-button:active {
  transform: translateY(0);
}

.component-text {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
  text-align: center;
}`;
  }

  generateComponentName(userInput) {
    const words = userInput.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 2);
    
    if (words.length === 0) return 'CustomComponent';
    
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Component';
  }

  getFallbackResponse(userInput) {
    return {
      type: 'component',
      component: {
        jsx: this.generateFallbackJSX(userInput),
        css: this.generateFallbackCSS(userInput),
        description: `Generated component for: ${userInput}`,
        features: ['Interactive button', 'Responsive design', 'Modern styling'],
        dependencies: [],
        props: [],
        accessibility: {}
      },
      metadata: {
        title: 'FallbackComponent',
        description: `Generated component for: ${userInput}`
      },
      userIntent: 'new_component',
      message: `Generated a fallback component for: ${userInput}`
    };
  }

  async streamRequest(userInput, chatHistory, currentComponent, onChunk) {
    console.log('Ollama LLM: Streaming request:', userInput);
    
    onChunk({
      type: 'context',
      data: { action: 'generating_component', intent: 'new_component' },
      timestamp: new Date().toISOString()
    });

    const message = 'Generating component with Ollama...';
    for (let i = 0; i < message.length; i += 3) {
      await new Promise(resolve => setTimeout(resolve, 100));
      onChunk({
        type: 'chunk',
        content: message.slice(i, i + 3),
        metadata: { phase: 'generation' },
        timestamp: new Date().toISOString()
      });
    }

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

export default new OllamaCompatibleLLMService();
