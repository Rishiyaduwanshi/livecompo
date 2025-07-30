# LiveCompo – AI React Component Generator

LiveCompo is a full-stack, production-grade platform to generate, edit, and preview React components with the help of AI. It features a modern Next.js frontend and a Node.js/Express backend with support for multiple LLM providers (Gemini, Ollama, OpenAI).

---

## Features

- **AI-powered React component generation** (JSX + CSS)
- **Live in-browser editing & preview** (Sandpack)
- **Copy & Download**: Easily copy code or download as ZIP
- **Session management**: Save, load, and auto-save chat/code sessions
- **Property editor**: Tweak styles and properties visually
- **Modern, responsive UI**: Built with TailwindCSS, Lucide icons
- **Authentication**: JWT-based login/register
- **Multiple LLM providers**: Gemini, Ollama, OpenAI (configurable)
- **Production-ready backend**: MongoDB, rate limiting, error logging

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, Zustand, Sandpack, TailwindCSS
- **Backend**: Node.js, Express, MongoDB, JWT, LangChain, LLM APIs
- **Other**: JSZip, Lucide React, modern SVG icons

---

## Getting Started

### 1. Clone the repo
```sh
git clone https://github.com/rishiyaduwanshi/livecompo.git .
```

### 2. Install dependencies
#### Client
```sh
cd client
pnpm install
```
#### Server
```sh
cd ../server
pnpm install
```

### 3. Configure environment variables
- Copy `.env.eg` to `.env.dev` in `server/` and fill in your API keys and DB info.
- For local dev, you can use the provided defaults for MongoDB and Ollama.

### 4. Start the app
#### Start backend (from `server/`):
```sh
pnpm dev
```
#### Start frontend (from `client/`):
```sh
pnpm dev
```

- Client runs on [http://localhost:3000](http://localhost:3000)
- Server runs on [http://localhost:4040](http://localhost:4040)

---

## LLM Provider Setup
- **Gemini**: Set `MODEL_PROVIDER=gemini` and add your Gemini API key.
- **Ollama**: Set `MODEL_PROVIDER=ollama` and run Ollama locally (see [Ollama docs](https://ollama.com/)).
- **OpenAI**: Set `MODEL_PROVIDER=openai` and add your OpenAI API key.

---

## Folder Structure

```
client/   # Next.js frontend (React, Sandpack, Zustand, Tailwind)
server/   # Node.js backend (Express, MongoDB, LLM integration)
```

---

## Key Scripts

- `pnpm dev` – Start dev server (client or server)
- `pnpm pro` – Start server in production mode

---

## Contributing
PRs and issues welcome! Please open an issue for bugs or feature requests.

---

## License
MIT

---

## Credits
- [Sandpack](https://sandpack.dev/) for live code editing/preview
- [LangChain](https://js.langchain.com/) for LLM integration
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons

---

## Author
[Rishi Yaduwanshi](https://github.com/rishiyaduwanshi)
