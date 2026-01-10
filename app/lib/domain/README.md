# Domain Context System

An intelligent context detection and domain knowledge injection system for providing mode-aware, domain-specific AI responses.

## Overview

The domain system automatically:
1. **Detects user intent** (learning, code review, or expert mode)
2. **Identifies file types and domains** (Python backend, React frontend, Next.js fullstack)
3. **Analyzes complexity** using AST-like pattern analysis
4. **Injects domain-specific knowledge** into system prompts
5. **Builds optimized LLM context** with appropriate temperature and token limits

## Architecture

```
domain/
├── contextDetector.ts    # Detects mode, file type, domain, and complexity
├── domainKnowledge.ts    # Curated knowledge for Python, React, and Next.js
├── modeDefinitions.ts    # System prompts for learning, code-review, and expert modes
└── contextBuilder.ts     # Orchestrates detection and builds final LLM prompts
```

## Core Components

### 1. Context Detector ([contextDetector.ts](contextDetector.ts))

Analyzes user input to detect:

- **Mode**: `learning`, `code-review`, or `expert`
- **File Type**: `python`, `typescript`, `react`, `nextjs`, `javascript`, `sql`
- **Domain**: `python-backend`, `react-frontend`, `nextjs-fullstack`, `mixed`
- **Complexity**: `simple`, `moderate`, or `complex` (with 0-100 score)

```typescript
import { ContextDetector } from './contextDetector';

const detection = ContextDetector.detect(
  "Can you review this async Python code?",
  "utils/fetch.py"
);

// Result:
// {
//   mode: 'code-review',
//   fileType: 'python',
//   domain: 'python-backend',
//   complexity: 'moderate',
//   confidence: 0.9,
//   detectedKeywords: ['[code-review] review', '[expert] async'],
//   reasoning: 'Detected code-review mode • python code detected • Primary domain: python backend'
// }
```

#### Enhanced Complexity Analysis

The `analyzeComplexity()` method provides detailed AST-like analysis:

```typescript
const signals = ContextDetector.analyzeComplexity(userInput);
// Returns ComplexitySignals:
// {
//   linesOfCode: 45,
//   codeBlockCount: 2,
//   cyclomaticComplexity: 8,
//   asyncPatternDepth: 3,
//   importCount: 5,
//   functionCount: 3,
//   classCount: 1,
//   technicalKeywordCount: 12,
//   overallComplexity: 67  // 0-100 score
// }
```

### 2. Domain Knowledge ([domainKnowledge.ts](domainKnowledge.ts))

Curated knowledge bases for:

- **Python Backend**: async/await, asyncio, FastAPI, concurrency patterns
- **React Frontend**: hooks, state management, performance, component patterns
- **Next.js Fullstack**: App Router, server/client components, API routes, optimization
- **Mixed Domain**: full-stack patterns, API design, authentication, type safety

```typescript
import { getDomainKnowledge, formatDomainKnowledge } from './domainKnowledge';

const knowledge = getDomainKnowledge('python-backend');
// Returns: concepts, bestPractices, commonPitfalls, contextPrompt

const formattedPrompt = formatDomainKnowledge('python-backend');
// Returns formatted prompt ready to inject into system prompt
```

Each domain includes:
- **Key Concepts**: Core technical concepts for the domain
- **Best Practices**: Recommended patterns and approaches
- **Common Pitfalls**: Anti-patterns and mistakes to avoid
- **Context Prompt**: Detailed guidance for LLM responses

### 3. Mode Definitions ([modeDefinitions.ts](modeDefinitions.ts))

Three distinct interaction modes with specialized system prompts:

#### Learning Mode
- **Use case**: Teaching concepts, explaining fundamentals
- **Temperature**: 0.4 (focused, consistent)
- **Style**: Patient educator with examples and analogies

#### Code Review Mode
- **Use case**: Analyzing code quality, suggesting improvements
- **Temperature**: 0.3 (precise, focused)
- **Style**: Constructive feedback with specific suggestions

#### Expert Mode
- **Use case**: Deep technical discussions, architecture decisions
- **Temperature**: 0.5 (balanced)
- **Style**: Advanced exploration of edge cases and trade-offs

```typescript
import { getModeDefinition } from './modeDefinitions';

const mode = getModeDefinition('expert');
// Returns: { name, description, systemPrompt, temperatureSuggestion, maxTokensSuggestion }
```

### 4. Context Builder ([contextBuilder.ts](contextBuilder.ts))

Orchestrates the entire system:

```typescript
import { ContextBuilder } from './contextBuilder';

const context = ContextBuilder.build({
  userInput: "Review this async code",
  filePath: "api/users.py",
  manualModeOverride: 'expert',  // Optional: user-selected mode
  includeDomainKnowledge: true,
  includeDetectionReasoning: false
});

// Returns:
// {
//   systemPrompt: "...",  // Complete prompt with domain knowledge
//   mode: 'expert',
//   detection: { ... },
//   modeOverridden: true,
//   domainKnowledgeInjected: true
// }
```

## Usage in API Routes

### Basic Integration

```typescript
import { buildContextForLLMCall } from '@/lib/domain/contextBuilder';

export async function POST(req: NextRequest) {
  const { messages, filePath, manualModeOverride } = await req.json();

  const lastUserMessage = messages[messages.length - 1]?.content;

  // Build context with domain knowledge
  const llmContext = await buildContextForLLMCall(
    lastUserMessage,
    filePath,
    manualModeOverride
  );

  // Use in LLM call
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: llmContext.systemPrompt },
      ...messages
    ],
    temperature: llmContext.temperature,
    max_tokens: llmContext.maxTokens,
  });

  return NextResponse.json(response);
}
```

### With Streaming

```typescript
const context = ContextBuilder.buildForStreaming({
  userInput: lastUserMessage,
  filePath,
  includeDomainKnowledge: true
});

const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'system', content: context.systemPrompt }, ...messages],
  temperature: context.temperature,
  max_tokens: context.maxTokens,
  stream: true,
});
```

## Pattern Detection

### Mode Detection

The system uses regex patterns to detect user intent:

- **Learning Mode**: `explain`, `teach`, `how`, `why`, `tutorial`, `basics`
- **Code Review Mode**: `review`, `feedback`, `improve`, `refactor`, `best practices`
- **Expert Mode**: `advanced`, `edge case`, `architecture`, `performance tuning`

### File Type Detection

Detects file types from:
- File extensions: `.py`, `.ts`, `.tsx`, `.jsx`, `.sql`
- Keywords: `asyncio`, `FastAPI`, `React`, `useState`, `Next.js`
- Code patterns: `async def`, `=>`, `<Component />`, `route.ts`

### Complexity Analysis

Calculates 0-100 complexity score based on:
- Lines of code and code blocks
- Cyclomatic complexity (if/else, loops, ternaries)
- Async pattern depth (async/await, Promises, concurrency)
- Technical keyword density
- Function and class counts
- Multi-domain detection

## Debugging

Enable debug logging to see detection reasoning:

```bash
export DEBUG_CONTEXT=true
```

Then use:

```typescript
const context = ContextBuilder.build({
  userInput: "Explain async/await",
  includeDetectionReasoning: true
});

console.log(ContextBuilder.formatContextInfo(context));
```

Output:
```
[Context Detection]
  Mode: learning (auto-detected)
  Confidence: High
  Domain: python-backend
  File Type: python
  Complexity: moderate
  Domain Knowledge: ✓ Injected
  Reasoning: Detected learning mode • python code detected • Primary domain: python backend
```

## Benefits

1. **Automatic Context Awareness**: No manual mode selection required
2. **Domain-Specific Responses**: Tailored advice for Python, React, or Next.js
3. **Complexity-Aware**: Adjusts depth based on question complexity
4. **Mode Override Support**: Users can manually select preferred mode
5. **Confidence Scoring**: Track detection accuracy
6. **Performance Optimized**: Different temperature/token settings per mode

## Extension Points

### Adding New Domains

Add to [domainKnowledge.ts](domainKnowledge.ts:313):

```typescript
export const GO_BACKEND_KNOWLEDGE: DomainKnowledge = {
  domain: 'go-backend',
  concepts: [...],
  bestPractices: [...],
  commonPitfalls: [...],
  contextPrompt: `...`
};
```

### Adding New Modes

Add to [modeDefinitions.ts](modeDefinitions.ts:19):

```typescript
const MODE_DEFINITIONS: Record<InteractionMode, ModeDefinition> = {
  // ... existing modes
  'debugging': {
    name: 'Debugging Mode',
    description: 'Systematic bug investigation',
    systemPrompt: `...`,
    temperatureSuggestion: 0.2,
    maxTokensSuggestion: 5000,
  }
};
```

### Extending Complexity Analysis

Modify [contextDetector.ts](contextDetector.ts:97) `analyzeComplexity()`:

```typescript
// Add new complexity signals
signals.securityPatternCount = (input.match(/\b(auth|crypto|hash)\b/gi) || []).length;

// Update score calculation
const score = Math.min(100,
  (signals.linesOfCode * 0.3) +
  (signals.securityPatternCount * 2.0) + // New signal
  // ... existing signals
);
```

## Related Files

- **Usage**: See [app/api/llm/route.ts](../../api/llm/route.ts) for integration example
- **Types**: Import types from individual modules
- **Testing**: Unit tests should cover detection accuracy

## License

Part of the Hacker Reign project.
