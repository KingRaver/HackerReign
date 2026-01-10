# Memory System

A production-ready, local-first memory system for LLM applications with persistent conversation history, semantic search, and strategy analytics.

## Overview

The Hacker Reign memory system combines three powerful technologies to provide long-term memory for your local LLM:

1. **SQLite Storage**: Persistent conversation history, user preferences, and analytics
2. **RAG (Retrieval-Augmented Generation)**: Semantic search over past conversations using vector embeddings
3. **Strategy Analytics**: Track model selection decisions and their outcomes for optimization

All data stays local. No external services required.

## Architecture

```
┌─────────────────────────────────────────────────┐
│       User Message through Chat UI              │
└────────────────────┬────────────────────────────┘
                     │
     ┌───────────────▼───────────────┐
     │  MemoryManager (Orchestrator) │
     │  - Coordinates subsystems     │
     │  - Routes requests            │
     └───────────────┬───────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Storage    │ │     RAG      │ │  Analytics   │
│  (SQLite)    │ │  (Chroma +   │ │ (Strategy    │
│              │ │  Ollama)     │ │  Tracking)   │
│ • Messages   │ │              │ │              │
│ • Chats      │ │ • Embeddings │ │ • Decisions  │
│ • Metadata   │ │ • Similarity │ │ • Outcomes   │
│ • Prefs      │ │ • Search     │ │ • Analytics  │
└──────────────┘ └──────────────┘ └──────────────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
     ┌───────────────▼───────────────┐
     │  Enhanced LLM Prompt          │
     │  System + Retrieved Context   │
     └───────────────┬───────────────┘
                     │
     ┌───────────────▼───────────────┐
     │  Ollama LLM (Inference)       │
     └───────────────┬───────────────┘
                     │
     ┌───────────────▼───────────────┐
     │  Response + Save to Memory    │
     └───────────────────────────────┘
```

## Directory Structure

```
app/lib/memory/
├── index.ts                      # MemoryManager (main public API)
├── schemas.ts                    # TypeScript types & interfaces
│
├── storage/
│   ├── index.ts                  # Storage abstraction & singleton
│   └── sqlite.ts                 # SQLite implementation
│
├── rag/
│   ├── index.ts                  # RAGManager (orchestrator)
│   ├── embeddings.ts             # OllamaEmbeddings (text → vectors)
│   └── retrieval.ts              # ChromaRetrieval (vector search)
│
├── migrations/
│   ├── init.sql                  # Base schema (conversations, messages, etc.)
│   └── 002_strategy_analytics.sql # Strategy tracking tables
│
├── README.md                     # This file
├── FILE_MANIFEST.md              # File listing and quick reference
└── INTEGRATION_GUIDE.md          # Integration instructions
```

## Core Features

### 1. Conversation Management

Store and retrieve complete conversation history:

```typescript
import { getMemoryManager } from '@/lib/memory';

const memory = getMemoryManager();

// Create a new conversation
const conversation = memory.createConversation(
  'Python Async Patterns',
  'qwen2.5-coder',
  ['python', 'async', 'learning']
);

// Save messages
await memory.saveMessage(
  conversation.id,
  'user',
  'How does async/await work?'
);

await memory.saveMessage(
  conversation.id,
  'assistant',
  'async/await is syntactic sugar for Promises...',
  { model_used: 'qwen2.5-coder', tokens_used: 150 }
);

// Retrieve messages
const messages = memory.getConversationMessages(conversation.id);
const recent = memory.getLastMessages(conversation.id, 10);
```

### 2. Semantic Search (RAG)

Find similar conversations using vector embeddings:

```typescript
// Find past discussions about a topic
const results = await memory.retrieveSimilarMessages(
  'coroutines and event loops',
  topK = 5
);

results.forEach((result, i) => {
  console.log(`${i+1}. Similarity: ${(result.similarity_score * 100).toFixed(0)}%`);
  console.log(`   ${result.message.content.substring(0, 100)}...`);
});

// Augment prompt with retrieved context
const augmented = await memory.augmentWithMemory(
  "I'm confused about asyncio"
);

// Use the enhanced prompt in your LLM call
const response = await ollama.chat({
  messages: [
    { role: 'system', content: augmented.enhanced_system_prompt },
    ...currentMessages
  ]
});
```

### 3. Strategy Analytics

Track model selection decisions and outcomes:

```typescript
// Save a strategy decision
await memory.saveStrategyDecision({
  conversation_id: 'conv_123',
  strategy_name: 'complexity-aware',
  selected_model: 'qwen2.5-coder:32b',
  reasoning: 'High complexity detected',
  confidence: 0.87,
  complexity_score: 72
});

// Track the outcome
await memory.saveStrategyOutcome({
  decision_id: 'decision_456',
  response_quality: 0.9,
  user_feedback: 'positive',
  response_time_ms: 1250,
  tokens_used: 420
});

// Analyze strategy performance
const analytics = await memory.getStrategyAnalytics();
console.log('Best performing strategy:', analytics.best_strategy);
console.log('Average response quality:', analytics.avg_quality);
```

### 4. User Preferences

Store and retrieve user settings:

```typescript
// Set preferences
memory.setPreference('preferred_model', 'qwen2.5-coder');
memory.setPreference('theme', { color: 'dark', fontSize: 14 });

// Get preferences
const model = memory.getPreference('preferred_model');
const allPrefs = memory.getAllPreferences();

// System preferences
memory.setSystemPreferences({
  preferred_model: 'qwen2.5-coder',
  rag_top_k: 5,
  max_context_tokens: 16000
});
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install better-sqlite3 chromadb
npm install --save-dev @types/better-sqlite3
```

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
# Memory system paths
MEMORY_DB_PATH=./.data/hackerreign.db
CHROMA_DB_PATH=./.data/chroma

# Ollama embedding model
OLLAMA_EMBED_HOST=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text

# RAG settings
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.3
```

### 3. Pull Embedding Model

```bash
# Start Ollama
ollama serve

# Pull embedding model (one-time)
ollama pull nomic-embed-text
```

### 4. Initialize Memory System

```typescript
import { initializeMemory } from '@/lib/memory';

// Call once at app startup
await initializeMemory();
```

## How It Works

### Vector Normalization

Embeddings are vectors of numbers (e.g., `[0.245, -0.891, 0.123, ...]`). The system automatically normalizes them to unit length for consistent similarity scoring:

```
Normalized = Vector / ||Vector||
where ||Vector|| = sqrt(sum(x_i^2))
```

**Benefits:**
- Consistent similarity scores (cosine similarity ranges from -1 to 1)
- Fair comparisons regardless of input length
- Numerical stability

### Conversation Flow Example

```
User: "How do I use async/await in Python?"
  │
  ├─► Memory augments the query
  │   Searches all past conversations
  │   Finds: "Previous conversation about coroutines" (82% similar)
  │
  ├─► Enhanced system prompt is created
  │   "You are Hacker Reign. Here's a relevant memory: [past response]"
  │
  ├─► Ollama generates response
  │   Uses extended context window + RAG context
  │
  └─► Response is saved and embedded
      For future retrieval
```

### Component Details

#### SQLite Storage ([storage/sqlite.ts](storage/sqlite.ts))

**Stores:**
- Conversation metadata (title, model, date, tags)
- Individual messages (content, role, tokens)
- User preferences (settings, system config)
- Embedding tracking (which messages are in Chroma)
- Strategy decisions and outcomes

**Why SQLite?**
- No external services (fully local)
- ACID compliance (data integrity)
- Easy to extend with PostgreSQL
- Familiar SQL for queries

#### RAG System ([rag/](rag/))

**How it works:**

```
Step 1: Text → Embedding (768 dimensions with nomic-embed-text)
  "How do I use async/await?"
  → [0.245, -0.891, 0.123, ..., 0.456]

Step 2: Store in Chroma
  ID: msg_12345
  Embedding: [0.245, -0.891, ...]
  Metadata: { role: 'user', conversation_id: 'conv_1', ... }

Step 3: Similarity Search
  Query: "Tell me about coroutines"
  → Embedding: [0.234, -0.879, ...]

  Similarity Score = Cosine similarity of normalized vectors
                   = 0.87 (very similar!)

  Result: "async/await message" (87% match)
```

**Why Chroma?**
- Hybrid storage (embeddings + metadata)
- Built-in SQLite persistence
- Easy PostgreSQL migration with pgvector
- Simple API for scaling

## Database Schema

### Core Tables

**conversations**: Chat sessions
```sql
id, title, created_at, updated_at, model_used, total_tokens, summary, tags
```

**messages**: Individual messages
```sql
id, conversation_id, role, content, created_at, tokens_used,
tool_calls, tool_results, model_used, temperature
```

**user_preferences**: Key-value settings
```sql
key, value, created_at, updated_at, data_type
```

**embedding_metadata**: Track embedded messages
```sql
id, message_id, conversation_id, chroma_id,
created_at, embedding_status, error_message
```

### Analytics Tables (New)

**strategy_decisions**: Model selection tracking
```sql
id, conversation_id, message_id, strategy_name, selected_model,
reasoning, confidence, context_complexity, complexity_score,
decision_time_ms, created_at
```

**strategy_outcomes**: Performance tracking
```sql
id, decision_id, response_quality, user_feedback,
response_time_ms, tokens_used, error_occurred,
retry_count, created_at
```

## Performance

### Latency (M4 MacBook Air 16GB)

| Operation | Time | Notes |
|-----------|------|-------|
| Embed text | 50-200ms | Depends on text length |
| RAG search | 10-50ms | Chroma is very fast |
| Save message | 5-10ms | SQLite is synchronous |
| Load last 10 msgs | <1ms | In-memory after first load |
| Total per request | +100-250ms | Added to LLM latency |

### Storage

| Data | Size per 1000 messages |
|------|----------------------|
| SQLite DB | ~5-10 MB |
| Chroma vectors | ~500 MB (768-dim) |
| Total | ~510 MB |

**Capacity**: Safely store **5,000+ conversations** with **100,000+ messages** locally.

## Configuration & Tuning

### RAG_TOP_K (Number of Similar Messages)

```env
RAG_TOP_K=5  # Default: find 5 most similar messages
```

| Value | Pros | Cons | Use Case |
|-------|------|------|----------|
| 1-3 | Fast, focused context | May miss relevant info | Quick lookups |
| 5-10 | Good balance (DEFAULT) | Slightly slower | General use |
| 15-20 | Comprehensive context | Slow, token-heavy | Deep analysis |

### RAG_SIMILARITY_THRESHOLD (Minimum Match Quality)

```env
RAG_SIMILARITY_THRESHOLD=0.3  # Range: 0.0-1.0
```

| Value | Behavior |
|-------|----------|
| 0.1 | Very loose (includes noise) |
| 0.3 | Default (good balance) |
| 0.5 | Strict (only very similar) |
| 0.7+ | Extremely strict (exact matches only) |

### Embedding Model Selection

```env
OLLAMA_EMBED_MODEL=nomic-embed-text  # 768-dimensional
```

| Model | Dimensions | Speed | Quality | Use Case |
|-------|-----------|-------|---------|----------|
| `all-minilm:22m` | 384 | Fast | Good | Budget-conscious |
| `nomic-embed-text` | 768 | Medium | Excellent | Default (RECOMMENDED) |
| `bge-large:en-v1.5` | 1024 | Slow | Best | Maximum accuracy |

## API Reference

```typescript
import { getMemoryManager } from '@/lib/memory';
const memory = getMemoryManager();

// === Initialization ===
await memory.initialize();

// === Conversations ===
memory.createConversation(title, model?, tags?)
memory.getConversation(id)
memory.getAllConversations(limit?, offset?)
memory.updateConversation(id, updates)
memory.deleteConversation(id)

// === Messages ===
await memory.saveMessage(convId, role, content, metadata?)
memory.getMessage(id)
memory.getConversationMessages(convId)
memory.getLastMessages(convId, count)

// === User Preferences ===
memory.setPreference(key, value)
memory.getPreference(key)
memory.getAllPreferences()

// === RAG ===
await memory.augmentWithMemory(query)
await memory.retrieveSimilarMessages(query, topK?)

// === System ===
await memory.getStats()
memory.formatContextForLogging(augmented)
```

## Integration Example

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete integration steps.

Basic integration in [app/api/llm/route.ts](../../api/llm/route.ts):

```typescript
import { getMemoryManager } from '@/lib/memory';

export async function POST(req: NextRequest) {
  const { messages, conversationId } = await req.json();
  const memory = getMemoryManager();

  // Create or get conversation
  let currentConvId = conversationId ||
    memory.createConversation('New Chat').id;

  // Augment with memory
  const lastUserMsg = messages[messages.length - 1];
  const augmented = await memory.augmentWithMemory(lastUserMsg.content);

  // Save user message
  await memory.saveMessage(currentConvId, 'user', lastUserMsg.content);

  // Call LLM with enhanced prompt
  const response = await ollama.chat({
    messages: [
      { role: 'system', content: augmented.enhanced_system_prompt },
      ...messages
    ]
  });

  // Save assistant response
  await memory.saveMessage(
    currentConvId,
    'assistant',
    response.message.content,
    { model_used: 'qwen2.5-coder', tokens_used: 420 }
  );

  return NextResponse.json(response);
}
```

## PostgreSQL Migration

The schema is designed for easy PostgreSQL migration:

### 1. Install pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Add Embedding Column

```sql
ALTER TABLE embedding_metadata
ADD COLUMN embedding vector(768);

CREATE INDEX ON embedding_metadata
USING ivfflat (embedding vector_cosine_ops);
```

### 3. Swap Storage Implementation

Create `storage/postgres.ts`:

```typescript
export class PostgresStorage {
  // Implement same interface as SQLiteStorage
  // But use node-postgres instead of better-sqlite3
}
```

Update `storage/index.ts`:

```typescript
const usePostgres = process.env.DATABASE_URL?.includes('postgres');
const storage = usePostgres
  ? new PostgresStorage(process.env.DATABASE_URL!)
  : new SQLiteStorage(dbPath);
```

**The beauty:** Code above storage layer needs zero changes!

## Security & Privacy

### Data Sensitivity

The memory system stores:
- User queries (exact questions to the LLM)
- LLM responses (full conversation history)
- Metadata (topics, models used, timestamps)

**All data stays local.** Nothing is sent to external services except Ollama (which runs locally).

### Best Practices

```typescript
// ✅ DO: Store in secure location
const dbPath = '/secure/location/hackerreign.db';

// ❌ DON'T: Commit database to Git
// .gitignore:
//   .data/
//   *.db

// ✅ DO: Backup periodically
cp .data/hackerreign.db .data/hackerreign.db.backup

// ✅ DO: Control file permissions
chmod 600 .data/hackerreign.db
```

### Data Deletion

```typescript
// Delete a single conversation
await memory.deleteConversation(conversationId);

// Export before deletion
const json = memory.exportConversation(conversationId);
```

## Troubleshooting

### "SQLITE_CANTOPEN: unable to open database file"

**Fix:**
```bash
mkdir -p .data
npm install
```

### "Cannot find module 'better-sqlite3'"

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "Model not found: nomic-embed-text"

**Fix:**
```bash
ollama pull nomic-embed-text
ollama list  # Verify
```

### "Connection refused" (Ollama)

**Fix:**
```bash
ollama serve  # Terminal 1
# Then run your app in Terminal 2
```

### "No similar context found"

This is normal! It means:
1. No past conversations yet
2. Query is very different from past messages
3. `RAG_SIMILARITY_THRESHOLD` is too strict

**Solution:** Increase threshold or create more conversations.

## Debugging

Enable debug logging:

```typescript
process.env.DEBUG_RAG = 'true';
process.env.DEBUG_SQL = 'true';

const memory = getMemoryManager();
await memory.initialize();
```

Check logs for:
- `[SQLite]` - Database operations
- `[OllamaEmbeddings]` - Embedding generation
- `[ChromaRetrieval]` - Vector search
- `[RAGManager]` - RAG operations
- `[MemoryManager]` - High-level operations

## Related Files

- **Integration Guide**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **File Manifest**: [FILE_MANIFEST.md](FILE_MANIFEST.md)
- **API Usage**: [app/api/llm/route.ts](../../api/llm/route.ts)
- **Domain Context**: [../domain/README.md](../domain/README.md)

## License

Part of the Hacker Reign project.

**Last Updated**: January 2026
**Version**: 1.1.0
**Status**: Production Ready ✅
