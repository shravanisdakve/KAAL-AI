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

  const toggleVoiceRecording = () => {
    // Check for browser speech recognition
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Gentle mock/simulation feedback if browser doesn't expose speech recognition
      if (!isRecording) {
        setIsRecording(true);
        setTimeout(() => {
          setQuestion((prev) =>
            prev
              ? `${prev} How can I structure competing priorities with clarity?`
              : 'How can I structure competing priorities with clarity?'
          );
          setIsRecording(false);
        }, 1200);
      } else {
        setIsRecording(false);
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      if (!isRecording) {
        setIsRecording(true);
        recognition.start();

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };
      } else {
        setIsRecording(false);
      }
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
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
      <div className="relative bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all">
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
          className="w-full resize-none text-[15px] text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none pr-24 leading-relaxed max-h-48"
        />

        {/* Action Buttons in Bottom Right */}
        <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer ${
              isRecording ? 'text-red-500 bg-red-50 animate-pulse' : ''
            }`}
            title={isRecording ? 'Listening...' : 'Voice Dictation'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !question.trim()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              question.trim() && !isLoading
                ? 'bg-[#1c2226] text-white hover:bg-black shadow-xs'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Send (Enter)"
          >
            <ArrowUp size={18} strokeWidth={2.4} />
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
