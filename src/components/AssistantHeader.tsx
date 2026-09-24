import React from 'react';
import { Menu, RotateCcw } from 'lucide-react';
import { KaalAvatar } from './KaalAvatar.tsx';

interface AssistantHeaderProps {
  onToggleSidebar: () => void;
  onReset: () => void;
  isMobile: boolean;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  onToggleSidebar,
  onReset,
  isMobile,
}) => {
  return (
    <header className="h-14 border-b border-gray-200/80 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none relative z-30">
      {/* Left: Assistant Branding */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu size={19} />
          </button>
        )}

        <KaalAvatar size="sm" />

        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-sm tracking-tight leading-none">
            KAAL AI
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
              title="Online"
            />
            <span className="text-[11px] text-gray-500 font-normal leading-none">
              Online • Thoughtful Guidance
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions (Clean refresh / new conversation button only) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          title="New Conversation"
          aria-label="New Conversation"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
};
