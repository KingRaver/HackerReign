// components/TopNav.tsx
'use client';
import Link from 'next/link';

interface Model {
  id: string;
  name: string;
  speed: string;
}

type StrategyType = 'balanced' | 'speed' | 'quality' | 'cost' | 'adaptive' | 'workflow';
type WorkflowMode = 'auto' | 'chain' | 'ensemble';

interface TopNavProps {
  // State values
  model: string;
  manualMode: '' | 'learning' | 'code-review' | 'expert';
  strategyEnabled: boolean;
  selectedStrategy: StrategyType;
  workflowMode: WorkflowMode;
  enableTools: boolean;
  voiceEnabled: boolean;
  autoSelectedModel: string;
  messageCount: number;

  // Handlers
  onModelChange: (model: string) => void;
  onModeChange: (mode: '' | 'learning' | 'code-review' | 'expert') => void;
  onStrategyToggle: (enabled: boolean) => void;
  onStrategyChange: (strategy: StrategyType) => void;
  onWorkflowModeChange: (mode: WorkflowMode) => void;
  onToolsToggle: () => void;
  onVoiceToggle: () => void;

  // Metadata
  models: Model[];
}

export default function TopNav({
  model,
  manualMode,
  strategyEnabled,
  selectedStrategy,
  workflowMode,
  enableTools,
  voiceEnabled,
  autoSelectedModel,
  messageCount,
  onModelChange,
  onModeChange,
  onStrategyToggle,
  onStrategyChange,
  onWorkflowModeChange,
  onToolsToggle,
  onVoiceToggle,
  models,
}: TopNavProps) {
  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* Main Navigation Container with Vibrant Gradient */}
      <div className="w-full bg-linear-to-r from-cyan-light via-teal to-peach shadow-2xl border-b-4 border-black/20"
      >
        <div className="max-w-full mx-auto px-8 py-5">
          {/* Top Row: Branding + Controls */}
          <div className="flex items-center justify-between gap-8">
            {/* Left: Branding - Clickable Logo to Analytics Dashboard */}
            <Link href="/analytics" className="flex flex-col min-w-max group cursor-pointer">
              <h1 className="text-2xl font-black text-slate-900 drop-shadow-sm tracking-tight group-hover:text-slate-700 transition-colors">
                🐺 Hacker Reign
              </h1>
              <p className="text-slate-800 text-xs font-bold tracking-widest uppercase group-hover:text-slate-700 transition-colors">
                Enterprise Intelligence
              </p>
            </Link>

            {/* Center Divider */}
            <div className="h-12 w-1 bg-slate-900/30 rounded-full" />

            {/* Right: Control Groups */}
            <div className="flex gap-6 items-center flex-1">
              {/* Group 1: Mode & Strategy */}
              <div className="flex gap-3 items-center">
                {/* Mode Selector */}
                <select
                  value={manualMode}
                  onChange={(e) =>
                    onModeChange(
                      e.target.value as '' | 'learning' | 'code-review' | 'expert'
                    )
                  }
                  className="px-4 py-2.5 rounded-lg text-xs font-bold bg-white/40 text-slate-900 border-2 border-slate-900/50 hover:bg-white/60 hover:border-slate-900/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/70 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                  title="Mode: Auto-detect or select learning, code review, or expert mode"
                >
                  <option value="" className="bg-white text-slate-900 font-bold">
                    🤖 Auto
                  </option>
                  <option value="learning" className="bg-white text-slate-900 font-bold">
                    🎓 Learning
                  </option>
                  <option value="code-review" className="bg-white text-slate-900 font-bold">
                    👁️ Review
                  </option>
                  <option value="expert" className="bg-white text-slate-900 font-bold">
                    🧠 Expert
                  </option>
                </select>

                {/* Strategy Toggle */}
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/40 text-slate-900 border-2 border-slate-900/50 hover:bg-white/60 hover:border-slate-900/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                  title="Toggle adaptive strategy to auto-select models based on task type">
                  <input
                    type="checkbox"
                    checked={strategyEnabled}
                    onChange={(e) => onStrategyToggle(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer accent-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                    ⚡ Strategy
                  </span>
                </label>

                {/* Strategy Selector (visible when enabled) */}
                {strategyEnabled && (
                  <>
                    <select
                      value={selectedStrategy}
                      onChange={(e) => onStrategyChange(e.target.value as StrategyType)}
                      className="px-4 py-2.5 rounded-lg text-xs font-bold bg-white/50 text-slate-900 border-2 border-slate-900/60 hover:bg-white/70 hover:border-slate-900/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/70 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                      title="Select optimization strategy: Balanced, Speed, Quality, Cost, Adaptive ML, or Workflow"
                    >
                      <option value="balanced" className="bg-white text-slate-900 font-bold">
                        ⚖️ Balanced
                      </option>
                      <option value="speed" className="bg-white text-slate-900 font-bold">
                        🚀 Speed
                      </option>
                      <option value="quality" className="bg-white text-slate-900 font-bold">
                        🧠 Quality
                      </option>
                      <option value="cost" className="bg-white text-slate-900 font-bold">
                        💰 Cost
                      </option>
                      <option value="adaptive" className="bg-white text-slate-900 font-bold">
                        🤖 Adaptive ML
                      </option>
                      <option value="workflow" className="bg-white text-slate-900 font-bold">
                        🔗 Workflow
                      </option>
                    </select>

                    {/* Workflow Mode Selector (visible when workflow strategy is selected) */}
                    {selectedStrategy === 'workflow' && (
                      <select
                        value={workflowMode}
                        onChange={(e) => onWorkflowModeChange(e.target.value as WorkflowMode)}
                        className="px-4 py-2.5 rounded-lg text-xs font-bold bg-white/60 text-slate-900 border-2 border-purple-600/60 hover:bg-white/80 hover:border-purple-600/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600/70 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                        title="Select workflow mode: Auto (smart selection), Chain (sequential refinement), or Ensemble (parallel voting)"
                      >
                        <option value="auto" className="bg-white text-slate-900 font-bold">
                          🎯 Auto
                        </option>
                        <option value="chain" className="bg-white text-slate-900 font-bold">
                          ⛓️ Chain (3B→7B→16B)
                        </option>
                        <option value="ensemble" className="bg-white text-slate-900 font-bold">
                          🗳️ Ensemble (Voting)
                        </option>
                      </select>
                    )}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="h-8 w-1 bg-slate-900/30 rounded-full" />

              {/* Group 2: Model Selection */}
              <div className="flex flex-col gap-2">
                <select
                  value={model}
                  onChange={(e) => onModelChange(e.target.value)}
                  disabled={strategyEnabled}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold bg-white/40 text-slate-900 border-2 border-slate-900/50 hover:bg-white/60 hover:border-slate-900/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/70 cursor-pointer shadow-sm hover:shadow-md active:scale-95 ${
                    strategyEnabled
                      ? 'opacity-60 cursor-not-allowed hover:bg-white/40 hover:border-slate-900/50 hover:shadow-sm'
                      : ''
                  }`}
                  title={
                    strategyEnabled
                      ? 'Model selection disabled when Strategy is enabled'
                      : 'Select the AI model to use'
                  }
                >
                  {models.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="bg-white text-slate-900 font-bold"
                    >
                      {m.name} {m.speed}
                    </option>
                  ))}
                </select>

                {/* Auto-selected Model Display */}
                {strategyEnabled && autoSelectedModel && (
                  <div className="text-xs font-bold text-slate-900 bg-white/50 px-3 py-1.5 rounded-lg border-2 border-slate-900/60 shadow-sm text-center whitespace-nowrap"
                    title="Model automatically selected by strategy">
                    🤖 {autoSelectedModel}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-8 w-1 bg-slate-900/30 rounded-full" />

              {/* Group 3: Toggles */}
              <div className="flex gap-3 items-center">
                {/* Tools Toggle */}
                <button
                  onClick={onToolsToggle}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 border-2 whitespace-nowrap active:scale-95 ${
                    enableTools
                      ? 'bg-linear-to-r from-yellow/90 to-peach/90 text-slate-900 border-slate-900/70 hover:border-slate-900/90 hover:shadow-lg'
                      : 'bg-white/40 text-slate-900 border-slate-900/50 hover:bg-white/60 hover:border-slate-900/80 hover:shadow-md'
                  }`}
                  title={enableTools ? 'Tools enabled - using full capabilities' : 'Tools disabled - fast streaming mode'}
                >
                  <span className="text-sm">{enableTools ? '🛠️' : '⚡'}</span>
                  <span>{enableTools ? 'Tools ON' : 'Fast'}</span>
                </button>

                {/* Voice Toggle */}
                <button
                  onClick={onVoiceToggle}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 border-2 whitespace-nowrap active:scale-95 ${
                    voiceEnabled
                      ? 'bg-linear-to-r from-red-500/90 to-pink-500/90 text-white border-slate-900/70 hover:border-slate-900/90 hover:shadow-lg'
                      : 'bg-white/40 text-slate-900 border-slate-900/50 hover:bg-white/60 hover:border-slate-900/80 hover:shadow-md'
                  }`}
                  title={voiceEnabled ? 'Voice mode active - seamless conversation' : 'Text mode - type to chat'}
                >
                  <span className="text-sm">{voiceEnabled ? '🎙️' : '💬'}</span>
                  <span>{voiceEnabled ? 'Voice ON' : 'Text'}</span>
                </button>
              </div>

              {/* Right Info: Status */}
              <div className="ml-auto flex flex-col items-end text-slate-800 text-xs font-bold whitespace-nowrap">
                <span>📊 {messageCount} messages</span>
                <span className="text-slate-700 text-xs">{model.split(':')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}