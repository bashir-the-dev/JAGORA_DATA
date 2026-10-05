import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Wallet,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  HelpCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, ScreenType, ReferralData, ReferralItem } from '../../types';
import { apiGetReferrals, apiTransferBonus } from '../../services/apiClient';
import { playTapSound, playSuccessChime, triggerHaptic } from '../../utils/soundEffects';

interface ReferralsScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  isLightMode?: boolean;
  isReferralsHidden?: boolean;
}

export const ReferralsScreen: React.FC<ReferralsScreenProps> = ({
  user,
  onNavigate,
  onUpdateUser,
  isLightMode = true,
  isReferralsHidden = false,
}) => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Fallback referral code if network is slow
  const activeReferralCode = useMemo(() => {
    return referralData?.referralCode || user.referralCode || `AJD${(user.phone || '9999').slice(-4).toUpperCase()}`;
  }, [referralData?.referralCode, user.referralCode, user.phone]);

  const activeReferralLink = useMemo(() => {
    if (referralData?.referralLink) return referralData.referralLink;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alaminjagora.ng';
    return `${origin}/register?ref=${encodeURIComponent(activeReferralCode)}`;
  }, [referralData?.referralLink, activeReferralCode]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await apiGetReferrals();
      if (res.status === 'success' && res.data) {
        setReferralData(res.data);
        if (res.data.stats?.bonusBalance !== undefined && onUpdateUser) {
          onUpdateUser({
            bonusBalance: res.data.stats.bonusBalance,
            referralCode: res.data.referralCode,
          });
        }
      }
    } catch {
      // Fallback in case of temporary offline state
    } finally {
      setIsLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = () => {
    playTapSound();
    triggerHaptic('light');
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(activeReferralCode).catch(() => {});
    }
    setCopiedCode(true);
    setActionAlert({ message: `Referral code "${activeReferralCode}" copied!`, type: 'success' });
    setTimeout(() => {
      setCopiedCode(false);
      setActionAlert(null);
    }, 2500);
  };

  const handleCopyLink = () => {
    playTapSound();
    triggerHaptic('light');
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(activeReferralLink).catch(() => {});
    }
    setCopiedLink(true);
    setActionAlert({ message: 'Referral link copied to clipboard! Share with friends.', type: 'success' });
    setTimeout(() => {
      setCopiedLink(false);
      setActionAlert(null);
    }, 2500);
  };

  const shareText = `Hey! I use Al'amin Jagora Data for instant, cheapest SME & Corporate data bundles, airtime, and utility bills. Sign up using my link to get started: ${activeReferralLink}`;

  const handleWhatsAppShare = () => {
    playTapSound();
    triggerHaptic('medium');
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
  };

  const handleNativeShare = async () => {
    playTapSound();
    triggerHaptic('medium');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: "Join Al'amin Jagora Data",
          text: "Get cheapest data bundles & 24/7 VTU services in Nigeria!",
          url: activeReferralLink,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const currentBonusBalance = typeof user.bonusBalance === 'number'
    ? user.bonusBalance
    : (referralData?.stats.bonusBalance ?? 0);

  const handleOpenTransferModal = () => {
    playTapSound();
    triggerHaptic('light');
    setTransferAmount(currentBonusBalance > 0 ? String(currentBonusBalance) : '');
    setTransferError('');
    setIsTransferModalOpen(true);
  };

  const handleTransferBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    const amt = parseFloat(transferAmount);

    if (isNaN(amt) || amt <= 0) {
      setTransferError('Please enter a valid amount greater than ₦0.00');
      return;
    }

    if (amt > currentBonusBalance) {
      setTransferError(`Insufficient bonus balance. Available: ₦${currentBonusBalance.toFixed(2)}`);
      return;
    }

    setIsSubmittingTransfer(true);
    playTapSound();

    try {
      const res = await apiTransferBonus(amt);
      if (res.status === 'success' && res.data) {
        playSuccessChime();
        triggerHaptic('success');
        setIsTransferModalOpen(false);
        setActionAlert({
          message: `₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })} transferred from Bonus to Main Wallet!`,
          type: 'success',
        });
        if (onUpdateUser) {
          onUpdateUser({
            balance: res.data.balance,
            bonusBalance: res.data.bonusBalance,
          });
        }
        await loadData();
      } else {
        setTransferError(res.message || 'Transfer could not be processed. Please try again.');
      }
    } catch (err: any) {
      setTransferError(err?.message || 'Failed to connect to wallet server.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const program = referralData?.programSettings;
  const isProgramEnabled = program?.enabled ?? true;
  const bonusAmount = program?.bonusAmount ?? referralData?.stats?.commissionPerReferral ?? 50;
  const eligibilityDays = program?.eligibilityDays ?? 30;
  const minPurchase = program?.minPurchaseAmount ?? 100;
  const allowBonusWithdrawal = program?.allowBonusWithdrawal ?? true;

  const stats = referralData?.stats || {
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    bonusEarned: 0,
    bonusBalance: currentBonusBalance,
    commissionPerReferral: bonusAmount,
  };

  const referralsList: ReferralItem[] = referralData?.referrals || [];

  if (isReferralsHidden || referralData?.programSettings?.hideFromUsers) {
    return (
      <div id="screen-referrals" className="px-4 py-16 max-w-md mx-auto text-center space-y-4 animate-screen-enter">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
          <Gift size={28} />
        </div>
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
          Referral Program Closed
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The affiliate and referral rewards program is currently offline by administration. Please check back later or continue using our fast data and bill recharge services.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onNavigate('home');
            }}
            className="px-6 py-2.5 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="screen-referrals"
      className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full overflow-x-hidden animate-screen-enter"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="referrals-back-btn"
            type="button"
            onClick={() => {
              playTapSound();
              onNavigate('home');
            }}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Refer & Earn</span>
              {isProgramEnabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-blue-950">
                  ₦{bonusAmount} Bonus
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Paused
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Invite friends and earn instant cash commission on their first transaction
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title="Refresh referrals data"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-[#0047cc]' : ''} />
        </button>
      </div>

      {/* Program Paused Banner */}
      {!isProgramEnabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <strong className="font-bold text-slate-900 dark:text-white block">
              Referral Program Currently Paused
            </strong>
            The referral rewards campaign is temporarily paused by administration. You can still transfer existing bonus balances to your main wallet.
          </div>
        </div>
      )}

      {/* Floating Action Alert */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all animate-in fade-in duration-200 shadow-sm ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : actionAlert.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300'
              : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={16} />}
            <span>{actionAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO COMMISSION CARD */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#061838] via-[#082255] to-[#0047cc] text-white p-5 sm:p-7 shadow-xl border border-blue-500/20">
        {/* Kano Star Decorative Watermark */}
        <div className="absolute top-0 right-0 w-44 h-44 opacity-15 pointer-events-none translate-x-8 -translate-y-8">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full text-amber-300">
            <polygon points="50,5 63,38 95,38 69,57 79,90 50,70 21,90 31,57 5,38 37,38" strokeWidth="1.2" />
            <polygon points="50,15 60,40 85,40 65,55 72,80 50,65 28,80 35,55 15,40 40,40" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="35" strokeWidth="0.7" />
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30">
              <Gift size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10.5px] font-mono font-bold tracking-widest text-amber-300 uppercase block">
                SPECIAL INCENTIVE PROGRAM
              </span>
              <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight text-white leading-tight">
                Earn ₦{bonusAmount} Instant Bonus per Referral
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal max-w-lg">
            Share your unique invite link with friends, colleagues, and family. When they register and make their qualifying purchase{eligibilityDays > 0 ? ` within ${eligibilityDays} days` : ''}, <strong>₦{Number(bonusAmount).toFixed(2)} is credited straight to your bonus wallet</strong> automatically!
          </p>

          {/* Quick Bonus Balance Strip inside Hero */}
          <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-medium text-blue-200/80 block">Current Bonus Balance</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                ₦{currentBonusBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              id="hero-transfer-bonus-btn"
              type="button"
              onClick={handleOpenTransferModal}
              disabled={currentBonusBalance <= 0}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-heading text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                currentBonusBalance > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-blue-950 border border-amber-300'
                  : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/5'
              }`}
            >
              <Wallet size={15} />
              <span>Convert to Main Wallet</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. REFERRAL LINK & CODE SHARING BOX */}
      {/* ========================================================================= */}
      <section
        className={`rounded-2xl p-4 sm:p-5 border shadow-xs space-y-4 ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#0047cc] dark:text-blue-400" />
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Your Unique Referral Link & Code
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
            Active
          </span>
        </div>

        {/* Unique Referral Code Badge */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLightMode ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Unique Referral Code
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-[#0047cc] dark:text-blue-400 mt-0.5 block">
              {activeReferralCode}
            </span>
          </div>

          <button
            id="copy-referral-code-btn"
            type="button"
            onClick={handleCopyCode}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              copiedCode
                ? 'bg-emerald-500 text-white shadow-xs'
                : isLightMode
                ? 'bg-[#0047cc] hover:bg-blue-700 text-white shadow-xs'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copiedCode ? <Check size={16} className="stroke-[3]" /> : <Copy size={16} />}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Full Link Input & Copy */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
            Shareable Referral Link
          </label>
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 flex items-center px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium truncate select-all ${
                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <span className="truncate">{activeReferralLink}</span>
            </div>
            <button
              id="copy-referral-link-btn"
              type="button"
              onClick={handleCopyLink}
              title="Copy referral link"
              className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 ${
                copiedLink
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {copiedLink ? <Check size={16} className="stroke-[3]" /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="share-whatsapp-btn"
            type="button"
            onClick={handleWhatsAppShare}
            className="min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <MessageCircle size={16} />
            <span>Share to WhatsApp</span>
          </button>

          <button
            id="share-native-btn"
            type="button"
            onClick={handleNativeShare}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl font-heading text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
            }`}
          >
            <Share2 size={16} />
            <span>Share with Apps</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PERFORMANCE STATS GRID */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <h3 className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
          Referral Performance & Earnings
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Total Invited */}
          <div
            className={`p-3.5 rounded-2xl border shadow-2xs space-y-1 ${
              isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <Users size={16} />
              <span className="text-[10px] font-mono font-bold">Total</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
              {stats.totalReferrals}
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Friends Joined
            </span>
          </div>

          {/* Card 2: Completed / Active */}
          <div
            className={`p-3.5 rounded-2xl border shadow-2xs space-y-1 ${
              isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-mono font-bold">1st Tx Done</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400">
              {stats.completedReferrals}
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Commission Paid
            </span>
          </div>

          {/* Card 3: Total Bonus Earned */}
          <div
            className={`p-3.5 rounded-2xl border shadow-2xs space-y-1 ${
              isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-amber-500">
              <TrendingUp size={16} />
              <span className="text-[10px] font-mono font-bold">Earned</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-amber-600 dark:text-amber-400">
              ₦{stats.bonusEarned.toLocaleString('en-NG')}
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Lifetime Bonus
            </span>
          </div>

          {/* Card 4: Pending Referrals */}
          <div
            className={`p-3.5 rounded-2xl border shadow-2xs space-y-1 ${
              isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <Clock size={16} />
              <span className="text-[10px] font-mono font-bold">Pending</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-slate-700 dark:text-slate-300">
              {stats.pendingReferrals}
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Awaiting 1st purchase
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. 3-STEP "HOW IT WORKS" GUIDE */}
      {/* ========================================================================= */}
      <section
        className={`rounded-2xl p-4 sm:p-5 border shadow-xs space-y-3.5 ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            How The Referral System Works
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div
            className={`p-3 rounded-xl border flex sm:flex-col items-center sm:items-start gap-3 ${
              isLightMode ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#0047cc] text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
                Share Invite Link
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Send your unique code or link to friends via WhatsApp or social media.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3 rounded-xl border flex sm:flex-col items-center sm:items-start gap-3 ${
              isLightMode ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#0047cc] text-white font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
                Friend Signs Up
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                They open the link and create their free account with your referral code attached.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3 rounded-xl border flex sm:flex-col items-center sm:items-start gap-3 ${
              isLightMode ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
                Earn ₦{bonusAmount} Bonus
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                When they buy data, airtime, or bills{minPurchase > 0 ? ` (min. ₦${minPurchase})` : ''}{eligibilityDays > 0 ? ` within ${eligibilityDays} days` : ''}, you receive ₦{bonusAmount} bonus immediately!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. REFERRED FRIENDS LEDGER / ACTIVITY */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Users size={13} />
            <span>Invited Friends Ledger ({referralsList.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {stats.completedReferrals} rewarded
          </span>
        </div>

        {referralsList.length === 0 ? (
          <div
            className={`rounded-2xl p-8 border text-center space-y-3 ${
              isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Gift size={26} />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-slate-200">
                No referrals yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Be the first to introduce friends to Al'amin Jagora Data! Tap "Share to WhatsApp" or copy your referral link above.
              </p>
            </div>
            <button
              id="empty-state-share-btn"
              type="button"
              onClick={handleWhatsAppShare}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-heading text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <MessageCircle size={15} />
              <span>Share Invite Link</span>
            </button>
          </div>
        ) : (
          <div
            className={`rounded-2xl border divide-y overflow-hidden shadow-xs ${
              isLightMode
                ? 'bg-white border-slate-200 divide-slate-100'
                : 'bg-slate-900 border-slate-800 divide-slate-800'
            }`}
          >
            {referralsList.map((item) => {
              const isCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>

                    <div className="min-w-0">
                      <h5 className="font-heading text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <span>{item.phone}</span>
                        <span>•</span>
                        <span>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isCompleted ? (
                      <div>
                        <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                          +₦{item.bonusEarned.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                          Bonus Paid
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full inline-block">
                          Pending 1st Purchase
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                          ₦{bonusAmount} on order
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. BONUS TO MAIN WALLET TRANSFER MODAL */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border space-y-5 animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold">Transfer Bonus to Main Wallet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instantly spend your earnings on data & bills
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isLightMode ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Available Bonus
                </span>
                <span className="text-lg font-black font-mono text-amber-500">
                  ₦{currentBonusBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTransferAmount(String(currentBonusBalance))}
                className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer"
              >
                Transfer All
              </button>
            </div>

            <form onSubmit={handleTransferBonusSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Amount to Transfer (₦)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-slate-400 pointer-events-none text-base">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={currentBonusBalance}
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="e.g. 50"
                    className={`w-full border rounded-2xl py-3 pl-9 pr-4 text-base font-mono font-bold focus:outline-none focus:border-[#0047cc] focus:ring-2 focus:ring-[#0047cc]/20 transition-all ${
                      isLightMode
                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer || currentBonusBalance <= 0}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#0047cc] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTransfer ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={15} className="stroke-[3]" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
