# Hacker Reign

A Next.js-powered chat application with local LLM integration via Ollama, featuring voice interaction, advanced tool support, persistent conversation memory, and semantic search capabilities.

## Features

### Core Capabilities
- **Local LLM Integration**: Connects to Ollama for private, on-device AI chat
- **Voice Interaction**: Hands-free speech-to-text and text-to-speech using Web Speech API
- **Tool Support**: Built-in tools for weather queries, calculations (mathjs), and safe code execution (vm2 sandbox)
- **Streaming Responses**: Real-time streaming for fast, responsive chat experience
- **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4

### Voice Interaction System
- **Speech-to-Text**: Real-time voice input using Web Speech API
- **Text-to-Speech**: Natural voice output with browser-based synthesis
- **Push-to-Talk**: Hold spacebar or click the orb to speak
- **Audio Visualization**: Real-time audio level monitoring with animated orb
- **Beat Detection**: Audio-reactive animations responding to speech emphasis
- **No Dependencies**: Built entirely on native browser APIs

### Memory & RAG System
- **Persistent Conversations**: SQLite-based storage for conversation history and messages
- **Semantic Search**: Find relevant past conversations using vector similarity search
- **Vector Embeddings**: Ollama integration for generating message embeddings
- **ChromaDB Integration**: Efficient vector database for RAG (Retrieval-Augmented Generation)
- **Analytics Tracking**: Monitor search performance and retrieval metrics

### Reliability
- **Timeout Protection**: 30-second fetch timeouts prevent indefinite hanging
- **Comprehensive Logging**: Detailed request/response logging for debugging
- **Error Handling**: Robust error management with detailed stack traces

## Prerequisites

1. **Ollama**: Install and run Ollama locally
   ```bash
   # Install Ollama (macOS)
   brew install ollama

   # Start Ollama service
   ollama serve

   # Pull a model (example: qwen2.5-coder)
   ollama pull qwen2.5-coder:7b-instruct-q5_K_M

   # Pull an embedding model for RAG (optional)
   ollama pull nomic-embed-text
   ```

2. **Node.js**: Version 20 or higher recommended

3. **Modern Browser** (for voice features):
   - Chrome, Edge, or Safari with Web Speech API support
   - Microphone access for speech-to-text

4. **ChromaDB** (Optional for RAG features):
   - The chromadb npm package is included in dependencies
   - For persistent vector storage, you can optionally run a ChromaDB server
   - See [ChromaDB docs](https://docs.trychroma.com/) for server setup

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Start chatting:**
   - Type messages or use voice input (hold spacebar to speak)
   - The app auto-updates as you edit files
   - Try asking for weather, calculations, or code examples!

## Voice Interaction

The application features a complete voice interaction system with no external dependencies:

### Features
- **Speech-to-Text**: Uses Web Speech API for real-time voice recognition
  - Hold **SPACEBAR** to activate push-to-talk
  - Or **click the animated orb** to start listening
  - Continuous and interim transcript support
  - Automatic silence detection

- **Text-to-Speech**: Browser-based speech synthesis
  - Automatic voice output for AI responses
  - Customizable voice selection
  - Real-time frequency analysis for visualization

- **Voice Orb Visualization**:
  - **Red pulsing**: Listening to your voice
  - **Cyan pulsing**: AI is speaking
  - **Teal idle**: Ready for input
  - Audio-reactive animations with beat detection

### Components
Located in `app/lib/voice/`:
- **useVoiceInput.ts**: Speech-to-text React hook
- **useVoiceOutput.ts**: Text-to-speech React hook
- **audioAnalyzer.ts**: Real-time audio analysis and FFT processing
- **VoiceOrb.tsx**: Canvas-based visualization component

### Browser Compatibility
- **Chrome/Edge**: Full support (recommended)
- **Safari**: Full support on macOS/iOS
- **Firefox**: Limited Web Speech API support

## Available Tools

The LLM has access to the following tools:

- **get_weather**: Get current weather for a city (mock data)
- **calculator**: Perform math operations using mathjs
- **code_exec**: Execute safe code snippets in a vm2 sandbox

## Memory System

The application includes a comprehensive memory and RAG system located in `app/lib/memory/`:

### Storage Layer (`storage/`)
- **SQLite Database**: Persistent storage for conversations and messages
- **Singleton Pattern**: Single database connection across the app
- **Schema Migrations**: Version-controlled database schema in `migrations/`

### RAG Layer (`rag/`)
- **Embeddings**: Generate vector embeddings using Ollama (`embeddings.ts`)
- **Retrieval**: Semantic search over conversations using ChromaDB (`retrieval.ts`)
- **Vector Storage**: ChromaDB for efficient similarity search

### Key Features
- Store and retrieve conversation history
- Semantic search to find relevant past messages
- Analytics tracking for search performance
- Batch operations for efficient embedding generation

### Configuration
Environment variables (add to `.env.local`):
```bash
# SQLite database path (default: ./.data/hackerreign.db)
MEMORY_DB_PATH=./.data/hackerreign.db

# ChromaDB path (default: ./.data/chroma)
CHROMA_DB_PATH=./.data/chroma

# Ollama API endpoint (default: http://localhost:11434)
OLLAMA_API_URL=http://localhost:11434

# Embedding model (default: nomic-embed-text)
EMBEDDING_MODEL=nomic-embed-text
```

For detailed integration instructions, see `app/lib/memory/INTEGRATION_GUIDE.md`

## Project Structure

See [STRUCTURE.md](STRUCTURE.md) for detailed project organization.

## Troubleshooting

### LLM Request Timeout
If you see "Headers Timeout Error" or requests taking too long:
1. Check if Ollama is running: `ollama list`
2. Verify the service is accessible: `curl http://localhost:11434/v1/models`
3. Check logs for tool execution issues - the app now has comprehensive logging
4. Requests now timeout after 30 seconds with clear error messages

### Tool Execution Errors
If tools aren't working:
1. Verify dependencies are installed: `npm list mathjs vm2`
2. Check console logs for `[Tool Executor]` messages
3. Review the tool handler mapping in `app/lib/tools/executor.ts`

### Memory System Issues
If the memory/RAG system isn't working:
1. Verify dependencies: `npm list better-sqlite3 chromadb`
2. Check database path exists: `mkdir -p .data`
3. Ensure Ollama is running with embedding model: `ollama pull nomic-embed-text`
4. Check console logs for `[ChromaRetrieval]` and `[SQLiteStorage]` messages
5. Review initialization in `app/lib/memory/INTEGRATION_GUIDE.md`

### Voice System Issues
If voice features aren't working:
1. **Microphone Permission**: Grant microphone access when prompted
2. **Browser Support**: Use Chrome, Edge, or Safari (Firefox has limited support)
3. **HTTPS Required**: Web Speech API requires HTTPS in production (localhost works)
4. **Check Console**: Look for Web Speech API error messages
5. **Test Audio**: Verify system microphone and speakers are working

## Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript types
```

## Recent Updates

### Voice Interaction System (v1.2.0)
- **Speech-to-Text**: Web Speech API integration with push-to-talk (spacebar)
- **Text-to-Speech**: Browser-based synthesis with voice selection
- **Audio Visualization**: Real-time frequency analysis and beat detection
- **Voice Orb Component**: Canvas-based animated orb with state-aware colors
- **API Endpoints**: Placeholder routes for future server-side STT/TTS integration
- **Zero Dependencies**: Built entirely on native browser APIs

### Memory & RAG System (v1.1.0)
- **SQLite Storage**: Persistent conversation and message storage
- **Vector Embeddings**: Ollama integration for semantic search
- **ChromaDB Integration**: Efficient vector similarity search
- **Analytics**: Search query tracking and performance metrics
- **Dependencies Added**: `better-sqlite3`, `chromadb`, and TypeScript types

### API Improvements
- **Timeout Protection**: 30-second AbortController on all fetch requests
- **Tool Handler Mapping**: Fixed dynamic imports with explicit name mapping
- **Enhanced Logging**: Request lifecycle tracking with timestamps
- **Error Handling**: Detailed error messages with duration and stack traces
- **Loop Protection**: Max 5 tool iterations to prevent infinite loops

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

## License

MIT
