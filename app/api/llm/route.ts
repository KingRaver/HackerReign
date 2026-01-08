import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import type * as OpenAIType from 'openai';

// ✅ Type-safe Ollama options injection
const openai = new OpenAI({ 
  baseURL: 'http://localhost:11434/v1', 
  apiKey: 'ollama',
  timeout: 120000 
});

// ✅ Edge stream polyfill (captures full content)
class OpenAIStream {
  static create(
    completion: any, 
    opts: { onCompletion?: (text: string) => void } = {}
  ) {
    const encoder = new TextEncoder();
    let fullContent = '';
    
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion as any) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullContent += content;
            if (content) controller.enqueue(encoder.encode(content));
          }
          controller.close();
          opts.onCompletion?.(fullContent);
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { model = 'qwen2.5-coder:7b-instruct-q5_K_M', messages, stream = true } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // ✅ FIXED: Direct HTTP for Ollama options (bypasses TS)
    const url = `http://localhost:11434/v1/chat/completions`;
    const body = {
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.1,
      top_p: 0.9,
      stream,
      options: {  // ✅ Direct Ollama param
        num_thread: 10,
        num_gpu: 99,
        num_ctx: 8192,
        repeat_penalty: 1.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ollama'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    if (stream) {
      // ✅ Perfect streaming via native fetch
      return new Response(response.body, {
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Non-stream: parse JSON
    const data = await response.json();
    return NextResponse.json(data.choices[0].message);

  } catch (error: any) {
    console.error('LLM API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error' 
    }, { status: 500 });
  }
}
