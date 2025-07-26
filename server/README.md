# AccioJob Server

This is the backend server for the AccioJob application. It provides APIs for authentication, user management, and chat functionality with LLM integration.

## Features

- User authentication (register, login, refresh token, logout)
- User profile management (get, update, delete)
- Chat with LLM (send message, get conversation history)
- Error handling and logging
- Rate limiting

## Tech Stack

- Node.js
- Express.js
- LLM Integration (Ollama, OpenAI, HuggingFace)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v10 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Create a `.env.dev` file for development or `.env` for production based on the provided examples

### Running the Server

#### Development Mode

```
pnpm dev
```

#### Production Mode

```
pnpm pro
```

## API Endpoints

### Health Check
- `GET /api/v1/health` - Check if the server is running

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login a user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout a user

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/profile` - Delete user profile

### Chat
- `POST /api/v1/chat/message` - Send a message to the LLM
- `GET /api/v1/chat/history` - Get conversation history

## Environment Variables

- `PORT` - Server port
- `NODE_ENV` - Environment (development, production)
- `APP_URL` - Application URL
- `APP_NAME` - Application name
- `GLOBAL_RATE_LIMIT_MAX` - Global rate limit
- `PER_IP_RATE_LIMIT_MAX` - Per IP rate limit
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRY` - JWT expiry time
- `JWT_REFRESH_SECRET` - JWT refresh secret key
- `JWT_REFRESH_EXPIRY` - JWT refresh expiry time
- `MODEL_PROVIDER` - LLM provider (ollama, openai, huggingface)
- `OLLAMA_BASE_URL` - Ollama base URL
- `OLLAMA_LLM_MODEL` - Ollama model name
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - OpenAI model name
- `HUGGINGFACE_API_KEY` - HuggingFace API key
- `LLM_MODEL` - HuggingFace model name