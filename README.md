# Hacker Reign

A Next.js-powered chat application with local LLM integration via Ollama, featuring domain-aware context detection, voice interaction with Piper TTS, advanced tool support, persistent conversation memory, and semantic search capabilities.

## Features

### Core Capabilities
- **Local LLM Integration**: Connects to Ollama for private, on-device AI chat
- **Domain Context System**: Automatic mode detection (Learning, Code Review, Expert) with domain-specific knowledge (Python, React, Next.js)
- **Voice Interaction**: Seamless voice conversation with Piper TTS and Web Speech API
- **Tool Support**: Built-in tools for weather queries, calculations (mathjs), and safe code execution (vm2 sandbox)
- **Streaming Responses**: Real-time streaming for fast, responsive chat experience
- **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4

### Domain Context System
- **Mode Detection**: Automatically detects interaction style from user input
  - **Learning Mode** 🎓: Patient educator with examples and explanations
  - **Code Review Mode** 👁️: Critical analyst focused on code quality
  - **Expert Mode** 🧠: Deep technical discussions with trade-offs
  - **Auto-detect** 🤖: Analyzes patterns to select best mode
- **Domain Knowledge**: Specialized knowledge injection for your tech stack
  - **Python Backend**: Asyncio, FastAPI, concurrency patterns
  - **React Frontend**: Hooks, state management, performance
  - **Next.js Fullstack**: App Router, Server Components, caching
  - **Mixed**: Full-stack patterns, API design, authentication
- **Dynamic Parameters**: Temperature and token limits optimized per mode
- **Manual Override**: User can force specific mode via dropdown selector

### Voice Interaction System
- **Speech-to-Text**: Real-time voice input using Web Speech API
- **Text-to-Speech**: High-quality server-side synthesis with Piper TTS Python integration
- **Unified Voice Flow**: Seamless conversation loop with auto-resume after AI responses
- **Push-to-Talk**: Hold spacebar or click the orb to speak
- **Audio Visualization**: 3D particle system and 2D orb with real-time audio reactivity
- **Beat Detection**: Audio-reactive animations responding to speech emphasis
- **State Machine**: Full conversation flow management (listening → thinking → speaking → auto-resume)

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

3. **Python & Piper TTS** (for high-quality voice output):
   ```bash
   # Install Piper TTS
   pip install piper-tts

   # Verify installation
   python3 -m piper --version

   # Models will auto-download to ~/.piper/models/ on first use
   ```

4. **Modern Browser** (for voice features):
   - Chrome, Edge, or Safari with Web Speech API support
   - Microphone access for speech-to-text

5. **ChromaDB** (Optional for RAG features):
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

4. **Select your mode:**
   - Choose from Auto-detect 🤖, Learning 🎓, Code Review 👁️, or Expert 🧠
   - Mode dropdown is in the top-right header

5. **Start chatting:**
   - Type messages or use voice input (hold spacebar to speak)
   - Enable voice mode for seamless conversation
   - Try asking for weather, calculations, or code examples!
   - The system will adapt its responses based on your selected mode and detected domain

## Voice Interaction

The application features a complete voice interaction system with Piper TTS integration:

### Features
- **Speech-to-Text**: Uses Web Speech API for real-time voice recognition
  - Hold **SPACEBAR** to activate push-to-talk
  - Or **click the Voice ON button** to enable voice mode
  - Continuous and interim transcript support
  - Automatic silence detection

- **Text-to-Speech**: Dual-mode TTS system
  - **Primary**: Piper TTS via Python CLI for high-quality server-side synthesis
  - **Fallback**: Web Speech API for browser-based synthesis
  - Automatic voice output for AI responses
  - Real-time frequency analysis for visualization

- **Unified Voice Flow**: Seamless conversation orchestration
  - **State Machine**: idle → listening → processing → thinking → generating → speaking → auto-resume
  - **Auto-resume**: Automatically starts listening 500ms after AI finishes speaking
  - **Centralized State**: voiceStateManager with pub/sub pattern for cross-component sync
  - **useVoiceFlow Hook**: Single hook combining STT, TTS, and flow control

- **Visual Feedback**:
  - **3D Particle Orb**: Three.js-based with 1000 particles, physics-based motion
  - **2D Voice Orb**: Canvas-based with state-aware colors
    - **Red pulsing**: Listening to your voice
    - **Cyan pulsing**: AI is speaking
    - **Teal idle**: Ready for input
  - Audio-reactive animations with beat detection

### Components
Located in `app/lib/voice/`:
- **useVoiceInput.ts**: Speech-to-text React hook
- **useVoiceOutput.ts**: Text-to-speech React hook with Piper integration
- **useVoiceFlow.ts**: Unified voice flow orchestration hook
- **voiceStateManager.ts**: Centralized state management with pub/sub
- **audioAnalyzer.ts**: Real-time audio analysis and FFT processing

Located in `components/`:
- **VoiceOrb.tsx**: Canvas-based 2D visualization
- **ParticleOrb.tsx**: Three.js 3D particle visualization

### API Endpoints
- **POST /api/piper-tts**: Generate speech audio with Piper (WAV format)
- **GET /api/piper-tts/voices**: List available Piper voice models
- **POST /api/tts**: Browser-based synthesis fallback
- **POST /api/stt**: Placeholder for future Whisper integration

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
1. **Piper TTS**: Ensure Python and Piper are installed: `python3 -m piper --version`
2. **Microphone Permission**: Grant microphone access when prompted
3. **Browser Support**: Use Chrome, Edge, or Safari (Firefox has limited support)
4. **HTTPS Required**: Web Speech API requires HTTPS in production (localhost works)
5. **Check Console**: Look for Web Speech API or Piper error messages
6. **Test Audio**: Verify system microphone and speakers are working
7. **Voice Models**: First TTS request will download voice model to `~/.piper/models/`

## Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript types
```

## Recent Updates

### Domain Context System (v1.3.0)
- **Context Detection**: Automatic mode and domain detection from user input
  - Analyzes keywords for Learning, Code Review, or Expert mode signals
  - Detects file types and tech stack (Python, TypeScript, React, Next.js)
  - Identifies primary domain (backend, frontend, fullstack, mixed)
  - Calculates complexity level and confidence scoring
- **Mode System**: Three specialized interaction modes with tailored system prompts
  - Learning Mode: Patient educator (temp 0.4, 8000 tokens)
  - Code Review Mode: Critical analyst (temp 0.3, 6000 tokens)
  - Expert Mode: Deep technical (temp 0.5, 7000 tokens)
- **Domain Knowledge**: Context-aware knowledge injection
  - Python async patterns, FastAPI, event loops
  - React hooks, state management, performance
  - Next.js App Router, Server Components, caching
  - Full-stack API design, authentication, type sharing
- **UI Integration**: Mode selector dropdown with auto-detect and manual override
- **API Integration**: `buildContextForLLMCall()` generates complete system prompts

### Voice Interaction System (v1.2.0)
- **Piper TTS Integration**: Server-side high-quality speech synthesis via Python CLI
- **Unified Voice Flow**: Complete conversation orchestration with auto-resume
- **State Management**: voiceStateManager with pub/sub pattern
- **Speech-to-Text**: Web Speech API integration with push-to-talk (spacebar)
- **Audio Visualization**: 3D particle system (Three.js) and 2D orb (Canvas)
- **API Endpoints**: `/api/piper-tts` for speech generation and voice listing

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
