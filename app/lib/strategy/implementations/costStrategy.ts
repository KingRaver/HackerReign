// app/lib/strategy/implementations/costStrategy.ts
import { BaseStrategy } from '../baseStrategy';
import { StrategyDecision, StrategyContext } from '../types';

export class CostStrategy extends BaseStrategy {
  name = 'Cost Optimized';
  priority = 70;
  type = 'cost';

  async decide(context: StrategyContext): Promise<StrategyDecision> {
    const complexity = context.complexityScore || 0;
    let model: string;

    if (complexity < 40) {
      model = this.selectModelBySize('3B', context.availableModels.map(m => m.name));
    } else if (complexity < 80) {
      model = this.selectModelBySize('7B', context.availableModels.map(m => m.name));
    } else {
      // Even for complex, check if recent good performance with smaller model
      model = this.selectModelBySize('7B', context.availableModels.map(m => m.name));
    }

    const decision: StrategyDecision = {
      id: this.generateId(),
      strategyName: this.name,
      timestamp: new Date(),
      selectedModel: model,
      temperature: 0.3,
      maxTokens: 6000,  // Conservative
      streaming: true,
      enableTools: false,
      maxToolLoops: 2,
      reasoning: `Cost-optimized. Selected ${model} (complexity: ${complexity}).`,
      confidence: 0.85,
      complexityScore: complexity
    };

    return decision;
  }
}