# Context-Aware Memory Upgrade Plan

This document turns the proposed memory improvements into a clear, reviewable plan. It does **not** change runtime behavior yet.

## Goals

- Improve relevance and context-awareness without breaking the existing memory flow.
- Preserve privacy (local, single-user) and explicit consent for long-term profile memory.
- Make changes incremental and reversible via feature flags.

## Baseline (Current State)

**Flow (today):**
- `saveMessage` → async embed → Chroma vector search → memory block appended to system prompt.
- Retrieval is dense-only and scoped to conversation first (then global fallback).
- Memory context is appended (domain prompt is preserved).
- Summary/profile tables exist and embeddings can be stored.

**Key files:**
- Memory core: `app/lib/memory/index.ts`
- RAG: `app/lib/memory/rag/index.ts`, `app/lib/memory/rag/retrieval.ts`
- Storage: `app/lib/memory/storage/sqlite.ts`
- API: `app/api/llm/route.ts`, `app/api/memory/consent/route.ts`

## Implementation Plan (No Behavior Change Yet)

### 1) Baseline Audit + Diagnostics (Safe)

**Purpose:** Measure before changing behavior.

**Actions:**
- Add retrieval composition logs: count of results from:
  - convo-scoped dense
  - global dense
  - conversation summaries
  - profile
- Record retrieval latency + top similarity.
- Add feature-flag plumbing:
  - `RAG_HYBRID` (off by default)
  - `RAG_CHUNKING` (off by default)
  - `RAG_TOKEN_BUDGET` (default unchanged)

**Risk:** Minimal (read-only logging).

---

### 2) Hierarchical Memory (Summaries + Profile)

**Purpose:** Provide distilled context and long-term preferences without noise.

**Already Implemented (ready to use):**
- Tables:
  - `conversation_summaries`
  - `user_profile`
- Consent gate:
  - `memory_profile_consent` in SQLite preferences.
  - API: `/api/memory/consent`.
- Retrieval includes `content_type` for summaries/profile.

**Remaining work:**
- Decide how summaries are created:
  - Manual (UI trigger or API).
  - Automatic (after each assistant reply).
- Decide how profile updates are authored:
  - Manual text entry (explicit).
  - Derived from a UI form.

**Privacy:**
- Profile used only if consent = true.
- Revoking consent clears profile + embeddings.

---

### 3) Hybrid Retrieval + Lightweight Rerank

**Purpose:** Improve recall for exact terms (identifiers, file names, code symbols).

**Additions:**
- SQLite FTS (BM25) index for messages and later chunks.
- Parallel retrieval:
  - Dense (Chroma)
  - Lexical (FTS/BM25)
- Rerank:
  - score = `α * dense_sim + β * bm25_norm + γ * code_id_match`
  - de-dup by message/chunk id

**Rollout:**
- Guard with `RAG_HYBRID=true`.
- Measure latency + relevance.

**Risk:** Moderate (new index + scoring), but contained by flag.

---

### 4) Chunking + Token Budgeting

**Purpose:** Prevent truncation from hiding relevant content.

**Chunking Strategy:**
- Split messages into:
  - code blocks
  - prose sections
- Store chunk metadata:
  - `content_type=message_chunk`
  - `parent_message_id`
  - `chunk_kind=code|prose`
  - `chunk_index`

**Prompt Assembly:**
- Prefer code chunks when code terms appear in the query.
- Enforce `RAG_TOKEN_BUDGET` (e.g., 800–1200 tokens).

**Rollout:**
- Guard with `RAG_CHUNKING=true`.
- Keep original message embeddings for fallback.

**Risk:** Moderate (new storage + prompt assembly logic).

---

### 5) Hardening + Documentation

**Actions:**
- Migrations for FTS + chunk tables.
- Fallback paths if FTS is missing or fails.
- Update `TOOLBAR.md` and memory docs.
- Add a manual test checklist.

---

## Open Decisions (Before Coding)

1) **Summary trigger**: manual vs automatic?
2) **Token budget**: preferred default?
3) **Feature flags**: env only or user preference?

## Acceptance Criteria

- No regressions in chat flow.
- Memory retrieval still works when all new flags are off.
- Consent is respected (profile never used without opt-in).
- Rerank and chunking improve retrieval quality without large latency spikes.
