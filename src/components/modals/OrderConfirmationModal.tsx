import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ArrowRight,
  Wallet,
  AlertCircle,
  X,
  Lock,
  Phone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { NetworkId } from '../../types';
import { playTapSound } from '../../utils/soundEffects';

export interface OrderConfirmationDetails {
  serviceType: 'DATA' | 'AIRTIME' | 'CABLE' | 'ELECTRICITY' | 'EXAM_PIN' | 'RECHARGE_PIN' | 'DATA_CARD' | 'TRANSFER';
  title: string;
  subtitle?: string;
  network?: NetworkId | string;
  recipient: string;
  recipientLabel?: string; // e.g. "Phone Number", "Smartcard Number", "Meter Number"
  amount: number;
  discount?: number;
  cashback?: number;
  userBalance: number;
  additionalInfo?: { label: string; value: string }[];
  warningNote?: string;
}

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  details: OrderConfirmationDetails | null;
  isLightMode?: boolean;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  details,
  isLightMode = true,
}) => {
  if (!details) return null;

  const totalPayable = details.amount - (details.discount || 0);
  const balanceAfter = details.userBalance - totalPayable;
  const isSufficient = details.userBalance >= totalPayable;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className={`relative w-full max-w-md rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh] pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            {/* Mobile Sheet Pull Bar */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-[#0047cc]">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Modal Header */}
            <div className="px-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-[#0047cc] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-bold tracking-tight text-white">
                    Confirm Transaction
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">Review your order details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Product Highlight Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-3.5">
                {details.network ? (
                  <TelecomLogo
                    network={details.network.toLowerCase() as NetworkId}
                    size="md"
                    className="shrink-0 rounded-xl shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-[#0047cc] text-white flex items-center justify-center shrink-0 font-black text-sm shadow-xs">
                    AJ
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {details.serviceType.replace('_', ' ')}
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {details.title}
                  </h4>
                  {details.subtitle && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {details.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Breakdown Slip */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs overflow-hidden">
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {details.recipientLabel || 'Beneficiary'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {details.recipient}
                  </span>
                </div>

                {details.additionalInfo?.map((info, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {info.label}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {info.value}
                    </span>
                  </div>
                ))}

                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Package Cost</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    ₦{details.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {details.discount !== undefined && details.discount > 0 && (
                  <div className="p-3 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">Instant Discount</span>
                    <span className="font-mono font-bold">
                      -₦{details.discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Total Payable</span>
                  <span className="font-mono font-extrabold text-base text-[#0047cc] dark:text-blue-400">
                    ₦{totalPayable.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Wallet Balance Impact */}
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  isSufficient
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Wallet size={13} />
                    <span>Current Wallet Balance</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ₦{details.userBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-700 dark:text-slate-300">Balance After Payment</span>
                  <span
                    className={`font-mono text-sm ${
                      isSufficient
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    ₦{balanceAfter.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {!isSufficient && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 pt-1 font-medium">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>
                      Insufficient wallet balance. Please fund your wallet with at least ₦
                      {(totalPayable - details.userBalance).toFixed(2)}.
                    </span>
                  </div>
                )}
              </div>

              {/* Warning Alert Note */}
              {details.warningNote && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span className="leading-snug font-medium">{details.warningNote}</span>
                </div>
              )}

              {/* Security Reassurance Notice */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>Instant dispatch guarantee • 100% automated refund on network failure</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={!isSufficient}
                  onClick={() => {
                    playTapSound();
                    onConfirm();
                  }}
                  className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={15} />
                  <span>Confirm & Enter PIN (₦{totalPayable.toLocaleString()})</span>
                </motion.button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel / Edit Order
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
