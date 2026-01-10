// app/lib/strategy/resources/constraints.ts
import type { ResourceConfig, SystemResourceInfo, StrategyDecision, StrategyContext } from '../types';

/**
 * Resource-Aware Decision Constraints
 * Applies hard limits and auto-downgrades based on system state
 */

export class ResourceConstraints {
  /**
   * Apply resource limits to strategy decision
   */
  static applyConstraints(
    decision: StrategyDecision,
    resources: SystemResourceInfo,
    config: ResourceConfig = {}
  ): StrategyDecision {
    const constrainedDecision = { ...decision };

    // 1. RAM CONSTRAINTS
    if (config.maxRAM && resources.availableRAM < config.maxRAM) {
      constrainedDecision.selectedModel = this.downgradeForRAM(resources.availableRAM);
      constrainedDecision.maxTokens = Math.min(constrainedDecision.maxTokens, 4000);
      constrainedDecision.reasoning += ` RAM limited (${Math.round(resources.availableRAM)}MB)`;
    }

    // 2. GPU LAYERS
    if (config.maxGPULayers && resources.gpuLayers > config.maxGPULayers) {
      constrainedDecision.selectedModel = this.selectLowGPUModel();
      constrainedDecision.reasoning += ` GPU layers limited`;
    }

    // 3. CPU USAGE
    if (resources.cpuUsage > 85) {
      constrainedDecision.maxTokens *= 0.7;
      constrainedDecision.temperature = Math.min(constrainedDecision.temperature, 0.2);
      constrainedDecision.reasoning += ` High CPU (${Math.round(resources.cpuUsage)}%)`;
    }

    // 4. THERMAL THROTTLING
    if (config.thermalThreshold && resources.temperature && resources.temperature > config.thermalThreshold) {
      constrainedDecision.streaming = true;
      constrainedDecision.maxTokens *= 0.5;
      constrainedDecision.reasoning += ` Thermal throttling`;
    }

    // 5. BATTERY MODE
    if (config.batteryAware && resources.onBattery && resources.batteryLevel! < 20) {
      constrainedDecision.selectedModel = 'llama3.2:3b-instruct-q5_K_M';
      constrainedDecision.maxTokens = 2000;
      constrainedDecision.streaming = true;
      constrainedDecision.reasoning += ` Battery saver mode`;
    }

    // 6. RESPONSE TIMEOUT
    if (config.maxResponseTime) {
      // Reduce tokens proportionally
      constrainedDecision.maxTokens = Math.min(
        constrainedDecision.maxTokens,
        Math.floor(config.maxResponseTime / 2)  // Conservative
      );
    }

    return constrainedDecision;
  }

  /**
   * Select model based on available RAM
   */
  static downgradeForRAM(availableRAM: number): string {
    if (availableRAM < 6000) return 'llama3.2:3b-instruct-q5_K_M';      // 3B only
    if (availableRAM < 12000) return 'qwen2.5-coder:7b-instruct-q4_K_M'; // 7B Q4
    return 'qwen2.5-coder:7b-instruct-q5_K_M';                           // 7B Q5
  }

  static selectLowGPUModel(): string {
    return 'llama3.2:3b-instruct-q5_K_M'; // CPU-friendly
  }

  /**
   * Validate if decision respects constraints
   */
  static isValidDecision(
    decision: StrategyDecision,
    resources: SystemResourceInfo,
    _config?: ResourceConfig
  ): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Only warn about CRITICAL resource issues, don't block execution
    // User is running local models and doesn't want artificial limits

    // Only fail if RAM is severely insufficient (< 50% of model requirement)
    const modelRAMReq = this.getModelRAMRequirement(decision.selectedModel);
    if (resources.availableRAM < modelRAMReq * 0.5) {
      violations.push(`Critical RAM shortage: ${Math.round(resources.availableRAM)}MB available, ${modelRAMReq}MB recommended`);
    }

    // No token limit checks - let the model and system handle it naturally

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Get recommended config for current system
   */
  static getRecommendedConfig(resources: SystemResourceInfo): ResourceConfig {
    return {
      maxRAM: resources.availableRAM * 0.7,  // Use 70% max
      maxGPULayers: resources.availableRAM > 16000 ? 35 : 25,
      maxCPUThreads: Math.min(resources.cpuThreads, 8),
      thermalThreshold: 85,  // Conservative
      batteryAware: resources.onBattery,
      maxResponseTime: resources.cpuUsage > 70 ? 30000 : 60000
    };
  }

  private static getModelRAMRequirement(model: string): number {
    const requirements: Record<string, number> = {
      'llama3.2:3b': 4000,
      'qwen2.5-coder:7b': 8000,
      'deepseek-v2:16b': 16000
    };

    for (const [key, ram] of Object.entries(requirements)) {
      if (model.includes(key)) return ram;
    }
    return 8000; // Default
  }

  /**
   * Pre-check context and suggest constraints
   */
  static suggestConstraintsForContext(context: StrategyContext): ResourceConfig {
    const baseConfig = this.getRecommendedConfig(context.systemResources);
    
    // Complexity-based adjustments
    if (context.complexityScore! > 80) {
      baseConfig.maxTokens = 16000;
    } else if (context.complexityScore! < 30) {
      baseConfig.maxTokens = 3000;
    }

    return baseConfig;
  }
}

/**
 * Middleware - Apply to all decisions automatically
 * DISABLED: Trust the user and adaptive strategy to make the right choices
 * System can handle swap/virtual memory - no artificial limits
 */
export function withResourceConstraints(
  decisionFn: (context: StrategyContext) => Promise<StrategyDecision>,
  context: StrategyContext
): Promise<StrategyDecision> {
  return decisionFn(context).then(decision => {
    const constraints = ResourceConstraints.suggestConstraintsForContext(context);

    // Apply only soft constraints (warnings, not hard limits)
    const validation = ResourceConstraints.isValidDecision(decision, context.systemResources, constraints);

    if (!validation.valid) {
      // Just log warnings - don't override the strategy decision
      console.log('[Constraints] Resource info (not blocking):', validation.violations);
      console.log('[Constraints] Trusting adaptive strategy decision:', decision.selectedModel);
    }

    // Never override the adaptive strategy - it knows best
    return decision;
  });
}