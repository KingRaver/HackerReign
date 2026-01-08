# Project Structure

```
hackerreign/
├── .vscode/                      # VSCode workspace settings
│   ├── css-custom-data.json      # Custom CSS definitions for Tailwind v4
│   └── settings.json             # Editor configuration
│
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   └── llm/                  # LLM endpoint
│   │       └── route.ts          # LLM API handler with tool support
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
│   └── Chat.tsx                  # Chat interface component
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
Reusable React components used across the application.

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

### Memory & RAG System Addition
- **Conversation Storage**: SQLite-based persistence for conversations and messages
- **Vector Search**: ChromaDB integration for semantic search over conversation history
- **Embeddings**: Ollama integration for generating vector embeddings
- **Analytics**: Search query tracking and performance metrics
- **Dependencies Added**:
  - `better-sqlite3` (v12.5.0) - SQLite database driver
  - `@types/better-sqlite3` (v7.6.13) - TypeScript definitions
  - `chromadb` (v3.2.0) - Vector database client

### LLM API & Tool System Improvements
- **Timeout Protection**: Added 30-second fetch timeouts with AbortController to prevent indefinite hanging
- **Tool Handler Mapping**: Fixed dynamic import issues by mapping tool names to correct file names
- **Enhanced Logging**: Comprehensive logging throughout request lifecycle with timestamps and stack traces
- **Error Handling**: Better error messages with context, duration tracking, and debugging information
- **Loop Protection**: Max 5 tool loop iterations to prevent infinite loops
- **Dependencies**: Verified `mathjs` and `vm2` are properly installed and configured
