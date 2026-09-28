import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff } from 'lucide-react';
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  formatSpeechError,
  appendTranscript,
  processSpeechResults,
  SpeechRecognitionInstance,
  SpeechRecognitionEventLike,
  SpeechRecognitionErrorEventLike,
} from '../utils/speechRecognition.ts';

interface ComposerProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  onClearError?: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSubmit,
  isLoading,
  onClearError,
}) => {
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSpeechBlocked, setIsSpeechBlocked] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>('');
  const accumulatedFinalRef = useRef<string>('');

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [question]);

  // Robust client-side capability check on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSpeechSupported(supported);
    if (!supported && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('[SpeechRecognition] SpeechRecognition is not supported or cannot be instantiated in this browser environment.');
    }

    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      isStartingRef.current = false;
      setIsListening(false);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError('Please enter a question before submitting.');
      return;
    }
    if (trimmed.length > 1000) {
      setValidationError('Question must be under 1,000 characters.');
      return;
    }

    setValidationError(null);
    if (onClearError) onClearError();
    onSubmit(trimmed);
    setQuestion('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const toggleVoiceRecording = () => {
    // If currently listening, stop immediately and return to idle
    if (isListening && recognitionRef.current) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SpeechRecognition] User stopped listening via button click.');
        }
        recognitionRef.current.stop();
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[SpeechRecognition] Error during manual stop:', err);
        }
      }
      setIsListening(false);
      isStartingRef.current = false;
      return;
    }

    // Prevent double-start from rapid clicking
    if (isStartingRef.current) {
      return;
    }

    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor || isSpeechBlocked) {
      setIsSpeechBlocked(true);
      setValidationError("Voice input isn't available in this browser. You can type instead.");
      return;
    }

    try {
      isStartingRef.current = true;
      baseTextRef.current = question;
      accumulatedFinalRef.current = '';

      const recognition = new Constructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
      recognitionRef.current = recognition;

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[SpeechRecognition] Starting speech recognition (lang: ${recognition.lang})`
        );
      }

      recognition.onstart = () => {
        isStartingRef.current = false;
        setIsListening(true);
        setValidationError(null);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SpeechRecognition] onstart fired successfully');
        }
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const { finalSegment, interimSegment } = processSpeechResults(
          event.results,
          event.resultIndex
        );

        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `[SpeechRecognition] onresult chunk: resultIndex=${event.resultIndex}, finalChunkLen=${finalSegment.length}, interimChunkLen=${interimSegment.length}`
          );
        }

        if (finalSegment) {
          accumulatedFinalRef.current = appendTranscript(
            accumulatedFinalRef.current,
            finalSegment
          );
        }

        // Live preview in textarea: base text + accumulated finalized speech + current interim preview
        const liveSpeech = appendTranscript(
          accumulatedFinalRef.current,
          interimSegment
        );
        const combined = appendTranscript(baseTextRef.current, liveSpeech);
        setQuestion(combined);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        isStartingRef.current = false;
        setIsListening(false);

        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[SpeechRecognition] onerror: error=${event.error}, message=${event.message || 'none'}`
          );
        }

        // Handle blocked speech backends (e.g. Brave / privacy shields)
        if (event.error === 'service-not-allowed' || event.error === 'network') {
          setIsSpeechBlocked(true);
          setValidationError(
            "Speech recognition isn't available in this browser right now. Try Chrome or Edge."
          );
          return;
        }

        const formatted = formatSpeechError(event.error);
        if (formatted) {
          setValidationError(formatted);
        }
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        setIsListening(false);

        // Ensure final recognized transcript is cleanly preserved in composer
        if (accumulatedFinalRef.current) {
          const finalFullText = appendTranscript(
            baseTextRef.current,
            accumulatedFinalRef.current
          );
          setQuestion(finalFullText);
        }
        recognitionRef.current = null;

        if (process.env.NODE_ENV !== 'production') {
          console.log('[SpeechRecognition] onend fired');
        }
      };

      recognition.start();
    } catch (err: any) {
      isStartingRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[SpeechRecognition] Fatal initialization error:',
          err?.name,
          err?.message
        );
      }
      setValidationError(
        "Could not access your microphone. Please check your browser permissions."
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-2 min-w-0">
      {validationError && (
        <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1.5 flex items-center justify-between">
          <span>{validationError}</span>
          <button
            onClick={() => setValidationError(null)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Composer Container Card */}
      <div className="relative bg-white dark:bg-[#0c1017] border border-gray-200/90 dark:border-[#1a2230] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs focus-within:border-gray-400 dark:focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-gray-100 dark:focus-within:ring-emerald-950/40 transition-all min-w-0">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening... speak now' : 'Ask KAAL anything...'}
          disabled={isLoading}
          rows={2}
          className="w-full resize-none text-[14px] sm:text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent focus:outline-none pr-20 sm:pr-24 leading-relaxed max-h-48"
        />

        {/* Listening Status Badge */}
        {isListening && (
          <div className="absolute left-3.5 bottom-2.5 sm:bottom-3.5 flex items-center gap-1.5 text-xs text-red-600 font-medium select-none pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />
            <span>Listening…</span>
          </div>
        )}

        {/* Action Buttons in Bottom Right */}
        <div className="absolute right-2.5 sm:right-3.5 bottom-2.5 sm:bottom-3.5 flex items-center gap-1.5 sm:gap-2">
          {/* Microphone Button (shown only when browser supports Web Speech API and is not blocked) */}
          {isSpeechSupported && !isSpeechBlocked && (
            <button
              type="button"
              onClick={toggleVoiceRecording}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              title={isListening ? 'Listening... (click to stop)' : 'Voice Dictation'}
              className={`p-1.5 sm:p-2 rounded-xl text-gray-400 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer ${
                isListening ? 'text-red-500 bg-red-50 ring-2 ring-red-200 animate-pulse' : ''
              }`}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !question.trim()}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              question.trim() && !isLoading
                ? 'bg-[#1c2226] dark:bg-emerald-600 text-white hover:bg-black dark:hover:bg-emerald-500 shadow-xs'
                : 'bg-gray-200 dark:bg-[#182232] text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Send (Enter)"
          >
            <ArrowUp size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Trust Subtext */}
      <p className="text-center text-[11px] text-gray-500 dark:text-[#94a3b8] mt-2 select-none">
        KAAL AI — Your space for clarity.
      </p>
    </div>
  );
};
