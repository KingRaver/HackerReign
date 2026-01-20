// app/lib/strategy/implementations/adaptiveStrategy.ts
import { BaseStrategy } from '../baseStrategy';
import { StrategyAnalytics } from '../analytics/tracker';
import { patternRecognizer } from '@/app/lib/learning/patternRecognition';
import { parameterTuner } from '@/app/lib/learning/parameterTuner';
import {
  StrategyDecision,
  StrategyContext,
  PerformanceMetrics,
  ModelMetrics,
  SystemResourceInfo
} from '../types';

/**
 * Adaptive Strategy (ML-Driven)
 * Uses historical analytics + user feedback to predict optimal model
 * Basic version - learns from past performance
 */

export class AdaptiveStrategy extends BaseStrategy {
  name = 'adaptive';
  priority = 110;  // Highest priority
  type = 'adaptive';

  private analytics = new StrategyAnalytics();

  async decide(context: StrategyContext): Promise<StrategyDecision> {
    const complexity = context.complexityScore || 50;
    const mode = context.detectedMode || 'code-review';

    try {
      // 1. Detect conversation theme using pattern recognition
      const themeDetection = await patternRecognizer.detectTheme(context.userMessage);
      console.log(`[Adaptive] Theme detected: ${themeDetection.primaryTheme} (confidence: ${themeDetection.confidence.toFixed(2)})`);

      // 2. Get historical performance data
      const [strategyPerf, modelPerf7B, modelPerf16B] = await Promise.all([
        this.analytics.getStrategyPerformance('balanced'),
        this.analytics.getModelPerformance('qwen2.5-coder:7b-instruct-q5_K_M'),
        this.analytics.getModelPerformance('deepseek-v2:16b-instruct-q4_K_M')
      ]);

      // 3. Get learned parameter recommendations
      const parameterRec = await parameterTuner.getRecommendation(
        themeDetection.primaryTheme,
        complexity
      );
      console.log(`[Adaptive] Parameter tuning: ${parameterRec.reasoning}`);

      // 4. Calculate recommendation score with theme awareness
      const recommendation = this.calculateOptimalModel(
        complexity,
        mode,
        strategyPerf,
        modelPerf7B,
        modelPerf16B,
        context.systemResources,
        themeDetection,
        parameterRec
      );

      const decision: StrategyDecision = {
        id: this.generateId(),
        strategyName: this.name,
        timestamp: new Date(),
        selectedModel: recommendation.model,
        fallbackModels: recommendation.confidence < 0.7 ? [recommendation.alternative] : undefined,
        temperature: recommendation.temperature,
        maxTokens: recommendation.maxTokens,
        streaming: true,
        enableTools: recommendation.enableTools,
        maxToolLoops: 3,
        reasoning: recommendation.reasoning,
        confidence: recommendation.confidence,
        complexityScore: complexity,
        metadata: {
          historicalSuccessRate: modelPerf7B.successRate,
          resourceConstrained: this.isResourceConstrained(context),
          detectedTheme: themeDetection.primaryTheme,
          themeConfidence: themeDetection.confidence,
          parameterLearningConfidence: parameterRec.confidence,
          strategyPerfMetrics: {
            avgQuality: strategyPerf.averageQuality,
            totalDecisions: strategyPerf.totalDecisions
          }
        }
      };

      console.log(`[Adaptive] Selected ${decision.selectedModel} (conf: ${decision.confidence.toFixed(2)}) - ${decision.reasoning}`);

      return decision;

    } catch (error) {
      console.warn('[Adaptive] ML lookup failed, falling back to complexity:', error);
      // Fallback to complexity strategy
      const fallback = new (await import('./complexityStrategy')).ComplexityStrategy();
      return fallback.decide(context);
    }
  }

  private calculateOptimalModel(
    complexity: number,
    mode: string,
    strategyPerf: PerformanceMetrics,
    model7B: ModelMetrics,
    model16B: ModelMetrics,
    resources: SystemResourceInfo,
    themeDetection?: { primaryTheme: string; confidence: number; suggestedModel: string; suggestedTemperature: number },
    parameterRec?: { temperature: number; maxTokens: number; enableTools: boolean; confidence: number }
  ): {
    model: string;
    alternative: string;
    temperature: number;
    maxTokens: number;
    enableTools: boolean;
    reasoning: string;
    confidence: number;
  } {
    const isConstrained = resources.availableRAM < 10000 || resources.cpuUsage > 75;

    // Historical success rates (weighted by recency/complexity match)
    let score7B = model7B.successRate * (1 - Math.min(complexity / 200, 0.3));
    let score16B = model16B.successRate * (1 + Math.min(complexity / 300, 0.4));

    // If we have high-confidence theme detection, boost the suggested model's score
    if (themeDetection && themeDetection.confidence > 0.7) {
      const themeBoost = 0.15 * themeDetection.confidence;
      if (themeDetection.suggestedModel.includes('7b')) {
        score7B += themeBoost;
      } else if (themeDetection.suggestedModel.includes('16b')) {
        score16B += themeBoost;
      }
    }

    let model, alternative, confidence, reasoning, temperature;

    if (isConstrained || score7B > score16B * 0.9) {
      // Prefer 7B for cost/speed or proven performance
      model = 'qwen2.5-coder:7b-instruct-q5_K_M';
      alternative = 'deepseek-v2:16b-instruct-q4_K_M';
      confidence = score7B;
      reasoning = `7B proven (${score7B.toFixed(2)}) vs 16B (${score16B.toFixed(2)})`;
    } else {
      // Escalate to 16B for complex tasks
      model = 'deepseek-v2:16b-instruct-q4_K_M';
      alternative = 'qwen2.5-coder:7b-instruct-q5_K_M';
      confidence = score16B;
      reasoning = `16B better for complexity ${complexity} (${score16B.toFixed(2)})`;
    }

    // Use learned parameters if confidence is high, otherwise use theme or heuristics
    if (parameterRec && parameterRec.confidence > 0.7) {
      temperature = parameterRec.temperature;
    } else if (themeDetection && themeDetection.confidence > 0.7) {
      temperature = themeDetection.suggestedTemperature;
    } else {
      temperature = complexity > 70 ? 0.5 : 0.3;
    }

    const maxTokens = parameterRec && parameterRec.confidence > 0.7
      ? parameterRec.maxTokens
      : (isConstrained ? 6000 : 12000);

    const enableTools = parameterRec && parameterRec.confidence > 0.7
      ? parameterRec.enableTools
      : complexity > 50;

    const themeInfo = themeDetection
      ? ` | theme: ${themeDetection.primaryTheme}`
      : '';

    const modeInfo = mode !== 'code-review' ? ` | mode: ${mode}` : '';
    const strategyInfo = strategyPerf.totalDecisions > 10
      ? ` | strategy quality: ${strategyPerf.averageQuality.toFixed(2)}`
      : '';

    return {
      model,
      alternative,
      temperature,
      maxTokens,
      enableTools,
      reasoning: `${reasoning} | constrained: ${isConstrained}${themeInfo}${modeInfo}${strategyInfo}`,
      confidence: Math.min(0.98, confidence)
    };
  }

  // Learn from feedback (called post-response)
  async updateFromFeedback(
    decisionId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    qualityScore?: number
  ): Promise<void> {
    // Update database with feedback for future learning
    await this.analytics.logOutcome(decisionId, {
      decisionId,
      responseQuality: qualityScore || (feedback === 'positive' ? 0.9 : feedback === 'negative' ? 0.4 : 0.7),
      userFeedback: feedback,
      responseTime: 0, // Filled by caller
      tokensUsed: 0,
      errorOccurred: feedback === 'negative',
      retryCount: 0
    });
  }
}
