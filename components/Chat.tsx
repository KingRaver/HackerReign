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
        body: JSON.stringify({ model, messages: [...messages, userMsg] })
      });

      if (!response.ok) throw new Error('API error');

      const aiId = (Date.now() + 1).toString();
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
    { id: 'llama3.2:3b-instruct-q5_K_M', name: 'Llama Fast', speed: '⚡⚡⚡' },
    { id: 'qwen2.5:7b-instruct-q5_K_M', name: 'Qwen Reason', speed: '⚡⚡' },
    { id: 'qwen2.5-coder:7b-instruct-q5_K_M', name: 'Qwen Coder', speed: '⚡' }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-linear-to-br from-slate-900/90 via-teal/20 to-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-cyan-light/10 p-8 space-y-8 h-screen flex flex-col">
      {/* Header with new palette */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-black bg-linear-to-r from-cyan-light via-teal to-yellow bg-clip-text text-transparent drop-shadow-lg">
            Hacker Reign
          </h1>
          <p className="text-white/60 text-sm">Enterprise Intelligence</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all shadow-lg hover:scale-105 ${
                model === m.id
                  ? 'bg-linear-to-r from-teal/90 to-cyan-light/90 text-white shadow-teal/50'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {m.name.split(' ')[0]} <span>{m.speed}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages - with new palette accents */}
        <div className="h-[70vh] flex flex-col bg-black/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-light/10">
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal/30 scrollbar-track-transparent space-y-4">
            
            {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
                <div className="w-24 h-24 mb-6 rounded-2xl bg-linear-to-r from-cyan-light/20 to-teal/20 border-2 border-cyan-light/20 animate-pulse" />
                <p className="text-lg font-medium">Select your AI specialist</p>
                <p className="text-sm mt-2 opacity-75">Python • Next.js • Offline</p>
            </div>
            ) : (
            <>
                {messages.map((msg: Message) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}
                >
                    <div className={`max-w-2xl p-6 rounded-2xl shadow-xl backdrop-blur-sm border prose prose-invert prose-headings:text-white prose-a:text-cyan-light hover:scale-[1.01] transition-transform ${
                    msg.role === 'user'
                        ? 'bg-linear-to-r from-teal/90 to-cyan-light/90 text-white shadow-teal/25 border-cyan-light/20'
                        : 'bg-white/5 text-white hover:bg-white/10 shadow-yellow/20 border-white/10'
                    }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                </div>
                ))}
                
                {isLoading && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2">
                    <div className="p-6 rounded-2xl bg-white/5 text-white border border-cyan-light/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-cyan-light/60 rounded-full animate-bounce [animation-delay:0s]" />
                        <div className="w-3 h-3 bg-teal/60 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-3 h-3 bg-yellow/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                        <span className="text-sm opacity-75">Thinking... ({model.split(':')[0]})</span>
                    </div>
                    </div>
                </div>
                )}
            </>
            )}
            
            <div ref={messagesEndRef} />
        </div>
        </div>

      {/* Input with new palette */}
      <div className="flex gap-3 p-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-cyan-light/10">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about code, Web3, or anything... (Enter to send)"
          className="flex-1 p-5 bg-transparent text-white placeholder-white/40 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-teal/50 rounded-xl min-h-11 max-h-32"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-8 py-5 bg-linear-to-r from-yellow/90 to-peach/90 text-gray-900 font-bold rounded-xl shadow-2xl hover:shadow-yellow/25 transition-all disabled:opacity-50 whitespace-nowrap hover:scale-105"
        >
          Send
        </button>
      </div>

      <div className="text-xs text-white/40 text-center pt-2 border-t border-cyan-light/10">
        🔒 Offline • M4 Optimized • {model.split(':')[0]} • {messages.length} messages
      </div>
    </div>
  );
}
