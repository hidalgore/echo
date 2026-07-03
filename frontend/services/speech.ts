// ECHO Speech-to-Text Service
// Uses Web Speech API on web, with hooks for native implementation

import { Platform } from 'react-native';

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export type SpeechCallback = (result: SpeechRecognitionResult) => void;
export type SpeechErrorCallback = (error: string) => void;

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResult: SpeechCallback | null = null;
  private onError: SpeechErrorCallback | null = null;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      this.initWebSpeech();
    }
  }

  private initWebSpeech() {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      const confidence = result[0].confidence;

      if (this.onResult) {
        this.onResult({ transcript, isFinal, confidence });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.onError) {
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Microphone access denied. Please enable in settings.',
          'no-speech': 'No speech detected. Try again.',
          'audio-capture': 'No microphone found.',
          'network': 'Network error. Check your connection.',
        };
        this.onError(errorMessages[event.error] || 'Speech recognition error');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && 
             !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    }
    // For native, return true - actual implementation would use react-native-voice
    return true;
  }

  async startListening(
    onResult: SpeechCallback,
    onError?: SpeechErrorCallback
  ): Promise<boolean> {
    if (!this.isSupported()) {
      onError?.('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.onResult = onResult;
    this.onError = onError || null;

    if (Platform.OS === 'web' && this.recognition) {
      try {
        this.recognition.start();
        this.isListening = true;
        return true;
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        return false;
      }
    }

    // Native implementation placeholder
    // In production, integrate with react-native-voice:
    // import Voice from '@react-native-voice/voice';
    // Voice.start('en-US');
    
    return false;
  }

  stopListening(): void {
    if (Platform.OS === 'web' && this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Singleton instance
export const speechService = new SpeechService();

// React hook for speech recognition
import { useState, useCallback, useEffect } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(speechService.isSupported());
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    
    const started = await speechService.startListening(
      (result) => {
        setTranscript(result.transcript);
        if (result.isFinal) {
          setIsListening(false);
        }
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );

    if (started) {
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    speechService.stopListening();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
