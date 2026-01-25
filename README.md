# Hacker Reign

An advanced Next.js-powered AI chat application with local LLM integration via Ollama, featuring intelligent multi-model orchestration, adaptive learning system with pattern recognition and quality prediction, domain-aware context detection, voice interaction with Whisper STT and Piper TTS, persistent conversation memory with semantic search, deep learning code generation, and advanced tool support.

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
  - **Workflow**: Multi-model orchestration (chain or ensemble modes)
- **Multi-Model Workflows**:
  - **Chain Mode**: Draft → Refine → Review pipeline (sequential processing)
  - **Ensemble Mode**: Parallel voting for consensus-based outputs
- **Resource Management**: Automatic adaptation to RAM, CPU, GPU, and battery constraints
- **Analytics**: SQLite-based performance tracking with continuous learning

### 🎓 Adaptive Learning System
- **Pattern Recognition**: Identifies successful and unsuccessful interaction patterns
  - Tracks context features (mode, domain, complexity, model used)
  - Pattern effectiveness scoring and ranking
  - SQLite-based pattern storage for persistent learning
- **Hyperparameter Tuning**: Intelligent optimization based on feedback
  - A/B testing framework for parameter experiments
  - Temperature, max tokens, and top-p optimization
  - Automated tuning based on user feedback and performance metrics
- **Quality Prediction**: Pre-generation quality assessment
  - Predicts response quality before generating output
  - ML-driven predictions using historical data
  - Integration with strategy selection for optimal routing
- **Learning Dashboard**: Visual analytics interface for insights
  - Real-time learning metrics and pattern visualization
  - Parameter tuning experiment results
  - Quality prediction accuracy tracking
- **Feedback Loop**: Continuous improvement from user ratings
  - User feedback collection via dedicated API
  - Feeds into pattern recognition and quality prediction
  - Enhances adaptive strategy performance over time

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
- **Persistent Storage**: SQLite-based conversation history with 7 applied migrations
- **Semantic Search**: Vector similarity search over past conversations
- **RAG Integration**: Retrieval-Augmented Generation with ChromaDB
- **Vector Embeddings**: Ollama nomic-embed-text (768-dimensional) for message embeddings
- **Phase 2 Features** (January 2026):
  - **Conversation Summaries**: Automatic summarization every 5 messages
  - **User Profile Management**: Structured 5-field profile with consent enforcement
  - **Profile UI**: Integrated profile editor in LeftToolbar component
- **Phase 3 Features - Hybrid Retrieval** (January 2026 - ENABLED):
  - **Dual Search System**: Combines semantic (dense) + lexical (FTS5/BM25) search
  - **Code Identifier Matching**: Extracts and matches camelCase, PascalCase, function names
  - **Intelligent Reranking**: Weighted scoring algorithm (α=0.6 dense, β=0.3 BM25, γ=0.1 code)
  - **FTS5 Index**: Full-text search with 346 messages indexed for instant keyword lookup
  - **Performance**: <10ms total overhead vs dense-only retrieval
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
  - LSTM-based sequence-to-sequence architecture with embedding layers
  - Character-level tokenization for flexibility
  - Trained on code patterns and common completions
- **Context-Aware**: Uses conversation history for better predictions
- **Temperature Sampling**: Configurable diversity in predictions
- **Model Persistence**: Trained models saved to .data/dl-model.pt
- **Training Pipeline**: Batch processing with configurable epochs

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

## AI Models Used

This system uses multiple AI models for different purposes. Here's a complete inventory:

### 1. LLM Models (Code Generation & Chat)

**Core Models Available in UI:**
- **llama3.2:3b-instruct-q5_K_M** (2.5GB RAM) - Llama 3.2 🚀
  - Best for: Fast responses, simple questions, quick completions
  - Speed: ~80 tokens/sec on M4 Mac
- **qwen2.5:7b-instruct-q5_K_M** (5GB RAM) - Qwen 2.5 🎯🔨
  - Best for: General purpose chat and coding
  - Speed: ~40 tokens/sec
- **qwen2.5-coder:7b-instruct-q5_K_M** (5GB RAM) - Vibe Coder ⚡ (Default)
  - Best for: Python/TypeScript/JavaScript code generation
  - Speed: ~40 tokens/sec
  - Optimized for: Next.js, React, FastAPI, async patterns
- **yi-coder:9b** (6GB RAM) - Yi 9B 🧠
  - Best for: Web development (Python, JS, TS, Node, HTML, SQL)
  - Speed: ~35 tokens/sec
  - Highest quality for full-stack development
- **deepseek-coder-v2:16b** (10GB RAM) - DeepSeek V2 🔥
  - Best for: Complex debugging, architecture decisions, expert analysis
  - Speed: ~25 tokens/sec
  - GPT-4 level coding performance

**Model Selection:**
- **Manual**: Select from dropdown in Chat UI
- **Automatic**: Strategy system chooses based on task complexity (when enabled)
- **Fallback**: System downgrades to llama3.2:3b on low RAM

**Installation:**
```bash
# Minimum setup (choose one based on RAM)
ollama pull llama3.2:3b-instruct-q5_K_M        # 4GB+ systems

# Recommended setup (8GB+ RAM)
ollama pull qwen2.5-coder:7b-instruct-q5_K_M   # Default model
ollama pull llama3.2:3b-instruct-q5_K_M        # Fast fallback

# Power user setup (16GB+ RAM)
ollama pull qwen2.5-coder:7b-instruct-q5_K_M   # Balanced coding
ollama pull yi-coder:9b                        # Web dev specialist
ollama pull deepseek-coder-v2:16b              # Expert analysis
ollama pull qwen2.5:7b-instruct-q5_K_M        # General purpose
ollama pull llama3.2:3b-instruct-q5_K_M        # Fast responses
```

**For complete model guide with benchmarks, see:** [MODELS.md](MODELS.md)

### 2. Embedding Model (RAG/Semantic Search)

**Required:**
- **nomic-embed-text** (137MB) - 768-dimensional embeddings
  - Used for: Vector search, semantic similarity, memory retrieval
  - Truncated to 384 dims in DL-Codegen for efficiency

**Installation:**
```bash
ollama pull nomic-embed-text
```

**Alternatives (optional):**
- `mxbai-embed-large` (670MB) - Higher accuracy
- `all-minilm` (45MB) - Ultra-lightweight

### 3. Speech-to-Text Model (Voice Input)

**Model:** OpenAI Whisper `small` (330MB)

**Installation:**
```bash
# Install Whisper
pip3 install openai-whisper

# Download model (one-time setup)
whisper --model small --task transcribe /dev/null
```

**Features:**
- Local transcription (no API calls)
- Automatic silence detection (3 seconds)
- WebM to WAV conversion included
- Supports push-to-talk and continuous listening

### 4. Text-to-Speech Models (Voice Output)

**System:** Piper TTS (ONNX-based neural voice models)

**Available Voices:**
- `en_US-libritts-high` (default) - High quality, slower (~2-3s latency)
- `en_US-amy-medium` - Medium quality, faster (~1-2s latency)
- `en_US-lessac-medium` - Alternative medium quality
- `en_US-ryan-high` - Male voice, high quality

**Installation:**
```bash
# Install Piper TTS
pip install piper-tts

# Verify installation
python3 -m piper --version

# Voice models auto-download to ~/.piper/models/ on first use
```

**Configuration:**
Set in `.env.local`:
```env
NEXT_PUBLIC_PIPER_VOICE=en_US-libritts-high
```

### 5. Deep Learning Model (Code Prediction)

**Model:** Custom LSTM trained on your code (optional)
- **Architecture**: LSTM with embedding layers (TensorFlow.js)
- **Storage**: `.data/dl-model.pt` (created after training)
- **Training**: Via `/api/dl-codegen/train` endpoint
- **Vocab size**: 100 tokens (configurable)

### Model Storage Requirements

**Minimum Setup (3B LLM only):**
- Llama 3.2 3B: ~2.5GB
- Nomic embeddings: 137MB
- Whisper small: 330MB
- Piper voice: ~50-100MB
- **Total: ~3-4GB**

**Recommended Setup (7B + tools):**
- Qwen 2.5 Coder 7B: ~5GB
- Llama 3.2 3B: ~2.5GB
- Nomic embeddings: 137MB
- Whisper small: 330MB
- Piper voice: ~50-100MB
- **Total: ~8-9GB**

**Power User Setup (All 5 LLMs):**
- All 5 chat models: ~25GB
- Nomic embeddings: 137MB
- Whisper small: 330MB
- Piper voices (multiple): ~200MB
- **Total: ~25-30GB**

### Model Storage Locations

- **Ollama models**: `~/.ollama/models/`
- **Piper voices**: `~/.piper/models/`
- **Whisper models**: System-dependent (managed by openai-whisper)
- **DL trained model**: `.data/dl-model.pt` (created during training)

---

## Prerequisites

### 1. Ollama
Install and run Ollama locally for LLM inference:

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull models (see "AI Models Used" section above for all options)
# Minimum:
ollama pull qwen2.5-coder:7b-instruct-q5_K_M  # Default model
ollama pull nomic-embed-text                   # For RAG/embeddings
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

# Voice models auto-download to ~/.piper/models/ on first use
# Default voice: en_US-libritts-high
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
# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_KEEP_ALIVE=-1                    # Keep models loaded
OLLAMA_NUM_PARALLEL=4                    # Parallel requests
OLLAMA_FLASH_ATTENTION=1                 # Performance boost

# Model Defaults
NEXT_PUBLIC_DEFAULT_MODEL=qwen2.5-coder:7b-instruct-q5_K_M

# Memory System - Database Paths
MEMORY_DB_PATH=./.data/hackerreign.db
CHROMA_DB_PATH=./.data/chroma
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Memory System - Phase 1-3 Feature Flags (ENABLED)
RAG_HYBRID=true                          # Phase 3: Hybrid retrieval (dense + FTS5/BM25)
RAG_CHUNKING=false                       # Phase 4: Message chunking (future)
RAG_TOKEN_BUDGET=1000                    # Max tokens for memory context
RAG_SUMMARY_FREQUENCY=5                  # Auto-summarize every N messages
RAG_RERANK_ALPHA=0.6                    # Dense (semantic) search weight
RAG_RERANK_BETA=0.3                     # BM25 (lexical) search weight
RAG_RERANK_GAMMA=0.1                    # Code identifier match weight
METRICS_RETENTION_DAYS=30                # Analytics retention period

# Strategy System
STRATEGY_DEFAULT=balanced
STRATEGY_ENABLE_ANALYTICS=true

# Resource Constraints
MAX_RAM_MB=16000
MAX_GPU_LAYERS=35
THERMAL_THRESHOLD=85
DISABLE_RAM_CONSTRAINTS=false            # Set to true to let machine cook

# Voice Configuration
NEXT_PUBLIC_PIPER_VOICE=en_US-libritts-high
WHISPER_PATH=/path/to/whisper            # Auto-detected if in PATH

# Deep Learning
ENABLE_DL_PREDICTIONS=true
DL_SERVER_HOST=http://127.0.0.1:5001

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
    ├─ Adaptive: ML-driven learning
    └─ Workflow: Multi-model orchestration (chain/ensemble)
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

### Memory & RAG Flow (Phase 3 - Hybrid Retrieval)

```
User message
    ↓
[Hybrid RAG Search] → Phase 3 dual-search system
    ├─ Dense Search (Semantic)
    │   ├─ Generate embedding (Ollama nomic-embed-text)
    │   └─ Vector search (ChromaDB)
    ├─ Lexical Search (BM25)
    │   ├─ Extract keywords
    │   └─ FTS5 full-text search (SQLite)
    └─ Code Identifier Matching
        └─ Extract camelCase, PascalCase, function names
    ↓
[Intelligent Reranking]
    ├─ α = 0.6 × dense score (semantic similarity)
    ├─ β = 0.3 × BM25 score (keyword relevance)
    ├─ γ = 0.1 × code match score (identifier overlap)
    └─ Final score = α + β + γ
    ↓
[Top K Results] (<10ms total overhead)
    ↓
[Context Building] → inject retrieved context
    ├─ Conversation summaries (Phase 2)
    └─ User profile preferences (Phase 2)
    ↓
[Enhanced System Prompt]
    ├─ Domain knowledge
    ├─ Mode-specific guidance
    ├─ Relevant past conversations (hybrid ranked)
    └─ User profile context
    ↓
[LLM with enriched context]
    ↓
[Save response to memory]
    ├─ SQLite storage
    ├─ Vector embedding (ChromaDB)
    ├─ FTS5 index update (Phase 3)
    └─ Auto-summarize every 5 messages (Phase 2)
```

## Project Structure

```
hackerreign/
├── app/
│   ├── api/
│   │   ├── llm/route.ts              # Main LLM endpoint with strategy integration
│   │   ├── analytics/route.ts        # Learning and strategy analytics API
│   │   ├── feedback/route.ts         # User feedback collection endpoint
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
│   │   │   │   ├── adaptiveStrategy.ts    # ML-driven
│   │   │   │   └── workflowStrategy.ts    # Multi-model orchestration
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
│   │   ├── learning/                 # Adaptive learning system
│   │   │   ├── patternRecognition.ts # Pattern detection and analysis
│   │   │   ├── parameterTuner.ts     # Hyperparameter optimization
│   │   │   ├── qualityPredictor.ts   # Quality prediction system
│   │   │   └── README.md             # Learning system documentation
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
│   │   ├── dl-codegen/               # Deep learning code generation
│   │   │   ├── index.ts              # Public API exports
│   │   │   ├── types.ts              # TypeScript type definitions
│   │   │   ├── preprocess.ts         # Tokenization and sequence prep
│   │   │   ├── model.ts              # LSTM neural network architecture
│   │   │   └── train.ts              # Training loop and persistence
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
│   ├── LearningDashboard.tsx         # Learning analytics dashboard
│   ├── TopNav.tsx                    # Top navigation bar
│   ├── VoiceOrb.tsx                  # 2D canvas audio visualization
│   └── ParticleOrb.tsx               # 3D Three.js particle system
│
├── .data/                            # Runtime data storage (not in git)
│   ├── chroma/                       # ChromaDB vector database
│   ├── chroma.log                    # ChromaDB logs
│   ├── dl-model.pt                   # Trained deep learning model
│   ├── hackerreign.db                # SQLite conversation history
│   ├── hackerreign.db-shm            # SQLite shared memory
│   └── hackerreign.db-wal            # SQLite write-ahead log
│
├── data/                             # Application data
│   ├── learning_patterns.db          # Pattern recognition database
│   ├── parameter_tuning.db           # Hyperparameter tuning database
│   ├── quality_predictions.db        # Quality prediction database
│   ├── strategy_analytics.db         # Strategy performance analytics
│   └── mode_analytics.db             # Mode interaction analytics
│
└── public/
    ├── codesnippets.json             # Code snippet training data
    ├── favicon.ico                   # Site favicon
    └── *.svg                         # Static assets
```

## API Endpoints

### LLM & Strategy
- **POST /api/llm**: Main chat endpoint with strategy system integration
  - Accepts: `messages`, `strategyEnabled`, `selectedStrategy`, `filePath`, `manualModeOverride`, `model`, `enableTools`
  - Returns: Streaming response with auto-selected model info and strategy reasoning

### Learning & Analytics
- **GET /api/analytics**: Retrieve learning and strategy analytics
  - Query params: `?type=summary|daily|config&days=N`
  - Returns: Aggregated metrics, historical trends, performance comparisons
- **POST /api/analytics**: Cleanup old analytics data
  - Accepts: `retentionDays`
- **POST /api/feedback**: Collect user feedback on AI responses
  - Accepts: `interactionId`, `rating`, `feedback`, `context`
  - Used by learning system for continuous improvement

### Memory & Profile
- **GET /api/memory/metrics**: Retrieval performance metrics
  - Returns: FTS search latency, dense search stats, reranking performance
- **POST /api/memory/consent**: Grant memory consent
  - Accepts: `consent` boolean
- **GET /api/memory/consent**: Check current consent status
- **DELETE /api/memory/consent**: Revoke memory consent
- **POST /api/profile**: Create/update user profile
  - Accepts: 5-field profile object (name, role, experience, preferences, goals)
- **GET /api/profile**: Retrieve current user profile
- **DELETE /api/profile**: Delete user profile

### Voice
- **POST /api/stt**: Whisper speech-to-text transcription
  - Accepts: FormData with audio file (WebM or WAV)
  - Returns: Transcribed text
- **POST /api/piper-tts**: Piper text-to-speech synthesis
  - Accepts: `{ text, voice }` (optional voice selection)
  - Returns: WAV audio file
- **GET /api/piper-tts/voices**: List available Piper voice models
  - Returns: Array of installed voice model names

### Deep Learning
- **POST /api/dl-codegen/predict**: Neural network code predictions
  - Accepts: `{ prompt, context }` (optional context array)
  - Returns: `{ completion, confidence, features }`
- **POST /api/dl-codegen/train**: Trigger model training
  - Accepts: `{ datasetPath }` (path to codesnippets.json)
  - Returns: `{ loss, accuracy }`

## Configuration

### Strategy System

```typescript
// Enable in Chat.tsx or LeftToolbar
const [strategyEnabled, setStrategyEnabled] = useState(true);
const [selectedStrategy, setSelectedStrategy] = useState('balanced');

// Strategies: 'balanced', 'speed', 'quality', 'cost', 'adaptive', 'workflow'
// Workflow modes: 'chain' (sequential) or 'ensemble' (parallel voting)
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
2. Ensure model file exists at `.data/dl-model.pt`
3. Train model first using POST /api/dl-codegen/train
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

- **Project Structure**: [STRUCTURE.md](STRUCTURE.md) - Complete project organization
- **LLM Models Guide**: [MODELS.md](MODELS.md) - Model selection and configuration
- **Future Roadmap**: [FUTURE.md](FUTURE.md) - Planned features and enhancements
- **Learning System**: [app/lib/learning/README.md](app/lib/learning/README.md) - Adaptive learning documentation
- **Memory & RAG**: [app/lib/memory/README.md](app/lib/memory/README.md)
- **Memory Integration**: [app/lib/memory/INTEGRATION_GUIDE.md](app/lib/memory/INTEGRATION_GUIDE.md)
- **Memory File Manifest**: [app/lib/memory/FILE_MANIFEST.md](app/lib/memory/FILE_MANIFEST.md)
- **Voice System**: [app/lib/voice/README.md](app/lib/voice/README.md)
- **Voice Quick Test**: [app/lib/voice/QUICK_TEST.md](app/lib/voice/QUICK_TEST.md)
- **Voice Optimization**: [app/lib/voice/VOICE_OPTIMIZATION.md](app/lib/voice/VOICE_OPTIMIZATION.md)

## Recent Updates

### v2.1.0 - Adaptive Learning System (January 2026)
- **Pattern Recognition**: Automated detection of successful interaction patterns
- **Hyperparameter Tuning**: A/B testing and optimization framework
- **Quality Prediction**: Pre-generation quality assessment using ML
- **Learning Dashboard**: Visual analytics interface for insights
- **Feedback API**: User feedback collection for continuous improvement
- **Analytics API**: Comprehensive metrics and performance tracking
- **Integration**: Seamless integration with adaptive strategy system

### v2.0.0 - Multi-Model Strategy System
- **Intelligent Orchestration**: Automatic model selection based on complexity
- **Resource Management**: RAM/CPU/GPU/battery-aware constraints
- **ML-Driven Learning**: Adaptive strategy learns from historical performance
- **Multi-Model Workflows**: Chain and ensemble execution modes
- **Analytics Dashboard**: SQLite-based performance tracking
- **6 Strategy Types**: Balanced, Speed, Quality, Cost, Adaptive, Workflow

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

### Memory System Enhancements

**Phase 3 - Hybrid Retrieval** (January 25, 2026 - ENABLED):
- **Dual Search**: Semantic (dense) + lexical (FTS5/BM25) retrieval
- **FTS5 Index**: Full-text search with 346 messages indexed
- **Code Matching**: Identifier extraction (camelCase, PascalCase, functions)
- **Reranking**: Weighted scoring (60% semantic, 30% BM25, 10% code)
- **Performance**: <10ms overhead vs dense-only
- **Migration 006-007**: FTS index creation and backfill triggers

**Phase 2 - Summaries & Profile** (January 20, 2026):
- **Auto-Summaries**: Generate summary every 5 messages
- **User Profiles**: 5-field structured profile with consent
- **Profile UI**: Integrated editor in LeftToolbar
- **Consent Management**: Memory opt-in/opt-out
- **Migration 003**: Summaries and profile tables

**Phase 1 - Baseline Metrics** (January 18, 2026):
- **Metrics Collection**: Retrieval performance tracking
- **Feature Flags**: Phase-based enablement system
- **Diagnostics**: Baseline performance data
- **Migration 004**: Metrics tables

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
