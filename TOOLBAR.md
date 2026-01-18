# Toolbar Guide

This document explains the left-hand toolbar, the controls it exposes, and the memory features it enables. It assumes a local, single-user setup.

## Left Toolbar Overview

The left toolbar consolidates controls that previously lived in the top nav. It’s designed to keep the chat area uncluttered while providing quick access to modes, strategy, tools, voice, models, and memory consent.

### Primary Controls

- **Mode Selector**
  - **Auto**: Let domain/context detection pick the mode.
  - **Learning**: More explanation and guidance.
  - **Review**: Critique and feedback for code.
  - **Expert**: Deep, technical responses.

- **Strategy Toggle**
  - Turns on the strategy system that auto-selects models and parameters.
  - When enabled, the **Strategy Selector** appears.

- **Strategy Selector**
  - **Balanced**: Default blend of speed/quality.
  - **Speed**: Fastest viable model.
  - **Quality**: Larger models and more thorough responses.
  - **Cost**: Smaller models when possible.
  - **Adaptive ML**: ML-driven strategy selection.
  - **Workflow**: Multi-model workflows.

- **Workflow Mode (shown only when Strategy = Workflow)**
  - **Auto**: Strategy chooses chain vs ensemble.
  - **Chain**: Sequential refinement.
  - **Ensemble**: Parallel voting.

- **Model Selector**
  - Manual model choice when Strategy is OFF.
  - When Strategy is ON, the selected model is disabled and the auto-picked model is shown.

- **Tools Toggle**
  - Controls tool usage for inference.
  - ON uses the full tool chain; OFF prefers fast streaming responses.

- **Voice Toggle**
  - Enables/disables voice loop (STT/TTS).

- **Memory Toggle (Consent)**
  - Controls long-term profile usage. This is privacy-sensitive and requires explicit consent.
  - OFF clears the stored profile and its embeddings.

## Memory Features (Detailed)

Memory is split into two layers:

1. **Conversation Memory** (always local)
2. **Profile Memory** (explicit consent only)

### 1) Conversation Memory

Conversation memory stores chat history and embeddings for retrieval:

- Stored in SQLite (messages, conversations).
- Embedded in Chroma for semantic search.
- Retrieval is scoped to the current conversation first, then falls back to global memory.
- Used to augment prompts with relevant context blocks.

**Key behavior:**
- Message embeddings are added asynchronously after saving messages.
- Retrieval pulls only relevant results above similarity thresholds.
- Memory context is appended to the system prompt (domain prompts are preserved).

### 2) Profile Memory (Consent-Gated)

Profile memory is a single, local record of long-term preferences and context. It does **not** auto-update. It is only used if you explicitly consent.

**Consent rules:**
- Consent is stored in SQLite preferences (`memory_profile_consent`).
- **If consent is OFF:** profile is not retrieved or used.
- **If consent is turned OFF:** profile data and its embeddings are deleted.

**Why this matters:**
- Keeps long-term personalization strictly opt-in.
- Prevents unexpected cross-session personalization.

### Conversation Summaries

Conversation summaries are designed for hierarchical memory:

- Stored in `conversation_summaries`.
- Kept in sync with `conversations.summary`.
- Embedded into Chroma under `content_type = conversation_summary`.
- Retrieved alongside messages to provide distilled context.

**Summary embedding helps:**
- Reduce token noise.
- Improve relevance when long chats become dense.

## Data Storage (Local Only)

**SQLite tables:**
- `conversations` (includes `summary`)
- `messages`
- `conversation_summaries`
- `user_profile`
- `user_preferences`

**Chroma embeddings:**
- `content_type = message`
- `content_type = conversation_summary`
- `content_type = user_profile`

## Privacy & Security Notes

- This system is local-first; no remote profile sharing.
- Profile memory requires explicit consent.
- Consent can be revoked any time; the profile is wiped immediately.
- Conversation memory remains local and scoped to chats.

## Implementation Notes

- Left toolbar lives in `components/LeftToolbar.tsx`.
- Consent API lives in `app/api/memory/consent/route.ts`.
- Memory management in `app/lib/memory/index.ts`.
- RAG retrieval in `app/lib/memory/rag`.

If you want help wiring additional privacy controls (e.g., “forget this conversation”), say the word.
