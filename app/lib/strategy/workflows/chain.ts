// app/lib/strategy/workflows/chain.ts
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import { ModelChainConfig, ModelChainStep } from '../types';

/**
 * Model Chaining Workflow - COMPLETE IMPLEMENTATION
 * Fast draft → Quality refine → Expert review pipeline
 * Uses fetch directly (like streaming endpoint) to avoid SDK timeout issues
 */

export class ModelChainWorkflow {
  /**
   * Execute full chaining pipeline
   */
  static async executeChain(
    config: ModelChainConfig,
    messages: ChatCompletionMessageParam[],
    options: {
      maxTotalTokens?: number;
      timeoutMs?: number;
      mergeStrategy?: 'last' | 'concat' | 'refined';
    } = {}
  ): Promise<{
    finalResponse: string;
    chainResults: ChainStepResult[];
    totalTokens: number;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const maxTokens = options.maxTotalTokens || 25000;
    let totalTokens = 0;
    let chainResults: ChainStepResult[] = [];
    let currentResponse = '';

    console.log(`[Chain] Starting ${config.steps.length}-step chain`);

    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      const stepStart = Date.now();

      try {
        const stepResult = await this.executeChainStep(
          step,
          messages,
          currentResponse,
          i === config.steps.length - 1 // Last step?
        );

        chainResults.push(stepResult);
        currentResponse = stepResult.output;
        totalTokens += stepResult.tokensUsed;

        console.log(`[Chain:${step.role}] ${stepResult.tokensUsed}t | conf: ${stepResult.confidence?.toFixed(2)}`);

        // Early termination
        if (totalTokens > maxTokens || stepResult.confidence && stepResult.confidence < 0.3) {
          console.log(`[Chain] Early stop: tokens=${totalTokens}, conf=${stepResult.confidence}`);
          break;
        }

      } catch (error: any) {
        console.error(`[Chain:${step.role}] Error:`, error);
        console.error(`[Chain:${step.role}] Error details:`, {
          message: error.message,
          status: error.status,
          code: error.code,
          type: error.type,
          model: step.model
        });

        // Continue with error message - include model info for debugging
        chainResults.push({
          model: step.model,
          role: step.role,
          output: `ERROR in ${step.role} (model: ${step.model}): ${error.message || error}\n\nThis may indicate the model is not loaded. Try running: ollama pull ${step.model}`,
          tokensUsed: 50,
          confidence: 0,
          timeMs: Date.now() - stepStart
        });
      }
    }

    const finalResponse = this.mergeChainResults(chainResults, config.mergeStrategy || 'vote');
    const executionTime = Date.now() - startTime;

    return {
      finalResponse,
      chainResults,
      totalTokens,
      executionTime
    };
  }

  private static async executeChainStep(
    step: ModelChainStep,
    baseMessages: ChatCompletionMessageParam[],
    previousOutput: string,
    isFinalStep: boolean
  ): Promise<ChainStepResult> {
    const stepStart = Date.now();

    // Dynamic system prompt for each role
    const rolePrompts: Record<string, string> = {
      draft: `QUICK DRAFT MODE. Generate a fast working version. Focus on core functionality, ignore edge cases. Be concise.`,
      refine: `REFINE MODE. Improve this draft:\n\n"""${previousOutput}"""\n\nMake it production-ready: better error handling, type safety, best practices, readability.`,
      validate: `VALIDATE MODE. Check this code:\n\n"""${previousOutput}"""\n\nList ALL issues, bugs, security problems, performance issues. Rate confidence 0-1.`,
      review: `EXPERT REVIEW MODE. Final polish:\n\n"""${previousOutput}"""\n\nCheck edge cases, scalability, maintainability. Suggest final improvements.`,
      critique: `CRITIC MODE. Be brutally honest:\n\n"""${previousOutput}"""\n\nFind every flaw, code smell, anti-pattern. No sugarcoating.`
    };

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${rolePrompts[step.role]} ${isFinalStep ? 'This is FINAL OUTPUT - make it perfect.' : ''} 
                 Respond ONLY with improved code or analysis. No chit-chat.`
      },
      ...baseMessages.slice(-8), // Context window
      {
        role: 'user',
        content: previousOutput || 'Start from scratch.'
      }
    ];

    // Use fetch directly like the streaming endpoint does - no timeout issues
    const body = {
      model: step.model,
      messages,
      max_tokens: step.maxTokens || (isFinalStep ? 6000 : 3000),
      temperature: step.temperature || (isFinalStep ? 0.3 : 0.6),
      top_p: 0.9,
      stream: false,
      options: {
        num_thread: 12,
        num_gpu: 99,
        num_ctx: 8192,
        repeat_penalty: 1.2,
        num_batch: 512,
        num_predict: step.maxTokens || (isFinalStep ? 6000 : 3000)
      }
    };

    // Undici is configured globally in instrumentation.ts with no timeouts
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${response.status} - ${error}`);
    }

    const completion = await response.json();

    const output = completion.choices[0].message.content?.trim() || '';
    const tokensUsed = completion.usage?.total_tokens || output.length / 4;

    // Extract confidence if present
    const confMatch = output.match(/confidence[:\s]*([0-9.]+)/i);
    const confidence = confMatch ? parseFloat(confMatch[1]) : 0.7;

    return {
      model: step.model,
      role: step.role,
      output,
      tokensUsed,
      confidence,
      timeMs: Date.now() - stepStart
    };
  }

  private static mergeChainResults(
    results: ChainStepResult[],
    strategy: 'last' | 'concat' | 'vote'
  ): string {
    switch (strategy) {
      case 'last':
        return results[results.length - 1].output;
      case 'concat':
        return results.map(r => `\n\n${r.role.toUpperCase()}:\n${r.output}`).join('');
      case 'vote':
      default:
        // Take final output, prepend key insights from previous steps
        const final = results[results.length - 1].output;
        const insights = results.slice(0, -1)
          .filter(r => r.confidence! > 0.6)
          .map(r => `(${r.role}): ${r.output.slice(0, 100)}...`)
          .join('\n');
        return insights ? `${insights}\n\n${'='.repeat(60)}\n\nFINAL:\n${final}` : final;
    }
  }
}

export interface ChainStepResult {
  model: string;
  role: string;
  output: string;
  tokensUsed: number;
  confidence?: number;
  timeMs: number;
}