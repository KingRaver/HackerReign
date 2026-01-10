// app/lib/strategy/baseStrategy.ts
import { StrategyDecision, StrategyContext, StrategyOutcome } from './types';

/**
 * Base Strategy Class
 * Abstract class for all strategy implementations
 */

export abstract class BaseStrategy {
  abstract name: string;
  abstract priority: number; // Higher = preferred
  abstract type: string; // 'balanced', 'speed', etc.

  // Core decision method
  abstract decide(context: StrategyContext): Promise<StrategyDecision>;

  // Optional hooks
  async preProcess(context: StrategyContext): Promise<void> {
    // Override for pre-processing (caching, validation, etc.)
  }

  async postProcess(decision: StrategyDecision): Promise<void> {
    // Override for post-processing (logging, validation, etc.)
  }

  // Analytics integration
  async recordDecision(
    decision: StrategyDecision,
    outcome: StrategyOutcome
  ): Promise<void> {
    // Default implementation - override for custom analytics
    console.log(`[Strategy:${this.name}] Decision recorded:`, {
      model: decision.selectedModel,
      confidence: decision.confidence,
      complexity: decision.complexityScore
    });
  }

  // Utility methods
  protected calculateComplexityScore(context: StrategyContext): number {
    return context.complexityScore || 50;
  }

  protected isResourceConstrained(context: StrategyContext): boolean {
    const resources = context.systemResources;
    return resources.availableRAM < 8000 || // <8GB
           resources.cpuUsage > 80 ||
           resources.onBattery;
  }

  protected selectModelBySize(
    size: '3B' | '7B' | '16B',
    availableModels: string[]
  ): string {
    const modelMap: Record<string, string> = {
      '3B': 'llama3.2:3b-instruct-q5_K_M',
      '7B': 'qwen2.5-coder:7b-instruct-q5_K_M',
      '16B': 'deepseek-v2:16b-instruct-q4_K_M'
    };
    return availableModels.find(m => m.includes(size)) || 
           availableModels[0] || 'qwen2.5-coder:7b-instruct-q5_K_M';
  }

  protected generateId(): string {
    return `dec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
