import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff } from 'lucide-react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = Boolean(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      );
      setIsSpeechSupported(hasSpeech);
    }
  }, []);

  const toggleVoiceRecording = () => {
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setValidationError('Voice recognition is not supported in this browser.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setValidationError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuestion((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setValidationError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setValidationError('Could not capture audio. Please try again or type your question.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
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
      <div className="relative bg-white border border-gray-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all min-w-0">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask KAAL anything..."
          disabled={isLoading}
          rows={2}
          className="w-full resize-none text-[14px] sm:text-[15px] text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none pr-20 sm:pr-24 leading-relaxed max-h-48"
        />

        {/* Action Buttons in Bottom Right */}
        <div className="absolute right-2.5 sm:right-3.5 bottom-2.5 sm:bottom-3.5 flex items-center gap-1.5 sm:gap-2">
          {/* Microphone Button (shown only when browser supports Web Speech API) */}
          {isSpeechSupported && (
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer ${
                isRecording ? 'text-red-500 bg-red-50 animate-pulse' : ''
              }`}
              title={isRecording ? 'Listening... (click to stop)' : 'Voice Dictation'}
            >
              {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !question.trim()}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              question.trim() && !isLoading
                ? 'bg-[#1c2226] text-white hover:bg-black shadow-xs'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Send (Enter)"
          >
            <ArrowUp size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Trust Subtext */}
      <p className="text-center text-[11px] text-gray-500 mt-2 select-none">
        KAAL AI — Your space for clarity.
      </p>
    </div>
  );
};
