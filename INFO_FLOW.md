```
Hacker Reign processes information through interconnected systems like strategy selection, domain context, memory RAG, and LLM orchestration, as detailed in the project documentation.[file:3][file:2]

## Overall Flow
User input enters via chat or voice, triggering context analysis for mode, domain, and complexity. Strategy system selects optimal LLM model and workflow, augmented by RAG retrieval from memory.[file:3][file:2]

Memory retrieves similar past conversations using embeddings and vector search before LLM inference.[file:1]

## Detailed Granular Flowchart

```mermaid
graph TB
    subgraph "User Input Layer"
        UI[Chat/Voice Input<br/>components/Chat.tsx<br/>useVoiceFlow.ts]
    end

    subgraph "Memory & RAG System - lib/memory"
        MS[MemoryManager Singleton<br/>index.ts - schemas.ts]
        ST[SQLite Storage<br/>hackerreign.db<br/>storage/index.ts<br/>storage/sqlite.ts<br/>CRUD: Conversations/Messages]
        RA[RAG Layer<br/>rag/index.ts]
        EM[Embeddings<br/>Ollama nomic-embed-text<br/>embeddings.ts<br/>384-dim vectors]
        RE[Retrieval<br/>ChromaDB .data/chroma<br/>retrieval.ts<br/>Cosine Similarity<br/>Top-K=5 Threshold=0.7<br/>Metadata Filter]
        AN[Analytics<br/>Search Stats<br/>Query Tracking]
    end

    subgraph "Domain Context System - lib/domain"
        CD[ContextDetector.ts<br/>Input Analysis:<br/>-  Keywords: 'explain'→Learning<br/>-  File Path: .py→python<br/>-  Code Patterns: async→backend<br/>-  Complexity: 0-100 Score<br/>-  Confidence: 0-1.0]
        MD[ModeDefinitions.ts<br/>Learning: temp=0.4 tokens=8000<br/>Code-Review: temp=0.3 tokens=6000<br/>Expert: temp=0.5 tokens=7000<br/>Auto-detect or UI Dropdown]
        DK[DomainKnowledge.ts<br/>python-backend:<br/>asyncio/FastAPI/concurrency<br/>react-frontend:<br/>Hooks/State/memoization<br/>nextjs-fullstack:<br/>AppRouter/ServerComponents<br/>mixed: API/Types/Auth]
        CB[ContextBuilder.ts<br/>buildContextForLLMCall<br/>Final System Prompt:<br/>Mode Rules + Domain Best Practices<br/>+ RAG Context + Natural Formatting]
    end

    subgraph "Strategy System - lib/strategy"
        CTX[RequestContext.ts<br/>complexity/urgency/domain<br/>From DomainDetector + RAG Stats]
        SM[StrategyManager.ts<br/>Registry/Selection/Lifecycle<br/>Priority: Adaptive→Complexity→Balanced]
        SR[Strategy Implementations:<br/>speedStrategy.ts - 3B models<br/>qualityStrategy.ts - 16B models<br/>costStrategy.ts - Token min<br/>complexityStrategy.ts - Score-based<br/>adaptiveStrategy.ts - ML learned<br/>baseStrategy.ts - Abstract]
        WO[Workflow Orchestrator.ts<br/>workflows/chain.ts:<br/>Draft(3B)→Refine(7B)→Review(16B)<br/>workflows/ensemble.ts:<br/>Parallel Vote + Consensus]
        RM[Resource Monitor<br/>resources/monitor.ts<br/>CPU/RAM/GPU/Battery/Thermal<br/>resources/constraints.ts<br/>Downgrade if RAM>80%]
        AT[Analytics Tracker<br/>analytics/tracker.ts<br/>strategyanalytics.db<br/>Decision/Outcome Logging]
    end

    subgraph "LLM Core - app/api/llm/route.ts"
        INF[Ollama Inference<br/>Multi-Model Routing:<br/>llama3.2-3B / qwen2.5-coder-7B<br/>deepseek-coder-v2-16B<br/>Tools: calc(mathjs)/weather<br/>code-exec(vm2 sandbox)<br/>30s Timeout/5 Tool Loop Max]
        FB[Feedback Endpoint<br/>api/feedback/route.ts<br/>interactionId/rating/feedback<br/>Feeds Learning System]
    end

    subgraph "Continual Learning - lib/learning"
        PR[PatternRecognition.ts<br/>learningpatterns.db<br/>Patterns: mode+domain+model<br/>→effectiveness score 0-1<br/>SQLite Pattern Storage]
        PT[ParameterTuner.ts<br/>parametertuning.db<br/>A/B Testing Framework<br/>temp/top-p/maxTokens Optimization<br/>Auto Experiment Selection]
        QP[QualityPredictor.ts<br/>qualitypredictions.db<br/>Pre-generation ML Score 0-100<br/>Factors: history/task/model<br/>Integration: Strategy Routing]
        LD[LearningDashboard.tsx<br/>Real-time Metrics/Charts<br/>Pattern Viz/Tuning Status<br/>Quality Accuracy Tracking]
    end

    subgraph "Output & Feedback"
        OUT[Response Delivery<br/>Streaming Chat/TTS(Piper)<br/>Voice: VoiceOrb/ParticleOrb<br/>Auto-save to Memory]
    end

    %% Data Flows
    UI -->|Message| MS
    UI -->|Analysis| CD
    MS -->|Store| ST
    MS -->|Embed/Search| RA
    RA -->|Generate| EM
    RA -->|Vector Search| RE
    RE -->|Relevant Context| CB
    CD -->|Mode/Domain| MD
    CD -->|Knowledge| DK
    MD --> CB
    DK --> CB
    CB --> CTX
    CTX --> SM
    SM --> SR
    SR --> WO
    WO -->|Check Limits| RM
    RM -.->|Downgrade| SM
    CTX --> AT
    WO --> INF
    CB -->|Enriched Prompt| INF
    RE -->|RAG Context| INF
    INF -->|Save Response| MS
    INF --> OUT
    OUT --> FB
    FB --> PR
    FB --> PT
    FB --> QP
    PR -->|Learned Patterns| SM
    PT -->|Optimal Params| SM
    QP -->|Quality Routing| SM
    PR --> LD
    PT --> LD
    QP --> LD
    AT --> PR

    classDef core fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef db fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef ui fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    class MS,ST,RA,EM,RE,AN,CD,MD,DK,CB,CTX,SM,SR,WO,RM,AT,INF,FB,PR,PT,QP,LD core
    class ST,PR,PT,QP,AT db
    class UI ui
```

## Memory System Breakdown
- **SQLite (hackerreign.db)**: Persistent conversations/messages with schema migrations.
- **ChromaDB (.data/chroma)**: Vector store for semantic search.
- **Embeddings**: Ollama nomic-embed-text (384-dim), generated on save.
- **Retrieval**: Cosine similarity, top-5, threshold 0.7, metadata filtering.

## Domain Selection Mechanics
- **Detection Signals**: Keywords ('explain'), file extensions (.py/.tsx), code patterns (async/hooks).
- **Modes**: Learning (patient, examples), Code-Review (critical fixes), Expert (trade-offs).
- **Dynamic Params**: Temp 0.3-0.5, tokens 6k-8k per mode.

## Context Building Process
Merges: Mode instructions + Domain knowledge (e.g., asyncio patterns) + RAG history → single enriched system prompt for LLM.

## Continual Learning Components
- **PatternRecognition**: Tracks mode+domain+model → success rate in learningpatterns.db.
- **ParameterTuner**: A/B tests temp/top-p/maxTokens → parametertuning.db.
- **QualityPredictor**: ML pre-gen score (0-100) → qualitypredictions.db, influences routing.
- **Feedback Loop**: api/feedback → all systems + LearningDashboard visualization.
