import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { ApiError } from '../types/guidance.ts';

interface ErrorStateProps {
  error: ApiError | null;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const displayMessage =
    error?.code === 'INVALID_QUESTION'
      ? error.message
      : "We couldn't generate your guidance right now.";

  return (
    <div className="w-full max-w-4xl mx-auto my-6 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-red-200/80 p-6 md:p-7 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <AlertCircle size={20} />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {displayMessage}
            </p>

            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c2226] hover:bg-black text-white text-xs font-medium rounded-xl transition cursor-pointer shadow-xs"
            >
              <RotateCcw size={14} />
              <span>Try again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
