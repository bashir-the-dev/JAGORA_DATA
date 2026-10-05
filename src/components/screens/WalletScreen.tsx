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
} from 'lucide-react';
import { WalletTransferModal } from '../modals/WalletTransferModal';
import { WithdrawalModal } from '../modals/WithdrawalModal';
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
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Real user balances directly from verified database profile
  const realBalance = typeof user?.balance === 'number' ? user.balance : 0;
  const realBonus = typeof user?.bonusBalance === 'number' ? user.bonusBalance : 0;

  const handleQuickAction = (actionName: 'Transfer' | 'Request' | 'Withdraw') => {
    playTapSound();
    triggerHaptic('light');

    if (actionName === 'Transfer') {
      setIsTransferModalOpen(true);
    } else if (actionName === 'Request') {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jagora.ng';
      const cleanPhone = user?.phone ? user.phone.replace(/\D/g, '') : '';
      const paymentLink = `${baseUrl}/?pay=${encodeURIComponent(cleanPhone)}`;

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(paymentLink).catch(() => {});
      }

      setActionAlert({
        message: `Payment link copied: ${paymentLink}. Share to receive instant wallet transfers!`,
        type: 'success',
      });
      setTimeout(() => setActionAlert(null), 4500);
    } else if (actionName === 'Withdraw') {
      setIsWithdrawModalOpen(true);
    }
  };

  const handleLocalTransferSuccess = (
    recipient: string,
    amount: number,
    reference: string,
    newBalance: number
  ) => {
    if (onTransferSuccess) {
      onTransferSuccess(recipient, amount, reference, newBalance);
    }
    setActionAlert({
      message: `₦${amount.toLocaleString()} transferred successfully to ${recipient}!`,
      type: 'success',
    });
    setTimeout(() => setActionAlert(null), 5000);
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

      {/* BALANCE CARD (Bespoke Obsidian Metal with Sapphire Depth) */}
      <section
        id="wallet-balance-card"
        className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all bg-gradient-to-br from-[#0a1224] via-[#0e172e] to-[#070b16] border border-white/10 ring-1 ring-white/[0.05]"
      >
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border-[16px] border-white/[0.03] pointer-events-none" />
        <div className="flex flex-col gap-1 z-10 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Available Balance
            </span>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight">
              {showBalance
                ? `₦ ${realBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                : '₦ ••••••••'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end z-10 relative pt-4 mt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              if (onNavigate) onNavigate('referrals');
            }}
            className="flex flex-col text-left hover:opacity-90 active:scale-95 transition-all cursor-pointer p-1 -m-1 rounded-lg"
            title="View referral bonus details"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-mono font-medium text-slate-400">Bonus Balance</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-amber-400 text-blue-950 font-black uppercase tracking-tight">
                Earn ₦50
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {showBalance
                ? `₦${realBonus.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                : '₦••••'}
            </span>
          </button>

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
            className="bg-blue-600 hover:bg-blue-500 text-white font-heading text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer border border-blue-400/30"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>+ Add Money</span>
          </button>
        </div>
      </section>

      {/* QUICK ACTIONS (Transfer, Request, Withdraw, Refer & Earn) */}
      <section className="grid grid-cols-4 gap-2">
        {/* Transfer */}
        <button
          id="quick-action-transfer"
          onClick={() => handleQuickAction('Transfer')}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-white border-slate-200/90 hover:border-slate-300'
              : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-all flex items-center justify-center border border-blue-200/80 dark:border-blue-900/60">
            <Send size={17} />
          </div>
          <span className="text-[11px] font-heading font-bold text-slate-900 dark:text-white truncate">Transfer</span>
        </button>

        {/* Request */}
        <button
          id="quick-action-request"
          onClick={() => handleQuickAction('Request')}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-white border-slate-200/90 hover:border-slate-300'
              : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-105 transition-all flex items-center justify-center border border-emerald-200/80 dark:border-emerald-900/60">
            <ArrowDownLeft size={18} />
          </div>
          <span className="text-[11px] font-heading font-bold text-slate-900 dark:text-white truncate">Request</span>
        </button>

        {/* Withdraw */}
        <button
          id="quick-action-withdraw"
          onClick={() => handleQuickAction('Withdraw')}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-white border-slate-200/90 hover:border-slate-300'
              : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 group-hover:scale-105 transition-all flex items-center justify-center border border-purple-200/80 dark:border-purple-900/60">
            <ArrowUpRight size={18} />
          </div>
          <span className="text-[11px] font-heading font-bold text-slate-900 dark:text-white truncate">Withdraw</span>
        </button>

        {/* Refer & Earn */}
        <button
          id="quick-action-refer"
          onClick={() => {
            playTapSound();
            if (onNavigate) onNavigate('referrals');
          }}
          className={`rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group border shadow-2xs cursor-pointer min-h-[44px] ${
            isLightMode
              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
              : 'bg-amber-950/20 border-amber-800/70 hover:border-amber-700'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 group-hover:scale-105 transition-all flex items-center justify-center border border-amber-300 dark:border-amber-700/80">
            <Gift size={18} />
          </div>
          <span className="text-[11px] font-heading font-bold text-amber-800 dark:text-amber-300 truncate">Refer ₦50</span>
        </button>
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

      {/* Integrated Real Transfer Modal */}
      <WalletTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentBalance={realBalance}
        userPhone={user?.phone}
        onTransferSuccess={handleLocalTransferSuccess}
        isLightMode={isLightMode}
        biometricEnabled={user?.biometricEnabled}
        isMaintenanceMode={isMaintenanceMode}
      />

      {/* Integrated Real Bank Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        currentBalance={realBalance}
        userName={user?.name}
        isLightMode={isLightMode}
        onNavigateSupport={onNavigateSupport}
        isMaintenanceMode={isMaintenanceMode}
      />
    </div>
  );
};
