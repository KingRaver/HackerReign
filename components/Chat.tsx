'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [model, setModel] = useState('llama3.2:3b-instruct-q5_K_M');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model, 
          messages: [{ role: 'user', content: input }] 
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const aiMsg: Message = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant' as const, 
        content: 'Error: ' + (error as Error).message 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
      {/* Model Selector */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          'llama3.2:3b-instruct-q5_K_M',
          'qwen2.5:7b-instruct-q5_K_M',
          'qwen2.5-coder:7b-instruct-q5_K_M'
        ].map((m) => (
          <button
            key={m}
            onClick={() => setModel(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              model === m
                ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {m.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="h-96 md:h-125 overflow-y-auto bg-black/20 rounded-2xl p-6 space-y-4 border border-white/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <div className="w-16 h-16 mb-4 rounded-full bg-linear-to-r from-blue-500 to-purple-600 animate-spin"></div>
            <p>Select a model and start chatting!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask Hacker Reign anything... (Python, Next.js, Web3)"
          className="flex-1 p-4 bg-white/10 text-white border border-white/20 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-8 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
      <p className="text-xs text-white/50 text-center">
        Local Ollama on M4 • {model.split(':')[0]}
      </p>
    </div>
  );
}
