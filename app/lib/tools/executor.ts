// lib/tools/executor.ts - Fixed role type issue
import type { ChatCompletionMessageParam, ChatCompletionToolMessageParam } from 'openai/resources/chat';

type ChatCompletionMessageToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

type FunctionArguments = Record<string, any>;

export async function executeTools(
  toolCalls: ChatCompletionMessageToolCall[],
  messages: ChatCompletionMessageParam[]
): Promise<ChatCompletionMessageParam[]> {
  
  for (const toolCall of toolCalls) {
    if (toolCall.type !== 'function') {
      console.warn('Non-function tool call:', toolCall);
      continue;
    }

    const toolFn = toolCall.function;
    const toolName = toolFn.name;
    
    try {
      const module = await import(`./handlers/${toolName}`);
      const handler = module.default as (args: FunctionArguments) => Promise<any>;
      
      if (!handler) {
        throw new Error(`No default handler in ${toolName}`);
      }
      
      let args: FunctionArguments;
      try {
        args = JSON.parse(toolFn.arguments ?? '{}');
      } catch {
        throw new Error('Invalid tool arguments JSON');
      }
      
      const result = await handler(args);

      // Use type assertion - SDK allows 'tool' role for tool responses
      const toolMessage: ChatCompletionToolMessageParam = {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: typeof result === 'string' ? result : JSON.stringify(result)
      };
      messages.push(toolMessage);
      
    } catch (error) {
      console.error(`Tool ${toolName} failed:`, error);

      const errorMessage: ChatCompletionToolMessageParam = {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: error instanceof Error ? error.message : 'Execution failed'
        })
      };
      messages.push(errorMessage);
    }
  }
  
  return messages;
}