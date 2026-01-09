/**
 * Context Detector
 * Analyzes user input to detect:
 * - Mode (Learning, Code Review, Expert)
 * - File type (Python, TypeScript, React, etc)
 * - Complexity level
 * - Primary domain (backend, frontend)
 */

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

/**
 * Complexity indicators
 */
const COMPLEXITY_PATTERNS = {
  complex: [
    /\b(async|await|Promise|concurrent|race condition|deadlock)\b/i,
    /\b(callback|generator|iterator|event loop|microtask)\b/i,
    /\b(TypeScript|generic|decorator|reflection)\b/i,
    /\b(architecture|pattern|design|scale)\b/i,
    /```[\s\S]{200,}/i, // Large code block (200+ chars)
  ],
  moderate: [
    /\b(function|class|module|import|loop|condition)\b/i,
    /```[\s\S]{50,200}/i, // Medium code block
    /\b(error|exception|try|catch)\b/i,
  ],
  simple: [
    /\b(print|log|variable|constant)\b/i,
    /```[\s\S]{0,50}/i, // Small code block
  ],
};

export class ContextDetector {
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
   */
  private static detectComplexity(input: string): 'simple' | 'moderate' | 'complex' {
    const codeBlockSize = (input.match(/```/g) || []).length;
    const inputLength = input.length;

    let complexScore = 0;

    // Check complex patterns
    COMPLEXITY_PATTERNS.complex.forEach(pattern => {
      if (pattern.test(input)) complexScore += 2;
    });

    // Check moderate patterns
    COMPLEXITY_PATTERNS.moderate.forEach(pattern => {
      if (pattern.test(input)) complexScore += 1;
    });

    // Check simple patterns
    COMPLEXITY_PATTERNS.simple.forEach(pattern => {
      if (pattern.test(input)) complexScore -= 1;
    });

    // Length heuristic
    if (inputLength > 500) complexScore++;
    if (inputLength > 1000) complexScore += 2;

    if (complexScore >= 3) return 'complex';
    if (complexScore >= 1) return 'moderate';
    return 'simple';
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
