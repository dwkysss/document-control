import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-3xl',
  headerRight,
  customHeader
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full ${maxWidth} overflow-hidden transform transition-all z-10 my-auto sm:my-8 max-h-[96dvh] sm:max-h-[95dvh] flex flex-col`}>
        {/* Header */}
        {customHeader ? (
          customHeader
        ) : (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerRight}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup (Esc)"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="px-3 sm:px-6 py-3 sm:py-5 overflow-y-auto flex-1 [scrollbar-width:thin]">
          {children}
        </div>
      </div>
    </div>
  );
}
