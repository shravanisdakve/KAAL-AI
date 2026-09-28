import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, User, Settings, X, ArrowLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { getStoredTheme, toggleTheme, Theme } from '../utils/theme.ts';

interface PersonalSpaceProps {
  isCollapsed?: boolean;
}

// Unified personal space profile
const USER_PROFILE = {
  fullName: 'Seeker',
  displayName: 'Personal Space',
  initials: 'KA',
  email: 'seeker@kaalai.in',
  plan: 'Active Member',
  accountType: 'Personal Space',
};

export const PersonalSpace: React.FC<PersonalSpaceProps> = ({ isCollapsed = false }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'account' | 'settings'>('menu');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kaal_guidance_updates') !== 'false';
    } catch {
      return true;
    }
  });
  const [theme, setTheme] = useState<Theme>('light');

  const menuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

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

  // Close popover and reset view on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
        setCurrentView('menu');
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
        setCurrentView('menu');
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
    setCurrentView('menu');
  };

  const handleClose = () => {
    setIsProfileMenuOpen(false);
    setCurrentView('menu');
  };

  // Render view contents based on current navigation state
  const renderViewContent = () => {
    switch (currentView) {
      case 'account':
        return (
          <div className="animate-fadeIn">
            {/* Account Details Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1a2230]">
              <button
                type="button"
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#cbd5e1] hover:text-gray-900 dark:hover:text-white font-medium py-1 px-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                aria-label="Back to Personal Space menu"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-bold text-gray-500 dark:text-[#94a3b8] uppercase tracking-wider">
                Account Details
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-400 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                aria-label="Close menu"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Account Profile Card */}
            <div className="py-3 space-y-3 text-xs">
              <div className="flex flex-col items-center text-center pb-2.5 border-b border-gray-100 dark:border-[#1a2230]">
                <div className="w-12 h-12 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-sm font-bold shadow-xs mb-2 select-none border border-transparent dark:border-[#1a2230]">
                  {USER_PROFILE.initials}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                  {USER_PROFILE.fullName}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-[#94a3b8] mt-0.5">
                  {USER_PROFILE.email}
                </p>
              </div>

              {/* Profile Details List */}
              <div className="space-y-2">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                    Profile
                  </span>
                  <div className="bg-gray-50/80 dark:bg-[#121824] rounded-xl p-2.5 border border-gray-100 dark:border-[#1a2230]">
                    <span className="block text-[10px] text-gray-500 dark:text-[#94a3b8] leading-tight">Name</span>
                    <span className="block text-xs font-medium text-gray-900 dark:text-white mt-0.5">
                      {USER_PROFILE.fullName}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                    Plan
                  </span>
                  <div className="bg-gray-50/80 dark:bg-[#121824] rounded-xl p-2.5 border border-gray-100 dark:border-[#1a2230] flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Access</span>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                      {USER_PROFILE.plan}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                    Account type
                  </span>
                  <div className="bg-gray-50/80 dark:bg-[#121824] rounded-xl p-2.5 border border-gray-100 dark:border-[#1a2230] flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Type</span>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-200/70 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                      {USER_PROFILE.accountType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-[#1a2230]">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="text-xs text-gray-600 dark:text-[#cbd5e1] hover:text-gray-900 dark:hover:text-white py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-gray-700 dark:text-gray-200 font-medium py-1.5 px-3 bg-gray-100 dark:bg-[#121824] hover:bg-gray-200 dark:hover:bg-[#1a2230] rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="animate-fadeIn">
            {/* Settings Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1a2230]">
              <button
                type="button"
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#cbd5e1] hover:text-gray-900 dark:hover:text-white font-medium py-1 px-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                aria-label="Back to Personal Space menu"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-bold text-gray-500 dark:text-[#94a3b8] uppercase tracking-wider">
                Settings
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-400 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                aria-label="Close menu"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Settings Options */}
            <div className="py-3 space-y-3 text-xs">
              <div>
                <span className="block text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                  Appearance
                </span>
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="w-full bg-gray-50/80 dark:bg-[#121824] hover:bg-gray-100/80 dark:hover:bg-[#182232] rounded-xl p-2.5 border border-gray-100 dark:border-[#1a2230] flex items-center justify-between transition cursor-pointer text-left"
                  title="Click to toggle theme"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon size={15} className="text-amber-400" />
                    ) : (
                      <Sun size={15} className="text-amber-500" />
                    )}
                    <span className="text-xs font-medium text-gray-800 dark:text-white">Theme</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-[#1a2230] bg-white dark:bg-[#0c1017] text-gray-700 dark:text-white">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        theme === 'dark' ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                    />
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                  Notifications
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsEnabled((prev) => {
                      const next = !prev;
                      try {
                        localStorage.setItem('kaal_guidance_updates', next ? 'true' : 'false');
                      } catch (e) {}
                      return next;
                    });
                  }}
                  className="w-full bg-gray-50/80 dark:bg-[#121824] hover:bg-gray-100/80 dark:hover:bg-[#182232] rounded-xl p-2.5 border border-gray-100 dark:border-[#1a2230] flex items-center justify-between transition cursor-pointer text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-800 dark:text-white">Guidance Updates</span>
                    <span className="text-[10px] text-gray-500 dark:text-[#94a3b8] font-normal mt-0.5">Daily reflection & contemplation prompts</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
                      notificationsEnabled
                        ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60'
                        : 'text-gray-500 dark:text-[#94a3b8] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-[#1a2230]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-gray-400 dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                  About
                </span>
                <div className="bg-gray-50/80 dark:bg-[#121824] rounded-xl p-2.5 border border-gray-100 dark:border-[#1a2230]">
                  <span className="block text-xs font-semibold text-gray-900 dark:text-white">KAAL AI</span>
                  <span className="block text-[11px] text-gray-500 dark:text-[#94a3b8] mt-0.5">
                    Your space for clarity
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-[#1a2230]">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="text-xs text-gray-600 dark:text-[#cbd5e1] hover:text-gray-900 dark:hover:text-white py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-gray-700 dark:text-gray-200 font-medium py-1.5 px-3 bg-gray-100 dark:bg-[#121824] hover:bg-gray-200 dark:hover:bg-[#1a2230] rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );

      case 'menu':
      default:
        return (
          <div className="animate-fadeIn">
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1a2230]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none shadow-2xs border border-transparent dark:border-[#1a2230]">
                  {USER_PROFILE.initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                    {USER_PROFILE.displayName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-gray-600 dark:text-[#cbd5e1] font-medium">
                      {USER_PROFILE.fullName}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.2 rounded-md">
                      {USER_PROFILE.plan}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-400 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
                aria-label="Close menu"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Menu Options */}
            <div className="py-2 space-y-0.5">
              <button
                type="button"
                onClick={() => setCurrentView('account')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#121824] font-medium transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <User size={15} className="text-gray-500 dark:text-[#94a3b8]" />
                  <span>Account</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {USER_PROFILE.initials}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#121824] font-medium transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={15} className="text-gray-500 dark:text-[#94a3b8]" />
                  <span>Settings</span>
                </div>
                <ChevronRight size={14} className="text-gray-400 dark:text-gray-500" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-gray-500 dark:text-[#94a3b8] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#121824] font-medium transition cursor-pointer text-left"
              >
                <X size={15} className="text-gray-400 dark:text-[#94a3b8]" />
                <span>Close</span>
              </button>
            </div>
          </div>
        );
    }
  };

  // Collapsed Sidebar View
  if (isCollapsed) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={toggleMenu}
          aria-haspopup="true"
          aria-expanded={isProfileMenuOpen}
          aria-label="Open personal space settings"
          className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-600 transition shadow-2xs border border-transparent dark:border-[#1a2230]"
          title={`Personal Space — ${USER_PROFILE.displayName}`}
        >
          {USER_PROFILE.initials}
        </button>

        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-12 mb-2 w-72 max-w-[calc(100vw-4rem)] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0c1017] border border-gray-200/90 dark:border-[#1a2230] rounded-2xl shadow-xl p-3 z-50">
            {renderViewContent()}
          </div>
        )}
      </div>
    );
  }

  // Expanded Sidebar View
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
        className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/90 dark:hover:bg-[#121824] transition cursor-pointer select-none group focus-visible:outline-2 focus-visible:outline-emerald-600 border border-transparent focus-visible:border-emerald-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none shrink-0 shadow-2xs border border-transparent dark:border-[#1a2230]">
            {USER_PROFILE.initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-black dark:group-hover:text-white">
              {USER_PROFILE.displayName}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-[#94a3b8] leading-tight">
              {USER_PROFILE.plan}
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
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 dark:ring-emerald-900/50'
              : 'text-gray-400 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-[#121824] border-transparent'
          } focus-visible:outline-2 focus-visible:outline-emerald-500`}
          title="Open personal space settings"
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* Popover / Settings Menu Panel */}
      {isProfileMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2.5 w-full min-w-[260px] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0c1017] border border-gray-200/90 dark:border-[#1a2230] rounded-2xl shadow-xl p-3 z-50">
          {renderViewContent()}
        </div>
      )}
    </div>
  );
};
