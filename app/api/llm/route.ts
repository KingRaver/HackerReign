// app/api/llm/route.ts - Full Tool Integration
import { NextRequest, NextResponse } from 'next/server';
import { getTools, executeTools } from '../../lib/tools';
import type { ChatCompletionMessage } from 'openai/resources/chat';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('\n[LLM API] ====== New Request ======');

  try {
    const { model = 'qwen2.5-coder:7b-instruct-q5_K_M', messages, stream = true, enableTools = false }: {
      model?: string;
      messages: ChatCompletionMessage[];
      stream?: boolean;
      enableTools?: boolean;
    } = await req.json();

    console.log(`[LLM API] Model: ${model}, Stream: ${stream}, Messages: ${messages?.length || 0}`);

    if (!messages?.length) {
      console.error('[LLM API] No messages provided');
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Tool support: Only add tools if explicitly enabled
    const body: any = {
      model,
      messages: [
        {
          role: 'system',
          content: `You are Hacker Reign - a friendly coding expert. Respond in plain text only.

CRITICAL RULES:
- NO markdown syntax (no *, #, \`, [], etc)
- NO code blocks or backticks
- NO lists with bullets or numbers
- NO formatting symbols
- Just plain conversational text

For code: write it inline like this -> print("hello") or useState(0)
For explanations: use natural sentences with commas and periods

Keep responses 1-3 sentences. Be direct and helpful.`
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

    // Only add tools if requested (significantly improves performance)
    if (enableTools) {
      const tools = getTools();
      body.tools = tools;
      body.tool_choice = 'auto';
      body.messages[0].content += '\n\nTOOLS: You have access to weather, calculator, and code execution tools. Use them when appropriate.';
    }

    const url = 'http://localhost:11434/v1/chat/completions';

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ollama'
        },
        body: JSON.stringify(body)
      });
    } catch (fetchError: any) {
      throw new Error(`Failed to connect to Ollama: ${fetchError.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM API] Ollama error ${response.status}:`, errorText);
      throw new Error(`Ollama error: ${response.status} - ${errorText}`);
    }

    console.log(`[LLM API] Initial request successful (${Date.now() - startTime}ms)`);

    // ✅ TOOL LOOPING (non-stream only for simplicity)
    if (!stream) {
      let data = await response.json();
      let allMessages = body.messages;

      console.log(`[LLM API] Response has ${data.choices[0].message.tool_calls?.length || 0} tool calls`);

      // Loop until no more tool calls
      let loopCount = 0;
      const maxLoops = 5; // Prevent infinite loops

      while (data.choices[0].message.tool_calls?.length) {
        loopCount++;
        console.log(`[LLM API] Tool loop iteration ${loopCount}/${maxLoops}`);

        if (loopCount > maxLoops) {
          console.error('[LLM API] Max tool loop iterations reached');
          throw new Error('Max tool loop iterations reached. Possible infinite loop.');
        }

        const toolCalls = data.choices[0].message.tool_calls;
        console.log(`[LLM API] Processing ${toolCalls.length} tool call(s):`, toolCalls.map((tc: any) => tc.function.name));

        allMessages.push(data.choices[0].message);
        allMessages = await executeTools(toolCalls, allMessages);

        // Re-call LLM with tool results
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama' },
            body: JSON.stringify({ model, messages: allMessages, stream: false })
          });
        } catch (fetchError: any) {
          throw fetchError;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[LLM API] Tool loop Ollama error ${response.status}:`, errorText);
          throw new Error(`Ollama error: ${response.status}`);
        }

        data = await response.json();
        console.log(`[LLM API] Tool loop response has ${data.choices[0].message.tool_calls?.length || 0} more tool calls`);
      }

      console.log(`[LLM API] Tool execution complete after ${loopCount} iterations. Total time: ${Date.now() - startTime}ms`);
      return NextResponse.json(data.choices[0].message);
    }

    // Stream unchanged
    console.log(`[LLM API] Returning stream response. Time: ${Date.now() - startTime}ms`);
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
    const duration = Date.now() - startTime;
    console.error(`[LLM API] ====== Error after ${duration}ms ======`);
    console.error('[LLM API] Error details:', error);
    console.error('[LLM API] Stack trace:', error.stack);

    return NextResponse.json({
      error: error.message || 'Server error',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
