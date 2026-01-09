/**
 * useVoiceFlow Hook
 * Unified voice interaction combining STT, TTS, and auto-resume logic
 * Manages the conversation flow: listen → process → think → speak → auto-listen
 */

'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceInput } from './useVoiceInput';
import { useVoiceOutput } from './useVoiceOutput';
import { getVoiceStateManager } from './voiceStateManager';

interface UseVoiceFlowProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceFlow({ onTranscript, onError }: UseVoiceFlowProps) {
  const stateManager = getVoiceStateManager();
  const [audioFrequency, setAudioFrequency] = useState({ beat: 0, amplitude: 0 });
  const autoResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoResumingRef = useRef(false);

  // Voice input (STT)
  const voiceInput = useVoiceInput({
    onTranscript: (text) => {
      stateManager.setState('processing');
      stateManager.setUserTranscript(text);
      onTranscript(text);
    },
    onListeningChange: (isListening) => {
      if (isListening) {
        stateManager.setState('listening');
      }
    },
    onError: (error) => {
      stateManager.setError(error);
      onError?.(error);
    }
  });

  // Voice output (TTS)
  const voiceOutput = useVoiceOutput({
    onFrequencyAnalysis: (data) => {
      setAudioFrequency({
        beat: data.beat,
        amplitude: data.amplitude
      });
      stateManager.setBeat(data.beat);
      stateManager.setAudioAmplitude(data.amplitude);
    },
    onPlaybackEnd: () => {
      // Auto-resume listening after TTS finishes
      autoResumeListening();
    },
    onError: (error) => {
      stateManager.setError(error);
      onError?.(error);
    }
  });

  /**
   * Start the conversation flow:
   * 1. Listen for user input
   * 2. Get transcript and send to LLM (handled by Chat.tsx)
   * 3. LLM processes and speaks response
   */
  const startListening = useCallback(() => {
    // Clear any pending auto-resume
    if (autoResumeTimeoutRef.current) {
      clearTimeout(autoResumeTimeoutRef.current);
      autoResumeTimeoutRef.current = null;
    }
    isAutoResumingRef.current = false;
    stateManager.setAutoResuming(false);

    voiceInput.startListening();
  }, [voiceInput]);

  const stopListening = useCallback(() => {
    voiceInput.stopListening();
  }, [voiceInput]);

  /**
   * Speak AI response and auto-resume listening
   * @param text - The AI response text to speak
   * @param autoResume - Whether to auto-resume listening after speaking (default: true)
   */
  const speakResponse = useCallback(
    async (text: string, autoResume = true) => {
      if (!text.trim()) return;

      stateManager.setState('generating');
      stateManager.setAiResponse(text);

      try {
        await voiceOutput.speak(text);

        // After speech finishes, auto-resume if enabled
        if (autoResume) {
          autoResumeListening();
        } else {
          stateManager.setState('idle');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'TTS error';
        stateManager.setError(errorMsg);
        onError?.(errorMsg);
      }
    },
    [voiceOutput, onError]
  );

  /**
   * Auto-resume listening with a small delay to give user time to think
   */
  const autoResumeListening = useCallback(() => {
    if (isAutoResumingRef.current) return; // Prevent double-resume

    isAutoResumingRef.current = true;
    stateManager.setAutoResuming(true);

    // Small delay (0.5 seconds) before resuming to give user time to think
    autoResumeTimeoutRef.current = setTimeout(() => {
      stateManager.setAutoResuming(false);
      voiceInput.startListening();
    }, 500);
  }, [voiceInput]);

  /**
   * Notify state manager that LLM is thinking
   */
  const setThinking = useCallback(() => {
    stateManager.setState('thinking');
  }, []);

  /**
   * Notify state manager that TTS is speaking (explicit call if needed)
   */
  const setSpeaking = useCallback(() => {
    stateManager.setState('speaking');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoResumeTimeoutRef.current) {
        clearTimeout(autoResumeTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isListening: voiceInput.isListening,
    isPlaying: voiceOutput.isPlaying,
    audioFrequency,
    error: voiceInput.error || voiceOutput.error,
    state: stateManager.getState(),

    // Actions
    startListening,
    stopListening,
    speakResponse,
    setThinking,
    setSpeaking,
    autoResumeListening,

    // State manager access (for Chat.tsx to subscribe to state changes)
    subscribe: (listener: (state: any) => void) => stateManager.subscribe(listener),
    getState: () => stateManager.getState(),
    setState: (state: any) => stateManager.setState(state)
  };
}