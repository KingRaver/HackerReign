# Hacker Reign

A Next.js-powered chat application with local LLM integration via Ollama, featuring advanced tool support for weather, calculations, and code execution.

## Features

- **Local LLM Integration**: Connects to Ollama for private, on-device AI chat
- **Tool Support**: Built-in tools for weather queries, calculations (mathjs), and safe code execution (vm2 sandbox)
- **Streaming Responses**: Real-time streaming for fast, responsive chat experience
- **Timeout Protection**: 30-second fetch timeouts prevent indefinite hanging
- **Comprehensive Logging**: Detailed request/response logging for debugging
- **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4

## Prerequisites

1. **Ollama**: Install and run Ollama locally
   ```bash
   # Install Ollama (macOS)
   brew install ollama

   # Start Ollama service
   ollama serve

   # Pull a model (example: qwen2.5-coder)
   ollama pull qwen2.5-coder:7b-instruct-q5_K_M
   ```

2. **Node.js**: Version 20 or higher recommended

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Start chatting:**
   The app auto-updates as you edit files. Try asking for weather, calculations, or code examples!

## Available Tools

The LLM has access to the following tools:

- **get_weather**: Get current weather for a city (mock data)
- **calculator**: Perform math operations using mathjs
- **code_exec**: Execute safe code snippets in a vm2 sandbox

## Project Structure

See [STRUCTURE.md](STRUCTURE.md) for detailed project organization.

## Troubleshooting

### LLM Request Timeout
If you see "Headers Timeout Error" or requests taking too long:
1. Check if Ollama is running: `ollama list`
2. Verify the service is accessible: `curl http://localhost:11434/v1/models`
3. Check logs for tool execution issues - the app now has comprehensive logging
4. Requests now timeout after 30 seconds with clear error messages

### Tool Execution Errors
If tools aren't working:
1. Verify dependencies are installed: `npm list mathjs vm2`
2. Check console logs for `[Tool Executor]` messages
3. Review the tool handler mapping in `app/lib/tools/executor.ts`

## Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript types
```

## API Improvements (Recent)

- **Timeout Protection**: 30-second AbortController on all fetch requests
- **Tool Handler Mapping**: Fixed dynamic imports with explicit name mapping
- **Enhanced Logging**: Request lifecycle tracking with timestamps
- **Error Handling**: Detailed error messages with duration and stack traces
- **Loop Protection**: Max 5 tool iterations to prevent infinite loops

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

## License

MIT
