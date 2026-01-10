// app/lib/strategy/implementations/speedStrategy.ts
import { BaseStrategy } from '../baseStrategy';
import { StrategyDecision, StrategyContext } from '../types';

export class SpeedStrategy extends BaseStrategy {
  name = 'Speed First';
  priority = 90;
  type = 'speed';

  async decide(context: StrategyContext): Promise<StrategyDecision> {
    const fastModel = this.selectModelBySize('3B', context.availableModels.map(m => m.name));
    
    const decision: StrategyDecision = {
      id: this.generateId(),
      strategyName: this.name,
      timestamp: new Date(),
      selectedModel: fastModel,
      temperature: 0.2,  // Low for consistency
      maxTokens: 3000,   // Reduced
      streaming: true,
      enableTools: false, // Disable unless critical
      maxToolLoops: 1,
      reasoning: `Speed-first strategy. Always using fastest model (${fastModel}) with minimal tokens.`,
      confidence: 0.9,
      complexityScore: context.complexityScore || 0
    };

    return decision;
  }
}