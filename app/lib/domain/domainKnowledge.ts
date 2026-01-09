/**
 * Domain Knowledge Base
 * Curated knowledge about Python async patterns and React/Next.js best practices
 * Injected into system prompts for better context-aware responses
 */

import type { Domain } from './contextDetector';

export interface DomainKnowledge {
  domain: 'python-backend' | 'react-frontend' | 'nextjs-fullstack';
  concepts: string[];
  bestPractices: string[];
  commonPitfalls: string[];
  contextPrompt: string; // Injected into system prompt
}

/**
 * PYTHON BACKEND KNOWLEDGE
 * Focus: async/await, asyncio, FastAPI, concurrency patterns
 */
export const PYTHON_BACKEND_KNOWLEDGE: DomainKnowledge = {
  domain: 'python-backend',
  concepts: [
    'Async/await and coroutines',
    'Event loop and task scheduling',
    'asyncio primitives (Lock, Semaphore, Queue, Event)',
    'Concurrent I/O with aiohttp and httpx',
    'Background tasks and periodic jobs',
    'FastAPI and async route handlers',
    'Database drivers (asyncpg, motor, sqlalchemy async)',
    'WebSockets and Server-Sent Events',
    'Error handling in async contexts',
    'Testing async code',
  ],
  bestPractices: [
    'Never block the event loop with sync operations (use run_in_executor)',
    'Use context managers (async with) for resource cleanup',
    'Avoid creating unnecessary tasks; use gather() or TaskGroup',
    'Set appropriate timeouts on all async operations',
    'Use asyncio.CancelledError for graceful shutdown',
    'Keep task creation near where it\'s awaited',
    'Test with realistic concurrency (concurrent.futures or asyncio.gather)',
    'Use structured concurrency (TaskGroup in Python 3.11+)',
    'Monitor for event loop blocking with asyncio.get_running_loop()',
    'Use pydantic for async-friendly validation',
  ],
  commonPitfalls: [
    'Forgetting to await a coroutine (creates Task, doesn\'t execute)',
    'Mixing sync and async without run_in_executor',
    'Creating unbounded tasks without limits',
    'Not handling CancelledError in cleanup code',
    'Race conditions with shared state (use asyncio.Lock)',
    'Deadlocks from circular Lock dependencies',
    'Connection pool exhaustion in concurrent requests',
    'Not setting timeouts on external service calls',
    'Using time.sleep() instead of asyncio.sleep()',
    'Starting tasks outside the main coroutine context',
  ],
  contextPrompt: `You are discussing Python backend development with emphasis on async/concurrent patterns.

KEY CONTEXT:
- The developer is working with async/await, asyncio, and likely FastAPI or similar frameworks
- Common concerns: event loop, task scheduling, concurrent I/O, connection pooling, error handling
- Performance is critical: they care about handling multiple concurrent connections efficiently

WHEN DISCUSSING PYTHON CODE:
- Always consider whether operations are blocking the event loop
- Point out async/await opportunities and pitfalls
- Reference asyncio primitives when discussing concurrency
- Discuss connection pool management for databases
- Consider timeout strategies for external calls
- Explain task lifecycle and cancellation patterns

PYTHON-SPECIFIC KNOWLEDGE:
- asyncio.gather(), asyncio.create_task(), asyncio.TaskGroup()
- context managers and resource cleanup in async contexts
- run_in_executor() for sync code in async contexts
- Lock, Semaphore, Condition, Event for synchronization
- Testing with asyncio.run(), pytest-asyncio, httpx AsyncClient

AVOID:
- Suggesting sync solutions when async is available
- Forgetting timeout strategies for network operations
- Over-complicating concurrency (simpler is better)`,
};

/**
 * REACT FRONTEND KNOWLEDGE
 * Focus: Hooks, state management, performance, patterns
 */
export const REACT_FRONTEND_KNOWLEDGE: DomainKnowledge = {
  domain: 'react-frontend',
  concepts: [
    'React hooks and their lifecycle',
    'useState, useEffect, useReducer, useContext',
    'Custom hooks and hook composition',
    'Controlled and uncontrolled components',
    'Memoization (React.memo, useMemo, useCallback)',
    'Component composition and prop drilling',
    'State management patterns (Context, Zustand, etc)',
    'Error boundaries and error handling',
    'Suspense and lazy loading',
    'Performance optimization and profiling',
  ],
  bestPractices: [
    'Keep components small and focused (single responsibility)',
    'Use useCallback for callbacks passed to children',
    'Use useMemo only for expensive computations',
    'Lift state to common ancestor or use Context when needed',
    'Avoid creating functions in render (defines new instance each time)',
    'Use keys properly in lists (unique, stable)',
    'Handle loading and error states explicitly',
    'Test user interactions, not implementation details',
    'Lazy load heavy components or routes',
    'Profile before optimizing (use React DevTools profiler)',
  ],
  commonPitfalls: [
    'Missing or incorrect dependencies in useEffect',
    'Creating useCallback/useMemo without actual need (adds complexity)',
    'Lifting state too high (over-sharing)',
    'Functions created inline in JSX (triggers re-renders of children)',
    'Not handling loading/error states',
    'Poor key selection in lists (index keys, changing keys)',
    'Prop drilling through many levels',
    'Not memoizing expensive components receiving props',
    'Misunderstanding closure in useEffect',
    'Testing implementation instead of behavior',
  ],
  contextPrompt: `You are discussing React frontend development with emphasis on components, hooks, and performance.

KEY CONTEXT:
- The developer is working with React hooks and functional components
- Common concerns: re-renders, state management, performance, component composition
- They likely care about clean, maintainable code and good user experience

WHEN DISCUSSING REACT CODE:
- Consider component re-render implications
- Point out unnecessary memoization or optimization
- Suggest composition patterns for reusability
- Discuss state lifting and Context trade-offs
- Consider performance metrics (LCP, FID, CLS)
- Explain hook dependencies and side effects
- Reference React best practices and patterns

REACT-SPECIFIC KNOWLEDGE:
- Hook dependency arrays and their implications
- React.memo, useMemo, useCallback trade-offs
- Component composition vs prop drilling
- Error boundaries and Suspense patterns
- Keys and reconciliation algorithm
- Custom hooks for logic reuse
- Context API for cross-cutting concerns

AVOID:
- Suggesting class components instead of hooks
- Over-optimizing without profiling data
- Complex state management when simple state suffices
- Missing error and loading states`,
};

/**
 * NEXT.JS FULLSTACK KNOWLEDGE
 * Focus: App Router, API routes, server components, optimization
 */
export const NEXTJS_FULLSTACK_KNOWLEDGE: DomainKnowledge = {
  domain: 'nextjs-fullstack',
  concepts: [
    'App Router vs Pages Router',
    'Server Components vs Client Components',
    'Dynamic routing and route parameters',
    'API routes as backend endpoints',
    'Middleware and authentication',
    'Static and dynamic rendering',
    'Revalidation and ISR (Incremental Static Regeneration)',
    'Image and font optimization',
    'Streaming and Suspense',
    'Environment variables and secrets',
  ],
  bestPractices: [
    'Use Server Components by default, Client Components only when needed',
    'Place API logic in /app/api routes',
    'Use middleware for cross-cutting concerns (auth, logging)',
    'Leverage static generation when possible (faster, better SEO)',
    'Use Image component for responsive images',
    'Use dynamic imports for code splitting',
    'Keep sensitive data on server (API keys, database access)',
    'Use revalidateTag() for targeted cache invalidation',
    'Structure API routes with clear naming (route.ts)',
    'Use environment variables for configuration',
  ],
  commonPitfalls: [
    'Marking everything as Client Component when Server Components would work',
    'Calling server-only code from client components',
    'Not using Image component for images (performance impact)',
    'Over-fetching data in Server Components',
    'Missing error boundaries for error handling',
    'Incorrect cache strategy (all static vs all dynamic)',
    'Not leveraging Suspense for streaming',
    'Storing sensitive data in environment variables visible to client',
    'Heavy JavaScript bundles sent to client',
    'Not considering SEO implications of rendering strategy',
  ],
  contextPrompt: `You are discussing Next.js fullstack development with emphasis on App Router and modern patterns.

KEY CONTEXT:
- The developer is using Next.js 13+ with App Router (not Pages Router)
- Common concerns: server/client boundaries, performance, data fetching, caching
- They care about: SEO, Core Web Vitals, build performance, developer experience

WHEN DISCUSSING NEXT.JS CODE:
- Default to Server Components unless interactivity is needed
- Point out data fetching opportunities (fetch on server, not client)
- Discuss caching strategies (static, revalidation, dynamic)
- Consider Core Web Vitals and image/font optimization
- Explain server/client boundary implications
- Reference App Router patterns and conventions
- Discuss API route design and middleware

NEXTJS-SPECIFIC KNOWLEDGE:
- 'use server' and 'use client' directives
- fetch() with cache options and revalidateTag()
- Middleware in middleware.ts
- API routes in /app/api
- Layout nesting and hierarchy
- Streaming with Suspense
- useSearchParams, useRouter on client
- Next/image and Next/font components

AVOID:
- Suggesting Pages Router patterns
- Client-side data fetching when server-side would work
- Missing optimization opportunities
- Ignoring cache behavior implications`,
};

/**
 * MIXED DOMAIN KNOWLEDGE
 * Focus: Working across Python backend and React/Next.js frontend
 */
export const MIXED_DOMAIN_KNOWLEDGE: DomainKnowledge = {
  domain: 'nextjs-fullstack', // Use fullstack as base
  concepts: [
    'Full-stack architecture patterns',
    'API design and RESTful conventions',
    'Authentication and session management',
    'Data serialization and validation',
    'CORS and cross-origin requests',
    'WebSocket and real-time communication',
    'Type safety across frontend and backend',
    'Error handling and error boundaries',
    'State management with server state',
    'Testing strategies for full-stack apps',
  ],
  bestPractices: [
    'Share TypeScript types between frontend and backend where possible',
    'Use consistent error handling patterns across layers',
    'Validate data at API boundaries (both frontend and backend)',
    'Implement proper authentication and authorization flows',
    'Design APIs with frontend consumption in mind',
    'Use proper HTTP status codes and error responses',
    'Consider loading states and optimistic updates',
    'Keep business logic on the backend, UI logic on frontend',
    'Use environment variables for configuration',
    'Implement proper logging and monitoring across stack',
  ],
  commonPitfalls: [
    'Mixing business logic into frontend components',
    'Inconsistent error handling across layers',
    'Missing or inadequate API validation',
    'Poor separation of concerns between frontend and backend',
    'Not handling network errors gracefully',
    'Insecure data handling and authentication',
    'Over-fetching or under-fetching data from APIs',
    'Not considering the full request lifecycle',
    'Tight coupling between frontend and backend',
    'Missing CORS configuration for development',
  ],
  contextPrompt: `You are discussing full-stack development spanning both Python backend and React/Next.js frontend.

KEY CONTEXT:
- The developer is working across the entire stack
- Common concerns: API design, data flow, authentication, type safety, error handling
- They care about: maintainability, consistency, performance, security

WHEN DISCUSSING FULL-STACK CODE:
- Consider both frontend and backend implications
- Discuss API design and data contracts
- Point out opportunities for type sharing
- Consider the full request/response lifecycle
- Discuss authentication and authorization patterns
- Reference both frontend and backend best practices
- Consider error handling at all layers

FULL-STACK KNOWLEDGE:
- API design patterns (REST, GraphQL, tRPC)
- Authentication flows (JWT, sessions, OAuth)
- Data validation on both ends
- Type safety with TypeScript
- Error handling and logging
- Testing strategies across layers
- Deployment and environment configuration

AVOID:
- Suggesting frontend-only or backend-only solutions
- Missing security considerations
- Not validating at API boundaries
- Tight coupling between layers`,
};

/**
 * Domain knowledge repository
 */
export const DOMAIN_KNOWLEDGE_BASE: Record<
  'python-backend' | 'react-frontend' | 'nextjs-fullstack' | 'mixed',
  DomainKnowledge
> = {
  'python-backend': PYTHON_BACKEND_KNOWLEDGE,
  'react-frontend': REACT_FRONTEND_KNOWLEDGE,
  'nextjs-fullstack': NEXTJS_FULLSTACK_KNOWLEDGE,
  'mixed': MIXED_DOMAIN_KNOWLEDGE,
};

/**
 * Get domain knowledge by type
 */
export function getDomainKnowledge(
  domain: 'python-backend' | 'react-frontend' | 'nextjs-fullstack' | 'mixed'
): DomainKnowledge {
  return DOMAIN_KNOWLEDGE_BASE[domain];
}

/**
 * Get context prompt for a domain
 */
export function getDomainContextPrompt(
  domain: 'python-backend' | 'react-frontend' | 'nextjs-fullstack' | 'mixed'
): string {
  return getDomainKnowledge(domain).contextPrompt;
}

/**
 * Format domain knowledge for injection into system prompt
 * Accepts Domain type from contextDetector (includes null)
 */
export function formatDomainKnowledge(domain: Domain): string | null {
  // Handle null case - no domain knowledge to inject
  if (!domain) {
    return null;
  }

  const knowledge = getDomainKnowledge(domain);

  return `
DOMAIN CONTEXT: ${domain.replace('-', ' ').toUpperCase()}

Key Concepts:
${knowledge.concepts.map(c => `• ${c}`).join('\n')}

Best Practices:
${knowledge.bestPractices.slice(0, 5).map(p => `• ${p}`).join('\n')}

Common Pitfalls to Avoid:
${knowledge.commonPitfalls.slice(0, 5).map(p => `• ${p}`).join('\n')}

${knowledge.contextPrompt}
`;
}

/**
 * Example usage:
 * 
 * import { getDomainKnowledge, formatDomainKnowledge } from './domainKnowledge';
 * 
 * const pythonKnowledge = getDomainKnowledge('python-backend');
 * console.log(pythonKnowledge.concepts); // All Python async concepts
 * 
 * const formattedPrompt = formatDomainKnowledge('python-backend');
 * // Use in system prompt:
 * const systemPrompt = basePrompt + '\n\n' + formattedPrompt;
 */
