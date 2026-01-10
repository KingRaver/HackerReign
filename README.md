# Hacker Reign

An advanced Next.js-powered AI chat application with local LLM integration via Ollama, featuring intelligent multi-model orchestration, domain-aware context detection, voice interaction with Whisper STT and Piper TTS, persistent conversation memory with semantic search, deep learning code generation, and advanced tool support.

## Features

### 🤖 Multi-Model Strategy System
- **Intelligent Model Selection**: Automatically routes requests to optimal models based on task complexity
  - **3B Models** (Llama 3.2): Fast responses for simple tasks
  - **7B Models** (Qwen 2.5 Coder): Balanced for moderate complexity
  - **16B Models** (DeepSeek V2): Expert-level for complex analysis
- **Strategy Types**:
  - **Balanced** (Default): Complexity-based routing with resource awareness
  - **Speed**: Always fast models for quick responses
  - **Quality**: Always best models for maximum accuracy
  - **Cost**: Token-optimized for efficiency
  - **Adaptive**: ML-driven learning from historical performance
- **Multi-Model Workflows**:
  - **Chain Mode**: Draft → Refine → Review pipeline
  - **Ensemble**: Parallel voting for consensus
- **Resource Management**: Automatic adaptation to RAM, CPU, GPU, and battery constraints
- **Analytics**: SQLite-based performance tracking with continuous learning

### 🎯 Domain Context System
- **Automatic Mode Detection**: Analyzes user input to select optimal interaction style
  - **Learning Mode** 🎓: Patient educator with examples and explanations
  - **Code Review Mode** 👁️: Critical analyst focused on code quality
  - **Expert Mode** 🧠: Deep technical discussions with trade-offs
  - **Auto-detect** 🤖: Pattern analysis to select best mode
- **Domain Knowledge Injection**: Specialized knowledge for your tech stack
  - **Python Backend**: Asyncio, FastAPI, concurrency patterns, best practices
  - **React Frontend**: Hooks, state management, performance optimization
  - **Next.js Fullstack**: App Router, Server Components, caching strategies
  - **Mixed**: Full-stack patterns, API design, authentication
- **Complexity Analysis**: AST-level code analysis with 0-100 scoring
  - Lines of code, cyclomatic complexity, async patterns
  - Technical keyword density, function/class counts
  - Multi-domain detection, conversation depth
- **Dynamic Parameters**: Temperature and token limits optimized per mode/complexity
- **Manual Override**: Force specific mode or model via UI controls

### 🧠 Memory & RAG System
- **Persistent Storage**: SQLite-based conversation history
- **Semantic Search**: Vector similarity search over past conversations
- **RAG Integration**: Retrieval-Augmented Generation with ChromaDB
- **Vector Embeddings**: Ollama nomic-embed-text for message embeddings
- **Strategy Analytics**: Performance tracking for ML-driven optimization
  - Decision logging with reasoning and confidence scores
  - Outcome tracking with quality metrics and user feedback
  - Automatic cleanup of old data (configurable retention)
- **Auto-Initialization**: Seamless setup with migration system

### 🎙️ Voice Interaction System
- **Speech-to-Text**: Local Whisper transcription for accurate, private recognition
  - Push-to-talk (hold spacebar) or voice mode (auto-listen)
  - Automatic silence detection (3 seconds default)
  - 330MB `small` model for optimal speed/accuracy
- **Text-to-Speech**: High-quality Piper TTS synthesis
  - Server-side ONNX-based neural voice models
  - Multiple voice options with auto-download
  - Real-time frequency analysis for visualization
- **Unified Voice Flow**: State machine orchestration
  - States: idle → listening → processing → thinking → speaking → auto-resume
  - Auto-resume 500ms after AI finishes speaking
  - Centralized state management with pub/sub pattern
- **Visual Feedback**:
  - **3D Particle Orb**: Three.js with 1000 particles, physics-based motion
  - **2D Voice Orb**: Canvas-based with state-aware colors (red=listening, cyan=speaking, teal=idle)
  - Audio-reactive animations with beat detection

### 🧪 Deep Learning Code Generation
- **Neural Network Predictions**: TensorFlow.js-powered code completion
  - Transformer-based sequence-to-sequence architecture
  - Character-level tokenization for flexibility
  - Trained on code patterns and common completions
- **Context-Aware**: Uses conversation history for better predictions
- **Confidence Scoring**: Only suggests high-confidence predictions (>70%)
- **Embedding System**: Shared cache with RAG for efficiency
- **Training Pipeline**: Continuous learning from usage patterns

### 🛠️ Tool Support
- **Built-in Tools**: Weather queries, calculations (mathjs), safe code execution (vm2 sandbox)
- **Dynamic Tool Loading**: Automatic tool registration and execution
- **Loop Protection**: Max 5 iterations to prevent infinite loops
- **Error Handling**: Comprehensive error tracking with detailed logging

### ⚡ Performance & Reliability
- **Streaming Responses**: Real-time token streaming for responsive UX
- **Timeout Protection**: 30-second fetch timeouts prevent hanging
- **Comprehensive Logging**: Request lifecycle tracking with timestamps
- **Error Handling**: Detailed error messages with stack traces
- **Resource Monitoring**: Real-time RAM, CPU, GPU, battery tracking
- **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4

## Prerequisites

### 1. Ollama
Install and run Ollama locally for LLM inference:

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull models (choose based on your RAM)
ollama pull llama3.2:3b-instruct-q5_K_M      # Fast (4GB RAM)
ollama pull qwen2.5-coder:7b-instruct-q5_K_M  # Balanced (8GB RAM)
ollama pull deepseek-v2:16b-instruct-q4_K_M   # Expert (16GB RAM)

# Pull embedding model for RAG/semantic search
ollama pull nomic-embed-text
```

### 2. Node.js
Version 20 or higher recommended

### 3. Python, Whisper & Piper TTS (for voice features)

```bash
# Install Whisper (for speech-to-text)
pip3 install openai-whisper

# Download Whisper model (330MB - one-time setup)
whisper --model small --task transcribe /dev/null

# Install Piper TTS (for text-to-speech)
pip install piper-tts

# Verify Piper installation
python3 -m piper --version

# Piper voice models will auto-download to ~/.piper/models/ on first use
```

### 4. Modern Browser
- Chrome, Edge, or Safari for microphone access
- Microphone permission required for voice input

### 5. Database Storage
- ChromaDB (included in dependencies) for vector storage
- SQLite (via better-sqlite3) for conversation history
- No external database server required - fully local

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Optional)

Create `.env.local` for custom settings:

```env
# Ollama API
OLLAMA_API_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text

# Memory System
MEMORY_DB_PATH=./.data/hackerreign.db
CHROMA_DB_PATH=./.data/chroma

# Strategy System
STRATEGY_DEFAULT=balanced
STRATEGY_ENABLE_ANALYTICS=true

# Resource Limits
MAX_RAM_MB=16000
MAX_GPU_LAYERS=35
THERMAL_THRESHOLD=85

# Deep Learning
ENABLE_DL_PREDICTIONS=true

# Debug
DEBUG_CONTEXT=false
DEBUG_RAG=false
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

### 5. Start Using

**Text Chat:**
- Select mode: Auto-detect 🤖, Learning 🎓, Code Review 👁️, or Expert 🧠
- Enable strategy system for intelligent model selection
- Type your message and watch the system adapt

**Voice Chat:**
- Click "Voice ON" or hold spacebar to speak
- System automatically resumes listening after responses
- Visual feedback shows current state (listening/thinking/speaking)

**Advanced Features:**
- Enable tools for weather, calculations, code execution
- View analytics to see model selection reasoning
- Manual override for specific models when needed

## System Architecture

### Multi-Model Strategy Flow

```
User Request
    ↓
[Context Building]
    ├─ Domain Detection (Python/React/Next.js)
    ├─ Complexity Analysis (0-100 score)
    └─ Resource Monitoring (RAM/CPU/GPU)
    ↓
[Strategy Selection]
    ├─ Balanced: Complexity-based routing
    ├─ Speed: Always 3B model
    ├─ Quality: Always 16B model
    ├─ Cost: Token optimization
    └─ Adaptive: ML-driven learning
    ↓
[Resource Constraints]
    ├─ RAM limits → downgrade model
    ├─ CPU usage → reduce tokens
    ├─ Battery mode → fast model
    └─ Thermal → throttle generation
    ↓
[Model Selection]
    ├─ 3B: Simple tasks (score < 30)
    ├─ 7B: Moderate tasks (score 30-70)
    └─ 16B: Complex tasks (score > 70)
    ↓
[Optional Workflows]
    ├─ Chain: Draft → Refine → Review
    └─ Ensemble: Parallel voting
    ↓
[LLM Inference via Ollama]
    ↓
[Analytics Logging]
    ├─ Decision: model, reasoning, confidence
    └─ Outcome: quality, time, tokens, feedback
```

### Voice Interaction Flow

```
User speaks (hold space or voice ON)
    ↓
[Browser MediaRecorder] → captures audio
    ↓
[POST /api/stt] → Whisper transcription
    ↓
[Text appears in chat]
    ↓
[Strategy System] → selects model
    ↓
[LLM generates response]
    ↓
[POST /api/piper-tts] → speech synthesis
    ↓
[Audio playback with visualization]
    ↓
[Auto-resume listening after 500ms]
```

### Memory & RAG Flow

```
User message
    ↓
[RAG Search] → find similar past conversations
    ├─ Generate embedding (Ollama)
    ├─ Vector search (ChromaDB)
    └─ Retrieve top K similar messages
    ↓
[Context Building] → inject retrieved context
    ↓
[Enhanced System Prompt]
    ├─ Domain knowledge
    ├─ Mode-specific guidance
    └─ Relevant past conversations
    ↓
[LLM with enriched context]
    ↓
[Save response to memory]
    ├─ SQLite storage
    └─ Vector embedding for future RAG
```

## Project Structure

```
hackerreign/
├── app/
│   ├── api/
│   │   ├── llm/route.ts              # Main LLM endpoint with strategy integration
│   │   ├── stt/route.ts              # Whisper speech-to-text
│   │   ├── piper-tts/route.ts        # Piper text-to-speech
│   │   └── dl-codegen/               # Deep learning code generation
│   │       ├── predict/route.ts      # Neural network predictions
│   │       └── train/route.ts        # Model training endpoint
│   │
│   ├── lib/
│   │   ├── strategy/                 # Multi-model orchestration system
│   │   │   ├── manager.ts            # Main orchestrator
│   │   │   ├── types.ts              # TypeScript interfaces
│   │   │   ├── baseStrategy.ts       # Abstract base class
│   │   │   ├── context.ts            # Context builder
│   │   │   ├── implementations/      # Strategy implementations
│   │   │   │   ├── complexityStrategy.ts  # Balanced (default)
│   │   │   │   ├── speedStrategy.ts       # Always fast
│   │   │   │   ├── qualityStrategy.ts     # Always best
│   │   │   │   ├── costStrategy.ts        # Token optimization
│   │   │   │   └── adaptiveStrategy.ts    # ML-driven
│   │   │   ├── workflows/            # Multi-model workflows
│   │   │   │   ├── chain.ts          # Sequential chaining
│   │   │   │   └── ensemble.ts       # Parallel voting
│   │   │   ├── resources/            # Resource management
│   │   │   │   ├── monitor.ts        # System monitoring
│   │   │   │   └── constraints.ts    # Resource constraints
│   │   │   ├── analytics/            # Performance tracking
│   │   │   │   └── tracker.ts        # SQLite analytics
│   │   │   └── orchestrator.ts       # Workflow execution
│   │   │
│   │   ├── domain/                   # Context detection system
│   │   │   ├── contextDetector.ts    # Mode/domain/complexity detection
│   │   │   ├── domainKnowledge.ts    # Tech stack knowledge bases
│   │   │   ├── modeDefinitions.ts    # Learning/Review/Expert modes
│   │   │   └── contextBuilder.ts     # System prompt generation
│   │   │
│   │   ├── memory/                   # Persistent storage & RAG
│   │   │   ├── index.ts              # MemoryManager API
│   │   │   ├── schemas.ts            # TypeScript types
│   │   │   ├── storage/              # SQLite storage layer
│   │   │   ├── rag/                  # Vector embeddings & search
│   │   │   └── migrations/           # Database schema migrations
│   │   │
│   │   ├── voice/                    # Voice interaction system
│   │   │   ├── useVoiceInput.ts      # STT React hook
│   │   │   ├── useVoiceOutput.ts     # TTS React hook
│   │   │   ├── useVoiceFlow.ts       # Unified orchestration
│   │   │   ├── voiceStateManager.ts  # Centralized state
│   │   │   └── audioAnalyzer.ts      # FFT analysis
│   │   │
│   │   ├── dl-codegen/               # Deep learning predictions
│   │   │   ├── model/                # TensorFlow.js model
│   │   │   ├── trainer.ts            # Training pipeline
│   │   │   └── predictor.ts          # Inference engine
│   │   │
│   │   └── tools/                    # LLM tool support
│   │       ├── definitions.ts        # Tool schemas
│   │       ├── executor.ts           # Tool execution
│   │       └── handlers/             # Individual tool handlers
│   │
│   └── page.tsx                      # Main chat interface
│
├── components/
│   ├── Chat.tsx                      # Main chat component
│   ├── VoiceOrb.tsx                  # 2D audio visualization
│   ├── ParticleOrb.tsx               # 3D particle system
│   └── MessageList.tsx               # Message rendering
│
├── data/                             # Local data storage
│   ├── hackerreign.db                # SQLite conversation history
│   ├── chroma/                       # Vector database
│   └── strategy_analytics.db         # Strategy performance metrics
│
└── public/
    └── models/                       # TensorFlow.js model files
```

## API Endpoints

### LLM & Strategy
- **POST /api/llm**: Main chat endpoint with strategy system integration
  - Accepts: `messages`, `strategyEnabled`, `selectedStrategy`, `filePath`, `manualModeOverride`
  - Returns: Streaming response with auto-selected model info

### Voice
- **POST /api/stt**: Whisper speech-to-text transcription
- **POST /api/piper-tts**: Piper text-to-speech synthesis
- **GET /api/piper-tts/voices**: List available voice models

### Deep Learning
- **POST /api/dl-codegen/predict**: Neural network code predictions
- **POST /api/dl-codegen/train**: Trigger model training

## Configuration

### Strategy System

```typescript
// Enable in Chat.tsx
const [strategyEnabled, setStrategyEnabled] = useState(true);
const [selectedStrategy, setSelectedStrategy] = useState('balanced');

// Strategies: 'balanced', 'speed', 'quality', 'cost', 'adaptive'
```

### Memory System

```typescript
import { getMemoryManager } from '@/lib/memory';

const memory = getMemoryManager();
await memory.initialize();

// Save messages
await memory.saveMessage(conversationId, 'user', content);

// Semantic search
const similar = await memory.retrieveSimilarMessages(query, topK=5);

// Get analytics
const stats = await memory.getStats();
```

### Domain Context

```typescript
import { buildContextForLLMCall } from '@/lib/domain/contextBuilder';

const context = await buildContextForLLMCall(
  userMessage,
  filePath,              // Optional: for file type detection
  manualModeOverride     // Optional: 'learning' | 'code-review' | 'expert'
);

// Use context.systemPrompt, context.temperature, context.maxTokens
```

## Troubleshooting

### Strategy System Issues

**Models keep getting downgraded:**
- Check available RAM: System may be resource-constrained
- Adjust constraints in `app/lib/strategy/resources/constraints.ts`
- Increase `MAX_RAM_MB` in environment variables

**Adaptive strategy not learning:**
- Need at least 20-30 decisions for meaningful patterns
- Check analytics database: `data/strategy_analytics.db`
- Ensure outcomes are being logged after responses

### LLM Issues

**Request timeouts:**
1. Check Ollama is running: `ollama list`
2. Verify service: `curl http://localhost:11434/v1/models`
3. Check model size vs available RAM
4. Review strategy logs for auto-downgrade reasoning

**Tool execution errors:**
1. Verify dependencies: `npm list mathjs vm2`
2. Check console for `[Tool Executor]` messages
3. Review tool handler mapping in `app/lib/tools/executor.ts`

### Memory System Issues

**RAG not finding relevant context:**
1. Ensure embedding model is pulled: `ollama pull nomic-embed-text`
2. Check ChromaDB path exists: `mkdir -p .data/chroma`
3. Verify messages are being embedded (check logs)
4. Adjust `RAG_SIMILARITY_THRESHOLD` (default 0.3)

**Database locked errors:**
1. Increase timeout in tracker.ts
2. Enable WAL mode: `this.db.pragma('journal_mode = WAL')`
3. Check for concurrent writes from parallel requests

### Voice System Issues

**Whisper STT not working:**
1. Install: `pip3 install openai-whisper`
2. Download model: `whisper --model small --task transcribe /dev/null`
3. Check PATH or set `WHISPER_PATH` environment variable
4. Review console for `[STT]` error messages

**Piper TTS not working:**
1. Install: `pip install piper-tts`
2. Verify: `python3 -m piper --version`
3. Voice models auto-download to `~/.piper/models/`
4. Check console for `[Piper]` errors

**Microphone not capturing:**
1. Grant browser microphone permission
2. Test system microphone in other apps
3. Check browser compatibility (Chrome/Edge/Safari recommended)
4. Review console for `[VoiceInput]` messages

### Deep Learning Issues

**Predictions not appearing:**
1. Check `ENABLE_DL_PREDICTIONS` is not false
2. Ensure model files exist in `public/models/`
3. Verify confidence threshold (default >70%)
4. Review console for `[DL]` error messages

## Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript types
```

## Documentation

- **Strategy System**: [app/lib/strategy/README.md](app/lib/strategy/README.md)
- **Domain Context**: [app/lib/domain/README.md](app/lib/domain/README.md)
- **Memory & RAG**: [app/lib/memory/README.md](app/lib/memory/README.md)
- **Memory Integration**: [app/lib/memory/INTEGRATION_GUIDE.md](app/lib/memory/INTEGRATION_GUIDE.md)
- **Project Structure**: [STRUCTURE.md](STRUCTURE.md)

## Recent Updates

### v2.0.0 - Multi-Model Strategy System
- **Intelligent Orchestration**: Automatic model selection based on complexity
- **Resource Management**: RAM/CPU/GPU/battery-aware constraints
- **ML-Driven Learning**: Adaptive strategy learns from historical performance
- **Multi-Model Workflows**: Chain and ensemble execution modes
- **Analytics Dashboard**: SQLite-based performance tracking
- **5 Strategy Types**: Balanced, Speed, Quality, Cost, Adaptive

### v1.3.0 - Domain Context System
- **Context Detection**: Automatic mode and domain detection
- **Mode System**: Learning, Code Review, Expert with specialized prompts
- **Domain Knowledge**: Python, React, Next.js knowledge injection
- **Complexity Analysis**: AST-level code analysis with 0-100 scoring
- **UI Integration**: Mode selector with manual override

### v1.2.0 - Voice Interaction System
- **Whisper STT**: Local speech-to-text transcription
- **Piper TTS**: High-quality speech synthesis
- **Unified Voice Flow**: Complete orchestration with auto-resume
- **Visual Feedback**: 3D particle system and 2D orb
- **State Management**: Centralized voiceStateManager

### v1.1.0 - Memory & RAG System
- **SQLite Storage**: Persistent conversation history
- **Vector Embeddings**: Semantic search with Ollama
- **ChromaDB Integration**: Efficient similarity search
- **Analytics**: Search performance tracking

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Whisper Documentation](https://github.com/openai/whisper)
- [Piper TTS Documentation](https://github.com/rhasspy/piper)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)

## License

©2026 | Vivid Visions | HackerReign™
