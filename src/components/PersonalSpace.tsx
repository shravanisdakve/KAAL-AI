import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, User, Settings, X, ArrowLeft, ChevronRight } from 'lucide-react';

interface PersonalSpaceProps {
  isCollapsed?: boolean;
}

// Demo user specification
const DEMO_USER = {
  fullName: 'Shravani Sunil Dakve',
  displayName: 'Shravani',
  initials: 'SD',
  email: 'shravanisdakve@gmail.com',
  plan: 'Standard Plan',
  accountType: 'Demo User',
};

export const PersonalSpace: React.FC<PersonalSpaceProps> = ({ isCollapsed = false }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'account' | 'settings'>('menu');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

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
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium py-1 px-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                aria-label="Back to Personal Space menu"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Account Details
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close menu"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Account Profile Card */}
            <div className="py-3 space-y-3 text-xs">
              <div className="flex flex-col items-center text-center pb-2.5 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-sm font-bold shadow-xs mb-2 select-none">
                  {DEMO_USER.initials}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                  {DEMO_USER.fullName}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {DEMO_USER.email}
                </p>
              </div>

              {/* Profile Details List */}
              <div className="space-y-2">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Profile
                  </span>
                  <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                    <span className="block text-[10px] text-gray-500 leading-tight">Name</span>
                    <span className="block text-xs font-medium text-gray-900 mt-0.5">
                      {DEMO_USER.fullName}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Plan
                  </span>
                  <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Plan</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                      {DEMO_USER.plan}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Account type
                  </span>
                  <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Type</span>
                    <span className="text-[11px] font-medium text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-md">
                      {DEMO_USER.accountType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="text-xs text-gray-600 hover:text-gray-900 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-gray-700 font-medium py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
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
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium py-1 px-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                aria-label="Back to Personal Space menu"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Settings
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close menu"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Settings Options */}
            <div className="py-3 space-y-3 text-xs">
              <div>
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Appearance
                </span>
                <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-800">Theme</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Light
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Notifications
                </span>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled((prev) => !prev)}
                  className="w-full bg-gray-50/80 hover:bg-gray-100/80 rounded-xl p-2.5 border border-gray-100 flex items-center justify-between transition cursor-pointer text-left"
                >
                  <span className="text-xs font-medium text-gray-800">Guidance Updates</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
                      notificationsEnabled
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-200/80'
                        : 'text-gray-500 bg-gray-100 border-gray-200'
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
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  About
                </span>
                <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                  <span className="block text-xs font-semibold text-gray-900">KAAL AI</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    Your space for clarity
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="text-xs text-gray-600 hover:text-gray-900 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-gray-700 font-medium py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
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
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none shadow-2xs">
                  {DEMO_USER.initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-900 leading-tight">
                    Personal Space
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-gray-600 font-medium">
                      {DEMO_USER.displayName}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md">
                      {DEMO_USER.plan}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
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
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <User size={15} className="text-gray-500" />
                  <span>Account</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {DEMO_USER.initials}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={15} className="text-gray-500" />
                  <span>Settings</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium transition cursor-pointer text-left"
              >
                <X size={15} className="text-gray-400" />
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
          className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-600 transition shadow-2xs"
          title={`Personal Space — ${DEMO_USER.displayName}`}
        >
          {DEMO_USER.initials}
        </button>

        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-12 mb-2 w-72 max-w-[calc(100vw-4rem)] max-h-[85vh] overflow-y-auto bg-white border border-gray-200/90 rounded-2xl shadow-xl p-3 z-50">
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
        className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/90 transition cursor-pointer select-none group focus-visible:outline-2 focus-visible:outline-emerald-600 border border-transparent focus-visible:border-emerald-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1c2226] text-white flex items-center justify-center text-xs font-semibold select-none shrink-0 shadow-2xs">
            {DEMO_USER.initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900 leading-tight group-hover:text-black">
              {DEMO_USER.displayName}
            </span>
            <span className="text-[11px] text-gray-500 leading-tight">
              {DEMO_USER.plan}
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
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 border-transparent'
          } focus-visible:outline-2 focus-visible:outline-emerald-500`}
          title="Open personal space settings"
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* Popover / Settings Menu Panel */}
      {isProfileMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2.5 w-full min-w-[260px] max-h-[85vh] overflow-y-auto bg-white border border-gray-200/90 rounded-2xl shadow-xl p-3 z-50">
          {renderViewContent()}
        </div>
      )}
    </div>
  );
};
