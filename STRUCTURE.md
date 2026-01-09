# Project Structure

```
hackerreign/
├── .vscode/                      # VSCode workspace settings
│   ├── css-custom-data.json      # Custom CSS definitions for Tailwind v4
│   └── settings.json             # Editor configuration
│
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   ├── llm/                  # LLM endpoint
│   │   │   └── route.ts          # LLM API handler with tool support
│   │   ├── piper-tts/            # Piper TTS endpoint
│   │   │   └── route.ts          # Server-side Piper TTS with Python CLI integration
│   │   ├── stt/                  # Speech-to-Text endpoint
│   │   │   └── route.ts          # STT API (placeholder for future server-side STT)
│   │   └── tts/                  # Text-to-Speech endpoint
│   │       └── route.ts          # TTS API (client-side synthesis instructions)
│   ├── lib/                      # Shared utilities and libraries
│   │   ├── memory/               # Memory and RAG system
│   │   │   ├── index.ts          # Storage singleton exports
│   │   │   ├── schemas.ts        # TypeScript schemas for conversations/messages
│   │   │   ├── storage/          # Data persistence layer
│   │   │   │   ├── index.ts      # SQLite storage singleton management
│   │   │   │   └── sqlite.ts     # SQLite implementation for conversations
│   │   │   ├── rag/              # Retrieval-Augmented Generation
│   │   │   │   ├── embeddings.ts # Ollama embeddings integration
│   │   │   │   └── retrieval.ts  # ChromaDB vector search
│   │   │   ├── migrations/       # Database schema migrations
│   │   │   │   └── 001_initial_schema.sql
│   │   │   ├── README.md         # Memory system documentation
│   │   │   ├── INTEGRATION_GUIDE.md  # Integration instructions
│   │   │   └── FILE_MANIFEST.md  # File descriptions
│   │   ├── voice/                # Voice interaction system
│   │   │   ├── useVoiceInput.ts  # Speech-to-Text hook (Web Speech API)
│   │   │   ├── useVoiceOutput.ts # Text-to-Speech hook (Web Speech API + Piper TTS)
│   │   │   ├── useVoiceFlow.ts   # Unified voice flow orchestration hook
│   │   │   ├── voiceStateManager.ts # Centralized state management for voice flow
│   │   │   └── audioAnalyzer.ts  # Audio frequency analysis and beat detection
│   │   └── tools/                # LLM tool integration
│   │       ├── index.ts          # Tool exports and configuration
│   │       ├── definitions.ts    # Tool JSON schemas
│   │       ├── executor.ts       # Tool execution engine with handler mapping
│   │       └── handlers/         # Individual tool implementations
│   │           ├── weather.ts    # Weather tool (mock data)
│   │           ├── calc.ts       # Calculator tool (mathjs)
│   │           └── code-exec.ts  # Code execution tool (vm2 sandbox)
│   ├── favicon.ico               # Site favicon
│   ├── globals.css               # Global styles with Tailwind v4
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── Chat.tsx                  # Chat interface component
│   ├── VoiceOrb.tsx              # Canvas-based 2D voice visualization component
│   └── ParticleOrb.tsx           # Three.js 3D particle visualization component
│
├── public/                       # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .env.local                    # Environment variables (not in git)
├── .gitignore                    # Git ignore rules
├── OUTLINE.md                    # Project outline/planning
├── README.md                     # Project documentation
├── eslint.config.mjs             # ESLint configuration
├── global.d.ts                   # Global TypeScript declarations
├── next-env.d.ts                 # Next.js TypeScript declarations
├── next.config.ts                # Next.js configuration
├── package.json                  # Project dependencies and scripts
├── package-lock.json             # Locked dependency versions
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Key Directories

### `/app`
Next.js 14+ App Router structure. Contains all pages, layouts, and API routes.

### `/app/api`
Server-side API endpoints. Currently hosts the LLM integration with tool support.

### `/app/lib`
Shared utilities and libraries used across the application.

#### `/app/lib/memory`
Memory and RAG (Retrieval-Augmented Generation) system:
- **storage/** - SQLite-based conversation and message persistence
- **rag/** - Vector embeddings and semantic search using ChromaDB and Ollama
- **schemas.ts** - TypeScript types for conversations and messages
- **migrations/** - Database schema version control

**Features:**
- Conversation history storage with SQLite
- Semantic search over past conversations using vector embeddings
- Ollama integration for generating embeddings
- ChromaDB for efficient vector similarity search
- Analytics tracking for search queries and retrieval performance

**Dependencies:**
- `better-sqlite3` - SQLite database driver
- `chromadb` - Vector database for semantic search

#### `/app/lib/voice`
Voice interaction system for speech input/output with unified flow orchestration:
- **useVoiceInput.ts** - React hook for speech-to-text using Web Speech API
- **useVoiceOutput.ts** - React hook for text-to-speech (Web Speech API + Piper TTS)
- **useVoiceFlow.ts** - Unified voice flow orchestration combining STT, TTS, and auto-resume
- **voiceStateManager.ts** - Centralized state management with pub/sub pattern
- **audioAnalyzer.ts** - Real-time audio frequency analysis and beat detection

**Features:**
- **Conversation Flow**: idle → listening → processing → thinking → generating → speaking → auto-resume
- Browser-based speech recognition (Web Speech API)
- Server-side TTS with Piper Python integration
- Real-time audio level monitoring and visualization
- Spacebar push-to-talk functionality
- Auto-resume listening after AI responses (500ms delay)
- State management with observer pattern for React components
- Frequency analysis for visual feedback
- Beat detection for responsive UI animations
- Microphone permission handling and error recovery

**State Machine:**
- `idle` - Ready, waiting for user interaction
- `listening` - Recording user speech
- `processing` - Converting speech to text
- `thinking` - LLM generating response
- `generating` - Converting response to speech
- `speaking` - Playing audio response
- `error` - Error state with message

**Dependencies:**
- Built on native browser APIs (Web Speech API)
- Piper TTS via Python CLI for server-side synthesis
- Compatible with Chrome, Edge, and Safari

#### `/app/lib/tools`
LLM tool integration system:
- **index.ts** - Central export point for tool definitions
- **definitions.ts** - JSON schemas for tool parameters (weather, calculator, code execution)
- **executor.ts** - Tool execution engine with handler mapping and error handling
- **handlers/** - Individual tool implementations with sandboxing and validation

**Features:**
- Tool handler name mapping (fixes dynamic import issues)
- Comprehensive logging for debugging tool execution
- Error handling with stack traces
- Support for calculator (mathjs), weather (mock API), and code execution (vm2 sandbox)

### `/components`
Reusable React components used across the application:
- **Chat.tsx** - Main chat interface with message history, input, and voice flow integration
  - Integrates with useVoiceFlow for voice conversation
  - Subscribes to voice state changes for UI updates
  - Handles LLM responses and auto-TTS playback
- **VoiceOrb.tsx** - Canvas-based 2D animated orb for voice visualization
  - Real-time audio level visualization with pulsing effects
  - State-based color schemes (listening: red, speaking: cyan, idle: teal)
  - Smooth interpolation for natural animations
  - Click and spacebar interaction support
- **ParticleOrb.tsx** - Three.js-based 3D particle visualization component
  - 1000 particles with physics-based animation
  - Sphere boundary with collision detection
  - State-based forces (inward collapse when listening, outward pulse when speaking)
  - Audio-reactive particle motion and beat detection
  - Smooth color transitions between states
  - Velocity damping and dynamic scaling

### `/public`
Static files served directly by Next.js without processing.

### `/.vscode`
VSCode-specific settings for consistent development experience.

## Configuration Files

- **next.config.ts** - Next.js framework configuration
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.ts** - Tailwind CSS v4 customization
- **postcss.config.mjs** - PostCSS plugins (including Tailwind)
- **eslint.config.mjs** - Code linting rules
- **global.d.ts** - Custom TypeScript type declarations

## Scripts

See `package.json` for available npm scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Recent Updates

### Voice Interaction System - Full Piper TTS Integration (January 2026)
- **Unified Voice Flow**: Complete conversation orchestration with auto-resume
  - State machine: idle → listening → processing → thinking → generating → speaking → auto-resume
  - Centralized state management with pub/sub pattern
  - 500ms delay before auto-resume for natural conversation pacing
  - useVoiceFlow hook combines STT, TTS, and flow control
  - voiceStateManager for cross-component state synchronization

- **Piper TTS Server Integration**: Production-ready server-side text-to-speech
  - Python CLI integration via `python3 -m piper`
  - Voice model management in `~/.piper/models/`
  - GET `/api/piper-tts/voices` - List available voice models
  - POST `/api/piper-tts` - Generate speech audio (WAV format)
  - ARM64 architecture support for Apple Silicon
  - 30-second timeout protection
  - Temporary file cleanup and error handling
  - Up to 5000 character text limit

- **Speech-to-Text (STT)**: Web Speech API integration for real-time voice input
  - Push-to-talk with spacebar control
  - Continuous and interim transcript support
  - Real-time audio level monitoring for visual feedback
  - Browser-based recognition (no server required)
  - Error handling for microphone permissions and network issues

- **Text-to-Speech (TTS)**: Dual-mode TTS system
  - Primary: Piper TTS via Python CLI for high-quality server-side synthesis
  - Fallback: Web Speech API for browser-based synthesis
  - Voice selection support
  - Real-time frequency analysis for visualization
  - Beat detection for responsive UI animations

- **3D Particle Visualization**: Advanced Three.js particle system
  - ParticleOrb component with 1000 particles
  - Physics-based motion with velocity and forces
  - Sphere boundary with collision detection
  - State-based particle behavior (collapse/expand)
  - Audio-reactive motion and beat pulses
  - Smooth color transitions between states

- **Voice Visualization**: Canvas-based 2D orb component
  - VoiceOrb with state-aware color schemes
  - Audio-reactive pulsing and scaling
  - Smooth interpolation for natural motion
  - Click and keyboard controls

- **API Endpoints**:
  - `/api/piper-tts` - Full Piper TTS integration (GET for voices, POST for synthesis)
  - `/api/tts` - Web Speech API fallback route
  - `/api/stt` - Placeholder for future Whisper integration

- **Audio Analysis**: Real-time frequency and amplitude tracking
  - FFT-based spectrum analysis
  - Beat detection for speech emphasis
  - Configurable frequency range filtering

### Memory & RAG System Addition (December 2025)
- **Conversation Storage**: SQLite-based persistence for conversations and messages
- **Vector Search**: ChromaDB integration for semantic search over conversation history
- **Embeddings**: Ollama integration for generating vector embeddings
- **Analytics**: Search query tracking and performance metrics
- **Dependencies Added**:
  - `better-sqlite3` (v12.5.0) - SQLite database driver
  - `@types/better-sqlite3` (v7.6.13) - TypeScript definitions
  - `chromadb` (v3.2.0) - Vector database client

### Additional Dependencies
- **3D Graphics**: `three` (v0.160.0), `@types/three` (v0.182.0) - For ParticleOrb 3D visualization
- **AI SDKs**:
  - `ai` (v6.0.20) - Vercel AI SDK for LLM integration
  - `openai` (v6.15.0) - OpenAI SDK for GPT models
- **Python Runtime**: `pyodide` (v0.29.1) - Python in the browser for code execution
- **Schema Validation**: `zod` (v4.3.5) - Runtime type checking and validation
- **Math**: `mathjs` (v15.1.0) - Calculator tool implementation

### LLM API & Tool System Improvements
- **Timeout Protection**: Added 30-second fetch timeouts with AbortController to prevent indefinite hanging
- **Tool Handler Mapping**: Fixed dynamic import issues by mapping tool names to correct file names
- **Enhanced Logging**: Comprehensive logging throughout request lifecycle with timestamps and stack traces
- **Error Handling**: Better error messages with context, duration tracking, and debugging information
- **Loop Protection**: Max 5 tool loop iterations to prevent infinite loops
- **Dependencies**: Verified `mathjs` and `vm2` are properly installed and configured
