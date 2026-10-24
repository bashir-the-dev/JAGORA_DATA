import React, { useState } from 'react';
import { Sparkles, Zap, Plus, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

interface WelcomeBackBannerProps {
  userName: string;
  userPhone?: string;
  balance: number;
  onQuickTopUp: () => void;
  onFundWallet: () => void;
  isLightMode?: boolean;
}

export const WelcomeBackBanner: React.FC<WelcomeBackBannerProps> = ({
  userName,
  balance,
  onQuickTopUp,
  onFundWallet,
  isLightMode = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('jagora_welcome_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('jagora_welcome_banner_dismissed', 'true');
    } catch {}
  };

  const displayName = userName?.split(' ')[0] || 'Customer';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${
        isLightMode
          ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-blue-800 text-white shadow-blue-950/10'
          : 'bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-950 border-blue-500/30 text-white shadow-black/40'
      }`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-24 -bottom-8 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Dismiss welcome banner"
        title="Dismiss banner"
      >
        <X size={15} />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pr-6 sm:pr-8">
        {/* Left side: Greeting and balance reminder */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles size={11} className="text-amber-300" />
              <span>Welcome Back</span>
            </span>
            <span className="text-[11px] text-slate-300 font-mono hidden sm:inline">
              ⚡ 24/7 Instant Automated Switch
            </span>
          </div>

          <h3 className="font-heading text-base sm:text-lg font-black tracking-tight text-white">
            Ready to vend today, {displayName}?
          </h3>

          <p className="text-xs text-slate-300/90 leading-relaxed max-w-md">
            Your wallet balance is{' '}
            <strong className="text-emerald-300 font-mono font-bold">
              ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </strong>
            . Enjoy discounted SME &amp; Direct bundles dispatched in seconds.
          </p>
        </div>

        {/* Right side: Quick Action Buttons */}
        <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              triggerHaptic('medium');
              onQuickTopUp();
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Zap size={15} className="fill-slate-950 stroke-[2.5]" />
            <span>Quick Top Up</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              triggerHaptic('light');
              onFundWallet();
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span className="hidden xs:inline">Fund</span>
          </button>
        </div>
      </div>
    </div>
  );
};
