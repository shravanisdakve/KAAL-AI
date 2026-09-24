import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, User, Settings, X, CheckCircle2 } from 'lucide-react';

interface PersonalSpaceProps {
  isCollapsed?: boolean;
}

export const PersonalSpace: React.FC<PersonalSpaceProps> = ({ isCollapsed = false }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeTabNotice, setActiveTabNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Close popover on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        settingsButtonRef.current?.focus();
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  const toggleMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsProfileMenuOpen((prev) => !prev);
    setActiveTabNotice(null);
  };

  const handleMenuOptionClick = (optionName: string) => {
    if (optionName === 'Close') {
      setIsProfileMenuOpen(false);
      setActiveTabNotice(null);
      return;
    }

    setActiveTabNotice(`${optionName} view selected`);
    setTimeout(() => {
      setActiveTabNotice(null);
    }, 2000);
  };

  if (isCollapsed) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={toggleMenu}
          aria-haspopup="true"
          aria-expanded={isProfileMenuOpen}
          aria-label="Open personal space settings"
          className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-600 transition"
          title="Personal Space"
        >
          KL
        </button>

        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-12 mb-2 w-64 bg-white border border-gray-200/90 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none">
                  KL
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-900 leading-tight">
                    Personal Space
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium mt-0.5 w-max">
                    Standard Plan
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close settings popover"
              >
                <X size={15} />
              </button>
            </div>

            {/* Menu Options */}
            <div className="py-2 space-y-1">
              <button
                onClick={() => handleMenuOptionClick('Account')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer"
              >
                <User size={15} className="text-gray-500" />
                <span>Account</span>
              </button>

              <button
                onClick={() => handleMenuOptionClick('Settings')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer"
              >
                <Settings size={15} className="text-gray-500" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleMenuOptionClick('Close')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 font-medium transition cursor-pointer"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            </div>

            {activeTabNotice && (
              <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                <span>{activeTabNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* Interactive Personal Space Rail Card */}
      <div
        onClick={toggleMenu}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isProfileMenuOpen}
        aria-label="Personal Space options"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
          }
        }}
        className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/90 transition cursor-pointer select-none group focus-visible:outline-2 focus-visible:outline-emerald-600 border border-transparent focus-visible:border-emerald-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none shrink-0 shadow-2xs">
            KL
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900 leading-tight group-hover:text-black">
              Personal Space
            </span>
            <span className="text-[11px] text-gray-500 leading-tight">
              Standard Plan
            </span>
          </div>
        </div>

        {/* Sliders / Settings Button */}
        <button
          ref={settingsButtonRef}
          type="button"
          onClick={toggleMenu}
          aria-label="Open personal space settings"
          aria-haspopup="true"
          aria-expanded={isProfileMenuOpen}
          className={`p-1.5 rounded-lg transition cursor-pointer border ${
            isProfileMenuOpen
              ? 'text-blue-600 bg-blue-50 border-blue-200 ring-2 ring-blue-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 border-transparent'
          } focus-visible:outline-2 focus-visible:outline-blue-500`}
          title="Open personal space settings"
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* Popover / Settings Menu Panel */}
      {isProfileMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2.5 w-full bg-white border border-gray-200/90 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
          {/* Header Info */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none">
                KL
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-900 leading-tight">
                  Personal Space
                </span>
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md w-max mt-0.5">
                  Standard Plan
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsProfileMenuOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close settings popover"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Menu Actions */}
          <div className="py-2 space-y-0.5">
            <button
              onClick={() => handleMenuOptionClick('Account')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <User size={15} className="text-gray-500" />
                <span>Account</span>
              </div>
              <span className="text-[10px] text-gray-400">KL</span>
            </button>

            <button
              onClick={() => handleMenuOptionClick('Settings')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-gray-500" />
                <span>Settings</span>
              </div>
              <span className="text-[10px] text-gray-400">⌘,</span>
            </button>

            <button
              onClick={() => handleMenuOptionClick('Close')}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
            >
              <X size={15} className="text-gray-400" />
              <span>Close</span>
            </button>
          </div>

          {activeTabNotice && (
            <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              <span>{activeTabNotice}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
