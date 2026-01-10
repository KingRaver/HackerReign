/**
 * Context Detector - ENHANCED VERSION
 * Analyzes user input to detect:
 * - Mode (Learning, Code Review, Expert)
 * - File type (Python, TypeScript, React, etc)
 * - Complexity level (with AST-level analysis)
 * - Primary domain (backend, frontend)
 */

import type { ComplexitySignals } from '../strategy/types';

export type DetectionMode = 'learning' | 'code-review' | 'expert' | null;
export type DetectionModeNonNull = 'learning' | 'code-review' | 'expert';
export type FileType = 'python' | 'typescript' | 'react' | 'nextjs' | 'javascript' | 'sql' | 'unknown';
export type Domain = 'python-backend' | 'react-frontend' | 'nextjs-fullstack' | 'mixed' | null;

export interface DetectionResult {
  mode: DetectionMode;
  fileType: FileType;
  domain: Domain;
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number; // 0-1
  detectedKeywords: string[];
  reasoning: string;
}

// ENHANCED VERSION with complexity score
export interface EnhancedDetectionResult extends DetectionResult {
  complexityScore: number; // 0-100 (NEW)
  complexitySignals: ComplexitySignals; // NEW - detailed signals
}

/**
 * Keyword patterns for mode detection
 */
const MODE_PATTERNS = {
  learning: [
    /\b(explain|teach|how|why|what is|understand|learn|tutorial|guide)\b/i,
    /\b(confused|stuck|beginner|new to|first time|basics)\b/i,
    /\b(difference between|compare|pros and cons)\b/i,
    /\b(example|show me|demo|walkthrough)\b/i,
  ],
  'code-review': [
    /\b(review|critique|feedback|improve|refactor|optimize|clean up|best practices)\b/i,
    /\b(code smell|anti-pattern|issue|bug|problem|fix)\b/i,
    /\b(performance|efficiency|readability|maintainability)\b/i,
    /\b(this code|my code|check this|look at)\b/i,
  ],
  expert: [
    /\b(deep dive|advanced|edge case|corner case|implementation detail)\b/i,
    /\b(architecture|design pattern|performance tuning|optimization)\b/i,
    /\b(async|concurrency|race condition|deadlock|memory leak)\b/i,
    /\b(how would you|what's the best|pattern for)\b/i,
  ],
};

/**
 * File type patterns
 */
const FILE_TYPE_PATTERNS: Record<FileType, RegExp[]> = {
  python: [
    /\.(py|pyx)\b/i,
    /\b(python|asyncio|aiohttp|fastapi|django|flask|pydantic)\b/i,
    /\b(async def|await|@app\.route|uvicorn)\b/i,
  ],
  typescript: [
    /\.(ts|tsx)\b/i,
    /\b(typescript|interface|type|generic)\b/i,
    /\b(const.*:\s*\w+\s*=|: Promise<)/i,
  ],
  react: [
    /\.(jsx|tsx)\b/i,
    /\b(react|useState|useEffect|Component|props|JSX)\b/i,
    /\b(export.*function|const.*=.*=>|<.*>)/i,
  ],
  nextjs: [
    /\b(next\.js|nextjs|app router|route\.ts|layout\.tsx|page\.tsx)\b/i,
    /\b(getServerSideProps|getStaticProps|API route)\b/i,
    /\/app\//i,
  ],
  javascript: [
    /\.(js|mjs|cjs)\b/i,
    /\b(javascript|function|const.*=|=>)/i,
  ],
  sql: [
    /\.(sql)\b/i,
    /\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|JOIN)\b/i,
  ],
  unknown: [],
};

export class ContextDetector {
  /**
   * ENHANCED: Analyze complexity with AST-level signals
   * Returns detailed complexity breakdown (0-100 score)
   */
  static analyzeComplexity(input: string, domain?: Domain): ComplexitySignals {
    const signals: ComplexitySignals = {
      linesOfCode: 0,
      codeBlockCount: 0,
      cyclomaticComplexity: 0,
      asyncPatternDepth: 0,
      importCount: 0,
      functionCount: 0,
      classCount: 0,
      inputLength: input.length,
      sentenceCount: (input.match(/[.!?]+/g) || []).length,
      technicalKeywordCount: 0,
      questionDepth: 0,
      conversationDepth: 1,
      domainComplexity: 0,
      multiDomainDetected: false,
      overallComplexity: 0
    };

    // 1. CODE BLOCK ANALYSIS
    const codeBlocks = input.match(/```[\s\S]*?```/g) || [];
    signals.codeBlockCount = codeBlocks.length;

    codeBlocks.forEach(block => {
      const code = block.replace(/```[a-z]*\n?|\n?```/g, '');
      const lines = code.split('\n').filter(line => line.trim().length > 0);
      signals.linesOfCode += lines.length;
    });

    // 2. TECHNICAL KEYWORD ANALYSIS
    const technicalKeywords = [
      'async', 'await', 'Promise', 'architecture', 'refactor', 'optimize',
      'design pattern', 'concurrency', 'race condition', 'deadlock',
      'TypeScript', 'generic', 'decorator', 'middleware', 'authentication',
      'authorization', 'scalability', 'performance', 'memory', 'threading'
    ];

    technicalKeywords.forEach(keyword => {
      if (input.toLowerCase().includes(keyword.toLowerCase())) {
        signals.technicalKeywordCount++;
      }
    });

    // 3. AST-LIKE PATTERN ANALYSIS (regex-based)
    signals.importCount = (input.match(/\b(import|from|require)\s+/gi) || []).length;
    signals.functionCount = (input.match(/\b(function|def|async\s+def|=>)\b/gi) || []).length;
    signals.classCount = (input.match(/\bclass\s+\w+/gi) || []).length;

    // 4. ASYNC PATTERN DEPTH
    const hasAsync = /\b(async|await)\b/i.test(input);
    const hasPromise = /\bPromise\b/i.test(input);
    const hasConcurrency = /\b(concurrent|parallel|race|Promise\.all)\b/i.test(input);

    if (hasConcurrency) signals.asyncPatternDepth = 3;
    else if (hasPromise) signals.asyncPatternDepth = 2;
    else if (hasAsync) signals.asyncPatternDepth = 1;

    // 5. CYCLOMATIC COMPLEXITY ESTIMATION
    const complexityIndicators = [
      { pattern: /\b(if|else if|elif)\b/gi, weight: 1 },
      { pattern: /\b(for|while|do)\b/gi, weight: 1 },
      { pattern: /(\&\&|\|\|)/g, weight: 1 },
      { pattern: /\b(catch|except|try)\b/gi, weight: 1 },
      { pattern: /\b(switch|case)\b/gi, weight: 1 },
      { pattern: /\?.*:/g, weight: 1 } // Ternary operators
    ];

    complexityIndicators.forEach(({ pattern, weight }) => {
      const matches = input.match(pattern) || [];
      signals.cyclomaticComplexity += matches.length * weight;
    });

    // 6. QUESTION DEPTH (nested/multiple questions)
    const questions = input.split(/[.!]/).filter(s => s.includes('?'));
    signals.questionDepth = questions.length;

    // 7. DOMAIN COMPLEXITY
    const domainComplexityMap: Record<string, number> = {
      'python-backend': 60,
      'react-frontend': 50,
      'nextjs-fullstack': 80,
      'mixed': 70
    };

    if (domain) {
      signals.domainComplexity = domainComplexityMap[domain] || 0;
    }

    // Detect multi-domain
    const hasPython = /\b(python|async def|fastapi|django)\b/i.test(input);
    const hasReact = /\b(react|useState|useEffect|component)\b/i.test(input);
    const hasDB = /\b(sql|database|query|SELECT|INSERT)\b/i.test(input);

    signals.multiDomainDetected = [hasPython, hasReact, hasDB].filter(Boolean).length > 1;

    // 8. CALCULATE OVERALL COMPLEXITY SCORE (0-100)
    const score = Math.min(100,
      (signals.linesOfCode * 0.3) +
      (signals.cyclomaticComplexity * 0.5) +
      (signals.technicalKeywordCount * 1.2) +
      (signals.asyncPatternDepth * 8) +
      (signals.functionCount * 0.8) +
      (signals.classCount * 1.5) +
      (signals.importCount * 0.4) +
      (signals.questionDepth * 0.5) +
      (signals.multiDomainDetected ? 10 : 0) +
      Math.min(signals.inputLength / 20, 20) // Cap input length impact
    );

    signals.overallComplexity = Math.round(score);

    return signals;
  }

  /**
   * ENHANCED: Detect with complexity score
   */
  static detectEnhanced(
    userInput: string,
    filePath?: string,
    conversationDepth: number = 1
  ): EnhancedDetectionResult {
    // Call existing detection
    const baseDetection = this.detect(userInput, filePath);

    // Add enhanced complexity analysis
    const signals = this.analyzeComplexity(userInput, baseDetection.domain);
    signals.conversationDepth = conversationDepth;

    return {
      ...baseDetection,
      complexityScore: signals.overallComplexity,
      complexitySignals: signals,
      complexity: signals.overallComplexity < 30 ? 'simple' :
                 signals.overallComplexity < 70 ? 'moderate' : 'complex'
    };
  }

  /**
   * Detect all context from user input
   */
  static detect(userInput: string, filePath?: string): DetectionResult {
    const mode = this.detectMode(userInput);
    const fileType = this.detectFileType(userInput, filePath);
    const domain = this.detectDomain(userInput, fileType);
    const complexity = this.detectComplexity(userInput);
    const detectedKeywords = this.extractKeywords(userInput);

    // Calculate confidence based on matches
    const confidence = this.calculateConfidence(mode, fileType, userInput);

    const reasoning = this.buildReasoning(mode, fileType, domain, userInput);

    return {
      mode,
      fileType,
      domain,
      complexity,
      confidence,
      detectedKeywords,
      reasoning,
    };
  }

  /**
   * Detect which mode best matches the input
   */
  private static detectMode(input: string): DetectionMode {
    const scores: Record<string, number> = {
      learning: 0,
      'code-review': 0,
      expert: 0,
    };

    // Score each mode based on pattern matches
    Object.entries(MODE_PATTERNS).forEach(([mode, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(input)) {
          scores[mode]++;
        }
      });
    });

    // Return highest scoring mode
    const sorted = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return null;
    return (sorted[0][0] as DetectionMode);
  }

  /**
   * Detect file type from input or file path
   */
  private static detectFileType(input: string, filePath?: string): FileType {
    const combinedInput = `${input} ${filePath || ''}`;
    const scores: Record<FileType, number> = {
      python: 0,
      typescript: 0,
      react: 0,
      nextjs: 0,
      javascript: 0,
      sql: 0,
      unknown: 0,
    };

    Object.entries(FILE_TYPE_PATTERNS).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(combinedInput)) {
          scores[type as FileType]++;
        }
      });
    });

    // NextJS is more specific than React, check first
    if (scores.nextjs > 0) return 'nextjs';
    if (scores.react > 0) return 'react';

    const sorted = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return 'unknown';
    return (sorted[0][0] as FileType);
  }

  /**
   * Detect primary domain (backend, frontend, fullstack)
   */
  private static detectDomain(input: string, fileType: FileType): Domain {
    const pythonPatterns = /\b(async def|await|asyncio|fastapi|django|backend|server)\b/i;
    const reactPatterns = /\b(useState|useEffect|component|frontend|ui|react)\b/i;

    const hasPython = pythonPatterns.test(input) || fileType === 'python';
    const hasReact = reactPatterns.test(input) || ['react', 'nextjs'].includes(fileType);

    if (hasPython && hasReact) return 'nextjs-fullstack';
    if (hasPython) return 'python-backend';
    if (hasReact) return 'react-frontend';

    if (fileType === 'typescript' || fileType === 'javascript') {
      return 'react-frontend';
    }

    return null;
  }

  /**
   * Detect complexity level
   * Now uses enhanced analysis for better accuracy
   */
  private static detectComplexity(input: string): 'simple' | 'moderate' | 'complex' {
    // Use enhanced complexity analysis
    const signals = this.analyzeComplexity(input);
    const score = signals.overallComplexity;

    // Map 0-100 score to simple/moderate/complex
    if (score < 30) return 'simple';
    if (score < 70) return 'moderate';
    return 'complex';
  }

  /**
   * Extract detected keywords for logging
   */
  private static extractKeywords(input: string): string[] {
    const keywords: string[] = [];

    Object.entries(MODE_PATTERNS).forEach(([mode, patterns]) => {
      patterns.forEach(pattern => {
        const matches = input.match(pattern);
        if (matches) {
          keywords.push(`[${mode}]`, matches[0]);
        }
      });
    });

    return Array.from(new Set(keywords)).slice(0, 10); // Unique, max 10
  }

  /**
   * Calculate confidence (0-1) based on pattern matches
   */
  private static calculateConfidence(mode: DetectionMode, fileType: FileType, input: string): number {
    let score = 0;

    if (mode !== null) score += 0.3;
    if (fileType !== 'unknown') score += 0.3;

    // Bonus for clear signals
    if (input.length > 100) score += 0.1;
    if (input.includes('```')) score += 0.1; // Code block present
    if ((input.match(/\b(please|help|need|want)\b/gi) || []).length > 0) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Build human-readable reasoning for detection
   */
  private static buildReasoning(
    mode: DetectionMode,
    fileType: FileType,
    domain: Domain,
    input: string
  ): string {
    const parts: string[] = [];

    if (mode) {
      parts.push(`Detected ${mode} mode (asking for ${mode === 'learning' ? 'explanation' : mode === 'code-review' ? 'feedback' : 'deep analysis'})`);
    }

    if (fileType !== 'unknown') {
      parts.push(`${fileType} code detected`);
    }

    if (domain) {
      parts.push(`Primary domain: ${domain.replace('-', ' ')}`);
    }

    return parts.join(' • ');
  }

  /**
   * Get confidence description
   */
  static getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.6) return 'High';
    if (confidence >= 0.4) return 'Moderate';
    return 'Low';
  }
}

/**
 * Example usage:
 * 
 * const input = `Can you review this async Python code?
 * \`\`\`python
 * async def fetch_data():
 *   result = await http.get(url)
 * \`\`\`
 * `;
 * 
 * const detection = ContextDetector.detect(input, 'utils/fetch.py');
 * console.log(detection);
 * // {
 * //   mode: 'code-review',
 * //   fileType: 'python',
 * //   domain: 'python-backend',
 * //   complexity: 'moderate',
 * //   confidence: 0.9,
 * //   detectedKeywords: ['[code-review] review', '[expert] async'],
 * //   reasoning: 'Detected code-review mode • python code detected • Primary domain: python backend'
 * // }
 */
