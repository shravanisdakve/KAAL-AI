import React, { useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  type: 'single' | 'all';
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  type,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Close modal when Escape key is pressed
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Autofocus confirm button for keyboard navigation
    confirmButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isAll = type === 'all';
  const title = isAll ? 'Clear all conversation history?' : 'Delete conversation?';
  const description = isAll
    ? 'This will permanently delete all your conversations. This action cannot be undone.'
    : 'Are you sure you want to delete this conversation? This action cannot be undone.';
  const confirmLabel = isAll ? 'Clear All' : 'Delete';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl border border-stone-200/90 shadow-2xl p-6 w-full max-w-sm select-none"
      >
        {/* Close Icon in corner */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Icon & Details */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100/80">
            {isAll ? <AlertTriangle size={20} /> : <Trash2 size={20} />}
          </div>
          <div className="pr-4">
            <h3
              id="delete-dialog-title"
              className="text-base font-semibold text-gray-900 leading-snug"
            >
              {title}
            </h3>
            <p
              id="delete-dialog-description"
              className="text-xs text-gray-500 leading-relaxed mt-1"
            >
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200/90 rounded-xl transition cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition cursor-pointer shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
