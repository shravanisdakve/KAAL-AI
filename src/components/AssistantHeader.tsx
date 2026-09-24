import React, { useState, useRef, useEffect } from 'react';
import { Menu, RotateCcw, User, Settings, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleAction = (label: string) => {
    setNotice(label);
    setTimeout(() => {
      setNotice(null);
      setIsProfileOpen(false);
    }, 1500);
  };

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

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          title="New Conversation"
          aria-label="New Conversation"
        >
          <RotateCcw size={16} />
        </button>

        {/* Profile Avatar with Interactive Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="User Profile Menu"
            className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs ml-1 shadow-2xs hover:ring-2 hover:ring-emerald-500/50 hover:bg-black transition cursor-pointer"
            title="User profile"
          >
            <User size={15} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200/90 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-xs">
                  <User size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    Personal Space
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium mt-0.5 w-max">
                    Standard Plan
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-2 space-y-0.5 text-xs">
                <button
                  onClick={() => handleAction('Account preferences')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <User size={14} className="text-gray-500" />
                    <span>My Account</span>
                  </div>
                  <span className="text-[10px] text-gray-400">KL</span>
                </button>

                <button
                  onClick={() => handleAction('Settings')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings size={14} className="text-gray-500" />
                    <span>Settings</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">⌘,</span>
                </button>

                <button
                  onClick={() => handleAction('Privacy settings')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={14} className="text-gray-500" />
                    <span>Privacy & Data</span>
                  </div>
                </button>

                <div className="pt-1.5 mt-1 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onReset();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium transition cursor-pointer text-left"
                  >
                    <LogOut size={14} />
                    <span>Reset Current Session</span>
                  </button>
                </div>
              </div>

              {notice && (
                <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                  <span>{notice} selected</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
