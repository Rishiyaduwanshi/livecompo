import { config } from '../../config/index.js';
import { AppError } from '../utils/appError.js';

const {
  MODEL_PROVIDER,
  LLM_MODEL, 
  OLLAMA_BASE_URL,
  OLLAMA_LLM_MODEL,
  HUGGINGFACE_API_KEY,
  OPENAI_API_KEY,
  OPENAI_MODEL,
} = config;

let llm;

try {
  switch (MODEL_PROVIDER) {
    case 'ollama': {
      const { ChatOllama } = await import('@langchain/ollama');
      llm = new ChatOllama({
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_LLM_MODEL,
      });
      break;
    }

    case 'huggingface': {
      const { HuggingFaceInference } = await import('@langchain/community/llms/huggingface_inference');
      llm = new HuggingFaceInference({
        model: LLM_MODEL,
        apiKey: HUGGINGFACE_API_KEY,
      });
      break;
    }

    case 'openai': {
      const { ChatOpenAI } = await import('@langchain/openai');
      llm = new ChatOpenAI({
        modelName: OPENAI_MODEL,
        openAIApiKey: OPENAI_API_KEY,
      });
      break;
    }

    default:
      throw new AppError({ message: `Unsupported MODEL_PROVIDER: ${MODEL_PROVIDER}` });
  }
} catch (error) {
  throw new AppError({ message: `LLM load failed: ${error.message}` });
}

export default llm;
