Hacker Reign processes information through interconnected systems like strategy selection, domain context, memory RAG, and LLM orchestration, as detailed in the project documentation.

## Overall Flow
User input enters via chat or voice, triggering context analysis for mode, domain, and complexity. Strategy system selects optimal LLM model and workflow, augmented by RAG retrieval from memory.

Memory retrieves similar past conversations using embeddings and vector search before LLM inference.

```mermaid
graph TB
    subgraph "User Input Layer"
        UI[Chat/Voice Input<br/>components/Chat.tsx<br/>useVoiceFlow]
    end

    subgraph "Memory & RAG System (lib/memory)"
        MS[MemoryManager Singleton<br/>schemas.ts]
        ST[SQLite Storage<br/>hackerreign.db<br/>storage/sqlite.ts<br/>Conversations/Messages]
        RA[RAG Layer<br/>rag/index.ts]
        EM[Embeddings<br/>Ollama nomic-embed-text<br/>embeddings.ts]
        RE[Retrieval<br/>ChromaDB .data/chroma<br/>retrieval.ts<br/>Cosine Similarity<br/>Top-K + Threshold]
        AN[Analytics<br/>Search Stats]
    end

    subgraph "Domain Context System (lib/domain)"
        CD[ContextDetector<br/>contextDetector.ts<br/>Input Analysis:<br/>- Keywords<br/>- File Path<br/>- Patterns<br/>- Complexity Score 0-100]
        MD[ModeDefinitions<br/>Learning/Code-Review/Expert<br/>Auto-detect or Manual<br/>temp: 0.4/0.3/0.5<br/>tokens: 8000/6000/7000]
        DK[DomainKnowledge<br/>python-backend:<br/>asyncio/FastAPI<br/>react-frontend:<br/>Hooks/State<br/>nextjs-fullstack:<br/>App Router/SSR<br/>mixed: API/Types]
        CB[ContextBuilder<br/>buildContextForLLMCall<br/>System Prompt:<br/>Mode + Domain + RAG]
    end

    subgraph "Strategy & Orchestration (lib/strategy)"
        CTX[RequestContext<br/>complexity/urgency/domain<br/>context.ts]
        SM[StrategyManager<br/>manager.ts<br/>Registry + Selection]
        SR[Strategies:<br/>speedStrategy<br/>qualityStrategy<br/>costStrategy<br/>complexityStrategy<br/>adaptiveStrategy<br/>baseStrategy.ts]
        WO[Workflows:<br/>chain.ts (Draft>Refine)<br/>ensemble.ts (Vote)<br/>orchestrator.ts]
        RM[ResourceMonitor<br/>CPU/RAM/GPU/Battery<br/>constraints.ts]
        AT[AnalyticsTracker<br/>strategyanalytics.db]
    end

    subgraph "LLM Inference (app/api/llm)"
        INF[Ollama Call<br/>Multi-Model:<br/>llama3.2-3B / qwen2.5-7B /<br/>deepseek-v2-16B<br/>Tools: calc/weather/code-exec]
        FB[Feedback API<br/>api/feedback<br/>Rating + Context]
    end

    subgraph "Continual Learning (lib/learning)"
        PR[PatternRecognition<br/>learningpatterns.db<br/>Success Patterns:<br/>mode+domain+model -> effectiveness]
        PT[ParameterTuner<br/>parametertuning.db<br/>A/B Testing:<br/>temp/top-p/maxTokens]
        QP[QualityPredictor<br/>qualitypredictions.db<br/>Pre-gen Score:<br/>ML on History]
        LD[LearningDashboard<br/>components/LearningDashboard.tsx]
    end

    subgraph "Output Layer"
        OUT[Response:<br/>Streaming Chat/TTS<br/>VoiceOrb/ParticleOrb Viz]
    end

    %% Flows
    UI --> MS
    UI --> CD
    MS --> ST
    MS --> RA
    RA --> EM
    RA --> RE
    RE --> CB
    CD --> MD
    CD --> DK
    MD --> CB
    DK --> CB
    CB --> CTX
    CTX --> SM
    SM --> SR
    SR --> WO
    WO --> RM
    RM --> SM
    CTX --> AT
    WO --> INF
    CB --> INF
    RE --> INF
    INF --> MS
    INF --> OUT
    OUT --> FB
    FB --> PR
    FB --> PT
    FB --> QP
    PR --> SM
    PT --> SM
    QP --> SM
    PR --> LD
    PT --> LD
    QP --> LD
    AT --> PR

    classDef subsystem fill:#e1f5fe
    class MS,ST,RA,EM,RE,AN,CD,MD,DK,CB,CTX,SM,SR,WO,RM,AT,INF,FB,PR,PT,QP,LD subsystem
```

## Memory System Details
Memory uses SQLite for conversation persistence and ChromaDB for vector search. Ollama generates 384-dim embeddings; retrieval finds top-K similar messages (threshold ~0.7) for RAG context injection.

## Domain Selection Granularity
ContextDetector analyzes input keywords, file paths (e.g., .py → python-backend), AST complexity (lines/functions/async). Outputs confidence-scored mode/domain; manual override via UI dropdown.

## Context Awareness Flow
Combines RAG retrieval, domain knowledge injection, and mode-specific prompts into enriched system prompt for LLM. Dynamic params adjust per detection (e.g., Learning mode: patient explanations).

## Continual Learning Loop
Feedback from api/feedback feeds pattern recognition (effectiveness scoring), A/B hyperparameter tuning, and quality prediction ML models. Learned patterns refine adaptiveStrategy selection over time via strategyanalytics.db.