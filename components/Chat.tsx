// components/Chat.tsx
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import ParticleOrb from './ParticleOrb';
import TopNav from './TopNav';
import { useVoiceFlow } from '@/app/lib/voice/useVoiceFlow';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type StrategyType = 'balanced' | 'speed' | 'quality' | 'cost';

export default function Chat() {
  // State Management
  const [model, setModel] = useState('qwen2.5-coder:7b-instruct-q5_K_M');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableTools, setEnableTools] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [manualMode, setManualMode] = useState<'' | 'learning' | 'code-review' | 'expert'>('');
  const [strategyEnabled, setStrategyEnabled] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('balanced');
  const [autoSelectedModel, setAutoSelectedModel] = useState<string>('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Models Configuration
  const models = [
    { id: 'llama3.2:3b-instruct-q5_K_M', name: 'Llama 3.2', speed: '🚀' },
    { id: 'qwen2.5:7b-instruct-q5_K_M', name: 'Qwen 2.5', speed: '🎯🔨' },
    { id: 'qwen2.5-coder:7b-instruct-q5_K_M', name: 'Vibe Coder', speed: '⚡' },
    { id: 'yi-coder:9b', name: 'Yi 9B', speed: '🧠' },
    { id: 'deepseek-coder-v2:16b', name: 'DS V2 16B', speed: '🔥' }
  ];

  // Voice flow hook - handles STT, TTS, and seamless conversation loop
  const voice = useVoiceFlow({
    onTranscript: (text) => {
      console.log('[Chat] Voice transcript received:', text);
      // Auto-send transcript to LLM
      handleSendMessage(text);
    },
    onError: (error) => {
      console.error('[Chat] Voice error:', error);
      // Error already displayed in voice hook state
    },
    onStateChange: (state) => {
      console.log('[Chat] Voice state changed:', state);
      // For orb visualization updates
    }
  });

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Store voice functions in refs to avoid infinite loops
  const voiceRef = useRef(voice);

  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  // Handle voice toggle
  useEffect(() => {
    if (voiceEnabled) {
      console.log('[Chat] Voice enabled - starting listening');
      voiceRef.current.startListening();
    } else {
      console.log('[Chat] Voice disabled - stopping');
      voiceRef.current.stopListening();
    }
  }, [voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[Chat] Cleanup - stopping voice');
      voiceRef.current.stopListening();
    };
  }, []);

  /**
   * Send message to LLM (called by text input or voice transcript)
   */
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userId = Date.now().toString();
    const userMsg: Message = { id: userId, role: 'user', content: messageText };

    // Update messages and clear input
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Notify voice system that LLM is thinking
      if (voiceEnabled) {
        voice.setThinking();
      }

      // Send to LLM API
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [...messages, userMsg],
          stream: !enableTools,
          enableTools,
          manualModeOverride: manualMode || undefined,
          strategyEnabled,
          selectedStrategy: strategyEnabled ? selectedStrategy : undefined
        })
      });

      if (!response.ok) throw new Error('API error');

      const aiId = (Date.now() + 1).toString();

      if (enableTools) {
        // Non-streaming response (tools enabled)
        const data = await response.json();
        const content = data.content || '';
        const aiMsg: Message = { id: aiId, role: 'assistant', content };

        setMessages(prev => [...prev, aiMsg]);

        // Update auto-selected model if strategy is enabled
        if (strategyEnabled && data.autoSelectedModel) {
          setAutoSelectedModel(data.autoSelectedModel);
        }

        // Speak response if voice enabled
        if (voiceEnabled && content) {
          await voice.speakResponse(content, true); // true = auto-resume after speaking
        }
      } else {
        // Streaming response (tools disabled)
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
                    // Skip invalid JSON lines
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          // Speak full response if voice enabled
          if (voiceEnabled && fullContent) {
            await voice.speakResponse(fullContent, true); // true = auto-resume after speaking
          }
        }
      }

    } catch (error: unknown) {
      console.error('[Chat] Send message error:', error);
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
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Sticky Top Navigation */}
      <TopNav
        model={model}
        manualMode={manualMode}
        strategyEnabled={strategyEnabled}
        selectedStrategy={selectedStrategy}
        enableTools={enableTools}
        voiceEnabled={voiceEnabled}
        autoSelectedModel={autoSelectedModel}
        messageCount={messages.length}
        onModelChange={setModel}
        onModeChange={setManualMode}
        onStrategyToggle={setStrategyEnabled}
        onStrategyChange={setSelectedStrategy}
        onToolsToggle={() => setEnableTools(!enableTools)}
        onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
        models={models}
      />

      {/* Main Chat Container - Professional Light Background */}
      <div className="pt-24 pb-8 px-8 min-h-screen bg-linear-to-br from-slate-50 via-cyan-50/30 to-slate-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-6 h-[calc(100vh-8rem)]">
          
          {/* Messages Container */}
          <div className="flex-1 flex flex-col bg-linear-to-br from-orange-50/95 to-rose-50/85 backdrop-blur-lg rounded-3xl p-8 border border-orange-200/60 shadow-inner shadow-orange-100/40 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-orange-400/60 scrollbar-track-transparent space-y-5">
              {messages.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-24 h-24 mb-6 rounded-2xl bg-linear-to-r from-cyan-light/30 to-teal/30 border-2 border-cyan-light/40 animate-pulse shadow-lg" />
                  <p className="text-lg font-bold text-slate-500 tracking-tight">
                    Select your AI specialist
                  </p>
                  <p className="text-xs mt-3 opacity-70 font-medium text-slate-400">
                    Python • Next.js • Offline • Voice Ready
                  </p>
                </div>
              ) : (
                <>
                  {/* Message List */}
                  {messages.map((msg: Message) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      } animate-in slide-in-from-bottom-3 duration-300 ease-out`}
                    >
                      {msg.role === 'user' ? (
                        // User Message - Right aligned with teal/cyan gradient
                        <div className="max-w-2xl p-6 rounded-2xl shadow-lg border-2 border-teal/50 bg-linear-to-br from-teal/90 to-cyan-light/80 text-white hover:shadow-xl hover:shadow-teal/40 transition-all duration-200 hover:border-teal/70">
                          <p className="whitespace-pre-wrap leading-relaxed font-medium text-white text-sm">
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        // Assistant Message - Left aligned with slate background
                        <div className="max-w-2xl p-6 rounded-2xl shadow-md border-2 border-slate-200 bg-slate-100/80 text-slate-900 hover:shadow-lg hover:shadow-teal/20 transition-all duration-200 hover:bg-slate-100 hover:border-slate-300">
                          <p className="whitespace-pre-wrap leading-relaxed font-normal text-slate-900 text-sm">
                            {msg.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex justify-start animate-in slide-in-from-bottom-3 duration-300">
                      <div className="p-6 rounded-2xl bg-slate-100/80 text-slate-900 border-2 border-slate-200 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-2">
                            <div className="w-2.5 h-2.5 bg-cyan-light rounded-full animate-bounce [animation-delay:0s]" />
                            <div className="w-2.5 h-2.5 bg-teal rounded-full animate-bounce [animation-delay:0.1s]" />
                            <div className="w-2.5 h-2.5 bg-yellow rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                          <span className="text-xs font-medium text-slate-600 ml-1">
                            {voiceEnabled ? 'Listening...' : 'Thinking...'} ({model.split(':')[0]})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Scroll Anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Voice or Text Mode */}
          {voiceEnabled ? (
            // Voice Mode - Seamless Conversation Loop
            <div className="flex flex-col items-center gap-6 py-6">
              <ParticleOrb
                state={voice.state === 'auto-resuming' ? 'listening' : (voice.state as any)}
                audioLevel={voice.audioLevel}
                beat={voice.audioFrequency.beat}
                disabled={isLoading || !voiceEnabled}
                onClick={() => {
                  // Toggle voice on/off via the orb
                  setVoiceEnabled(!voiceEnabled);
                }}
              />

              {/* Voice Error Display */}
              {voice.error && (
                <div className="text-center text-red-600 text-sm font-medium">
                  {voice.error}
                </div>
              )}

              {/* Auto-Resume Status */}
              {voice.state === 'auto-resuming' && (
                <div className="text-center text-teal/70 text-xs font-medium animate-pulse">
                  Ready to listen...
                </div>
              )}
            </div>
          ) : (
            // Text Mode - Input Area
            <div className="flex gap-3 p-2 bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-cyan-light/40 shadow-xl hover:border-cyan-light/60 transition-all duration-200 hover:shadow-2xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about code, Web3, or anything... (Enter to send)"
                className="flex-1 p-5 bg-transparent text-slate-900 placeholder-slate-400 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-teal/60 rounded-xl min-h-11 max-h-32 font-medium text-sm transition-all duration-200"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="px-8 py-5 bg-linear-to-r from-yellow/90 to-peach/90 text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-yellow/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap hover:scale-105 active:scale-95 text-sm tracking-wide border-2 border-slate-900/20"
              >
                Send
              </button>
            </div>
          )}

          {/* Footer - Status Info */}
          <div className="text-xs text-slate-500 text-center pt-4 border-t border-cyan-light/20 font-medium tracking-widest">
            🔒 Offline • M4 Optimized • {model.split(':')[0]} • {messages.length} messages 
            {manualMode && ` • ${
              manualMode === 'learning' 
                ? '🎓' 
                : manualMode === 'code-review' 
                ? '👁️' 
                : '🧠'
            } ${manualMode}`}
            {voiceEnabled && ' • 🎤 Voice Active'}
          </div>
        </div>
      </div>
    </>
  );
}