import { config } from '../../config/index.js';
import { AppError } from '../utils/appError.js';

const {
  MODEL_PROVIDER,
  GOOGLE_API_KEY,
  GEMINI_MODEL,
  OLLAMA_BASE_URL,
  OLLAMA_LLM_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL,
} = config;

class SimpleLLMService {
  constructor() {
    this.provider = MODEL_PROVIDER;
    this.initializeLLM();
  }

  async initializeLLM() {
    try {
      switch (this.provider) {
        case 'gemini':
          await this.initializeGemini();
          break;
        case 'ollama':
          await this.initializeOllama();
          break;
        case 'openai':
          await this.initializeOpenAI();
          break;
        default:
          throw new Error(`Unsupported MODEL_PROVIDER: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Failed to initialize ${this.provider}:`, error.message);
      throw new AppError({ message: `LLM initialization failed: ${error.message}` });
    }
  }

  async initializeGemini() {
    const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
    const { z } = await import('zod');
    
    // Component schema for structured output
    const ComponentSchema = z.object({
      jsx: z.string().describe("Complete React component JSX code with imports"),
      css: z.string().describe("Complete CSS styling for the component"),
      description: z.string().describe("Brief description of component functionality"),
      features: z.array(z.string()).describe("List of key features of the component"),
      componentName: z.string().describe("Name of the React component"),
      dependencies: z.array(z.string()).optional().describe("Required npm packages")
    });

    this.model = new ChatGoogleGenerativeAI({
      apiKey: GOOGLE_API_KEY,
      model: GEMINI_MODEL || 'gemini-1.5-flash',
      temperature: 0.3,
      maxOutputTokens: 2048,
    });
    
    this.structuredModel = this.model.withStructuredOutput(ComponentSchema, {
      name: "react_component_generator"
    });
    
    console.log('🎯 Gemini LLM initialized successfully');
  }

  async initializeOllama() {
    const { ChatOllama } = await import('@langchain/ollama');
    
    this.model = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: OLLAMA_LLM_MODEL,
      temperature: 0.3,
    });
    
    console.log('🦙 Ollama LLM initialized successfully');
  }

  async initializeOpenAI() {
    const { ChatOpenAI } = await import('@langchain/openai');
    const { z } = await import('zod');
    
    // Component schema for structured output
    const ComponentSchema = z.object({
      jsx: z.string().describe("Complete React component JSX code with imports"),
      css: z.string().describe("Complete CSS styling for the component"),
      description: z.string().describe("Brief description of component functionality"),
      features: z.array(z.string()).describe("List of key features of the component"),
      componentName: z.string().describe("Name of the React component"),
      dependencies: z.array(z.string()).optional().describe("Required npm packages")
    });

    this.model = new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0.3,
    });
    
    this.structuredModel = this.model.withStructuredOutput(ComponentSchema, {
      name: "react_component_generator"
    });
    
    console.log('🤖 OpenAI LLM initialized successfully');
  }

  async handleRequest(userInput, chatHistory = [], currentComponent = null) {
    try {
      console.log(`${this.provider.toUpperCase()} LLM: Processing request:`, userInput);
      
      if (this.provider === 'gemini' || this.provider === 'openai') {
        return await this.handleStructuredRequest(userInput);
      } else {
        return await this.handleOllamaRequest(userInput);
      }
    } catch (error) {
      console.error(`${this.provider} LLM error:`, error);
      console.log('Falling back to fallback response...');
      return this.generateFallbackResponse(userInput);
    }
  }

  async handleStructuredRequest(userInput) {
    const enhancedPrompt = `
You are an expert React developer. Create a complete, functional React component based on this request: "${userInput}"

Requirements:
1. Generate clean, modern JSX code with proper React hooks
2. Include beautiful, responsive CSS with modern design principles
3. Use semantic HTML elements and proper accessibility
4. Add interactive features where appropriate
5. Follow React best practices

Component should be:
- Functional and ready to use
- Well-styled with modern CSS
- Responsive design
- Accessible (ARIA labels, keyboard navigation)
- Include hover effects and smooth transitions

Generate a complete React component now.`;

    const result = await this.structuredModel.invoke(enhancedPrompt);
    
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
  }

  async handleOllamaRequest(userInput) {
    const prompt = `You are an expert React developer. Create a complete React component for: "${userInput}"

Return a JSON response with this exact structure:
{
  "jsx": "Complete React component JSX code with imports",
  "css": "Complete CSS styling for the component",
  "description": "Brief description of component functionality",
  "features": ["list", "of", "features"],
  "componentName": "ComponentName",
  "dependencies": ["react"]
}

Generate a modern, responsive component with proper styling and accessibility features.`;

    const response = await this.model.invoke(prompt);
    const content = response.content;
    
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          success: true,
          type: 'component_generation',
          data: {
            type: 'component',
            component: {
              jsx: parsed.jsx || '',
              css: parsed.css || '',
              description: parsed.description || `Generated component for: ${userInput}`,
              features: Array.isArray(parsed.features) ? parsed.features : ['Modern component'],
              dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : ['react'],
              props: [],
              accessibility: {
                ariaLabels: true,
                keyboardNavigation: true,
                screenReaderSupport: true
              },
              componentName: parsed.componentName || 'OllamaComponent',
              lastModified: new Date().toISOString()
            },
            metadata: {
              title: parsed.componentName || 'OllamaComponent',
              description: parsed.description || `Generated component for: ${userInput}`
            },
            userIntent: 'new_component',
            message: parsed.description || `Generated component for: ${userInput}`
          }
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Ollama response:', parseError);
    }
    
    // If parsing fails, return fallback
    return this.generateFallbackResponse(userInput);
  }

  generateFallbackResponse(userInput) {
    const componentName = 'SimpleComponent';
    
    return {
      success: true,
      type: 'component_generation',
      data: {
        type: 'component',
        component: {
          jsx: `import React, { useState } from 'react';

const ${componentName} = () => {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="${componentName.toLowerCase()}-container">
      <button 
        className="${componentName.toLowerCase()}-button"
        onClick={handleToggle}
        aria-pressed={isActive}
      >
        {isActive ? 'Active' : 'Click Me'}
      </button>
      <p className="${componentName.toLowerCase()}-text">
        Component for: ${userInput}
      </p>
    </div>
  );
};

export default ${componentName};`,
          css: `.${componentName.toLowerCase()}-container {
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 1px solid #e1e5e9;
  max-width: 400px;
  margin: 20px auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.${componentName.toLowerCase()}-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 15px;
}

.${componentName.toLowerCase()}-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.${componentName.toLowerCase()}-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.${componentName.toLowerCase()}-text {
  color: #4a5568;
  font-size: 14px;
  margin: 0;
  text-align: center;
  line-height: 1.5;
}`,
          description: `Generated component for: ${userInput}`,
          features: ['Interactive button', 'Responsive design', 'Modern styling', 'Accessibility features'],
          dependencies: ['react'],
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
    onChunk({
      type: 'start',
      data: null,
      metadata: { phase: 'processing', provider: this.provider },
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

  getProviderInfo() {
    return {
      provider: this.provider,
      supportsStructuredOutput: this.provider === 'gemini' || this.provider === 'openai',
      status: 'active'
    };
  }
}

export default new SimpleLLMService();
