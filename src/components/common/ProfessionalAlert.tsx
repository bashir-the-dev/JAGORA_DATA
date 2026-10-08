import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { playSuccessChime, triggerHaptic, playTapSound } from '../../utils/soundEffects';
import { humanizeVtuError } from '../../utils/errorParser';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAlert {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
}

interface ProfessionalToastProps {
  alerts: ToastAlert[];
  onDismiss: (id: string) => void;
  isLightMode?: boolean;
}

export const ProfessionalToastContainer: React.FC<ProfessionalToastProps> = ({
  alerts,
  onDismiss,
  isLightMode = true,
}) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2 w-full max-w-sm px-3 pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {alerts.map((alert) => (
          <ProfessionalToastItem
            key={alert.id}
            alert={alert}
            onDismiss={() => onDismiss(alert.id)}
            isLightMode={isLightMode}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ProfessionalToastItem: React.FC<{
  alert: ToastAlert;
  onDismiss: () => void;
  isLightMode?: boolean;
}> = ({ alert, onDismiss, isLightMode = true }) => {
  const { type, title, message: rawMessage, duration = 4000 } = alert;
  const message = type === 'error' ? humanizeVtuError(rawMessage, 'account') : rawMessage;

  useEffect(() => {
    if (type === 'success') {
      playSuccessChime();
      triggerHaptic('success');
    } else if (type === 'error') {
      triggerHaptic('warning');
    } else {
      triggerHaptic('light');
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [type, duration, onDismiss]);

  const config = {
    success: {
      icon: CheckCircle2,
      accentColor: '#10b981',
      bgLight: 'bg-white/95 border-emerald-500/30 text-slate-900 shadow-lg shadow-emerald-500/10',
      bgDark: 'bg-slate-900/95 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/50',
      badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800',
      barColor: 'bg-emerald-500',
    },
    error: {
      icon: AlertCircle,
      accentColor: '#ef4444',
      bgLight: 'bg-white/95 border-rose-500/30 text-slate-900 shadow-lg shadow-rose-500/10',
      bgDark: 'bg-slate-900/95 border-rose-500/40 text-white shadow-lg shadow-rose-950/50',
      badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800',
      barColor: 'bg-rose-500',
    },
    warning: {
      icon: AlertTriangle,
      accentColor: '#f59e0b',
      bgLight: 'bg-white/95 border-amber-500/30 text-slate-900 shadow-lg shadow-amber-500/10',
      bgDark: 'bg-slate-900/95 border-amber-500/40 text-white shadow-lg shadow-amber-950/50',
      badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800',
      barColor: 'bg-amber-500',
    },
    info: {
      icon: Info,
      accentColor: '#0047cc',
      bgLight: 'bg-white/95 border-blue-500/30 text-slate-900 shadow-lg shadow-blue-500/10',
      bgDark: 'bg-slate-900/95 border-blue-500/40 text-white shadow-lg shadow-blue-950/50',
      badgeClass: 'bg-blue-50 text-[#0047cc] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800',
      barColor: 'bg-[#0047cc]',
    },
  }[type];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`pointer-events-auto w-full rounded-2xl border backdrop-blur-md overflow-hidden relative transition-colors ${
        isLightMode ? config.bgLight : config.bgDark
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${config.badgeClass}`}>
          <Icon size={18} className="stroke-[2.5]" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          {title && (
            <h4 className="text-xs font-bold font-sans tracking-tight mb-0.5 text-slate-900 dark:text-slate-100">
              {title}
            </h4>
          )}
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-snug break-words">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            onDismiss();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Subtle Progress Bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`h-0.5 ${config.barColor} opacity-70`}
      />
    </motion.div>
  );
};
