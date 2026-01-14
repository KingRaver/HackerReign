Hacker Reign processes information through interconnected systems like strategy selection, domain context, memory RAG, and LLM orchestration, as detailed in the project documentation.

## Overall Flow
User input enters via chat or voice, triggering context analysis for mode, domain, and complexity. Strategy system selects optimal LLM model and workflow, augmented by RAG retrieval from memory.

Memory retrieves similar past conversations using embeddings and vector search before LLM inference.

## Mermaid Flowchart
```mermaid
graph TD
    A[User Input<br/>Chat/Voice] --> B[Context Detection<br/>Domain/Mode/Complexity<br/>lib/domain]
    A --> C[Memory RAG<br/>Semantic Search<br/>ChromaDB + Ollama Embeddings<br/>lib/memory]
    B --> D[Strategy Selection<br/>Speed/Quality/Adaptive<br/>lib/strategy/manager.ts]
    C --> E[System Prompt Building<br/>Domain Knowledge + RAG Context<br/>lib/domain/contextBuilder]
    D --> F[Model Selection & Workflow<br/>3B/7B/16B via Ollama<br/>Chain/Ensemble]
    E --> G[LLM Inference<br/>api/llm/route.ts<br/>Tools/Streaming Response]
    F --> G
    G --> H[Response Output<br/>TTS + Save to Memory<br/>Voice/Chat UI]
    H --> I[Analytics & Learning<br/>Pattern Recog/Feedback<br/>lib/learning + strategyanalytics.db]
    I --> D
```

This flowchart captures the core information processing pipeline from input to adaptive feedback loop.