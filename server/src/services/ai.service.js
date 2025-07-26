import { ChatOpenAI } from '@langchain/openai';
import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { config } from '../../config/index.js';

class AIService {
  constructor() {
    this.model = this.initializeModel();
    this.outputParser = new StringOutputParser();
  }

  initializeModel() {
    switch (config.MODEL_PROVIDER) {
      case 'openai':
        return new ChatOpenAI({
          openAIApiKey: config.OPENAI_API_KEY,
          modelName: config.OPENAI_MODEL,
          temperature: 0.7,
        });
      
      case 'huggingface':
        return new HuggingFaceInference({
          apiKey: config.HUGGINGFACE_API_KEY,
          model: config.LLM_MODEL,
        });
      
      case 'ollama':
      default:
        return new ChatOllama({
          baseUrl: config.OLLAMA_BASE_URL,
          model: config.OLLAMA_LLM_MODEL,
        });
    }
  }

  async generateComponent(prompt) {
    const componentPrompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are an expert React component generator. Generate clean, reusable, and accessible components.'],
      ['user', '{input}']
    ]);

    const chain = componentPrompt.pipe(this.model).pipe(this.outputParser);

    try {
      const response = await chain.invoke({
        input: prompt
      });

      // Parse the response to extract JSX and CSS
      const [jsx, css] = this.parseComponentResponse(response);

      return {
        jsx,
        css
      };
    } catch (error) {
      throw new Error(`Failed to generate component: ${error.message}`);
    }
  }

  parseComponentResponse(response) {
    // Default empty values
    let jsx = '';
    let css = '';

    // Try to extract JSX code between ```jsx and ``` markers
    const jsxMatch = response.match(/```jsx\n([\s\S]*?)```/);
    if (jsxMatch && jsxMatch[1]) {
      jsx = jsxMatch[1].trim();
    }

    // Try to extract CSS code between ```css and ``` markers
    const cssMatch = response.match(/```css\n([\s\S]*?)```/);
    if (cssMatch && cssMatch[1]) {
      css = cssMatch[1].trim();
    }

    return [jsx, css];
  }

  async chatCompletion(messages) {
    const chatPrompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a helpful AI assistant that helps users create React components.'],
      ...messages.map(msg => [msg.role, msg.content])
    ]);

    const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

    try {
      const response = await chain.invoke({
        input: messages[messages.length - 1].content
      });

      return response;
    } catch (error) {
      throw new Error(`Chat completion failed: ${error.message}`);
    }
  }
}

export default new AIService();