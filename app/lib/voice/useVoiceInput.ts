// app/lib/voice/useVoiceInput.ts
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onError?: (error: string) => void;
}

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  audioLevel: number; // 0-1 for UI visualization
}

// Browser API types - Extend Window interface for webkit support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    onTranscript,
    onListeningChange,
    onError
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    audioLevel: 0
  });

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Store callbacks in refs to avoid re-initialization
  const onTranscriptRef = useRef(onTranscript);
  const onListeningChangeRef = useRef(onListeningChange);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onListeningChangeRef.current = onListeningChange;
    onErrorRef.current = onError;
  }, [onTranscript, onListeningChange, onError]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState(prev => ({
        ...prev,
        error: 'Web Speech API not supported in this browser. Use Chrome or Edge on desktop.'
      }));
      return;
    }

    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = false; // Stop listening after silence
    recognition.interimResults = true; // Show partial results
    recognition.lang = 'en-US';

    // On result
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: (prev.transcript + finalTranscript).trim(),
        interimTranscript: interim
      }));

      // Fire callback when we get final transcript
      if (finalTranscript && event.results[event.results.length - 1].isFinal) {
        const fullTranscript = (interim || finalTranscript).trim();
        if (onTranscriptRef.current && fullTranscript) {
          onTranscriptRef.current(fullTranscript);
        }
      }
    };

    // On error
    recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'network': 'Network error - check internet connection',
        'audio-capture': 'No microphone found or permission denied',
        'not-allowed': 'Microphone permission denied',
        'no-speech': 'No speech detected - try again',
        'service-not-allowed': 'Speech recognition service not allowed'
      };

      const errorMsg = errorMessages[event.error] || `Error: ${event.error}`;
      setState(prev => ({
        ...prev,
        error: errorMsg,
        isListening: false
      }));
      onErrorRef.current?.(errorMsg);
    };

    // On end
    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false
      }));
      onListeningChangeRef.current?.(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setState(prev => ({ ...prev, error: 'Speech API not initialized' }));
      return;
    }

    try {
      // Clear previous transcript
      setState(prev => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        error: null,
        isListening: true
      }));

      // Request microphone for audio level visualization
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Create audio context for visualization
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        // Start audio level monitoring
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (mediaStreamRef.current) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const level = (sum / dataArray.length) / 255;
            setState(prev => ({ ...prev, audioLevel: level }));
            requestAnimationFrame(updateLevel);
          }
        };
        updateLevel();
      } catch (error) {
        // Microphone access failed, but continue with speech recognition
        console.warn('Could not access microphone for visualization:', error);
      }

      onListeningChangeRef.current?.(true);
      recognitionRef.current.start();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start listening';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isListening: false
      }));
      onErrorRef.current?.(errorMessage);
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Clean up audio streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isListening: false,
      audioLevel: 0
    }));
    onListeningChangeRef.current?.(false);
  }, []);

  // Spacebar toggle handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (!state.isListening) {
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state.isListening) {
        e.preventDefault();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript: () => setState(prev => ({ ...prev, transcript: '' }))
  };
}