import { AppError } from "..src/utils/appError.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, 'package.json');
const packageJsonData = readFileSync(packageJsonPath, 'utf-8');
const { version } = JSON.parse(packageJsonData);


const DEFAULT_PORT = process.env.PORT ?? 4040;

// ====== App Config ======
const appConfig = {
    PORT: DEFAULT_PORT,
    NODE_ENV: process.env.NODE_ENV ?? 'production',
    APP_URL: process.env.APP_URL ?? `http://localhost:${DEFAULT_PORT}`,
    APP_NAME: process.env.APP_NAME ?? 'accioJob',
    version: version
};

// ====== JWT Config ======
const jwtConfig = {
    JWT_SECRET: process.env.JWT_SECRET ?? 'secret',
    JWT_EXPIRY: process.env.JWT_EXPIRY ?? '1d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'secret',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY ?? '7d',
};

// ====== LLM Config ======
const llmConfig = {
    MODEL_PROVIDER: process.env.MODEL_PROVIDER ?? 'ollama',
    
    // Hugging Face Config
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY ?? '',
    LLM_MODEL: process.env.LLM_MODEL ?? 'microsoft/DialoGPT-medium',
    
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    OLLAMA_LLM_MODEL: process.env.OLLAMA_LLM_MODEL ?? 'llama3.2:latest',
    
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo',
};

// ====== Rate Limiting Config ======
const rateLimitConfig = {
    GLOBAL_RATE_LIMIT_CONFIG: {
        windowMs: 60 * 1000,
        max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '100'),
        keyGenerator: () => 'global',
        handler: (_, __) => {
            throw new AppError({
                message: 'Too many requests, please try again later.',
                statusCode: 429,
            });
        },
    },
    PER_IP_RATE_LIMIT_CONFIG: {
        windowMs: 60 * 1000,
        max: parseInt(process.env.PER_IP_RATE_LIMIT_MAX ?? '') || 10,
        handler: (_, __) => {
            throw new AppError({
                message: 'Too many requests from this IP, please try again later.',
                statusCode: 429,
            });
        },
    },
};

export const config = Object.freeze({
    ...appConfig,
    ...jwtConfig,
    ...llmConfig,
    ...rateLimitConfig,
});
