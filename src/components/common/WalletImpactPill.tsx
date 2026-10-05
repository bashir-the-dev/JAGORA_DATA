import React from 'react';
import { Wallet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface WalletImpactPillProps {
  currentBalance: number;
  cost: number;
  onOpenFundWallet?: () => void;
  className?: string;
}

export const WalletImpactPill: React.FC<WalletImpactPillProps> = ({
  currentBalance,
  cost,
  onOpenFundWallet,
  className = '',
}) => {
  const remaining = currentBalance - cost;
  const isSufficient = remaining >= 0;
  const deficit = Math.abs(remaining);

  return (
    <div
      className={`p-3 rounded-xl border text-xs transition-colors ${
        isSufficient
          ? 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
          <Wallet size={12} className="text-[#0047cc] dark:text-blue-400" />
          <span>Wallet Balance Impact</span>
        </div>

        {isSufficient ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 size={10} className="stroke-[3]" />
            <span>Sufficient</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
            <AlertCircle size={10} className="stroke-[3]" />
            <span>Need +₦{deficit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono">
        <div>
          <span className="text-slate-600 dark:text-slate-400 block text-[10px]">Current</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            ₦{currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-slate-600 dark:text-slate-400 block text-[10px]">Charge</span>
          <span className="font-bold text-[#0047cc] dark:text-blue-400">
            -₦{cost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-600 dark:text-slate-400 block text-[10px]">Remaining</span>
          <span
            className={`font-bold ${
              isSufficient
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400 font-extrabold'
            }`}
          >
            ₦{remaining.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {!isSufficient && onOpenFundWallet && (
        <button
          type="button"
          onClick={onOpenFundWallet}
          className="mt-2.5 w-full py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Fund Wallet Now</span>
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
};
