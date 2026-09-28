import React from 'react';
import { Cpu, Database, Server, X, Zap } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewConversation: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNewConversation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#0c1017] rounded-2xl shadow-xl border border-gray-200/90 dark:border-[#1a2230] overflow-hidden animate-scaleIn select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1a2230]">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              KAAL AI Command & Architecture Overview
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#121824] transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Shortcuts section */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#94a3b8] mb-2">
              Keyboard Shortcuts
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-[#121824] border border-gray-100 dark:border-[#1a2230]">
                <span className="text-gray-700 dark:text-[#cbd5e1]">Submit Question</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] bg-white dark:bg-[#1a2230] border border-gray-200 dark:border-[#2a374c] rounded shadow-2xs text-gray-800 dark:text-gray-200">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-[#121824] border border-gray-100 dark:border-[#1a2230]">
                <span className="text-gray-700 dark:text-[#cbd5e1]">Add Line Break</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] bg-white dark:bg-[#1a2230] border border-gray-200 dark:border-[#2a374c] rounded shadow-2xs text-gray-800 dark:text-gray-200">
                  Shift + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-[#121824] border border-gray-100 dark:border-[#1a2230]">
                <span className="text-gray-700 dark:text-[#cbd5e1]">Toggle Command Menu</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] bg-white dark:bg-[#1a2230] border border-gray-200 dark:border-[#2a374c] rounded shadow-2xs text-gray-800 dark:text-gray-200">
                  ⌘ + K / Ctrl + K
                </kbd>
              </div>
            </div>
          </div>

          {/* Engine Info */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5 text-emerald-900 dark:text-emerald-300 font-semibold text-xs">
              <Cpu size={14} className="text-emerald-700 dark:text-emerald-400" />
              <span>KAAL Deterministic Guidance Engine</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              No black-box LLM or stochastic hallucination. Input signals are
              normalized, scored across controlled taxonomy categories (Career,
              Learning, Productivity, Well-being, General), and mapped to
              structured tactical checklists.
            </p>
          </div>

          {/* Architecture Pipeline */}
          <div className="border border-gray-100 dark:border-[#1a2230] rounded-xl p-3.5 bg-gray-50/50 dark:bg-[#121824]/60">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#94a3b8] mb-2">
              System Pipeline
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white dark:bg-[#0c1017] rounded-lg border border-gray-200/80 dark:border-[#1a2230]">
                <Server size={14} className="mx-auto mb-1 text-gray-500 dark:text-[#94a3b8]" />
                <span className="font-semibold block text-[11px] text-gray-900 dark:text-white">Express API</span>
                <span className="text-[10px] text-gray-400 dark:text-[#94a3b8]">/api/guidance</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#0c1017] rounded-lg border border-gray-200/80 dark:border-[#1a2230]">
                <Cpu size={14} className="mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold block text-[11px] text-gray-900 dark:text-white">Rule Engine</span>
                <span className="text-[10px] text-gray-400 dark:text-[#94a3b8]">Deterministic</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#0c1017] rounded-lg border border-gray-200/80 dark:border-[#1a2230]">
                <Database size={14} className="mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold block text-[11px] text-gray-900 dark:text-white">PostgreSQL</span>
                <span className="text-[10px] text-gray-400 dark:text-[#94a3b8]">JSONB Store</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-[#07090e] border-t border-gray-100 dark:border-[#1a2230] flex items-center justify-between">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="text-xs text-[#114936] dark:text-emerald-400 hover:underline font-medium cursor-pointer"
          >
            Start New Conversation
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 dark:bg-[#1a2230] hover:bg-gray-300 dark:hover:bg-[#253348] text-gray-800 dark:text-gray-200 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
