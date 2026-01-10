import { NextRequest, NextResponse } from 'next/server';
import { getMemoryManager } from '../../lib/memory';
import { getTools, executeTools } from '../../lib/tools';
import { buildContextForLLMCall } from '../../lib/domain/contextBuilder';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama'
});

export const runtime = 'nodejs'; // Required for SQLite/Chroma

export async function POST(req: NextRequest) {
  try {
    const {
      model = 'qwen2.5-coder:7b-instruct-q5_K_M',
      messages,
      stream = true,
      enableTools = false,
      conversationId = null,
      useMemory = true, // Enable memory augmentation
      filePath, // Optional: file path for domain detection
      manualModeOverride, // Optional: user-selected mode ('learning' | 'code-review' | 'expert')
    } = await req.json();

    const memory = getMemoryManager();

    // Initialize memory system if not already initialized
    await memory.initialize();

    // Create conversation if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const conversation = memory.createConversation(
        `Chat - ${new Date().toLocaleString()}`,
        model
      );
      currentConversationId = conversation.id;
    }

    // ============================================================
    // CONTEXT BUILDING: Build domain-aware system prompt
    // ============================================================
    const lastUserMessage = messages[messages.length - 1];

    // Build context with domain detection
    const llmContext = await buildContextForLLMCall(
      lastUserMessage?.content || '',
      filePath,
      manualModeOverride
    );

    // Get base system prompt from domain context, but add natural language rules
    let systemPrompt = llmContext.systemPrompt + `

CRITICAL OUTPUT FORMAT RULES:
- NO markdown syntax (no *, #, \`, [], etc)
- NO code blocks or backticks
- NO lists with bullets or numbers
- NO formatting symbols
- Just plain conversational text

For code: write it inline like this -> print("hello") or useState(0)
For explanations: use natural sentences with commas and periods

Keep responses 1-3 sentences per concept. Be direct and helpful.`;

    let temperature = llmContext.temperature;
    let maxTokens = llmContext.maxTokens;

    // ============================================================
    // MEMORY AUGMENTATION: Retrieve past context
    // ============================================================
    // Augment prompt with memory if enabled and this is a user message
    if (useMemory && lastUserMessage?.role === 'user') {
      try {
        const augmented = await memory.augmentWithMemory(lastUserMessage.content);

        // Only include context if we found relevant memories
        if (augmented.retrieved_context.length > 0) {
          // Append memory context to the domain-aware system prompt
          systemPrompt = augmented.enhanced_system_prompt;

          // Log what was retrieved (for debugging)
          console.log('[Memory] Retrieved context:');
          console.log(memory.formatContextForLogging(augmented));
        }
      } catch (error) {
        console.warn('[Memory] Error augmenting prompt:', error);
        // Continue without memory augmentation
      }
    }

    // ============================================================
    // DL CODE GENERATION: Get neural network predictions
    // ============================================================
    let dlSuggestion: string | null = null;
    const enableDL = process.env.ENABLE_DL_PREDICTIONS !== 'false'; // Enabled by default

    if (enableDL && lastUserMessage?.role === 'user') {
      try {
        // Get conversation history for context
        const contextMessages = messages.slice(-3)
          .filter((m: any) => m.role === 'assistant')
          .map((m: any) => m.content);

        const dlResponse = await fetch('http://localhost:3000/api/dl-codegen/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: lastUserMessage.content,
            context: contextMessages
          })
        });

        if (dlResponse.ok) {
          const dlResult = await dlResponse.json();
          if (dlResult.success && dlResult.prediction.confidence > 0.5) {
            dlSuggestion = dlResult.prediction.completion;
            console.log('[DL] Neural network suggestion:', dlSuggestion,
                       `(confidence: ${(dlResult.prediction.confidence * 100).toFixed(1)}%)`);

            // Inject DL suggestion into system prompt
            systemPrompt += `\n\n[Neural Network Code Suggestion: "${dlSuggestion}" - Consider this if relevant to the user's request]`;
          }
        }
      } catch (error) {
        console.warn('[DL] Error getting neural network prediction:', error);
        // Continue without DL augmentation
      }
    }

    // ============================================================
    // PREPARE MESSAGES FOR LLM
    // ============================================================
    const enhancedMessages: ChatCompletionMessageParam[] = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...messages.slice(-10), // Keep last 10 messages for context window
    ];

    // ============================================================
    // SAVE USER MESSAGE TO MEMORY
    // ============================================================
    if (lastUserMessage?.role === 'user') {
      try {
        await memory.saveMessage(
          currentConversationId,
          'user',
          lastUserMessage.content
        );
      } catch (error) {
        console.warn('[Memory] Error saving user message:', error);
      }
    }

    // ============================================================
    // CALL LLM
    // ============================================================

    // For streaming: use fetch for manual control
    if (stream) {
      const body: any = {
        model,
        messages: enhancedMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 0.85,
        stream: true,
        options: {
          num_thread: 12,
          num_gpu: 99,
          num_ctx: 8192, // Reduced from 16384 for faster processing
          repeat_penalty: 1.2,
          num_batch: 512,
          num_predict: maxTokens,
        },
      };

      if (enableTools) {
        const tools = getTools();
        body.tools = tools;
        body.tool_choice = 'auto';
      }

      const url = 'http://localhost:11434/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama error: ${response.status} - ${error}`);
      }

    // ============================================================
    // HANDLE STREAMING RESPONSE
    // ============================================================
      // For streaming, collect the response and save to memory after
      let fullContent = '';

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              const reader = response.body?.getReader();
              if (!reader) throw new Error('No response body');

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const json = JSON.parse(line.slice(6));
                      const content = json.choices[0]?.delta?.content || '';
                      if (content) {
                        fullContent += content;
                        controller.enqueue(new TextEncoder().encode(line + '\n'));
                      }
                    } catch {
                      // Invalid JSON, skip
                    }
                  }
                }
              }

              // ============================================================
              // SAVE ASSISTANT RESPONSE TO MEMORY (after streaming)
              // ============================================================
              if (fullContent) {
                try {
                  await memory.saveMessage(
                    currentConversationId,
                    'assistant',
                    fullContent,
                    { model_used: model }
                  );
                } catch (error) {
                  console.warn('[Memory] Error saving assistant message:', error);
                }
              }

              controller.close();
            } catch (error) {
              console.error('[Stream] Error:', error);
              controller.error(error);
            }
          },
        }),
        {
          headers: { 'Content-Type': 'text/event-stream' },
        }
      );
    }

    // ============================================================
    // HANDLE NON-STREAMING RESPONSE (using OpenAI SDK)
    // ============================================================
    // Use OpenAI SDK for non-streaming with proper types
    const completion = await openai.chat.completions.create({
      model,
      messages: enhancedMessages,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 0.85,
      stream: false,
      tools: enableTools ? getTools() : undefined,
      tool_choice: enableTools ? 'auto' : undefined,
      // @ts-ignore - Ollama-specific options
      num_ctx: 8192, // Reduced from 16384 for faster processing
      num_thread: 12,
      num_gpu: 99,
    } as any); // Cast to any for Ollama-specific options compatibility

    let currentCompletion = completion;
    let allMessages = enhancedMessages;

    // Tool looping with OpenAI SDK
    if (enableTools) {
      let loopCount = 0;
      const maxLoops = 5;

      while (true) {
        const message = currentCompletion.choices[0].message;

        // Check for proper tool_calls format
        if (message.tool_calls?.length) {
          loopCount++;
          if (loopCount > maxLoops) {
            throw new Error('Max tool loop iterations reached');
          }

          const toolCalls = message.tool_calls;
          allMessages.push(message as ChatCompletionMessageParam);
          allMessages = await executeTools(toolCalls as any, allMessages);

          // Make another call with the updated messages
          currentCompletion = await openai.chat.completions.create({
            model,
            messages: allMessages,
            stream: false,
          } as any);
          continue;
        }

        // WORKAROUND: Ollama returns tool calls as text content
        // Try to parse content as a tool call
        if (message.content && typeof message.content === 'string') {
          const content = message.content.trim();

          // Check if content looks like a tool call JSON
          if ((content.startsWith('{') && content.includes('"name"')) ||
              (content.startsWith('```json') && content.includes('"name"'))) {
            try {
              // Extract JSON from code blocks if present
              let jsonStr = content;
              if (content.startsWith('```')) {
                const match = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
                if (match) jsonStr = match[1];
              }

              const toolCall = JSON.parse(jsonStr);

              if (toolCall.name && toolCall.arguments) {
                loopCount++;
                if (loopCount > maxLoops) {
                  throw new Error('Max tool loop iterations reached');
                }

                console.log('[Tool Workaround] Detected tool call in content:', toolCall.name);

                // Convert to proper tool_calls format
                const syntheticToolCall = {
                  id: `call_${Date.now()}`,
                  type: 'function' as const,
                  function: {
                    name: toolCall.name,
                    arguments: JSON.stringify(toolCall.arguments)
                  }
                };

                // Add assistant message without the tool call content
                allMessages.push({
                  role: 'assistant',
                  content: null,
                  tool_calls: [syntheticToolCall]
                } as any);

                // Execute the tool
                allMessages = await executeTools([syntheticToolCall] as any, allMessages);

                // Make another call with the updated messages
                currentCompletion = await openai.chat.completions.create({
                  model,
                  messages: allMessages,
                  stream: false,
                } as any);
                continue;
              }
            } catch (e) {
              // Not a valid tool call JSON, treat as normal content
              console.log('[Tool Workaround] Content is not a valid tool call:', e);
            }
          }
        }

        // No tool calls found, exit loop
        break;
      }
    }

    const assistantMessage = currentCompletion.choices[0].message.content || '';

    // ============================================================
    // SAVE ASSISTANT RESPONSE TO MEMORY (non-streaming)
    // ============================================================
    try {
      await memory.saveMessage(
        currentConversationId,
        'assistant',
        assistantMessage,
        { model_used: model }
      );
    } catch (error) {
      console.warn('[Memory] Error saving assistant message:', error);
    }

    // Return response with conversation ID
    return NextResponse.json({
      ...currentCompletion.choices[0].message,
      conversationId: currentConversationId,
    });
  } catch (error: any) {
    console.error('[LLM API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}