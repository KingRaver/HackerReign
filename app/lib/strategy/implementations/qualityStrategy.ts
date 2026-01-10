// app/lib/strategy/implementations/qualityStrategy.ts
import { BaseStrategy } from '../baseStrategy';
import { StrategyDecision, StrategyContext } from '../types';

export class QualityStrategy extends BaseStrategy {
  name = 'Quality First';
  priority = 80;
  type = 'quality';

  async decide(context: StrategyContext): Promise<StrategyDecision> {
    const expertModel = this.selectModelBySize('16B', context.availableModels.map(m => m.name));
    
    const decision: StrategyDecision = {
      id: this.generateId(),
      strategyName: this.name,
      timestamp: new Date(),
      selectedModel: expertModel,
      temperature: 0.6,  // Higher for creativity
      maxTokens: 20000,
      topP: 0.9,
      streaming: true,
      enableTools: true,
      maxToolLoops: 5,
      reasoning: `Quality-first strategy. Using best model (${expertModel}) with full capabilities.`,
      confidence: 0.95,
      complexityScore: context.complexityScore || 0
    };

    return decision;
  }
}