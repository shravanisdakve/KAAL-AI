import React, { useState, useEffect } from 'react';
import { Menu, RotateCcw, Sun, Moon } from 'lucide-react';
import { KaalAvatar } from './KaalAvatar.tsx';
import { getStoredTheme, toggleTheme, Theme } from '../utils/theme.ts';

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
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getStoredTheme());
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };
    window.addEventListener('kaal-theme-change', handler);
    return () => window.removeEventListener('kaal-theme-change', handler);
  }, []);

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <header className="h-14 border-b border-gray-200/80 bg-white/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 select-none relative z-30 w-full min-w-0">
      {/* Left: Assistant Branding */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {isMobile && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg transition cursor-pointer touch-manipulation flex items-center justify-center shrink-0"
            aria-label="Open conversation history menu"
            title="Open conversation history"
          >
            <Menu size={20} />
          </button>
        )}

        <KaalAvatar size="sm" />

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-gray-900 text-sm tracking-tight leading-none truncate">
            KAAL AI
          </span>
          <div className="flex items-center gap-1.5 mt-1 min-w-0">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
              title="Online"
            />
            <span className="text-[11px] text-gray-500 font-normal leading-none truncate">
              Online • Thoughtful Guidance
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions (Theme Toggle & Clean Refresh) */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={handleToggleTheme}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-amber-400" />
          ) : (
            <Moon size={16} className="text-gray-500" />
          )}
        </button>

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
