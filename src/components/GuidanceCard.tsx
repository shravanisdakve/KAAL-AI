import React, { useState } from 'react';
import { StructuredGuidanceResponse } from '../types/guidance.ts';
import { KaalAvatar } from './KaalAvatar.tsx';

interface GuidanceCardProps {
  response: StructuredGuidanceResponse;
  category?: string;
  timestamp?: string;
}

// Category-tailored reflective questions echoing KAAL AI's sanctuary of reflection
const REFLECTIVE_PROMPTS: Record<string, string> = {
  Clarity:
    'What is one decision you can make today without needing to know the entire path ahead?',
  Stress:
    'What burden are you trying to carry today that actually belongs to tomorrow?',
  Purpose:
    'What brings you a quiet sense of duty and fulfillment, even when no one is watching?',
  Relationships:
    'How would this interaction soften if you listened to understand rather than to defend?',
  'Fear & Uncertainty':
    'If you recognized uncertainty as open space rather than a threat, what step would you take?',
  Discipline:
    'What is the smallest honest effort you can offer today, letting go of the need for perfection?',
  Meditation:
    'Can you give yourself permission to simply sit with this moment without evaluating or fixing it?',
  'General Reflection':
    'What is truly within your control right now, and what can you gently release?',
};

export const GuidanceCard: React.FC<GuidanceCardProps> = ({
  response,
  category = 'General Reflection',
  timestamp = '10:43 AM',
}) => {
  const [imageError, setImageError] = useState(false);

  // Derive reflection thought based on category or response metadata
  const reflectionThought =
    REFLECTIVE_PROMPTS[category] ||
    REFLECTIVE_PROMPTS['General Reflection'];

  // Extract clean practical next steps from response.steps or frameworkSteps
  const nextSteps: string[] =
    response.steps && response.steps.length > 0
      ? response.steps
      : response.frameworkSteps && response.frameworkSteps.length > 0
      ? response.frameworkSteps.map((s) => s.title || s.description)
      : [
          'Take a quiet moment to observe what is within your control right now.',
          'Choose one small, thoughtful action for today and begin gently.',
          'Allow the outcome to unfold without rushing the timeline.',
        ];

  // Calm, serene nature image for reflection (morning stillness / quiet water landscape)
  const calmImageUrl =
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="w-full max-w-4xl mx-auto mb-10 select-text">
      {/* Response Minimal Header */}
      <div className="flex items-center gap-2.5 mb-3 select-none">
        <KaalAvatar size="sm" />
        <span className="font-semibold text-gray-900 text-sm tracking-tight">
          KAAL AI
        </span>
        <span className="text-xs text-gray-400">{timestamp}</span>
      </div>

      {/* Main Guidance Card — Clean, Warm, Spacious */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        {/* Section 1: CORE GUIDANCE */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="flex-1">
            <span className="block text-[11px] font-bold tracking-widest text-[#155e45] uppercase mb-2 select-none">
              CORE GUIDANCE
            </span>
            <h3 className="text-lg md:text-[20px] font-medium text-gray-900 leading-snug mb-3">
              {response.title}
            </h3>
            <p className="text-[15px] text-gray-700 leading-relaxed font-normal">
              {response.summary}
            </p>
          </div>

          {/* Subtle Visual Element — Calm Nature Landscape */}
          {!imageError && (
            <div className="w-full md:w-48 h-32 md:h-36 shrink-0 rounded-xl overflow-hidden shadow-2xs border border-stone-200/70 bg-stone-50 select-none">
              <img
                src={calmImageUrl}
                alt="Calm natural landscape representing stillness and reflection"
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          )}
        </div>

        {/* Section 2: A MOMENT TO REFLECT */}
        <div className="py-6 border-b border-stone-100">
          <span className="block text-[11px] font-bold tracking-widest text-[#155e45] uppercase mb-2.5 select-none">
            A MOMENT TO REFLECT
          </span>
          <div className="pl-4 border-l-2 border-emerald-600/50 py-1 bg-stone-50/50 rounded-r-xl">
            <p className="text-[15px] md:text-[16px] text-stone-800 font-normal italic leading-relaxed">
              "{reflectionThought}"
            </p>
          </div>
        </div>

        {/* Section 3: A SIMPLE NEXT STEP */}
        <div className="pt-6">
          <span className="block text-[11px] font-bold tracking-widest text-[#155e45] uppercase mb-4 select-none">
            A SIMPLE NEXT STEP
          </span>
          <div className="space-y-3">
            {nextSteps.slice(0, 3).map((stepText, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-[11px] font-mono font-medium text-emerald-800 bg-[#eaf4ee] px-2 py-0.5 rounded-md shrink-0 select-none mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-[14px] md:text-[15px] text-gray-700 leading-relaxed">
                  {stepText}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
