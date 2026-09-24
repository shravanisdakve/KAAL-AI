import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { GuidanceSession } from '../types/guidance.ts';
import { KaalAvatar } from './KaalAvatar.tsx';
import { PersonalSpace } from './PersonalSpace.tsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.tsx';

interface SidebarProps {
  sessions: GuidanceSession[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onNewConversation: () => void;
  onDeleteSession: (id: number) => void;
  onClearAllHistory: () => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
  onClearAllHistory,
  isOpen,
  onToggle,
  isMobile,
  onCloseMobile,
}) => {
  const [sessionToDeleteId, setSessionToDeleteId] = useState<number | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Categorize sessions into Today, Yesterday, Earlier
  const categorizeSessions = () => {
    const today: GuidanceSession[] = [];
    const yesterday: GuidanceSession[] = [];
    const earlier: GuidanceSession[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    for (const session of sessions) {
      const sessionTime = new Date(session.createdAt).getTime();
      if (sessionTime >= startOfToday) {
        today.push(session);
      } else if (sessionTime >= startOfYesterday) {
        yesterday.push(session);
      } else {
        earlier.push(session);
      }
    }

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = categorizeSessions();

  // Helper to generate a clean title
  const formatItemTitle = (session: GuidanceSession): string => {
    if (session.response?.title) {
      const t = session.response.title;
      return t.length > 24 ? `${t.slice(0, 22)}...` : t;
    }
    const q = session.question;
    return q.length > 24 ? `${q.slice(0, 22)}...` : q;
  };

  const renderGroup = (label: string, items: GuidanceSession[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase select-none">
          {label}
        </h3>
        <div className="space-y-1">
          {items.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors select-none ${
                  isActive
                    ? 'bg-[#c5e8d5] text-[#114936] font-medium'
                    : 'text-gray-700 hover:bg-gray-100 font-normal'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectSession(session.id);
                    if (isMobile) onCloseMobile();
                  }}
                  className="flex-1 text-left truncate cursor-pointer pr-2"
                  title={session.question}
                >
                  {formatItemTitle(session)}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDeleteId(session.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity cursor-pointer shrink-0 ${
                    isActive
                      ? 'text-[#114936] hover:bg-[#b0decd]'
                      : 'text-gray-400 hover:text-red-600 hover:bg-gray-200/60'
                  }`}
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#fbfcfb] border-r border-gray-200/80 w-72 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button
          type="button"
          onClick={() => {
            onNewConversation();
            if (isMobile) onCloseMobile();
          }}
          aria-label="Go to KAAL AI home"
          className="flex items-center gap-2.5 p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100/80 active:bg-gray-200/60 transition cursor-pointer text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/50 group"
          title="Go to KAAL AI home"
        >
          <KaalAvatar size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 tracking-tight text-sm leading-none group-hover:text-black">
              KAAL AI
            </span>
            <span className="text-[10px] text-gray-500 font-normal leading-tight mt-0.5 group-hover:text-gray-700">
              Your space for clarity
            </span>
          </div>
        </button>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* New Conversation Button */}
      <div className="p-3 space-y-2">
        <button
          type="button"
          onClick={() => {
            onNewConversation();
            if (isMobile) onCloseMobile();
          }}
          className="w-full bg-[#c5e8d5] hover:bg-[#b5dec7] text-[#114936] font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.2} />
          <span>New Conversation</span>
        </button>

        {/* Clear All History Button */}
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => setIsClearAllModalOpen(true)}
            className="w-full text-xs text-gray-500 hover:text-red-600 hover:bg-red-50/60 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {renderGroup('Today', today)}
        {renderGroup('Yesterday', yesterday)}
        {renderGroup('Earlier', earlier)}

        {sessions.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-gray-400">
            No previous conversations yet.
          </div>
        )}
      </div>

      {/* Personal Space Rail Footer Card */}
      <div className="p-3 border-t border-gray-200/80 mt-auto bg-[#fafbfa]">
        <PersonalSpace isCollapsed={false} />
      </div>
    </div>
  );

  return (
    <>
      {/* Confirmation Modals */}
      <DeleteConfirmationModal
        isOpen={sessionToDeleteId !== null}
        type="single"
        onConfirm={() => {
          if (sessionToDeleteId !== null) {
            onDeleteSession(sessionToDeleteId);
            setSessionToDeleteId(null);
          }
        }}
        onCancel={() => setSessionToDeleteId(null)}
      />

      <DeleteConfirmationModal
        isOpen={isClearAllModalOpen}
        type="all"
        onConfirm={() => {
          onClearAllHistory();
          setIsClearAllModalOpen(false);
          if (isMobile) onCloseMobile();
        }}
        onCancel={() => setIsClearAllModalOpen(false)}
      />

      {/* Mobile Drawer */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Collapsed Rail */}
      {!isMobile && !isOpen && (
        <div className="w-14 h-full bg-[#fbfcfb] border-r border-gray-200/80 flex flex-col items-center py-4 select-none shrink-0 transition-all">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition mb-4 cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>

          <button
            type="button"
            onClick={onNewConversation}
            className="p-2.5 bg-[#c5e8d5] text-[#114936] rounded-xl hover:bg-[#b5dec7] transition shadow-2xs mb-4 cursor-pointer"
            title="New Conversation"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>

          <div className="flex-1" />

          <PersonalSpace isCollapsed={true} />
        </div>
      )}

      {/* Desktop Expanded Sidebar */}
      {!isMobile && isOpen && (
        <div className="h-full shrink-0 select-none transition-all">
          {sidebarContent}
        </div>
      )}
    </>
  );
};
