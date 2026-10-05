import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Building2,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { ModalWrapper } from './ActionModals';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  userName?: string;
  isLightMode?: boolean;
  onNavigateSupport?: () => void;
  isMaintenanceMode?: boolean;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  userName,
  isLightMode = true,
  onNavigateSupport,
  isMaintenanceMode,
}) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const numAmount = typeof amount === 'number' ? amount : 0;
  const settlementFee = 25;
  const totalDeducted = numAmount + settlementFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    triggerHaptic('light');

    if (isMaintenanceMode) {
      setError('System maintenance is currently in progress. Bank withdrawals are temporarily paused.');
      return;
    }

    if (!bankName.trim() || !accountNumber.trim()) {
      setError('Please provide your bank name and 10-digit NUBAN account number.');
      return;
    }

    if (accountNumber.replace(/\D/g, '').length !== 10) {
      setError('Nigerian bank account numbers must be exactly 10 digits.');
      return;
    }

    if (numAmount < 500) {
      setError('Minimum withdrawal settlement is ₦500.');
      return;
    }

    if (totalDeducted > currentBalance) {
      setError(`Insufficient balance. You currently have ₦${currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}, but total required with ₦25 network fee is ₦${totalDeducted.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`);
      return;
    }

    setIsConfirming(true);
  };

  const handleAuthorizeSettlement = () => {
    playTapSound();
    triggerHaptic('medium');
    setIsConfirming(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setIsConfirming(false);
    setBankName('');
    setAccountNumber('');
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Bank Withdrawal" isLightMode={isLightMode}>
      {isSubmitted ? (
        <div className="text-center py-5 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={32} className="stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-slate-100">
              Withdrawal Request Queued
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Your request to withdraw <strong className="text-slate-800 dark:text-slate-200">₦{numAmount.toLocaleString()}</strong> to {bankName} ({accountNumber}) has been submitted for automated settlement.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
            Estimated processing time: 5 - 15 minutes. Bank settlement notifications are delivered via email & in-app alerts.
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      ) : isConfirming ? (
        <div className="space-y-4 py-1">
          {/* Review Header */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 font-heading">
                Confirm Settlement Details
              </h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90">
                Please verify beneficiary account information
              </p>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Destination Bank</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{bankName}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Account Number</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{accountNumber}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Beneficiary Name</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{userName || 'Account Holder'}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Withdrawal Amount</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">₦{numAmount.toLocaleString()}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">NIP Gateway Fee</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">₦{settlementFee.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-100/70 dark:bg-slate-950 flex items-center justify-between rounded-b-2xl font-bold">
              <span className="text-slate-800 dark:text-slate-200">Total Wallet Debit</span>
              <span className="font-mono text-sm text-[#0047cc] dark:text-blue-400">₦{totalDeducted.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Irreversible Warning Note */}
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle size={16} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="leading-snug">
              <strong className="font-bold block text-rose-900 dark:text-rose-200">Irreversible Transaction</strong>
              Interbank settlements are routed to the central switch immediately. Double check the account number as transfers cannot be recalled once dispatched.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Edit Details
            </button>
            <button
              type="button"
              onClick={handleAuthorizeSettlement}
              className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Lock size={14} />
              <span>Confirm & Authorize</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ArrowUpRight size={17} className="text-purple-100 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-heading font-bold">Direct Bank Settlement</h4>
                <p className="text-[11px] text-purple-100/90 font-medium">NIP Automated Disbursement</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>

          {/* Current Balance */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Available for Withdrawal</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              ₦{currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Maintenance Notice */}
          {isMaintenanceMode && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <span className="font-bold">Maintenance Notice:</span> Bank withdrawals are temporarily paused while scheduled system maintenance is underway. Your balance is 100% secure.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Bank Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Destination Bank
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Access Bank, OPay, GTBank, Zenith"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0047cc]"
            />
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              10-Digit NUBAN Account Number
            </label>
            <input
              type="tel"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''));
                if (error) setError('');
              }}
              placeholder="0123456789"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0047cc]"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Withdrawal Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                ₦
              </span>
              <input
                type="number"
                min={500}
                value={amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setAmount(val);
                  if (error) setError('');
                }}
                placeholder="1000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0047cc]"
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Min ₦500 • Settlement to verified account name: <strong className="text-slate-700 dark:text-slate-300">{userName || "Account Holder"}</strong>
            </span>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={numAmount <= 0 || !!isMaintenanceMode}
            className="w-full bg-[#0047cc] hover:bg-[#003eb8] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
          >
            <span>{isMaintenanceMode ? 'Withdrawals Paused (Maintenance)' : `Withdraw ₦${numAmount > 0 ? numAmount.toLocaleString() : '0'}`}</span>
            <ArrowRight size={16} />
          </motion.button>

          {onNavigateSupport && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onClose();
                  onNavigateSupport();
                }}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-[#0047cc] transition-colors cursor-pointer font-medium"
              >
                Need instant manual settlement? Contact WhatsApp Helpdesk
              </button>
            </div>
          )}
        </form>
      )}
    </ModalWrapper>
  );
};
