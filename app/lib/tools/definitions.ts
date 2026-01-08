// lib/tools/definitions.ts - JSON Schemas
import type { ChatCompletionTool } from 'openai/resources';

export const weatherTool: ChatCompletionTool[] = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name (e.g., "New York")'
        }
      },
      required: ['city']
    }
  }
}];

export const calcTool: ChatCompletionTool[] = [{
  type: 'function',
  function: {
    name: 'calculator',
    description: 'Perform basic math operations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression (e.g., "15 * 7 + 3")'
        }
      },
      required: ['expression']
    }
  }
}];

export const codeExecTool: ChatCompletionTool[] = [{
  type: 'function',
  function: {
    name: 'code_exec',
    description: 'Execute safe Python code snippets',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code to execute'
        }
      },
      required: ['code']
    }
  }
}];