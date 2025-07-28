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

let llm;

try {
  switch (MODEL_PROVIDER) {
    case 'gemini': {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      llm = new ChatGoogleGenerativeAI({
        apiKey: GOOGLE_API_KEY,
        model: GEMINI_MODEL || 'gemini-1.5-flash',
        temperature: 0.3,
        maxOutputTokens: 2048,
      });
      console.log('🎯 Gemini LLM initialized successfully');
      break;
    }

    case 'ollama': {
      const { ChatOllama } = await import('@langchain/ollama');
      llm = new ChatOllama({
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_LLM_MODEL,
        temperature: 0.3,
      });
      console.log('🦙 Ollama LLM initialized successfully');
      break;
    }

    case 'openai': {
      const { ChatOpenAI } = await import('@langchain/openai');
      llm = new ChatOpenAI({
        apiKey: OPENAI_API_KEY,
        model: OPENAI_MODEL || 'gpt-3.5-turbo',
        temperature: 0.3,
      });
      console.log('🤖 OpenAI LLM initialized successfully');
      break;
    }

    default:
      throw new Error(`Unsupported MODEL_PROVIDER: ${MODEL_PROVIDER}`);
  }
} catch (error) {
  throw new AppError({ message: `LLM load failed: ${error.message}` });
}

export default llm;
