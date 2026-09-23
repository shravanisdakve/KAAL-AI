import React, { useEffect, useState } from 'react';
import { KaalAvatar } from './KaalAvatar.tsx';

export const LoadingState: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  const analysisSteps = [
    'Parsing question signals...',
    'Evaluating category weights...',
    'Matching deterministic guidance pattern...',
    'Sequencing tactical milestones...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % analysisSteps.length);
    }, 900);
    return () => clearInterval(timer);
  }, [analysisSteps.length]);

  return (
    <div className="w-full max-w-4xl mx-auto my-6 animate-fadeIn">
      {/* KAAL Avatar & Thinking Message */}
      <div className="flex items-center gap-3 mb-3 select-none">
        <KaalAvatar size="sm" isThinking={true} />
        <span className="font-semibold text-gray-900 text-sm tracking-tight">
          KAAL AI
        </span>
        <span className="text-xs text-gray-400">Evaluating...</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-800">
            Thinking through your question...
          </span>
        </div>

        {/* Rule-based analysis step progress */}
        <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-medium">
              Rule-Based Guidance Engine
            </span>
            <span className="text-gray-400">·</span>
            <span className="italic transition-all duration-300">
              {analysisSteps[stepIndex]}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
