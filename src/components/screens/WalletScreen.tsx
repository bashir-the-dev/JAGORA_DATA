import React, { useState } from 'react';
import { Transaction, UserProfile, ScreenType } from '../../types';
import {
  Plus,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Wifi,
  Bolt,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Gift,
  History,
} from 'lucide-react';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

interface WalletScreenProps {
  user: UserProfile;
  transactions: Transaction[];
  onOpenFundWallet: () => void;
  onNavigateFundWallet?: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateHistory: () => void;
  onNavigateSupport?: () => void;
  onNavigate?: (screen: ScreenType) => void;
  onTransferSuccess?: (recipient: string, amount: number, reference: string, newBalance: number) => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
  isReferralsHidden?: boolean;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  user,
  transactions,
  onOpenFundWallet,
  onNavigateFundWallet,
  onSelectTransaction,
  onNavigateHistory,
  onNavigateSupport,
  onNavigate,
  onTransferSuccess,
  isLightMode,
  isMaintenanceMode,
  isReferralsHidden = false,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Real user balances directly from verified database profile
  const realBalance = typeof user?.balance === 'number' ? user.balance : 0;
  const realBonus = typeof user?.bonusBalance === 'number' ? user.bonusBalance : 0;

  const handleCopyPaymentLink = () => {
    playTapSound();
    triggerHaptic('light');

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jagora.ng';
    const cleanPhone = user?.phone ? user.phone.replace(/\D/g, '') : '';
    const paymentLink = `${baseUrl}/?pay=${encodeURIComponent(cleanPhone)}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(paymentLink).catch(() => {});
    }

    setActionAlert({
      message: `Payment link copied: ${paymentLink}. Share to receive instant automated wallet top-ups!`,
      type: 'success',
    });
    setTimeout(() => setActionAlert(null), 4500);
  };

  return (
    <div id="screen-wallet" className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
      {/* Account Verification & Security Status */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Verified Wallet
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <ShieldCheck size={13} className="text-[#0047cc] dark:text-blue-400" />
          <span>Tier 1 Active</span>
        </div>
      </div>

      {/* BALANCE CARD (16:9 on mobile, clean, simple and uncrowded) */}
      <section
        id="wallet-balance-card"
        className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden transition-all bg-gradient-to-br from-[#0a1224] via-[#0e172e] to-[#070b16] border border-white/10 ring-1 ring-white/[0.05] aspect-video sm:aspect-auto sm:min-h-[170px] flex flex-col justify-between"
      >
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border-[16px] border-white/[0.03] pointer-events-none" />

        {/* Top: Label and Visibility Toggle */}
        <div className="flex items-center justify-between z-10 relative">
          <span className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide">
            Available Balance
          </span>
          <button
            type="button"
            onClick={() => setShowBalance(!showBalance)}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Center: Large Balance */}
        <div className="z-10 relative my-auto py-1">
          <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight truncate">
            {showBalance
              ? `₦ ${realBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
              : '₦ ••••••••'}
          </div>
        </div>

        {/* Bottom: Bonus info + Fund Wallet Button */}
        <div className="flex justify-between items-center z-10 relative pt-2 border-t border-white/10">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono text-slate-400">Bonus</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400">
              {showBalance
                ? `₦${realBonus.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                : '₦••••'}
            </span>
          </div>

          <button
            id="fund-wallet-main-btn"
            type="button"
            onClick={() => {
              if (onNavigateFundWallet) {
                onNavigateFundWallet();
              } else {
                onOpenFundWallet();
              }
            }}
            className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-heading text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer border border-blue-400/30"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Fund Wallet</span>
          </button>
        </div>
      </section>

      {/* QUICK ACTIONS (Fund Wallet, History, Pay Link, Rewards) */}
      <section className="grid grid-cols-4 gap-2">
        {/* 1. Fund Wallet */}
        <button
          id="quick-action-fund"
          onClick={() => {
            playTapSound();
            if (onNavigateFundWallet) onNavigateFundWallet();
            else onOpenFundWallet();
          }}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-white border-blue-100 hover:border-blue-300'
              : 'bg-[#0c1322] border-blue-900/40 hover:border-blue-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047cc] dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-all flex items-center justify-center border border-blue-200/80 dark:border-blue-900/60">
            <Plus size={18} className="stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-heading font-bold text-slate-900 dark:text-white truncate">Fund</span>
        </button>

        {/* 2. History */}
        <button
          id="quick-action-history"
          onClick={() => {
            playTapSound();
            onNavigateHistory();
          }}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-white border-slate-200/90 hover:border-slate-300'
              : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047cc] dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-all flex items-center justify-center border border-blue-200/80 dark:border-blue-900/60">
            <History size={17} />
          </div>
          <span className="text-[11px] font-heading font-bold text-slate-900 dark:text-white truncate">History</span>
        </button>

        {/* 3. Request / Payment Link */}
        <button
          id="quick-action-request"
          onClick={handleCopyPaymentLink}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-white border-slate-200/90 hover:border-slate-300'
              : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047cc] dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-all flex items-center justify-center border border-blue-200/80 dark:border-blue-900/60">
            <Copy size={17} />
          </div>
          <span className="text-[11px] font-heading font-bold text-slate-900 dark:text-white truncate">Pay Link</span>
        </button>

        {/* 4. Refer & Earn */}
        {!isReferralsHidden && (
          <button
            id="quick-action-refer"
            onClick={() => {
              playTapSound();
              if (onNavigate) onNavigate('referrals');
            }}
            className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
              isLightMode
                ? 'bg-blue-50/60 border-blue-200/80 hover:border-blue-300'
                : 'bg-blue-950/20 border-blue-900/60 hover:border-blue-700'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#0047cc] dark:bg-blue-900/60 dark:text-blue-300 group-hover:scale-105 transition-all flex items-center justify-center border border-blue-300 dark:border-blue-700/80">
              <Gift size={18} />
            </div>
            <span className="text-[11px] font-heading font-bold text-[#0047cc] dark:text-blue-300 truncate">Rewards</span>
          </button>
        )}
      </section>

      {/* Action Notification banner */}
      {actionAlert && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0047cc] dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200 shadow-xs">
          <span>{actionAlert.message}</span>
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 ml-2" />
        </div>
      )}

      {/* TRANSACTION HISTORY SECTION */}
      <section className="space-y-3">
        <div className="flex justify-between items-center pb-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Transaction History</h3>
          <button
            onClick={onNavigateHistory}
            className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className={`rounded-2xl p-3.5 flex items-center justify-between border transition-all cursor-pointer shadow-xs ${
                isLightMode
                  ? 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  : 'bg-slate-800/90 border-slate-700/60 hover:border-slate-600 hover:bg-slate-700/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.isCredit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400'
                  }`}
                >
                  {tx.iconType === 'wallet' ? (
                    <Plus size={17} />
                  ) : tx.iconType === 'bolt' ? (
                    <Bolt size={17} />
                  ) : (
                    <Wifi size={17} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{tx.title}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{tx.date}</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span
                  className={`font-sans text-xs sm:text-sm font-bold ${
                    tx.isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {tx.isCredit ? '+' : '-'} ₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-[10px] uppercase px-2 py-0.5 rounded tracking-wider font-semibold mt-0.5 ${
                    tx.status === 'SUCCESS'
                      ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60'
                      : tx.status === 'PENDING'
                      ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60'
                      : 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
