// lib/tools/index.ts - Fixed: Remove unused import, use correct path
import type { ChatCompletionTool } from 'openai/resources';

export const getTools = (): ChatCompletionTool[] => [
  ...(require('./definitions').weatherTool as ChatCompletionTool[]),
  ...(require('./definitions').calcTool as ChatCompletionTool[]),
  ...(require('./definitions').codeExecTool as ChatCompletionTool[]),
];

export type ToolName = 'get_weather' | 'calculator' | 'code_exec';
export { executeTools } from './executor';