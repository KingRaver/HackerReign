// app/api/llm/route.ts - Full Tool Integration
import { NextRequest, NextResponse } from 'next/server';
import { getTools, executeTools } from '../../lib/tools';
import type { ChatCompletionMessage } from 'openai/resources/chat';

export async function POST(req: NextRequest) {
  try {
    const { model = 'qwen2.5-coder:7b-instruct-q5_K_M', messages, stream = true }: {
      model?: string;
      messages: ChatCompletionMessage[];
      stream?: boolean;
    } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Tool support: Add tools if model supports (Qwen2.5/Llama3.2 do)
    const tools = getTools();
    const body: any = {
      model,
      messages: [
        {
          role: 'system',
          content: `CRITICAL: PLAIN TEXT ONLY. NO markdown. NO backticks. NO lists. NO code blocks.

You are Hacker Reign - friendly coding expert. Sound human. 1-3 sentences max.

TOOLS: You have access to weather, calculator, and code execution tools. Use them when appropriate.

EXAMPLES:
print hello -> print("Hello World")
react hook -> useState(0)
api route -> app/api/route.ts export POST(req)
weather NYC -> Use get_weather tool

Plain text responses only. Be direct and helpful.`
        },
        ...messages.slice(-10)
      ],
      tools, // ✅ Add tools dynamically
      tool_choice: 'auto', // Let model decide
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
    let response = await fetch(url, {
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

    // ✅ TOOL LOOPING (non-stream only for simplicity)
    if (!stream) {
      let data = await response.json();
      let allMessages = body.messages;

      // Loop until no more tool calls
      while (data.choices[0].message.tool_calls?.length) {
        const toolCalls = data.choices[0].message.tool_calls;
        allMessages.push(data.choices[0].message);
        allMessages = await executeTools(toolCalls, allMessages);
        
        // Re-call LLM with tool results
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama' },
          body: JSON.stringify({ model, messages: allMessages, stream: false })
        });
        
        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        data = await response.json();
      }

      return NextResponse.json(data.choices[0].message);
    }

    // Stream unchanged
    return new Response(response.body, {
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('LLM API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error' 
    }, { status: 500 });
  }
}
