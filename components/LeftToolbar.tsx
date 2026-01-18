// components/LeftToolbar.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type StrategyType = 'balanced' | 'speed' | 'quality' | 'cost' | 'adaptive' | 'workflow';
type WorkflowMode = 'auto' | 'chain' | 'ensemble';

interface ModelOption {
  id: string;
  name: string;
  speed: string;
}

export interface ToolbarSettings {
  manualMode: '' | 'learning' | 'code-review' | 'expert';
  selectedStrategy: StrategyType;
  workflowMode: WorkflowMode;
  model: string;
  enableTools: boolean;
  voiceEnabled: boolean;
  strategyEnabled: boolean;
  memoryConsent: boolean;
}

interface LeftToolbarProps {
  models: ModelOption[];
  autoSelectedModel: string;
  onSettingsChange: (settings: ToolbarSettings) => void;
}

export default function LeftToolbar({
  models,
  autoSelectedModel,
  onSettingsChange,
}: LeftToolbarProps) {
  // LeftToolbar owns all settings state
  const [settings, setSettings] = useState<ToolbarSettings>({
    manualMode: '',
    selectedStrategy: 'balanced',
    workflowMode: 'auto',
    model: 'qwen2.5-coder:7b-instruct-q5_K_M',
    enableTools: false,
    voiceEnabled: false,
    strategyEnabled: false,
    memoryConsent: false,
  });

  // Load memory consent preference on mount
  useEffect(() => {
    const loadConsent = async () => {
      try {
        const response = await fetch('/api/memory/consent');
        if (!response.ok) return;
        const data = await response.json();
        setSettings(prev => ({ ...prev, memoryConsent: Boolean(data?.consent) }));
      } catch (error) {
        console.warn('[LeftToolbar] Failed to load memory consent:', error);
      }
    };
    loadConsent();
  }, []);

  // Notify Chat whenever settings change
  useEffect(() => {
    onSettingsChange(settings);
  }, [settings, onSettingsChange]);

  // Update individual settings
  const updateSetting = <K extends keyof ToolbarSettings>(
    key: K,
    value: ToolbarSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle memory consent toggle with API call
  const handleMemoryConsentToggle = async () => {
    const next = !settings.memoryConsent;
    updateSetting('memoryConsent', next);
    try {
      const response = await fetch('/api/memory/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: next }),
      });
      if (!response.ok) {
        updateSetting('memoryConsent', !next); // Revert on error
      }
    } catch (error) {
      console.warn('[LeftToolbar] Failed to update memory consent:', error);
      updateSetting('memoryConsent', !next); // Revert on error
    }
  };

  const toggleStyle =
    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95';

  return (
    <>
      {/* Desktop: Vertical Tool Rail */}
      <aside className="hidden md:flex flex-col w-56 shrink-0">
        <div className="rounded-3xl border-2 border-slate-900/40 bg-linear-to-b from-cyan-light/30 via-white/70 to-peach/40 shadow-xl p-4">
          <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
            Tool Rail
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <select
              value={settings.manualMode}
              onChange={(e) =>
                updateSetting('manualMode', e.target.value as '' | 'learning' | 'code-review' | 'expert')
              }
              className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-slate-900/40 hover:bg-white hover:border-slate-900/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/60 cursor-pointer shadow-sm hover:shadow-md"
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

            <div className="rounded-2xl border-2 border-slate-900/30 bg-white/60 p-3 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Model
              </div>
              <select
                value={settings.model}
                onChange={(e) => updateSetting('model', e.target.value)}
                disabled={settings.strategyEnabled}
                className="mt-2 w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/80 text-slate-900 border-2 border-slate-900/40 hover:bg-white hover:border-slate-900/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/60 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                title={
                  settings.strategyEnabled
                    ? 'Model selection disabled when Strategy is enabled'
                    : 'Select the AI model to use'
                }
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white text-slate-900 font-bold">
                    {m.name} {m.speed}
                  </option>
                ))}
              </select>
              {settings.strategyEnabled && autoSelectedModel && (
                <div
                  className="mt-2 text-[11px] font-bold text-slate-800 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-900/30 text-center"
                  title="Model automatically selected by strategy"
                >
                  🤖 {autoSelectedModel}
                </div>
              )}
            </div>

            <Link
              href="/analytics"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 border-slate-900/50 bg-white/70 text-slate-900 hover:bg-white hover:border-slate-900/80 transition-all shadow-sm hover:shadow-md"
              title="Analytics dashboard"
            >
              📊 Analytics
            </Link>

            <button
              onClick={() => updateSetting('strategyEnabled', !settings.strategyEnabled)}
              className={`${toggleStyle} ${
                settings.strategyEnabled
                  ? 'bg-linear-to-r from-yellow/80 to-peach/80 text-slate-900 border-slate-900/70'
                  : 'bg-white/60 text-slate-900 border-slate-900/40 hover:border-slate-900/70'
              }`}
              title="Toggle adaptive strategy"
            >
              ⚡ Strategy {settings.strategyEnabled ? 'ON' : 'OFF'}
            </button>

            {settings.strategyEnabled && (
              <>
                <select
                  value={settings.selectedStrategy}
                  onChange={(e) => updateSetting('selectedStrategy', e.target.value as StrategyType)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-slate-900/40 hover:bg-white hover:border-slate-900/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/60 cursor-pointer shadow-sm hover:shadow-md"
                  title="Select optimization strategy"
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

                {settings.selectedStrategy === 'workflow' && (
                  <select
                    value={settings.workflowMode}
                    onChange={(e) => updateSetting('workflowMode', e.target.value as WorkflowMode)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-purple-600/40 hover:bg-white hover:border-purple-600/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600/50 cursor-pointer shadow-sm hover:shadow-md"
                    title="Select workflow mode"
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

            <button
              onClick={() => updateSetting('enableTools', !settings.enableTools)}
              className={`${toggleStyle} ${
                settings.enableTools
                  ? 'bg-linear-to-r from-yellow/80 to-peach/80 text-slate-900 border-slate-900/70'
                  : 'bg-white/60 text-slate-900 border-slate-900/40 hover:border-slate-900/70'
              }`}
              title="Toggle tools"
            >
              🛠️ Tools {settings.enableTools ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={handleMemoryConsentToggle}
              className={`${toggleStyle} ${
                settings.memoryConsent
                  ? 'bg-linear-to-r from-cyan-light/80 to-teal/80 text-slate-900 border-slate-900/70'
                  : 'bg-white/60 text-slate-900 border-slate-900/40 hover:border-slate-900/70'
              }`}
              title="Allow long-term memory profile usage"
            >
              🧠 Memory {settings.memoryConsent ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
              className={`${toggleStyle} ${
                settings.voiceEnabled
                  ? 'bg-linear-to-r from-red-500/90 to-pink-500/90 text-white border-slate-900/70'
                  : 'bg-white/60 text-slate-900 border-slate-900/40 hover:border-slate-900/70'
              }`}
              title="Toggle voice"
            >
              🎙️ Voice {settings.voiceEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-900/20 bg-white/60 px-3 py-2 text-[11px] font-semibold text-slate-700">
            🚧 More settings coming 🚧
          </div>
        </div>
      </aside>

      {/* Mobile: Compact Toolbar Row */}
      <div className="md:hidden flex gap-2 flex-wrap">
        <select
          value={settings.manualMode}
          onChange={(e) =>
            updateSetting('manualMode', e.target.value as '' | 'learning' | 'code-review' | 'expert')
          }
          className="px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-slate-900/40 shadow-sm"
        >
          <option value="">🤖 Auto</option>
          <option value="learning">🎓 Learning</option>
          <option value="code-review">👁️ Review</option>
          <option value="expert">🧠 Expert</option>
        </select>
        <select
          value={settings.model}
          onChange={(e) => updateSetting('model', e.target.value)}
          disabled={settings.strategyEnabled}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-slate-900/40 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <Link
          href="/analytics"
          className="px-3 py-2 rounded-xl text-xs font-bold border-2 border-slate-900/50 bg-white/70 text-slate-900 shadow-sm"
        >
          📊 Analytics
        </Link>
        <button
          onClick={() => updateSetting('strategyEnabled', !settings.strategyEnabled)}
          className={`${toggleStyle} ${
            settings.strategyEnabled
              ? 'bg-linear-to-r from-yellow/80 to-peach/80 text-slate-900 border-slate-900/70'
              : 'bg-white/60 text-slate-900 border-slate-900/40'
          }`}
        >
          ⚡ Strategy
        </button>
        {settings.strategyEnabled && (
          <>
            <select
              value={settings.selectedStrategy}
              onChange={(e) => updateSetting('selectedStrategy', e.target.value as StrategyType)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-slate-900/40 shadow-sm"
            >
              <option value="balanced">⚖️ Balanced</option>
              <option value="speed">🚀 Speed</option>
              <option value="quality">🧠 Quality</option>
              <option value="cost">💰 Cost</option>
              <option value="adaptive">🤖 Adaptive ML</option>
              <option value="workflow">🔗 Workflow</option>
            </select>
            {settings.selectedStrategy === 'workflow' && (
              <select
                value={settings.workflowMode}
                onChange={(e) => updateSetting('workflowMode', e.target.value as WorkflowMode)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/70 text-slate-900 border-2 border-purple-600/40 shadow-sm"
              >
                <option value="auto">🎯 Auto</option>
                <option value="chain">⛓️ Chain</option>
                <option value="ensemble">🗳️ Ensemble</option>
              </select>
            )}
          </>
        )}
        <button
          onClick={() => updateSetting('enableTools', !settings.enableTools)}
          className={`${toggleStyle} ${
            settings.enableTools
              ? 'bg-linear-to-r from-yellow/80 to-peach/80 text-slate-900 border-slate-900/70'
              : 'bg-white/60 text-slate-900 border-slate-900/40'
          }`}
        >
          🛠️ Tools
        </button>
        <button
          onClick={handleMemoryConsentToggle}
          className={`${toggleStyle} ${
            settings.memoryConsent
              ? 'bg-linear-to-r from-cyan-light/80 to-teal/80 text-slate-900 border-slate-900/70'
              : 'bg-white/60 text-slate-900 border-slate-900/40'
          }`}
        >
          🧠 Memory
        </button>
        <button
          onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
          className={`${toggleStyle} ${
            settings.voiceEnabled
              ? 'bg-linear-to-r from-red-500/90 to-pink-500/90 text-white border-slate-900/70'
              : 'bg-white/60 text-slate-900 border-slate-900/40'
          }`}
        >
          🎙️ Voice
        </button>
      </div>
    </>
  );
}
