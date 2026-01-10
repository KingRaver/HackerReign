// app/lib/strategy/context.ts
import { StrategyContext, RecentDecision } from './types';
import { ContextDetector } from '../domain/contextDetector';
import { getSystemResources } from './resources/monitor';

/**
 * Strategy Context Builder
 * Bridges existing domain detection with strategy system
 */

interface ModelInfo {
  name: string;
  displayName: string;
  size: string;
  type: 'fast' | 'balanced' | 'expert';
  strengths: string[];
  weaknesses: string[];
  ramRequired: number;
  gpuRequired: boolean;
  contextWindow: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  timestamp?: Date;
}

interface ConversationMetadata {
  id: string;
  messageCount: number;
  totalTokens: number;
  averageResponseTime: number;
  userSatisfaction: number;
}

type DetectionMode = 'learning' | 'code-review' | 'expert' | null;

const DEFAULT_MODELS: ModelInfo[] = [
  {
    name: 'llama3.2:3b-instruct-q5_K_M',
    displayName: 'Llama 3.2 (3B)',
    size: '3B',
    type: 'fast',
    strengths: ['speed', 'simple tasks'],
    weaknesses: ['complex reasoning'],
    ramRequired: 4000,
    gpuRequired: false,
    contextWindow: 8192
  },
  {
    name: 'qwen2.5-coder:7b-instruct-q5_K_M',
    displayName: 'Qwen 2.5 Coder (    // 7B)', 
    size: '7B',
    type: 'balanced',
    strengths: ['code review', 'explanations'],
    weaknesses: ['very complex architecture'],
    ramRequired: 8000,
    gpuRequired: true,
    contextWindow: 16384
  },
  {
    name: 'deepseek-v2:16b-instruct-q4_K_M',
    displayName: 'DeepSeek V2 (16B)',
    size: '16B',
    type: 'expert',
    strengths: ['architecture', 'deep analysis'],
    weaknesses: ['speed'],
    ramRequired: 16000,
    gpuRequired: true,
    contextWindow: 32768
  }
];

export async function buildStrategyContext(params: {
  userMessage: string;
  conversationHistory: ConversationMessage[];
  filePath?: string;
  manualModeOverride?: DetectionMode;
  manualModelOverride?: string;
}): Promise<StrategyContext> {
  // 1. Use existing context detector
  const detection = ContextDetector.detect(
    params.userMessage,
    params.filePath
  );

  // Enhanced complexity score (0-100 scale)
  const complexityScore = calculateComplexityScore(detection.complexity, params.userMessage);

  // 2. System resources
  const systemResources = await getSystemResources();

  // 3. Conversation metadata
  const metadata = calculateConversationMetadata(params.conversationHistory);

  // 4. Recent decisions (stub for now)
  const recentDecisions: RecentDecision[] = [];

  return {
    userMessage: params.userMessage,
    conversationHistory: params.conversationHistory,
    detectedMode: params.manualModeOverride || detection.mode,
    detectedDomain: detection.domain,
    detectedFileType: detection.fileType,
    complexity: detection.complexity,
    complexityScore: complexityScore,
    confidence: detection.confidence,
    availableModels: DEFAULT_MODELS,
    systemResources,
    conversationMetadata: metadata,
    manualModeOverride: params.manualModeOverride,
    manualModelOverride: params.manualModelOverride,
    recentDecisions,
    userFeedback: []
  };
}

/**
 * Calculate enhanced complexity score (0-100)
 * Extends basic complexity detection with additional signals
 */
function calculateComplexityScore(
  baseComplexity: 'simple' | 'moderate' | 'complex',
  userMessage: string
): number {
  // Base score from detection
  let score = baseComplexity === 'simple' ? 20 : baseComplexity === 'moderate' ? 50 : 80;

  // Additional signals
  const messageLength = userMessage.length;
  const codeBlockCount = (userMessage.match(/```/g) || []).length / 2;
  const hasAsync = /\b(async|await|Promise|concurrent)\b/i.test(userMessage);
  const hasArchitecture = /\b(architecture|design|pattern|scale)\b/i.test(userMessage);
  const lineCount = userMessage.split('\n').length;

  // Adjust score
  if (messageLength > 500) score += 10;
  if (messageLength > 1000) score += 10;
  if (codeBlockCount >= 2) score += 15;
  if (hasAsync) score += 10;
  if (hasArchitecture) score += 10;
  if (lineCount > 50) score += 10;

  return Math.min(100, Math.max(0, score));
}

function calculateConversationMetadata(history: ConversationMessage[]): ConversationMetadata {
  const totalTokens = history.reduce((sum, msg) => sum + (msg.tokens || 0), 0);
  const assistantMsgs = history.filter(m => m.role === 'assistant');
  const avgResponseTime = assistantMsgs.length > 0 
    ? assistantMsgs.reduce((sum, msg) => sum + (msg.timestamp ? Date.now() - msg.timestamp.getTime() : 0), 0) / assistantMsgs.length / 1000
    : 0;

  return {
    id: 'conv_' + Date.now(),
    messageCount: history.length,
    totalTokens,
    averageResponseTime: avgResponseTime,
    userSatisfaction: 0.8 // Default
  };
}

