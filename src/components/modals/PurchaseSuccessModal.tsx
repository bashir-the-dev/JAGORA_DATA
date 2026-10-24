import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Receipt, ArrowRight } from 'lucide-react';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

export interface PurchaseSuccessData {
  isOpen: boolean;
  network?: string;
  planName?: string;
  recipientPhone?: string;
  amount: number;
  dateStr?: string;
  transactionId?: string;
  serviceType?: string;
}

interface PurchaseSuccessModalProps {
  data: PurchaseSuccessData | null;
  onClose: () => void;
  onViewReceipt: () => void;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  data,
  onClose,
  onViewReceipt,
}) => {
  if (!data || !data.isOpen) return null;

  const formattedDate = data.dateStr || new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const txId = data.transactionId || `AJT${Date.now().toString().slice(-14)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#0b1328] border border-slate-800 text-white shadow-2xl overflow-hidden p-6 text-center"
        >
          {/* Subtle glow circle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Glowing Green Checkmark Circle */}
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-500/20 mb-4 animate-bounce-short">
            <Check size={32} className="stroke-[3]" />
          </div>

          {/* Headline & Subtitle */}
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight mb-1 text-white">
            Purchase Successful!
          </h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">
            Your {data.serviceType || 'data'} purchase has been completed successfully.
          </p>

          {/* Receipt Breakdown Card */}
          <div className="rounded-2xl bg-[#060c1c] border border-slate-800/80 p-4 text-xs space-y-3 mb-6 text-left divide-y divide-slate-800/50">
            {data.network && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 font-medium">Network</span>
                <span className="font-bold text-white uppercase">{data.network}</span>
              </div>
            )}

            {data.planName && (
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-400 font-medium">Data Plan</span>
                <span className="font-bold text-white">{data.planName}</span>
              </div>
            )}

            {data.recipientPhone && (
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-400 font-medium">Phone Number</span>
                <span className="font-mono font-bold text-slate-200">{data.recipientPhone}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-400 font-medium">Amount</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ₦{Number(data.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-400 font-medium">Date & Time</span>
              <span className="font-medium text-slate-300 text-[11px]">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-400 font-medium">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-300 text-[11px] truncate max-w-[170px]">
                {txId}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => {
                playTapSound();
                triggerHaptic('medium');
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-heading font-bold text-sm shadow-lg shadow-orange-950/30 transition-all active:scale-95 cursor-pointer"
            >
              Back to Home
            </button>

            <button
              onClick={() => {
                playTapSound();
                triggerHaptic('light');
                onViewReceipt();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-heading font-semibold text-xs border border-slate-700/60 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Receipt size={14} />
              <span>View Full Receipt</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
