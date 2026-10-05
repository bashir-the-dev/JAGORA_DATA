import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Users,
  TrendingUp,
  Award,
  Wallet,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  HelpCircle,
  Percent,
  Check,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ReferralProgramSettings } from '../../types';
import {
  apiAdminGetReferralSettings,
  apiAdminUpdateReferralSettings,
  apiAdminGetReferralsOverview,
} from '../../services/apiClient';
import { playTapSound, playSuccessChime } from '../../utils/soundEffects';

interface ReferralControlsTabProps {
  isLightMode?: boolean;
  showToast: (msg: string) => void;
  adminProfile?: any;
}

export const ReferralControlsTab: React.FC<ReferralControlsTabProps> = ({
  isLightMode,
  showToast,
  adminProfile,
}) => {
  // Settings Form State
  const [enabled, setEnabled] = useState(true);
  const [hideFromUsers, setHideFromUsers] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('50');
  const [eligibilityDays, setEligibilityDays] = useState('30');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('100');
  const [allowBonusWithdrawal, setAllowBonusWithdrawal] = useState(true);
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState(false);
  const [welcomeBonusAmount, setWelcomeBonusAmount] = useState('0');
  const [termsNotice, setTermsNotice] = useState(
    'Earn instant referral bonus when your referred friend completes their first qualifying purchase within 30 days.'
  );

  // Status & Overview State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [searchLeaderboard, setSearchLeaderboard] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load live settings and overview
  const loadData = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const [settingsRes, overviewRes] = await Promise.all([
        apiAdminGetReferralSettings(),
        apiAdminGetReferralsOverview(),
      ]);

      if (settingsRes.status === 'success' && settingsRes.data) {
        const s = settingsRes.data;
        setEnabled(s.enabled);
        setHideFromUsers(Boolean(s.hideFromUsers));
        setBonusAmount(String(s.bonusAmount ?? 50));
        setEligibilityDays(String(s.eligibilityDays ?? 30));
        setMinPurchaseAmount(String(s.minPurchaseAmount ?? 100));
        setAllowBonusWithdrawal(s.allowBonusWithdrawal ?? true);
        setWelcomeBonusEnabled(Boolean(s.welcomeBonusEnabled));
        setWelcomeBonusAmount(String(s.welcomeBonusAmount ?? 0));
        if (s.termsNotice) setTermsNotice(s.termsNotice);
      }

      if (overviewRes.status === 'success' && overviewRes.data) {
        setOverviewData(overviewRes.data);
      }
      setHasUnsavedChanges(false);
    } catch {
      showToast('⚠️ Could not load latest referral settings.');
    } finally {
      setIsLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFieldChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setHasUnsavedChanges(true);
  };

  const handleToggleProgram = async () => {
    playTapSound();
    const nextState = !enabled;
    setEnabled(nextState);
    setHasUnsavedChanges(true);
  };

  const handleResetDefaults = () => {
    playTapSound();
    setEnabled(true);
    setHideFromUsers(false);
    setBonusAmount('50');
    setEligibilityDays('30');
    setMinPurchaseAmount('100');
    setAllowBonusWithdrawal(true);
    setWelcomeBonusEnabled(false);
    setWelcomeBonusAmount('0');
    setTermsNotice(
      'Earn instant referral bonus when your referred friend completes their first qualifying purchase within 30 days.'
    );
    setHasUnsavedChanges(true);
    showToast('Reset to recommended platform defaults (unsaved).');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playTapSound();

    const numericBonus = parseFloat(bonusAmount);
    const numericDays = parseInt(eligibilityDays, 10);
    const numericMinSpend = parseFloat(minPurchaseAmount);
    const numericWelcome = parseFloat(welcomeBonusAmount);

    if (isNaN(numericBonus) || numericBonus < 0) {
      showToast('⚠️ Please enter a valid non-negative bonus amount.');
      return;
    }

    if (isNaN(numericDays) || numericDays < 0) {
      showToast('⚠️ Eligibility days must be 0 (unlimited) or a positive integer.');
      return;
    }

    if (isNaN(numericMinSpend) || numericMinSpend < 0) {
      showToast('⚠️ Minimum purchase amount must be 0 or a positive number.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<ReferralProgramSettings> = {
        enabled,
        hideFromUsers,
        bonusAmount: numericBonus,
        eligibilityDays: numericDays,
        minPurchaseAmount: numericMinSpend,
        allowBonusWithdrawal,
        welcomeBonusEnabled,
        welcomeBonusAmount: isNaN(numericWelcome) ? 0 : Math.max(0, numericWelcome),
        termsNotice: termsNotice.trim(),
      };

      const res = await apiAdminUpdateReferralSettings(payload);
      if (res.status === 'success') {
        playSuccessChime();
        showToast('✅ Referral system configuration saved successfully!');
        setHasUnsavedChanges(false);
        await loadData();
      } else {
        showToast(res.message || '⚠️ Failed to save referral settings.');
      }
    } catch (err: any) {
      showToast(err.message || '⚠️ Server error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter leaderboard
  const filteredLeaderboard = (overviewData?.leaderboard || []).filter((item: any) => {
    if (!searchLeaderboard.trim()) return true;
    const q = searchLeaderboard.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.phone?.includes(q) ||
      item.referralCode?.toLowerCase().includes(q)
    );
  });

  const summary = overviewData?.summary || {
    totalReferredUsers: 0,
    completedRewardsCount: 0,
    pendingRewardsCount: 0,
    totalBonusPaidOut: 0,
    totalCurrentBonusFloat: 0,
    activeReferrersCount: 0,
    conversionRate: 0,
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner: Master Control Bar */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          enabled
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border-emerald-500/30'
            : 'bg-gradient-to-r from-rose-950/50 via-slate-900 to-amber-950/40 border-rose-500/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                enabled
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-rose-600 shadow-rose-600/30'
              }`}
            >
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-heading tracking-tight text-white">
                  Referral Reward Program
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase flex items-center gap-1 ${
                    enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {enabled ? 'Active & Rewarding' : 'Disabled (Turned Off)'}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase flex items-center gap-1 ${
                    hideFromUsers
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {hideFromUsers ? <EyeOff size={10} /> : <Eye size={10} />}
                  {hideFromUsers ? 'Hidden From Users' : 'Visible to Users'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {hideFromUsers
                  ? 'Referral feature is completely hidden from customer screens, banners, and navigation menus.'
                  : enabled
                  ? 'Referral bonuses are actively distributed to customers on their invites’ qualifying purchases.'
                  : 'Program is turned off. No referral bonuses will be distributed to referrers until re-enabled.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              id="admin-toggle-referral-visibility-btn"
              onClick={() => handleFieldChange(setHideFromUsers, !hideFromUsers)}
              className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl font-heading text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                hideFromUsers
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Shut down feature completely from showing to regular users"
            >
              {hideFromUsers ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hidden from Users</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Hide from Users</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleProgram}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-heading text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                enabled
                  ? 'bg-amber-600/90 hover:bg-amber-600 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {enabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Pause Rewards
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Enable Rewards
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning Callout when Hidden From Users */}
        {hideFromUsers && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs">
            <EyeOff className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="font-bold text-white block">
                Feature Completely Shut Down & Hidden from Users:
              </strong>
              All referral links, banners, quick actions, and code entries are hidden from customer view. Customers cannot access the referral system while this setting is active.
            </div>
          </div>
        )}

        {/* Warning Callout when Turned Off */}
        {!enabled && !hideFromUsers && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="font-bold text-white block">
                Referral reward payouts are paused:
              </strong>
              Customers can still view their invite codes, but transactions completed by their
              referrals will <strong>NOT</strong> generate any bonus payout until you re-enable the
              rewards.
            </div>
          </div>
        )}
      </div>

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Bonus Per Referral */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Active Reward Rate</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            ₦{parseFloat(bonusAmount || '0').toLocaleString('en-NG')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {parseInt(eligibilityDays || '0', 10) > 0
                ? `Valid for ${eligibilityDays} days`
                : 'Unlimited window'}
            </span>
          </div>
        </div>

        {/* Card 2: Total Invited Friends */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Total Referred Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            {summary.totalReferredUsers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{summary.completedRewardsCount} rewarded</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{summary.pendingRewardsCount} pending</span>
          </div>
        </div>

        {/* Card 3: Total Paid Out */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Total Paid to Users</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-amber-400">
            ₦{summary.totalBonusPaidOut.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Conversion: <strong className="text-white">{summary.conversionRate}%</strong>
          </div>
        </div>

        {/* Card 4: Current Bonus Wallet Float */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Bonus Float in Wallets</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-purple-300">
            ₦{summary.totalCurrentBonusFloat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {allowBonusWithdrawal ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Transfers Allowed
              </span>
            ) : (
              <span className="text-rose-400">Transfers Paused</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="font-heading font-black text-base text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Program Rules & Parameter Controls</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize financial payouts, qualifying time windows, and consumer rules.
            </p>
          </div>

          {hasUnsavedChanges && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-bold font-mono self-start sm:self-auto animate-pulse">
              ● Unsaved Changes
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Field 1: Commission Bonus Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Bonus Amount per Referral (₦) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₦
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={bonusAmount}
                onChange={(e) => handleFieldChange(setBonusAmount, e.target.value)}
                placeholder="50"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Credited to referrer's bonus balance upon the invite's first qualifying order.
            </p>
          </div>

          {/* Field 2: Eligibility Window (Days) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Eligibility Period (Days) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="1"
                value={eligibilityDays}
                onChange={(e) => handleFieldChange(setEligibilityDays, e.target.value)}
                placeholder="30"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Customer must purchase within X days of signing up. Set to{' '}
              <strong className="text-white">0</strong> for unlimited/lifetime.
            </p>
          </div>

          {/* Field 3: Minimum Purchase Amount (₦) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Minimum Qualifying Spend (₦) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₦
              </span>
              <input
                type="number"
                min="0"
                step="50"
                value={minPurchaseAmount}
                onChange={(e) => handleFieldChange(setMinPurchaseAmount, e.target.value)}
                placeholder="100"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Minimum purchase amount required before releasing bonus. Set to{' '}
              <strong className="text-white">0</strong> for any amount.
            </p>
          </div>

          {/* Master Kill-Switch: Shut Down & Hide from User Screens */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
            hideFromUsers
              ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
              : 'bg-slate-800/50 border-slate-700/60'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                hideFromUsers ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
              }`}>
                {hideFromUsers ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <span>Shut Down & Hide Feature From Users</span>
                  {hideFromUsers && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Completely removes all referral banners, drawer links, profile buttons, and invite codes from user view.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="admin-hide-referrals-toggle-btn"
              onClick={() => handleFieldChange(setHideFromUsers, !hideFromUsers)}
              className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                hideFromUsers ? 'text-rose-400' : 'text-slate-500'
              }`}
              title="Toggle customer visibility"
            >
              {hideFromUsers ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Field 4: Allow Bonus Wallet Transfers */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Allow Bonus Transfers</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Users can transfer referral bonus to their main wallet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleFieldChange(setAllowBonusWithdrawal, !allowBonusWithdrawal)}
              className={`p-1 rounded-lg transition-colors ${
                allowBonusWithdrawal ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {allowBonusWithdrawal ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Field 5: Welcome Bonus for New Friend */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">New Friend Welcome Bonus</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Reward the invited user on signup with an initial credit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleFieldChange(setWelcomeBonusEnabled, !welcomeBonusEnabled)}
              className={`p-1 rounded-lg transition-colors ${
                welcomeBonusEnabled ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              {welcomeBonusEnabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Field 6: Welcome Bonus Amount if Enabled */}
          {welcomeBonusEnabled && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="block text-xs font-bold text-slate-200">
                Welcome Bonus to New User (₦)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₦
                </span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={welcomeBonusAmount}
                  onChange={(e) => handleFieldChange(setWelcomeBonusAmount, e.target.value)}
                  placeholder="25"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Instantly credited to the friend upon registering with a valid code.
              </p>
            </div>
          )}
        </div>

        {/* Marketing / Terms Notice Textarea */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-bold text-slate-200">
            Terms & Campaign Notice (Shown to Users in App)
          </label>
          <textarea
            rows={2}
            value={termsNotice}
            onChange={(e) => handleFieldChange(setTermsNotice, e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-xs leading-relaxed focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe the referral incentive rules..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Recommended Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-heading text-xs font-extrabold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Referral Controls</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Leaderboard & Recent Payouts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers Leaderboard */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div>
              <h3 className="font-heading font-black text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Top Customer Advocates</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest performing referrers on your platform.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLeaderboard}
                onChange={(e) => setSearchLeaderboard(e.target.value)}
                placeholder="Search referrer..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto grow">
            {filteredLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No customer advocates recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Advocate</th>
                    <th className="py-2 px-2 text-center">Invited</th>
                    <th className="py-2 px-2 text-center">Rewarded</th>
                    <th className="py-2 px-2 text-right">Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredLeaderboard.map((item: any) => {
                    const medal =
                      item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : null;
                    return (
                      <tr key={item.phone} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-400">
                          {medal ? <span className="text-sm">{medal}</span> : `#${item.rank}`}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-white truncate max-w-[130px]">
                            {item.name || 'Customer'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {item.phone} • {item.referralCode}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-300">
                          {item.totalReferred}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.completed}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-400">
                          ₦{item.totalBonusEarned.toLocaleString('en-NG')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Referral Commissions Log */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <div className="mb-4">
            <h3 className="font-heading font-black text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Recent Referral Commissions Paid</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live audit trail of qualifying bonuses credited to user wallets.
            </p>
          </div>

          <div className="overflow-y-auto max-h-[360px] divide-y divide-slate-800/60 grow">
            {(overviewData?.recentRewards || []).length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No recent referral bonuses disbursed yet.
              </div>
            ) : (
              overviewData.recentRewards.map((reward: any) => (
                <div key={reward.id || reward.reference} className="py-2.5 px-1 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white flex items-center gap-1.5 truncate">
                      <span>Recipient: {reward.recipientPhone}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-500/15 text-blue-400">
                        Paid
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {reward.description || `Triggered by customer ${reward.customerPhone || 'purchase'}`}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {reward.date ? new Date(reward.date).toLocaleString() : 'Just now'} • {reward.reference}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-emerald-400 text-sm block">
                      +₦{Number(reward.amount || 50).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
