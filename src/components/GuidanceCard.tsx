import React, { useState } from 'react';
import { BookOpen, Copy, Check, Sparkles } from 'lucide-react';
import { StructuredGuidanceResponse } from '../types/guidance.ts';
import { KaalAvatar } from './KaalAvatar.tsx';
import { SituationalVisual } from './SituationalVisual.tsx';

interface GuidanceCardProps {
  response: StructuredGuidanceResponse;
  category?: string;
  timestamp?: string;
}

export const GuidanceCard: React.FC<GuidanceCardProps> = ({
  response,
  category = 'General Reflection',
  timestamp = '10:43 AM',
}) => {
  const [copiedShloka, setCopiedShloka] = useState(false);

  const activeCategory = response.meta?.category || category || 'General Reflection';

  // Conversational text paragraphs
  const conversationalText =
    response.conversationalReply || response.summary || '';
  const paragraphs = conversationalText.split('\n\n').filter((p) => p.trim().length > 0);

  // Reflection Prompt
  const reflectionThought =
    response.reflectionPrompt ||
    'What is one burden you can gently release today to invite immediate peace?';

  // Extract clean practical next steps
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

  const shloka = response.shloka;
  const isShlokaRelevant = response.isShlokaRelevant && shloka;

  const handleCopyShloka = () => {
    if (!shloka) return;
    const text = `Bhagavad Gita ${shloka.chapter}.${shloka.verse}\n\n${shloka.sanskrit}\n\n${shloka.transliteration}\n\n"${shloka.translation}"\n\n— via KAAL AI (kaalai.in)`;
    navigator.clipboard.writeText(text);
    setCopiedShloka(true);
    setTimeout(() => setCopiedShloka(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-10 select-text animate-fadeIn min-w-0">
      {/* Response Minimal Header */}
      <div className="flex items-center gap-2 sm:gap-2.5 mb-3 select-none flex-wrap">
        <KaalAvatar size="sm" />
        <span className="font-semibold text-gray-900 text-sm tracking-tight">
          KAAL AI
        </span>
        <span className="text-xs text-gray-400">{timestamp}</span>

        {response.detectedEmotion && (
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{response.detectedEmotion}</span>
          </span>
        )}
      </div>

      {/* Main Guidance Card — Clean, Warm, Spacious */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-stone-200/80 p-4 sm:p-6 md:p-8 shadow-xs min-w-0">
        {/* Section 1: HUMAN CONVERSATIONAL GUIDANCE */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 sm:gap-6 pb-6 border-b border-stone-100 min-w-0">
          <div className="flex-1 min-w-0 space-y-3.5">
            <div className="flex items-center gap-2 select-none flex-wrap min-w-0">
              <span className="text-[11px] font-bold tracking-widest text-[#155e45] uppercase shrink-0">
                GUIDANCE FOR YOU
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-500 font-medium break-words">
                {response.title}
              </span>
            </div>

            {/* Natural Human-like Prose */}
            <div className="text-[14px] sm:text-[15px] text-gray-800 leading-relaxed font-normal space-y-3 break-words">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Subtle Visual Element — Dynamic Situational Landscape Generated On the Fly */}
          {response.situationVisual && (
            <SituationalVisual
              visual={response.situationVisual}
              category={activeCategory}
              question={response.title}
            />
          )}
        </div>

        {/* Section 2: AUTHENTIC BHAGAVAD GITA SHLOKA CARD (ONLY IF RAG RETRIEVED & RELEVANT) */}
        {isShlokaRelevant && (
          <div className="my-5 sm:my-6 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#faf8f5] to-[#f5f1ea] border border-[#e8ded1] rounded-xl sm:rounded-2xl relative overflow-hidden shadow-2xs min-w-0">
            {/* Top Sacred Shloka Badge */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e2d5c3] gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 shrink-0 rounded-full bg-[#081A2E] text-[#F2C766] border border-[#D9A441]/50 flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                  ॐ
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-bold text-gray-900 tracking-tight shrink-0">
                      BHAGAVAD GITA · {shloka.chapter}.{shloka.verse}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#966b24] bg-[#ebd8be] px-2 py-0.5 rounded-full truncate">
                      {shloka.chapterName.split('(')[0].trim()}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-normal block truncate">
                    A reflection from the Bhagavad Gita
                  </span>
                </div>
              </div>

              {/* Copy Quote Button */}
              <button
                type="button"
                onClick={handleCopyShloka}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-stone-200/60 transition cursor-pointer flex items-center gap-1 text-xs shrink-0"
                title="Copy Shloka & Translation"
              >
                {copiedShloka ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700 text-[11px] font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="text-[11px] hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Original Sanskrit Text */}
            <div className="mb-2.5 text-center sm:text-left">
              <p className="font-serif text-sm sm:text-base md:text-lg text-stone-900 leading-relaxed font-semibold tracking-wide whitespace-pre-line break-words">
                {shloka.sanskrit}
              </p>
            </div>

            {/* Romanized Transliteration */}
            <div className="mb-4 text-center sm:text-left">
              <p className="font-serif italic text-xs sm:text-sm text-stone-600 leading-relaxed break-words">
                {shloka.transliteration}
              </p>
            </div>

            {/* Literal Translation */}
            <div className="p-3 sm:p-3.5 bg-white/90 rounded-xl border border-stone-200/80 mb-3.5">
              <div className="flex items-start gap-2">
                <BookOpen size={15} className="text-[#966b24] shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed italic break-words">
                    "{shloka.translation}"
                  </p>
                  {shloka.author && (
                    <p className="text-[10px] text-stone-400 font-normal">
                      Translation by {shloka.author}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Intellectual Honesty: Why this relates */}
            <div className="p-3 sm:p-3.5 bg-[#fbf9f5] rounded-xl border border-[#e5dcd0] space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#845a1b] uppercase tracking-wider">
                <Sparkles size={13} className="text-[#966b24]" />
                <span>Why this relates</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words">
                {response.whyThisRelates || shloka.meaning}
              </p>
            </div>
          </div>
        )}

        {/* Section 3: A MOMENT TO REFLECT */}
        <div className="py-5 sm:py-6 border-b border-stone-100 min-w-0">
          <span className="block text-[11px] font-bold tracking-widest text-[#155e45] uppercase mb-2 select-none">
            A MOMENT TO REFLECT
          </span>
          <div className="pl-3 sm:pl-4 border-l-2 border-emerald-600/50 py-1.5 bg-stone-50/50 rounded-r-xl min-w-0">
            <p className="text-[14px] sm:text-[15px] md:text-[16px] text-stone-800 font-normal italic leading-relaxed break-words">
              "{reflectionThought}"
            </p>
          </div>
        </div>

        {/* Section 4: A SIMPLE NEXT STEP */}
        <div className="pt-5 sm:pt-6 min-w-0">
          <span className="block text-[11px] font-bold tracking-widest text-[#155e45] uppercase mb-3 sm:mb-4 select-none">
            A SIMPLE NEXT STEP TODAY
          </span>
          <div className="space-y-3 min-w-0">
            {nextSteps.slice(0, 3).map((stepText, idx) => (
              <div key={idx} className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <span className="text-[11px] font-mono font-medium text-emerald-800 bg-[#eaf4ee] px-2 py-0.5 rounded-md shrink-0 select-none mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-[13px] sm:text-[14px] md:text-[15px] text-gray-700 leading-relaxed min-w-0 break-words">
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
