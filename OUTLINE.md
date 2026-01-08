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
│   ├── api/llm/route.ts       # ← Ollama proxy (server)
│   └── page.tsx              # ← <Chat /> wrapper
├── components/
│   └── Chat.tsx              # ← UI + model selector
├── package.json              # openai, next, react, tailwind
├── tsconfig.json             # @/* paths: ["./*"]
└── tailwind.config.ts
```

## ⚡ **QUICK START** (3 Terminals)
```bash
# T1: Ollama (models)
ollama serve
# Pulls complete: llama3.2:3b ✅, qwen2.5:7b ✅, qwen2.5-coder:7b ✅

# T2: App
cd hackerreign
npm run dev                    # http://localhost:3000

# T3: (optional) Warm models
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
```tsx
'use client';
import { useState, useRef, useEffect } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function Chat() {
  const [model, setModel

 