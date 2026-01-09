// app/lib/voice/useVoiceOutput.ts
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioAnalyzer, extractBeatFromFrequency } from './audioAnalyzer';

interface FrequencyData {
  frequency: number;
  amplitude: number;
  beat: number;
}

interface UseVoiceOutputOptions {
  onFrequencyAnalysis?: (data: FrequencyData) => void;
  onPlaybackEnd?: () => void;
  onError?: (error: string) => void;
  voice?: string; // Piper voice ID
}

interface VoiceOutputState {
  isPlaying: boolean;
  isGenerating: boolean;
  error: string | null;
  progress: number; // 0-1
}

export function useVoiceOutput(options: UseVoiceOutputOptions = {}) {
  const {
    onFrequencyAnalysis,
    onPlaybackEnd,
    onError,
    voice = 'en_US-libritts-high'
  } = options;

  const [state, setState] = useState<VoiceOutputState>({
    isPlaying: false,
    isGenerating: false,
    error: null,
    progress: 0
  });

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const previousAmplitudeRef = useRef<number>(0);

  // Store callbacks in refs to avoid re-initialization
  const onFrequencyAnalysisRef = useRef(onFrequencyAnalysis);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onFrequencyAnalysisRef.current = onFrequencyAnalysis;
    onPlaybackEndRef.current = onPlaybackEnd;
    onErrorRef.current = onError;
  }, [onFrequencyAnalysis, onPlaybackEnd, onError]);

  // Initialize audio context and analyzer (once)
  useEffect(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create hidden audio element for playback
      const audioElement = new Audio();
      audioElement.crossOrigin = 'anonymous';
      audioElementRef.current = audioElement;

      // Create media source from audio element
      const sourceNode = audioContext.createMediaElementSource(audioElement);
      sourceNodeRef.current = sourceNode;

      // Initialize frequency analyzer with the same audio context
      const analyzer = new AudioAnalyzer((frequencyData) => {
        const beat = extractBeatFromFrequency(
          frequencyData.frequency,
          frequencyData.amplitude,
          previousAmplitudeRef.current
        );

        previousAmplitudeRef.current = frequencyData.amplitude;

        onFrequencyAnalysisRef.current?.({
          frequency: frequencyData.frequency,
          amplitude: frequencyData.amplitude,
          beat
        });
      }, audioContext);

      // Connect the audio graph: source -> analyzer -> destination
      sourceNode.connect(analyzer.getAnalyser());
      analyzer.getAnalyser().connect(audioContext.destination);
      analyzerRef.current = analyzer;

      // Setup playback event listeners
      audioElement.onplay = () => {
        setState(prev => ({ ...prev, isPlaying: true }));
        analyzer.start();
      };

      audioElement.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        analyzer.stop();
        onPlaybackEndRef.current?.();
      };

      audioElement.onerror = () => {
        const errorMsg = `Audio playback error: ${audioElement.error?.message || 'Unknown'}`;
        setState(prev => ({ ...prev, error: errorMsg, isPlaying: false }));
        analyzer.stop();
        onErrorRef.current?.(errorMsg);
      };

      audioElement.ontimeupdate = () => {
        if (audioElement.duration > 0) {
          setState(prev => ({
            ...prev,
            progress: audioElement.currentTime / audioElement.duration
          }));
        }
      };

      return () => {
        analyzer.dispose();
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Audio context failed';
      setState(prev => ({ ...prev, error: errorMsg }));
      onErrorRef.current?.(errorMsg);
    }
  }, []);

  /**
   * Generate speech from text and play it using Web Speech API
   */
  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        setState(prev => ({
          ...prev,
          isGenerating: true,
          error: null,
          progress: 0
        }));

        // Use browser's Web Speech API for TTS
        if (!('speechSynthesis' in window)) {
          throw new Error('Text-to-speech not supported in this browser');
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice if specified
        if (voice && voice !== 'default') {
          const voices = window.speechSynthesis.getVoices();
          const selectedVoice = voices.find(v => v.name === voice || v.lang.includes(voice));
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onstart = () => {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            isPlaying: true
          }));
          if (analyzerRef.current) {
            analyzerRef.current.start();
          }
        };

        utterance.onend = () => {
          setState(prev => ({
            ...prev,
            isPlaying: false,
            progress: 1
          }));
          if (analyzerRef.current) {
            analyzerRef.current.stop();
          }
          onPlaybackEndRef.current?.();
        };

        utterance.onerror = (event) => {
          throw new Error(`Speech synthesis error: ${event.error}`);
        };

        // Simulate progress since speechSynthesis doesn't provide it
        const estimatedDuration = (text.length / 15) * 1000; // ~15 chars per second
        const progressInterval = setInterval(() => {
          setState(prev => {
            if (!prev.isPlaying) {
              clearInterval(progressInterval);
              return prev;
            }
            return {
              ...prev,
              progress: Math.min(0.95, prev.progress + 0.05)
            };
          });
        }, estimatedDuration / 20);

        window.speechSynthesis.speak(utterance);

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Voice output error';
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
          isPlaying: false
        }));
        onErrorRef.current?.(errorMessage);
      }
    },
    [voice]
  );

  /**
   * Stop playback
   */
  const stop = useCallback(() => {
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    if (analyzerRef.current) {
      analyzerRef.current.stop();
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      progress: 0
    }));
  }, []);

  /**
   * Get current audio level (0-1) for visual feedback
   */
  const getAudioLevel = useCallback(() => {
    if (analyzerRef.current && state.isPlaying) {
      return analyzerRef.current.getAverageAmplitude();
    }
    return 0;
  }, [state.isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        URL.revokeObjectURL(audioElementRef.current.src);
      }
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
    };
  }, []);

  return {
    ...state,
    speak,
    stop,
    getAudioLevel
  };
}