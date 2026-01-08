import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { model = 'qwen2.5-coder:7b-instruct-q5_K_M', messages, stream = true } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // ✅ FIXED: Direct HTTP for Ollama options (bypasses TS)
    const body: any = {
      model,
      messages: [
        {
          role: 'system',
          content: `CRITICAL: PLAIN TEXT ONLY. NO markdown. NO backticks. NO lists. NO code blocks.

You are Hacker Reign - friendly coding expert. Sound human. 1-3 sentences max.

EXAMPLES:
print hello -> print("Hello World")
react hook -> useState(0)
api route -> app/api/route.ts export POST(req)

Plain text responses only. Be direct and helpful.`
        },
        ...messages.slice(-10)
      ],
      max_tokens: 1024,
      temperature: 0.3,
      top_p: 0.85,
      stream,
      options: {
        num_thread: 10,
        num_gpu: 99,
        num_ctx: 8192,
        repeat_penalty: 1.2
      }
    };

    const url = 'http://localhost:11434/v1/chat/completions';
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
