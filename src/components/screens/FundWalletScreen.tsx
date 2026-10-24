import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Copy,
  Check,
  Building2,
  HelpCircle,
  Clock,
  ArrowRight,
  Info,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { playTapSound, triggerHaptic, playSuccessChime } from '../../utils/soundEffects';
import { apiGenerateVirtualAccounts } from '../../services/apiClient';

interface FundWalletScreenProps {
  virtualAccounts?: Array<{ bank_name: string; account_number: string; account_name: string }>;
  isLightMode?: boolean;
  onNavigateBack?: () => void;
  onNavigateSupport?: () => void;
  isMaintenanceMode?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export const FundWalletScreen: React.FC<FundWalletScreenProps> = ({
  virtualAccounts: userVirtualAccounts,
  isLightMode,
  onNavigateSupport,
  isMaintenanceMode,
  onRefresh,
}) => {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    playTapSound();
    triggerHaptic('medium');
    try {
      const res = await apiGenerateVirtualAccounts();
      if (res.status === 'success' || res.data) {
        playSuccessChime();
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        setGenerateError(res.message || 'Could not generate account numbers. Please try again.');
      }
    } catch (e: any) {
      setGenerateError(e?.message || 'Server connection error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeAccounts =
    userVirtualAccounts && Array.isArray(userVirtualAccounts) && userVirtualAccounts.length > 0
      ? userVirtualAccounts
      : [];

  const handleCopy = (num: string, bank: string) => {
    navigator.clipboard.writeText(num);
    playTapSound();
    triggerHaptic('light');
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 3000);
  };

  return (
    <div id="screen-fund-wallet" className="px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
      {/* 1. Header Banner: 0% Fee & Instant Auto-Credit */}
      <section className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-[#0047cc] to-blue-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-emerald-300 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-sm font-heading font-bold tracking-tight">Dedicated Virtual Accounts</h2>
              <p className="text-[11px] text-blue-100/90 font-medium">Automated 24/7 Deposit Switch</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full shrink-0">
            0% Surcharge
          </span>
        </div>
      </section>

      {/* Maintenance Notice */}
      {isMaintenanceMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-bold">Maintenance Notice:</span> Virtual funding switch is operating under scheduled maintenance. Bank deposits to your dedicated accounts are monitored and will settle into your wallet immediately as the gateway cycle finishes.
          </div>
        </div>
      )}

      {/* 2. Virtual Account Numbers or Pending Safeguard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Your Dedicated Bank Accounts
          </h3>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {activeAccounts.length > 0 ? 'Instant Credit' : 'Zero-Dummy Guard'}
          </span>
        </div>

        {activeAccounts.length === 0 ? (
          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1322] space-y-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <ShieldCheck size={22} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-heading">
                    Virtual Bank Accounts Pending
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0047cc] dark:text-blue-400 border border-blue-500/20">
                    Protected
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                  Real dedicated accounts are issued directly via XIXAPAY (PalmPay & Kolomoni MFB) with 0% fees and no BVN or NIN needed.
                </p>
              </div>
            </div>

            {/* Instant Account Generation CTA Button */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0047cc] to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-white" />
                    <span>Activating Real Bank Accounts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-amber-300 fill-amber-300" />
                    <span>⚡ Get My Account Numbers (Instant - No BVN/NIN)</span>
                  </>
                )}
              </button>

              {generateError && (
                <p className="text-xs text-rose-500 font-medium text-center">{generateError}</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info size={14} className="text-[#0047cc] dark:text-blue-400 shrink-0" />
                <span>Alternative Instant Funding:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Contact our verified AJDATASUB Customer Support for direct manual transfer verification, or wait for automated gateway KYC activation.
              </p>
            </div>

            {onNavigateSupport && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigateSupport();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] text-white text-xs font-heading font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95"
              >
                <span>Contact Support for Instant Funding</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeAccounts.map((acc, i) => {
              const bankName = (acc as any).bank_name || (acc as any).bank || 'Virtual Bank';
              const accNum = (acc as any).account_number || (acc as any).number || '0000000000';
              const accHolder = (acc as any).account_name || (acc as any).name || "AJDATASUB";
              const isCopied = copiedBank === bankName;

              return (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border transition-all shadow-2xs ${
                    isCopied
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : isLightMode
                      ? 'bg-white border-slate-200/90 hover:border-blue-300'
                      : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
                        <Building2 size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-heading font-bold text-slate-900 dark:text-slate-100 truncate">
                        {bankName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                      24/7 Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-[#0047cc] dark:text-blue-400 select-all">
                        {accNum}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Account Name: <span className="font-semibold text-slate-700 dark:text-slate-200">{accHolder}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(accNum, bankName)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#0047cc] hover:bg-[#003eb8] text-white shadow-xs'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} className="stroke-[3]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Simple & Professional Transfer Guide (Replaces complex verification) */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Info size={16} className="stroke-[2.5]" />
          </div>
          <h3 className="font-heading text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            How to Fund Your Wallet
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <div className="w-6 h-6 rounded-full bg-[#0047cc] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Copy Any Account Number Above</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Choose any of your dedicated virtual accounts (Wema, Sterling, or PalmPay) and tap <strong className="text-slate-800 dark:text-slate-200">Copy</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <div className="w-6 h-6 rounded-full bg-[#0047cc] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Send Money From Any Banking App</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Open your preferred bank app (OPay, PalmPay, Kuda, GTBank, Zenith, Access, etc.) and make a normal bank transfer of any amount to that account.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Automatic Wallet Credit (Under 60 Seconds)</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                No manual receipt uploading or verification is required. Your payment is automatically recognized by the banking switch and credited to your wallet balance instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Helpful Tips Callout */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-blue-500" />
            <span>Average settlement: <strong>10 to 45 seconds</strong></span>
          </div>
          {onNavigateSupport && (
            <button
              type="button"
              onClick={onNavigateSupport}
              className="text-[#0047cc] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={13} />
              <span>Need help?</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
