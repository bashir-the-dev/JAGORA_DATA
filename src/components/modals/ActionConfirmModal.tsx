import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Trash2,
  LogOut,
  ShieldAlert,
  X,
  Loader2,
  Lock,
  UserX,
} from 'lucide-react';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

export interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  iconType?: 'logout' | 'delete' | 'freeze' | 'warning' | 'info';
  isLoading?: boolean;
  isLightMode?: boolean;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningNote,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'warning',
  iconType = 'warning',
  isLoading = false,
  isLightMode = true,
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'logout':
        return <LogOut size={22} className="stroke-[2.2]" />;
      case 'delete':
        return <Trash2 size={22} className="stroke-[2.2]" />;
      case 'freeze':
        return <UserX size={22} className="stroke-[2.2]" />;
      case 'info':
        return <ShieldAlert size={22} className="stroke-[2.2]" />;
      case 'warning':
      default:
        return <AlertTriangle size={22} className="stroke-[2.2]" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:bg-rose-800',
          badgeText: 'text-rose-600 dark:text-rose-400',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-950/70 text-[#0047cc] dark:text-blue-400 border border-blue-200 dark:border-blue-800',
          confirmBtn:
            'bg-[#0047cc] hover:bg-[#003eb8] text-white shadow-blue-600/20 active:bg-blue-800',
          badgeText: 'text-blue-600 dark:text-blue-400',
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
          confirmBtn:
            'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:bg-amber-800',
          badgeText: 'text-amber-600 dark:text-amber-400',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={isLoading ? undefined : onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className={`relative w-full max-w-sm sm:max-w-md rounded-t-[26px] sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border z-10 flex flex-col pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header / Dismiss */}
            <div className="px-5 pt-3 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 pb-6 pt-1 text-center space-y-4">
              {/* Main Icon Badge */}
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs ${styles.iconBg}`}
              >
                {getIcon()}
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 px-2">
                <h3 className="font-heading text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  {description}
                </p>
              </div>

              {/* Warning Alert Note (if provided) */}
              {warningNote && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle
                    size={16}
                    className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                  />
                  <div className="leading-snug font-medium">
                    {warningNote}
                  </div>
                </div>
              )}

              {/* Action Buttons (Min 44px tap target) */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    triggerHaptic('light');
                    onClose();
                  }}
                  disabled={isLoading}
                  className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {cancelLabel}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    playTapSound();
                    triggerHaptic('medium');
                    await onConfirm();
                  }}
                  disabled={isLoading}
                  className={`w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{confirmLabel}</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
