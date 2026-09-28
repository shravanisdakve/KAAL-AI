import React from 'react';
import { ArrowUpRight, Compass, Sparkles, Target, Zap } from 'lucide-react';
import { KaalAvatar } from './KaalAvatar.tsx';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  const promptSuggestions = [
    {
      title: 'Finding Clarity',
      text: 'I feel confused about which path I should take in life.',
      icon: Compass,
      category: 'Clarity',
    },
    {
      title: 'Overcoming Stress',
      text: 'I feel overwhelmed by everything happening in my life. What should I do?',
      icon: Target,
      category: 'Stress',
    },
    {
      title: 'Understanding Purpose',
      text: "I feel like I am working hard but I don't know what my purpose is.",
      icon: Sparkles,
      category: 'Purpose',
    },
    {
      title: 'Building Discipline',
      text: 'I know what I need to do, but I keep procrastinating.',
      icon: Zap,
      category: 'Discipline',
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-8 max-w-2xl mx-auto select-none">
      {/* Krishna / KAAL AI Emblem */}
      <div className="mb-4">
        <KaalAvatar size="lg" className="w-14 h-14 ring-4 ring-emerald-500/20 shadow-md" />
      </div>

      {/* Small Eyebrow */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold tracking-widest uppercase mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
        <span>YOUR SPACE FOR CLARITY</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-3">
        What would you like guidance on today?
      </h1>

      {/* Supporting Text */}
      <p className="text-sm md:text-base text-gray-500 dark:text-[#94a3b8] max-w-lg mb-8 leading-relaxed font-normal">
        Take a moment, share what's on your mind, and work through it with clarity.
      </p>

      {/* Suggestion Prompt Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {promptSuggestions.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.text)}
              className="group p-4 bg-white dark:bg-[#0c1017] hover:bg-[#fafbfa] dark:hover:bg-[#121824] border border-gray-200/80 dark:border-[#1a2230] hover:border-emerald-300/80 dark:hover:border-emerald-500/50 rounded-2xl transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-[#121824] text-gray-700 dark:text-[#cbd5e1] flex items-center justify-center group-hover:bg-[#e6f7ef] dark:group-hover:bg-emerald-950/60 group-hover:text-[#114936] dark:group-hover:text-emerald-300 transition-colors">
                    <IconComponent size={15} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {item.category}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-[#cbd5e1] line-clamp-2 leading-relaxed">
                  {item.text}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400 dark:text-[#94a3b8] group-hover:text-[#114936] dark:group-hover:text-emerald-400 font-medium pt-2 border-t border-gray-100 dark:border-[#1a2230]">
                <span>Explore guidance</span>
                <ArrowUpRight
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
