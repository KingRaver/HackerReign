# 🚀 **Hacker Reign - Complete Build Reference**
*Jan 8, 2026 -  M4 MacBook Air 16GB -  3x Local LLMs*

## 🎯 **PROJECT SUMMARY**
**Self-contained Next.js interface** powering **3 specialized LLMs** via Ollama. Private, offline, production-ready coding assistant (Python/Next.js/Web3 focus).

| **Model** | **Size** | **Strength** | **Use Case** |
|-----------|----------|--------------|--------------|
| `llama3.2:3b-instruct-q5_K_M` | 2.3GB | Fast/general | Quick chats, tests |
| `qwen2.5:7b-instruct-q5_K_M` | 5.4GB | Reasoning | Complex questions |
| `qwen2.5-coder:7b-instruct-q5_K_M` | **5.5GB** | **Python/Next.js** | **Code, APIs, dev** |

**Total:** 13.2GB -  **M4 Performance:** 20-80 tokens/sec warm

## 🏗️ **FILE STRUCTURE**
```
hackerreign/
├── app/
│   ├── api/
│   │   ├── llm/route.ts       # ← Ollama proxy + tools + domain context
│   │   ├── stt/route.ts       # ← Speech-to-Text API (placeholder)
│   │   ├── tts/route.ts       # ← Text-to-Speech API (placeholder)
│   │   └── piper-tts/route.ts # ← Piper TTS Python integration
│   ├── lib/
│   │   ├── domain/            # ← Context detection & mode system
│   │   │   ├── contextDetector.ts
│   │   │   ├── modeDefinitions.ts
│   │   │   ├── domainKnowledge.ts
│   │   │   └── contextBuilder.ts
│   │   ├── memory/            # ← RAG & conversation storage
│   │   │   ├── storage/       # SQLite persistence
│   │   │   └── rag/           # ChromaDB + embeddings
│   │   ├── voice/             # ← STT/TTS with Piper integration
│   │   │   ├── useVoiceInput.ts
│   │   │   ├── useVoiceOutput.ts
│   │   │   ├── useVoiceFlow.ts
│   │   │   ├── voiceStateManager.ts
│   │   │   └── audioAnalyzer.ts
│   │   └── tools/             # LLM tool handlers
│   └── page.tsx              # ← <Chat /> wrapper
├── components/
│   ├── Chat.tsx              # ← UI + model + mode selector
│   ├── VoiceOrb.tsx          # ← 2D voice visualization
│   └── ParticleOrb.tsx       # ← 3D particle visualization
├── package.json              # openai, next, react, tailwind, chromadb, better-sqlite3
├── tsconfig.json             # @/* paths: ["./*"]
└── tailwind.config.ts
```

## ⚡ **QUICK START** (3 Terminals)
```bash
# T1: Ollama (models + embeddings)
ollama serve
# LLM models: llama3.2:3b ✅, qwen2.5:7b ✅, qwen2.5-coder:7b ✅
ollama pull nomic-embed-text   # For RAG/semantic search

# T2: App
cd hackerreign
npm install                    # Includes chromadb, better-sqlite3
npm run dev                    # http://localhost:3000

# T3: (optional) Docker + ChromaDB
docker-compose up -d           # If using Docker for services

# T4: (optional) Warm models
OLLAMA_KEEP_ALIVE=-1 ollama serve  # Never unloads
```

## 📁 **CORE FILES** (Copy-Paste Ready)

### **1. API Route** `app/api/llm/route.ts`
```typescript
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama'
});

export async function POST(req: NextRequest) {
  try {
    const { model = 'llama3.2:3b-instruct-q5_K_M', messages } = await req.json();
    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7
    });
    return NextResponse.json(completion.choices[0].message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### **2. Chat UI** `components/Chat.tsx` (Full)
See [Chat.tsx](components/Chat.tsx) for the complete implementation with:
- Model selection dropdown
- Message history
- Streaming responses
- Tool execution support
- Voice integration

---

## 🧠 **MEMORY & RAG SYSTEM**

### **Architecture**
```
User Query → Semantic Search (ChromaDB) → Context Retrieval → LLM + Context → Response
                    ↓
            Vector Embeddings (Ollama)
                    ↓
            SQLite Storage (Conversations)
```

### **Components**

#### **1. SQLite Storage** (`app/lib/memory/storage/`)
```typescript
// Persistent conversation history
interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}
```

**Features:**
- Singleton pattern for database connection
- Schema migrations in `migrations/001_initial_schema.sql`
- Full conversation CRUD operations
- Message history tracking

#### **2. Vector Embeddings** (`app/lib/memory/rag/embeddings.ts`)
```typescript
// Generate embeddings via Ollama
const embedding = await generateEmbedding(text, {
  model: 'nomic-embed-text',
  apiUrl: 'http://localhost:11434'
});
// Returns: number[] (384-dimensional vector)
```

**Ollama Embedding Models:**
- `nomic-embed-text` (recommended, 384 dims)
- `all-minilm` (384 dims, lightweight)
- `mxbai-embed-large` (1024 dims, high accuracy)

#### **3. ChromaDB Integration** (`app/lib/memory/rag/retrieval.ts`)
```typescript
// Semantic search over conversations
const results = await retrieval.search({
  query: "user question",
  limit: 5,
  threshold: 0.7  // Similarity threshold
});

// Returns relevant past messages with similarity scores
```

**Features:**
- In-memory or persistent storage (`.data/chroma/`)
- Cosine similarity search
- Metadata filtering
- Analytics tracking

### **Environment Variables**
```bash
# .env.local
MEMORY_DB_PATH=./.data/hackerreign.db
CHROMA_DB_PATH=./.data/chroma
OLLAMA_API_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
```

### **Usage Example**
```typescript
import { storage } from '@/app/lib/memory';

// Create conversation
const conv = await storage.createConversation('New Chat');

// Add message
await storage.addMessage(conv.id, {
  role: 'user',
  content: 'Hello!'
});

// Search past conversations
const relevant = await retrieval.search({
  query: 'authentication issues',
  limit: 3
});
```

---

## 🎙️ **VOICE INTERACTION (STT/TTS)**

### **Architecture**
```
User Voice → Web Speech API → STT → LLM → TTS → Web Speech API → Audio Output
                ↓                                    ↓
          Audio Analyzer                       Frequency Analysis
                ↓                                    ↓
           VoiceOrb (visualization)
```

### **Components**

#### **1. Speech-to-Text** (`app/lib/voice/useVoiceInput.ts`)
```typescript
const {
  isListening,
  transcript,
  audioLevel,
  startListening,
  stopListening
} = useVoiceInput({
  onTranscript: (text) => console.log(text),
  onError: (err) => console.error(err)
});

// Push-to-talk: Hold SPACEBAR
// Or programmatically: startListening()
```

**Features:**
- Web Speech API (browser-native)
- Real-time transcript + interim results
- Audio level monitoring (0-1 scale)
- Spacebar push-to-talk
- Microphone permission handling
- Error recovery

**Browser Support:**
- ✅ Chrome/Edge (full support)
- ✅ Safari (macOS/iOS)
- ⚠️ Firefox (limited)

#### **2. Text-to-Speech** (`app/lib/voice/useVoiceOutput.ts`)
```typescript
const {
  isPlaying,
  speak,
  stop,
  getAudioLevel
} = useVoiceOutput({
  voice: 'en_US-libritts-high',
  onPlaybackEnd: () => console.log('Done')
});

await speak("Hello, I'm your AI assistant!");
```

**Features:**
- Browser-based speech synthesis
- Voice selection (system voices)
- Real-time frequency analysis
- Beat detection for emphasis
- Progress tracking

#### **3. Audio Analyzer** (`app/lib/voice/audioAnalyzer.ts`)
```typescript
const analyzer = new AudioAnalyzer((data) => {
  console.log({
    frequency: data.frequency,    // Dominant frequency (Hz)
    amplitude: data.amplitude,    // Volume (0-1)
    spectrum: data.spectrum       // FFT data
  });
});

analyzer.connectSource(audioSource);
analyzer.start();
```

**Features:**
- FFT-based spectrum analysis (256 bins)
- Dominant frequency detection
- Beat extraction (speech emphasis)
- Frequency range filtering
- Average amplitude calculation

#### **4. VoiceOrb Component** (`components/VoiceOrb.tsx`)
```tsx
<VoiceOrb
  isListening={isListening}
  isPlaying={isPlaying}
  audioLevel={audioLevel}
  beat={beat}
  onToggleListening={() => toggleVoice()}
/>
```

**Visual States:**
- 🔴 **Red pulsing**: Listening to user
- 🔵 **Cyan pulsing**: AI speaking
- 🟢 **Teal idle**: Ready for input
- Canvas-based animations (400x400px)
- Audio-reactive scaling and rotation

### **API Routes (Placeholder)**

#### **STT Endpoint** (`app/api/stt/route.ts`)
```typescript
// POST /api/stt
// Body: FormData with audio blob
// Currently returns 501 (client-side STT recommended)
// Future: Whisper/Ollama integration
```

#### **TTS Endpoint** (`app/api/tts/route.ts`)
```typescript
// POST /api/tts
// Body: { text: string, voice?: string, rate?: number }
// Returns instructions for client-side synthesis
// Future: Piper TTS/ElevenLabs integration
```

---

## 🐳 **DOCKER SUPPORT**

### **Docker Compose Setup** (Optional)
```yaml
# docker-compose.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_KEEP_ALIVE=-1

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OLLAMA_API_URL=http://ollama:11434
      - CHROMA_DB_PATH=/data/chroma
    depends_on:
      - ollama
      - chromadb

volumes:
  ollama_data:
  chroma_data:
```

### **Dockerfile** (Next.js App)
```dockerfile
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### **Usage**
```bash
# Start all services
docker-compose up -d

# Pull Ollama models
docker exec -it hackerreign-ollama-1 ollama pull qwen2.5-coder:7b-instruct-q5_K_M
docker exec -it hackerreign-ollama-1 ollama pull nomic-embed-text

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔧 **COMPLETE DEPENDENCIES**

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "openai": "^4.73.0",
    "better-sqlite3": "^12.5.0",
    "chromadb": "^3.2.0",
    "mathjs": "^13.0.0",
    "vm2": "^3.9.19"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## 📊 **FEATURE MATRIX**

| Feature | Status | Tech Stack | Dependencies |
|---------|--------|------------|--------------|
| **LLM Chat** | ✅ Production | Ollama + OpenAI SDK | `openai` |
| **Domain Context** | ✅ Production | Mode detection + domain knowledge | Built-in |
| **Tool Support** | ✅ Production | mathjs, vm2 | `mathjs`, `vm2` |
| **Memory/RAG** | ✅ Production | SQLite + ChromaDB | `better-sqlite3`, `chromadb` |
| **Voice STT** | ✅ Production | Web Speech API | Native browser API |
| **Voice TTS** | ✅ Production | Piper TTS + Web Speech | `python3 -m piper` |
| **Audio Viz** | ✅ Production | Canvas + Three.js | `three` |
| **Docker** | 🔄 Optional | Docker Compose | `docker`, `docker-compose` |
| **Server STT** | 📋 Planned | Whisper/Ollama | TBD |

---

## 🎯 **RECOMMENDED MODELS**

### **For M4 MacBook Air 16GB**
```bash
# Primary setup (13.2GB total)
ollama pull llama3.2:3b-instruct-q5_K_M     # 2.3GB - Fast general
ollama pull qwen2.5:7b-instruct-q5_K_M      # 5.4GB - Reasoning
ollama pull qwen2.5-coder:7b-instruct-q5_K_M # 5.5GB - Coding (primary)

# RAG/Embeddings (137MB)
ollama pull nomic-embed-text                 # 384-dim embeddings

# Total: ~13.4GB (leaves ~2.6GB for OS/apps)
```

### **Performance Metrics**
- **Cold start**: 2-5 seconds
- **Warm inference**: 20-80 tokens/sec
- **Embedding**: ~50ms per message
- **RAG search**: ~100-200ms (1000 messages)

---

## 🚀 **PRODUCTION CHECKLIST**

- [ ] Set `OLLAMA_KEEP_ALIVE=-1` for persistent models
- [ ] Configure `.env.local` with all paths
- [ ] Initialize SQLite: `mkdir -p .data`
- [ ] Pull embedding model: `ollama pull nomic-embed-text`
- [ ] Test microphone permissions (HTTPS in production)
- [ ] Configure CORS for Ollama if remote
- [ ] Set up Docker (optional, for deployment)
- [ ] Build Next.js: `npm run build`
- [ ] Test with: `npm start`

---

## 📚 **REFERENCES**

- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OpenAI SDK](https://github.com/openai/openai-node)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## 🎓 **DOMAIN CONTEXT SYSTEM**

### **Architecture**
```
User Input + Mode Selection
         ↓
Context Detector (mode, domain, complexity)
         ↓
Mode System (learning/code-review/expert)
         ↓
Domain Knowledge (Python/React/Next.js/Mixed)
         ↓
Context Builder (complete system prompt)
         ↓
LLM with tailored context
```

### **Interaction Modes**
| Mode | Icon | Temperature | Tokens | Focus |
|------|------|-------------|--------|-------|
| **Learning** | 🎓 | 0.4 | 8000 | Patient educator, examples, WHY |
| **Code Review** | 👁️ | 0.3 | 6000 | Critical analyst, improvements |
| **Expert** | 🧠 | 0.5 | 7000 | Deep technical, trade-offs |
| **Auto-detect** | 🤖 | Dynamic | Dynamic | Analyzes input patterns |

### **Domains**
- **python-backend**: Asyncio, FastAPI, concurrency, event loops
- **react-frontend**: Hooks, state management, performance, memoization
- **nextjs-fullstack**: App Router, Server Components, caching, SSR/SSG
- **mixed**: Full-stack patterns, API design, type sharing, authentication

### **Usage in Chat.tsx**
```typescript
// User selects mode from dropdown (or leaves on Auto-detect)
const [manualMode, setManualMode] = useState<'' | 'learning' | 'code-review' | 'expert'>('');

// Passed to API on every request
fetch('/api/llm', {
  body: JSON.stringify({
    messages,
    manualModeOverride: manualMode || undefined
  })
});
```

### **API Integration**
```typescript
// app/api/llm/route.ts
import { buildContextForLLMCall } from '../../lib/domain/contextBuilder';

const llmContext = await buildContextForLLMCall(
  userMessage,
  filePath,        // Optional: for domain detection
  manualModeOverride  // User-selected mode
);

// Returns:
// - systemPrompt: Complete prompt with mode + domain knowledge
// - temperature: 0.3-0.5 based on mode
// - maxTokens: 6000-8000 based on mode
```

---

**Last Updated:** Jan 9, 2026
**Version:** 1.3.0 (Domain Context + Voice + RAG)
