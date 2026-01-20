// app/lib/strategy/implementations/workflowStrategy.ts
import { BaseStrategy } from '../baseStrategy';
import { StrategyAnalytics } from '../analytics/tracker';
import { patternRecognizer } from '@/app/lib/learning/patternRecognition';
import { parameterTuner } from '@/app/lib/learning/parameterTuner';
import {
  StrategyDecision,
  StrategyContext,
  SystemResourceInfo
} from '../types';

/**
 * Workflow Strategy (Multi-Model Orchestration)
 * Supports both Chain (sequential refinement) and Ensemble (parallel voting) workflows
 * Uses ML-driven insights to optimize workflow selection and configuration
 */

export type WorkflowMode = 'chain' | 'ensemble' | 'auto';

export class WorkflowStrategy extends BaseStrategy {
  name = 'workflow';
  priority = 115;  // Highest priority - above adaptive
  type = 'workflow';

  private analytics = new StrategyAnalytics();

  // Workflow mode can be set externally (from UI)
  private workflowMode: WorkflowMode = 'auto';

  setWorkflowMode(mode: WorkflowMode) {
    this.workflowMode = mode;
  }

  async decide(context: StrategyContext): Promise<StrategyDecision> {
    const complexity = context.complexityScore || 50;
    const mode = context.detectedMode || 'code-review';

    try {
      // 1. Detect conversation theme using pattern recognition
      const themeDetection = await patternRecognizer.detectTheme(context.userMessage);
      console.log(`[Workflow] Theme detected: ${themeDetection.primaryTheme} (confidence: ${themeDetection.confidence.toFixed(2)})`);

      // 2. Get learned parameter recommendations
      const parameterRec = await parameterTuner.getRecommendation(
        themeDetection.primaryTheme,
        complexity
      );

      // 3. Determine optimal workflow type
      const workflowType = this.determineWorkflowType(
        complexity,
        mode,
        themeDetection.primaryTheme,
        context.systemResources,
        this.workflowMode
      );

      // 4. Build workflow configuration based on type
      const decision = workflowType === 'chain'
        ? this.buildChainWorkflow(complexity, themeDetection, parameterRec, context.systemResources)
        : this.buildEnsembleWorkflow(complexity, themeDetection, parameterRec, context.systemResources);

      console.log(`[Workflow] Selected ${workflowType} workflow (conf: ${decision.confidence.toFixed(2)}) - ${decision.reasoning}`);

      return decision;

    } catch (error) {
      console.warn('[Workflow] ML lookup failed, falling back to chain workflow:', error);
      // Fallback to basic chain workflow
      return this.buildChainWorkflow(complexity, null, null, context.systemResources);
    }
  }

  /**
   * Determine which workflow type to use based on context
   */
  private determineWorkflowType(
    complexity: number,
    mode: string,
    theme: string,
    resources: SystemResourceInfo,
    userMode: WorkflowMode
  ): 'chain' | 'ensemble' {
    // If user explicitly selected a mode, use it (unless resources don't support it)
    if (userMode === 'chain') {
      return 'chain';
    } else if (userMode === 'ensemble') {
      // User explicitly wants ensemble - trust their choice and push hardware limits
      // Only fallback if RAM is critically low (system crash risk)
      if (resources.availableRAM < 6000) {
        console.log('[Workflow] CRITICAL RAM (<6GB) for ensemble, falling back to chain to prevent system crash');
        return 'chain';
      }
      // Let it rip - user wants ensemble, system can handle swap
      console.log(`[Workflow] Ensemble mode with ${Math.round(resources.availableRAM)}MB RAM - pushing hardware limits`);
      return 'ensemble';
    }

    // Auto mode - determine based on context, maximize hardware usage
    // Ensemble is best for: security, critical decisions, consensus needed
    const ensembleThemes = ['security', 'architecture', 'refactoring', 'debugging'];
    // Lowered RAM threshold to 8GB - push limits, system can handle swap
    const useEnsemble = ensembleThemes.some(t => theme.includes(t)) && resources.availableRAM >= 8000;

    // Chain is best for: complex generation, documentation, multi-step tasks
    const chainThemes = ['documentation', 'code-generation', 'implementation'];
    const useChain = chainThemes.some(t => theme.includes(t)) || complexity > 70;

    // Default logic - AGGRESSIVE resource usage, maximize hardware utilization
    if (useEnsemble && !useChain) {
      console.log(`[Workflow] Auto selected ensemble (${Math.round(resources.availableRAM)}MB RAM) - maximizing hardware`);
      return 'ensemble';
    } else if (complexity > 80 && resources.availableRAM >= 10000) {
      console.log(`[Workflow] Auto selected chain for high complexity (${complexity})`);
      return 'chain'; // Complex tasks benefit from progressive refinement
    } else if (mode === 'security-review' || theme.includes('security')) {
      // Lower threshold to 8GB for security reviews - important enough to push limits
      return resources.availableRAM >= 8000 ? 'ensemble' : 'chain';
    } else {
      return 'chain'; // Default to chain for most cases
    }
  }

  /**
   * Build Chain Workflow configuration
   */
  private buildChainWorkflow(
    complexity: number,
    themeDetection: any,
    parameterRec: any,
    resources: SystemResourceInfo
  ): StrategyDecision {
    // Only constrain if EXTREME resource shortage - push hardware limits
    const isConstrained = resources.availableRAM < 6000 || resources.cpuUsage > 90;

    // Adjust chain depth based on complexity and resources
    const steps = [];

    // Step 1: Draft (always included)
    steps.push({
      model: 'llama3.2:3b-instruct-q5_K_M',
      role: 'draft' as const,
      maxTokens: 2000,
      temperature: 0.7,
      systemPromptSuffix: 'Create a working draft. Focus on core functionality, ignore edge cases for now.'
    });

    // Step 2: Refine (included for moderate+ complexity)
    if (complexity > 40 || !isConstrained) {
      steps.push({
        model: 'qwen2.5-coder:7b-instruct-q5_K_M',
        role: 'refine' as const,
        maxTokens: 4000,
        temperature: parameterRec?.temperature || 0.4,
        systemPromptSuffix: 'Improve the draft. Add error handling, optimize logic, handle common edge cases.'
      });
    }

    // Step 3: Review (included for high complexity and adequate resources)
    if (complexity > 70 && !isConstrained) {
      steps.push({
        model: 'deepseek-coder-v2:16b-instruct-q4_K_M',
        role: 'review' as const,
        maxTokens: 6000,
        temperature: 0.3,
        systemPromptSuffix: 'Final review. Check for bugs, security issues, performance problems, and handle all edge cases.'
      });
    }

    const themeInfo = themeDetection
      ? ` | theme: ${themeDetection.primaryTheme}`
      : '';

    return {
      id: this.generateId(),
      strategyName: this.name,
      timestamp: new Date(),
      selectedModel: steps[0].model, // Initial model for compatibility
      temperature: parameterRec?.temperature || 0.4,
      maxTokens: 12000,
      streaming: false, // Workflows don't support streaming
      enableTools: parameterRec?.enableTools || complexity > 50,
      maxToolLoops: 3,

      // Chain workflow configuration
      modelChain: {
        enabled: true,
        steps,
        mergeStrategy: 'last' // Use the final step's output
      },

      reasoning: `Chain workflow: ${steps.length} steps (complexity: ${complexity}${themeInfo})`,
      confidence: 0.85,
      complexityScore: complexity,

      metadata: {
        workflowType: 'chain',
        stepCount: steps.length,
        detectedTheme: themeDetection?.primaryTheme,
        themeConfidence: themeDetection?.confidence,
        parameterLearningConfidence: parameterRec?.confidence
      }
    };
  }

  /**
   * Build Ensemble Workflow configuration
   */
  private buildEnsembleWorkflow(
    complexity: number,
    themeDetection: any,
    parameterRec: any,
    resources: SystemResourceInfo
  ): StrategyDecision {
    // Select models based on available resources
    const models = ['qwen2.5-coder:7b-instruct-q5_K_M'];
    const weights: Record<string, number> = {
      'qwen2.5-coder:7b': 0.5
    };

    // Add 16B model if we have enough RAM
    if (resources.availableRAM >= 16000) {
      models.push('deepseek-coder-v2:16b-instruct-q4_K_M');
      weights['deepseek-coder-v2:16b'] = 0.8; // Higher weight for larger model
    }

    // Add 3B model for speed and diversity
    models.push('llama3.2:3b-instruct-q5_K_M');
    weights['llama3.2:3b'] = 0.3; // Lower weight for smaller model

    // Determine voting strategy based on theme
    const criticalThemes = ['security', 'architecture', 'debugging'];
    const isCritical = criticalThemes.some(t => themeDetection?.primaryTheme?.includes(t));
    const votingStrategy = isCritical ? 'consensus' : 'weighted';
    const minConsensusThreshold = isCritical ? 0.8 : 0.7;

    const themeInfo = themeDetection
      ? ` | theme: ${themeDetection.primaryTheme}`
      : '';

    return {
      id: this.generateId(),
      strategyName: this.name,
      timestamp: new Date(),
      selectedModel: models[0], // Primary model for compatibility
      temperature: parameterRec?.temperature || 0.4,
      maxTokens: 8000,
      streaming: false, // Workflows don't support streaming
      enableTools: false, // Ensemble focuses on analysis/voting
      maxToolLoops: 0,

      // Ensemble workflow configuration
      ensembleConfig: {
        enabled: true,
        models,
        votingStrategy: votingStrategy as any,
        weights,
        minConsensusThreshold
      },

      reasoning: `Ensemble workflow: ${models.length} models, ${votingStrategy} voting (complexity: ${complexity}${themeInfo})`,
      confidence: 0.9,
      complexityScore: complexity,

      metadata: {
        workflowType: 'ensemble',
        modelCount: models.length,
        votingStrategy,
        detectedTheme: themeDetection?.primaryTheme,
        themeConfidence: themeDetection?.confidence,
        parameterLearningConfidence: parameterRec?.confidence
      }
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
