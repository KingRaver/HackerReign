'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [model, setModel] = useState('qwen2.5-coder:7b-instruct-q5_K_M');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [partialContent, setPartialContent] = useState('');
  const [enableTools, setEnableTools] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partialContent, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userId = Date.now().toString();
    const userMsg: Message = { id: userId, role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setPartialContent('');

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [...messages, userMsg],
          stream: !enableTools,  // Disable streaming when tools are enabled
          enableTools
        })
      });

      if (!response.ok) throw new Error('API error');

      const aiId = (Date.now() + 1).toString();

      if (enableTools) {
        // Handle non-streaming response (when tools are enabled)
        const data = await response.json();
        const content = data.content || '';
        const aiMsg: Message = { id: aiId, role: 'assistant', content };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Handle streaming response (when tools are disabled)
        const aiMsg: Message = { id: aiId, role: 'assistant', content: '' };
        setMessages(prev => [...prev, aiMsg]);

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullContent += content;
                      setMessages(prev => prev.map(msg =>
                        msg.id === aiId
                          ? { ...msg, content: fullContent }
                          : msg
                      ));
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      }

    } catch (error: unknown) {
      console.error('Chat error:', error);
      const errorMsg: Message = { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: `Error: ${(error as Error).message}` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const models = [
    { id: 'llama3.2:3b-instruct-q5_K_M', name: 'Llama 3.2', speed: '🚀' },
    { id: 'qwen2.5:7b-instruct-q5_K_M', name: 'Qwen 2.5', speed: '🏎️💨' },
    { id: 'qwen2.5-coder:7b-instruct-q5_K_M', name: 'Vibe Coder', speed: '⚡' }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-linear-to-br from-slate-900/90 via-teal/20 to-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-cyan-light/10 p-8 space-y-6 min-h-screen flex flex-col">
      {/* Header with improved hierarchy and spacing */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between pb-4 border-b border-cyan-light/5">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-black bg-linear-to-r from-cyan-light via-teal to-yellow bg-clip-text text-transparent drop-shadow-lg tracking-tight">
            Hacker Reign
          </h1>
          <p className="text-white/50 text-xs font-medium tracking-widest uppercase mt-2">Enterprise Intelligence</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Model Dropdown - Enhanced depth */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-5 py-3 rounded-2xl text-sm font-semibold bg-white/8 text-white border-2 border-cyan-light/30 hover:border-cyan-light/50 hover:bg-white/12 transition-all duration-200 shadow-lg hover:shadow-cyan-light/20 focus:outline-none focus:ring-2 focus:ring-cyan-light/60 cursor-pointer backdrop-blur-sm"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-white font-medium">
                {m.name} {m.speed}
              </option>
            ))}
          </select>

          {/* Tools Toggle - Enhanced distinction */}
          <button
            onClick={() => setEnableTools(!enableTools)}
            className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-lg flex items-center gap-2 border-2 ${
              enableTools
                ? 'bg-linear-to-r from-yellow/95 to-peach/95 text-gray-900 shadow-yellow/40 border-yellow/40 hover:shadow-yellow/60 hover:scale-105'
                : 'bg-white/8 text-white/90 hover:bg-white/12 border-white/20 hover:border-white/40 backdrop-blur-sm'
            }`}
          >
            <span className="text-lg">{enableTools ? '🛠️' : '❯❯❯❯'}</span>
            <span className="font-bold">{enableTools ? 'Tools ON' : 'Fast Mode'}</span>
          </button>
        </div>
      </div>

      {/* Messages Container - Enhanced depth and separation */}
      <div className="h-[70vh] flex flex-col bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-cyan-light/10 shadow-inner">
        <div className="flex-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-teal/40 scrollbar-track-transparent space-y-5">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <div className="w-24 h-24 mb-6 rounded-2xl bg-linear-to-r from-cyan-light/20 to-teal/20 border-2 border-cyan-light/20 animate-pulse shadow-lg" />
              <p className="text-lg font-bold text-white/50 tracking-tight">Select your AI specialist</p>
              <p className="text-xs mt-3 opacity-60 font-medium">Python • Next.js • Offline</p>
            </div>
          ) : (
            <>
              {messages.map((msg: Message) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-300 ease-out`}
                >
                  {msg.role === 'user' ? (
                    // User Message - Enhanced distinction
                    <div className="max-w-2xl p-6 rounded-2xl shadow-lg border border-cyan-light/40 bg-linear-to-br from-teal/85 to-cyan-light/75 text-white hover:shadow-xl hover:shadow-teal/30 transition-all duration-200 hover:border-cyan-light/60 backdrop-blur-sm">
                      <p className="whitespace-pre-wrap leading-relaxed font-medium text-white text-sm">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    // Assistant Message - Enhanced distinction
                    <div className="max-w-2xl p-6 rounded-2xl shadow-md border border-white/15 bg-white/8 text-white hover:shadow-lg hover:shadow-yellow/20 transition-all duration-200 hover:bg-white/12 hover:border-white/25 backdrop-blur-sm prose prose-invert prose-headings:font-bold prose-headings:text-white prose-a:text-cyan-light prose-a:font-semibold hover:prose-a:text-cyan-light/80">
                      <p className="whitespace-pre-wrap leading-relaxed font-normal text-white/90 text-sm">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-in slide-in-from-bottom-3 duration-300">
                  <div className="p-6 rounded-2xl bg-white/8 text-white border border-white/15 shadow-md backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-cyan-light/70 rounded-full animate-bounce [animation-delay:0s]" />
                        <div className="w-2.5 h-2.5 bg-teal/70 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2.5 h-2.5 bg-yellow/70 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                      <span className="text-xs font-medium text-white/70 ml-1">Thinking... ({model.split(':')[0]})</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Enhanced elevation and depth */}
      <div className="flex gap-3 p-2 bg-white/8 backdrop-blur-sm rounded-2xl border-2 border-cyan-light/20 shadow-lg hover:border-cyan-light/40 transition-all duration-200 hover:shadow-xl">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about code, Web3, or anything... (Enter to send)"
          className="flex-1 p-5 bg-transparent text-white placeholder-white/40 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-teal/50 rounded-xl min-h-11 max-h-32 font-medium text-sm transition-all duration-200"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-8 py-5 bg-linear-to-r from-yellow/95 to-peach/95 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-yellow/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap hover:scale-105 active:scale-95 text-sm tracking-wide"
        >
          Send
        </button>
      </div>

      {/* Footer - Improved hierarchy */}
      <div className="text-xs text-white/40 text-center pt-4 border-t border-cyan-light/5 font-medium tracking-widest">
        🔒 Offline • M4 Optimized • {model.split(':')[0]} • {messages.length} messages
      </div>
    </div>
  );
}