import React, { useState } from 'react';
import { ApiProvider, AdminPlatformWallet } from '../../types';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Building,
  DollarSign,
  X,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Users,
  RefreshCw,
  Sliders,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

interface WalletBalancesTabProps {
  platformWallet: AdminPlatformWallet;
  providers: ApiProvider[];
  onRefreshGatewayBalances?: () => void;
  isRefreshingGateways?: boolean;
  isLightMode?: boolean;
  onNavigateToUsers?: () => void;
}

export const WalletBalancesTab: React.FC<WalletBalancesTabProps> = ({
  platformWallet,
  providers,
  onRefreshGatewayBalances,
  isRefreshingGateways = false,
  isLightMode,
  onNavigateToUsers,
}) => {
  // Provider Funding Modal State (Official Bank Details / Portal Link)
  const [selectedProviderForFunding, setSelectedProviderForFunding] = useState<ApiProvider | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Low float threshold setting
  const [floatThreshold, setFloatThreshold] = useState<number>(50000);

  // Total float calculation
  const totalVendorFloatCalculated = providers.reduce((sum, p) => sum + (p.floatBalance || 0), 0);
  const effectiveVendorFloat = platformWallet.totalVendorFloat || totalVendorFloatCalculated;
  const netLiquiditySurplus = effectiveVendorFloat - platformWallet.totalUserWallets;
  const isHealthyCoverage = platformWallet.reserveRatio >= 0.8 || netLiquiditySurplus >= 0;

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    playTapSound();
    triggerHaptic('light');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div id="admin-wallet-balances-tab" className="space-y-6 pb-16">
      {/* 1. AGGREGATE PLATFORM LIQUIDITY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* User Wallets Total (Customer Liabilities) */}
        <div
          className={`p-5 sm:p-6 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm'
              : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total User Wallets
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
                <Wallet size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white truncate">
              ₦{platformWallet.totalUserWallets.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Customer liabilities</span>
            {onNavigateToUsers && (
              <button
                onClick={onNavigateToUsers}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Accounts</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Vendor Float Reserves */}
        <div
          className={`p-5 sm:p-6 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm'
              : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Upstream Float Reserves
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Building size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              ₦{effectiveVendorFloat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span
              className={`px-2 py-0.5 rounded-full font-bold font-sans tabular-nums text-[11px] border ${
                isHealthyCoverage
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
              }`}
            >
              {(platformWallet.reserveRatio * 100).toFixed(1)}%
            </span>
            <span>coverage ratio</span>
          </div>
        </div>

        {/* Today's Gross Sales Volume */}
        <div
          className={`p-5 sm:p-6 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm'
              : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Today's Gross Sales
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white truncate">
              ₦{platformWallet.todaySalesVolume.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ArrowUpRight size={14} />
            <span className="font-sans tabular-nums">{platformWallet.todayTxCount} orders processed</span>
          </div>
        </div>

        {/* Today's Gross Net Profit */}
        <div
          className={`p-5 sm:p-6 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm'
              : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Today's Net Profit
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-amber-600 dark:text-amber-400 truncate">
              ₦{platformWallet.todayGrossProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Avg margin: ~7.8% on SME Data</span>
          </div>
        </div>
      </div>

      {/* 2. UPSTREAM API PROVIDER FLOAT BALANCES */}
      <div
        className={`p-5 sm:p-6 rounded-xl border transition-all ${
          isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Live Upstream Gateway Float Balances
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70">
                {providers.length} Gateways
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Available balance queried directly from wholesale aggregator wallets via authenticated REST API
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshGatewayBalances && (
              <button
                type="button"
                onClick={onRefreshGatewayBalances}
                disabled={isRefreshingGateways}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0047cc] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
              >
                <RefreshCw size={14} className={isRefreshingGateways ? 'animate-spin' : ''} />
                <span>{isRefreshingGateways ? 'Querying Upstream APIs...' : 'Query Live Balances'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => {
            const isLowFloat = p.floatBalance < floatThreshold && p.status === 'active';
            const isUnconfigured = p.status === 'unconfigured';
            const floatPercent = effectiveVendorFloat > 0 ? (p.floatBalance / effectiveVendorFloat) * 100 : 0;

            return (
              <div
                key={p.id}
                className={`p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between h-full ${
                  isLowFloat
                    ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20'
                    : isUnconfigured
                    ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40 opacity-85'
                    : isLightMode
                    ? 'border-slate-200/80 bg-white hover:border-slate-300 shadow-xs'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center font-bold text-xs font-sans">
                        {p.badge}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans tabular-nums font-medium">
                          {p.avgLatencyMs ? `${p.avgLatencyMs}ms latency` : 'Standby'} • {p.maskedApiKey || 'Linked'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-normal flex items-center gap-1.5 border ${
                        p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                          : p.status === 'unconfigured'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'active' ? 'bg-emerald-500' : p.status === 'unconfigured' ? 'bg-slate-400' : 'bg-amber-500'
                        }`}
                      ></span>
                      <span className="capitalize">{p.status === 'unconfigured' ? 'Standby / Unlinked' : p.status}</span>
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      <span>Available Float (API)</span>
                      <span className="font-sans tabular-nums text-slate-600 dark:text-slate-300 font-semibold">
                        {p.status === 'active' ? `${floatPercent.toFixed(1)}% of reserves` : '0%'}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white">
                      ₦{p.floatBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>

                    {/* Mini Float Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLowFloat ? 'bg-amber-500' : 'bg-[#0047cc]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(p.status === 'active' ? 5 : 0, floatPercent))}%` }}
                      />
                    </div>
                  </div>

                  {isLowFloat && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium bg-amber-50/80 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Low float warning: Under ₦{floatThreshold.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Card footer: Funding Instructions & Portal link */}
                <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium truncate">
                    {p.lastPingTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedProviderForFunding(p)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0047cc] dark:text-blue-400 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span>Fund Gateway</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TREASURY LIQUIDITY DISTRIBUTION & HEALTH SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Float Distribution Breakdown */}
        <div
          className={`lg:col-span-2 p-5 sm:p-6 rounded-xl border transition-all ${
            isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white">
                Reserve Distribution by Upstream Provider
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proportion of telecom float allocated across wholesale fulfillment endpoints
              </p>
            </div>
            <div className="text-xs font-sans tabular-nums font-bold text-slate-700 dark:text-slate-300">
              Total: ₦{effectiveVendorFloat.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
            </div>
          </div>

          <div className="space-y-3">
            {providers.map((p) => {
              const pct = effectiveVendorFloat > 0 ? (p.floatBalance / effectiveVendorFloat) * 100 : 0;
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.name}
                    </span>
                    <span className="font-sans tabular-nums text-slate-600 dark:text-slate-400">
                      ₦{p.floatBalance.toLocaleString()} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-[#0047cc] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Treasury Health & Customer Link Card */}
        <div
          className={`p-5 sm:p-6 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Treasury Solvency Status
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{isHealthyCoverage ? 'Fully Backed & Solvent' : 'Low Float Buffer'}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between items-center">
                <span>Vendor Float:</span>
                <span className="font-sans tabular-nums font-bold text-slate-900 dark:text-white">
                  ₦{effectiveVendorFloat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Customer Liabilities:</span>
                <span className="font-sans tabular-nums font-bold text-slate-900 dark:text-white">
                  ₦{platformWallet.totalUserWallets.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold">Net Float Buffer:</span>
                <span className={`font-sans tabular-nums font-bold ${netLiquiditySurplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {netLiquiditySurplus >= 0 ? '+' : ''}₦{netLiquiditySurplus.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {onNavigateToUsers && (
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onNavigateToUsers}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                <Users size={14} className="text-[#0047cc] dark:text-blue-400" />
                <span>Manage Customer Accounts</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OFFICIAL UPSTREAM GATEWAY FUNDING MODAL */}
      {selectedProviderForFunding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center font-bold text-xs font-sans">
                  {selectedProviderForFunding.badge}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Fund Upstream Float
                  </h4>
                  <span className="text-[11px] text-slate-400 block">
                    {selectedProviderForFunding.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProviderForFunding(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <Info size={17} className="shrink-0 text-[#0047cc] dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-bold">Real Upstream Deposit Notice</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
                    Upstream gateway float cannot be credited artificially. Deposit funds directly to your merchant funding account on the provider's platform, and your balance will automatically update here via API.
                  </p>
                </div>
              </div>

              {/* Current Live Balance */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Live Balance:</span>
                <span className="font-bold font-sans tabular-nums text-sm text-slate-900 dark:text-white">
                  ₦{selectedProviderForFunding.floatBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Funding Bank Details */}
              {selectedProviderForFunding.fundingAccount ? (
                <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Merchant Funding Account
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Bank Name:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedProviderForFunding.fundingAccount.bankName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {selectedProviderForFunding.fundingAccount.accountNumber}
                      </span>
                      {selectedProviderForFunding.fundingAccount.accountNumber.length > 5 && !selectedProviderForFunding.fundingAccount.accountNumber.includes('Available') && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedProviderForFunding.fundingAccount!.accountNumber, 'acc')}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          {copiedField === 'acc' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedProviderForFunding.fundingAccount.accountName}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 mt-2">
                    {selectedProviderForFunding.fundingAccount.instructions}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
                  Log in to your wholesale gateway dashboard to fund your automated float account.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProviderForFunding(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>

                {selectedProviderForFunding.fundingAccount?.portalUrl && (
                  <a
                    href={selectedProviderForFunding.fundingAccount.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Provider Portal</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
