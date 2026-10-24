import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, Lock, Radio, Zap, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { SandTimerLoader } from './SandTimerLoader';

interface FintechSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export const FintechSpinner: React.FC<FintechSpinnerProps> = ({
  size = 20,
  color = 'currentColor',
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="31.415 31.415"
        strokeDashoffset="0"
        className="opacity-20"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="16 48"
        strokeDashoffset="0"
        className="opacity-90"
      />
    </svg>
  );
};

interface FintechButtonLoaderProps {
  text: string;
  subtext?: string;
  size?: number;
}

export const FintechButtonLoader: React.FC<FintechButtonLoaderProps> = ({
  text,
  subtext,
  size = 18,
}) => {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <div className="relative flex items-center justify-center">
        <FintechSpinner size={size} color="currentColor" />
        <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="font-semibold">{text}</span>
        {subtext && <span className="text-[10px] opacity-80 font-normal">{subtext}</span>}
      </div>
    </div>
  );
};

export interface TransactionProcessingModalProps {
  isOpen: boolean;
  serviceTitle: string;
  recipient?: string;
  amount?: number;
  isLightMode?: boolean;
  isPendingState?: boolean;
  onViewHistory?: () => void;
  onClose?: () => void;
}

export const TransactionProcessingModal: React.FC<TransactionProcessingModalProps> = ({
  isOpen,
  serviceTitle,
  recipient,
  amount,
  isLightMode = true,
  isPendingState = false,
  onViewHistory,
  onClose,
}) => {
  const [step, setStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [internalPending, setInternalPending] = useState(false);

  const steps = [
    { label: 'Authenticating transaction & verifying wallet', icon: Lock },
    { label: 'Connecting to telecom operator switch', icon: Radio },
    { label: 'Dispensing value & issuing official e-Receipt', icon: Zap },
  ];

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setElapsedSeconds(0);
      setInternalPending(false);
      return;
    }

    const timer1 = setTimeout(() => setStep(1), 600);
    const timer2 = setTimeout(() => setStep(2), 2200);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // If operation exceeds 12 seconds without closing, suggest pending transition
        if (next >= 12) {
          setInternalPending(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(interval);
    };
  }, [isOpen]);

  const showPendingView = isPendingState || internalPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl relative overflow-hidden ${
              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            {/* Top glowing accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                showPendingView
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-[#0047cc] via-blue-500 to-indigo-500 animate-pulse'
              }`}
            />

            {!showPendingView ? (
              <div className="py-4 px-2 flex flex-col items-center justify-center text-center space-y-4">
                <SandTimerLoader
                  size="lg"
                  color="#0047cc"
                  sandColor="#f59e0b"
                  text="Processing Order..."
                  subtext="Connecting to telecom carrier switch"
                />

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 w-full text-center space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {serviceTitle}
                  </span>
                  {amount !== undefined && (
                    <span className="font-mono text-sm font-bold text-[#0047cc] dark:text-blue-400 block">
                      ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {recipient && (
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                      Recipient: {recipient}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <span>Instant delivery • Wallet auto-refund protection</span>
                </div>
              </div>
            ) : (
              <>
                {/* Visual PENDING State View */}
                <div className="flex flex-col items-center text-center mt-2 mb-4 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Clock size={28} className="animate-pulse" />
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Order Queued & Pending
                  </span>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Delivery In Progress
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The telecom provider switch is taking a moment to finalize delivery for{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{recipient || serviceTitle}</span>.
                  </p>
                </div>

                {/* Assurance box */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>Your Money Is 100% Safe</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    If the network operator cannot complete the delivery within 5 minutes, your wallet is automatically refunded. You can monitor the real-time status in Transaction History.
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  {onViewHistory && (
                    <button
                      onClick={onViewHistory}
                      className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Track In Transaction History</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
                    >
                      Done / Close
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Shimmer Skeleton for cards
export const SkeletonCard: React.FC<{ height?: string; className?: string }> = ({
  height = 'h-40',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 ${height} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
  );
};

// Shimmer Skeleton for transaction item
export const SkeletonTransactionItem: React.FC = () => {
  return (
    <div className="p-3.5 flex items-center justify-between relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/80 shrink-0" />
        <div className="space-y-1.5">
          <div className="w-28 h-3.5 rounded bg-slate-200 dark:bg-slate-700/80" />
          <div className="w-20 h-2.5 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="text-right space-y-1.5">
        <div className="w-16 h-3.5 rounded bg-slate-200 dark:bg-slate-700/80 ml-auto" />
        <div className="w-12 h-2.5 rounded bg-slate-100 dark:bg-slate-800 ml-auto" />
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
  );
};

export const SkeletonTransactionList: React.FC<{ count?: number; isLightMode?: boolean }> = ({
  count = 4,
  isLightMode = true,
}) => {
  return (
    <div
      className={`rounded-2xl border shadow-sm divide-y overflow-hidden ${
        isLightMode
          ? 'bg-white border-slate-100 divide-slate-100'
          : 'bg-slate-800/90 border-slate-700/60 divide-slate-700/50'
      }`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTransactionItem key={i} />
      ))}
    </div>
  );
};
