/**
 * Web Speech API Utilities and Capability Detection for KAAL AI.
 * Provides resilient, typed browser speech recognition lifecycle management.
 */

export interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  readonly confidence?: number;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/**
 * Retrieves the browser SpeechRecognition constructor if available.
 */
export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const windowWithSpeech = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition || null;
}

/**
 * Robust capability check: verifies API existence and that constructor can be initialized.
 */
export function isSpeechRecognitionSupported(): boolean {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) return false;
  try {
    const testInstance = new Constructor();
    return typeof testInstance.start === 'function' && typeof testInstance.stop === 'function';
  } catch {
    return false;
  }
}

/**
 * User-friendly mapping of Web Speech API error codes.
 * Returns null for silent cancellations ('aborted').
 */
export function formatSpeechError(error: string): string | null {
  switch (error) {
    case 'not-allowed':
      return 'Microphone permission was denied. Please allow microphone access in your browser.';
    case 'audio-capture':
      return 'Your microphone could not be accessed. Check your browser and microphone settings.';
    case 'no-speech':
      return "Didn't hear anything. Try speaking again.";
    case 'network':
    case 'service-not-allowed':
      return "Speech recognition isn't available in this browser right now. Try Chrome or Edge.";
    case 'language-not-supported':
      return 'Selected language is not supported by your browser.';
    case 'aborted':
      return null;
    default:
      return 'Could not capture audio. Please try again or type your question.';
  }
}

/**
 * Appends recognized speech to existing composer text with proper spacing.
 *
 * Example:
 * Existing: "Help me with my career"
 * Spoken: "I feel confused"
 * Result: "Help me with my career I feel confused"
 */
export function appendTranscript(existingText: string, newTranscript: string): string {
  const trimmedExisting = existingText.trim();
  const trimmedNew = newTranscript.trim();
  if (!trimmedNew) return existingText;
  if (!trimmedExisting) return trimmedNew;
  return `${trimmedExisting} ${trimmedNew}`;
}

export interface ProcessedSpeech {
  finalSegment: string;
  interimSegment: string;
}

/**
 * Processes SpeechRecognition results list, correctly separating committed final
 * segments from in-progress interim segments to prevent text duplication.
 */
export function processSpeechResults(
  results: SpeechRecognitionResultListLike,
  resultIndex = 0
): ProcessedSpeech {
  let finalSegment = '';
  let interimSegment = '';

  for (let i = resultIndex; i < results.length; i++) {
    const res = results[i];
    if (!res || !res[0]) continue;
    const text = res[0].transcript || '';
    if (res.isFinal) {
      finalSegment += (finalSegment ? ' ' : '') + text.trim();
    } else {
      interimSegment += (interimSegment ? ' ' : '') + text.trim();
    }
  }

  return {
    finalSegment: finalSegment.trim(),
    interimSegment: interimSegment.trim(),
  };
}
