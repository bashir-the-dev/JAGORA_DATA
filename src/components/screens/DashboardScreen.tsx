import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScreenType, Transaction, UserProfile, DataPlan } from '../../types';
import { dataPlans } from '../../data/mockData';
import {
  Wifi,
  Smartphone,
  Tv,
  Zap,
  GraduationCap,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  Eye,
  EyeOff,
  Plus,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Megaphone,
  X,
  Headphones,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Send,
  History,
  Wallet,
  Bolt,
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Gift,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { playTapSound, triggerHaptic, playSuccessChime, triggerConfetti } from '../../utils/soundEffects';
import { Skeleton, TransactionItemSkeleton } from '../common/Skeleton';
import { useSystemStatus } from '../../context/SystemStatusContext';
import { apiGenerateVirtualAccounts, apiGetVtuPlans } from '../../services/apiClient';
import { isGenericCustomerName, deduplicateTransactions } from '../../services/dbService';

interface DashboardScreenProps {
  user: UserProfile;
  transactions: Transaction[];
  onNavigate: (screen: ScreenType) => void;
  onOpenFundWallet: () => void;
  onOpenBuyAirtime: () => void;
  onOpenRechargePin?: () => void;
  onOpenDataCard?: () => void;
  onOpenCableTv?: () => void;
  onOpenElectricity?: () => void;
  onOpenExamPin?: () => void;
  onOpenMoreServices: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenHelp?: () => void;
  isLightMode?: boolean;
  broadcastAnnouncement?: { text: string; active: boolean; type: 'info' | 'warning' | 'urgent' };
  isMaintenanceMode?: boolean;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
  isReferralsHidden?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  transactions,
  onNavigate,
  onOpenFundWallet,
  onOpenBuyAirtime,
  onOpenRechargePin,
  onOpenDataCard,
  onOpenCableTv,
  onOpenElectricity,
  onOpenExamPin,
  onOpenMoreServices,
  onSelectTransaction,
  onOpenHelp,
  isLightMode,
  broadcastAnnouncement,
  isMaintenanceMode,
  onRefresh,
  isLoading = false,
  isReferralsHidden = false,
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(() => {
    try {
      const dismissedText = localStorage.getItem('jagora_dismissed_announcement_text');
      return Boolean(dismissedText && broadcastAnnouncement?.text && dismissedText === broadcastAnnouncement.text);
    } catch {
      return false;
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingAccounts, setIsGeneratingAccounts] = useState(false);
  const [genAccountSuccess, setGenAccountSuccess] = useState(false);
  const { isOnline, latencyMs, syncState, lastSyncedTime, triggerSync, setIsStatusModalOpen } = useSystemStatus();

  const handleGenerateVirtualAccounts = async () => {
    if (isGeneratingAccounts) return;
    setIsGeneratingAccounts(true);
    playTapSound();
    triggerHaptic('medium');
    try {
      const res = await apiGenerateVirtualAccounts();
      if (res.status === 'success' || res.data) {
        setGenAccountSuccess(true);
        playSuccessChime();
        triggerConfetti();
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsGeneratingAccounts(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || syncState === 'syncing') return;
    setIsRefreshing(true);
    playTapSound();
    triggerHaptic('light');
    try {
      await triggerSync(async () => {
        if (onRefresh) {
          await onRefresh();
        } else {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      });
      playSuccessChime();
    } catch {
      // silent
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    try {
      const dismissedText = localStorage.getItem('jagora_dismissed_announcement_text');
      if (broadcastAnnouncement?.text && dismissedText === broadcastAnnouncement.text) {
        setIsAnnouncementDismissed(true);
      } else {
        setIsAnnouncementDismissed(false);
      }
    } catch {
      setIsAnnouncementDismissed(false);
    }
  }, [broadcastAnnouncement?.text]);

  const virtualAccountsList = useMemo(() => {
    if (user?.virtualAccounts && Array.isArray(user.virtualAccounts) && user.virtualAccounts.length > 0) {
      return user.virtualAccounts;
    }
    return [];
  }, [user?.virtualAccounts]);

  const [selectedVirtualAccIndex, setSelectedVirtualAccIndex] = useState(0);
  const activeVirtualAcc = virtualAccountsList[selectedVirtualAccIndex] || virtualAccountsList[0] || null;

  const handleCopyVirtualAccount = (accountNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(accountNumber).catch(() => {});
    }
    playTapSound();
    triggerHaptic('light');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2200);
  };

  // Recent 5 transactions for scannable ledger (strictly deduplicated)
  const recentTransactions = useMemo(() => {
    return deduplicateTransactions(transactions).slice(0, 5);
  }, [transactions]);

  // Frequent Purchases derived dynamically from real ledger transactions
  const frequentRecharges = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      phone: string;
      network: 'mtn' | 'airtel' | 'glo' | '9mobile';
      lastService: string;
      amount: number;
      type: 'data' | 'airtime';
    }> = [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return list;
    }

    const seenPhones = new Set<string>();

    for (const tx of transactions) {
      if (list.length >= 4) break;
      const lower = (tx.title + ' ' + (tx.subtitle || '')).toLowerCase();
      const isAirtime = tx.category === 'airtime' || lower.includes('airtime');
      const isData = tx.category === 'data' || lower.includes('data');
      if (!isAirtime && !isData) continue;

      const phoneMatch = (tx.recipient || tx.subtitle || tx.title || '').match(/0[789][01]\d{8}/);
      const phone = phoneMatch ? phoneMatch[0] : (tx.recipient && /^0[789][01]\d{8}$/.test(tx.recipient) ? tx.recipient : null);
      if (phone && !seenPhones.has(phone)) {
        seenPhones.add(phone);
        let network: 'mtn' | 'airtel' | 'glo' | '9mobile' = 'mtn';
        if (lower.includes('airtel')) network = 'airtel';
        else if (lower.includes('glo')) network = 'glo';
        else if (lower.includes('9mobile') || lower.includes('etisalat')) network = '9mobile';

        const isUserSelf = user?.phone && (phone === user.phone || phone.replace(/\D/g, '').endsWith(user.phone.replace(/\D/g, '').slice(-10)));

        list.push({
          id: `freq-${tx.id}`,
          name: isUserSelf ? 'My Phone' : (tx.recipient || (isData ? 'Data Bundle' : 'Airtime')),
          phone,
          network,
          lastService: tx.title || (isData ? 'Data Bundle' : 'Airtime'),
          amount: Math.abs(tx.amount) || (isData ? 260 : 500),
          type: isAirtime ? 'airtime' : 'data',
        });
      }
    }

    return list;
  }, [transactions, user?.phone]);

  const handleRepeatRecharge = (item: typeof frequentRecharges[0], e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    triggerHaptic('medium');
    if (item.type === 'airtime') {
      onNavigate('airtime');
    } else {
      onNavigate('data');
    }
  };

  // Format Status Badges for Ledger View
  const renderLedgerStatusBadge = (tx: Transaction) => {
    const rawStatus = (tx.status || 'SUCCESS').toUpperCase();
    const isRefunded = rawStatus === 'REFUNDED' || (tx.title && tx.title.toLowerCase().includes('refund'));

    if (isRefunded) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700">
          <RotateCcw size={10} className="stroke-[2.5]" />
          <span>REFUNDED</span>
        </span>
      );
    }

    if (rawStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800 animate-pulse">
          <Clock size={10} className="stroke-[2.5]" />
          <span>QUEUED</span>
        </span>
      );
    }

    if (rawStatus === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/70 dark:border-rose-800">
          <AlertCircle size={10} className="stroke-[2.5]" />
          <span>FAILED</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800">
        <CheckCircle2 size={10} className="stroke-[2.5]" />
        <span>DELIVERED</span>
      </span>
    );
  };

  // Helper to render telecom logo or service icon
  const renderTxIcon = (tx: Transaction) => {
    const titleLower = (tx.title + ' ' + (tx.subtitle || '')).toLowerCase();

    if (titleLower.includes('mtn')) {
      return <TelecomLogo network="mtn" size="sm" className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" />;
    }
    if (titleLower.includes('airtel')) {
      return <TelecomLogo network="airtel" size="sm" className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" />;
    }
    if (titleLower.includes('glo')) {
      return <TelecomLogo network="glo" size="sm" className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" />;
    }
    if (titleLower.includes('9mobile') || titleLower.includes('etisalat')) {
      return <TelecomLogo network="9mobile" size="sm" className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" />;
    }
    if (tx.iconType === 'bolt' || titleLower.includes('electric') || titleLower.includes('disco')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center shrink-0">
          <Bolt size={15} className="stroke-[2.5]" />
        </div>
      );
    }
    if (titleLower.includes('wallet') || tx.category === 'funding' || tx.isCredit) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
          <Wallet size={15} className="stroke-[2.2]" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center shrink-0">
        <Wifi size={15} className="stroke-[2.2]" />
      </div>
    );
  };

  const isGeneric = (n?: string) => isGenericCustomerName(n);
  const rawFirst = (user?.name && !isGeneric(user.name))
    ? user.name.trim().split(/\s+/)[0]
    : ((user?.username && !isGeneric(user.username)) ? user.username : "Al'amin");
  const firstName = rawFirst.toUpperCase() === "AL'AMIN" || rawFirst.toUpperCase() === "ALAMIN"
    ? "Al'amin"
    : rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const userInitial = (user?.name && !isGeneric(user.name)) ? user.name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'A');

  const isAdminUser = Boolean(
    user?.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
    user?.phone === '08123456789' ||
    (user?.role === 'admin' && user?.adminRole === 'super_admin')
  );

  return (
    <div id="screen-dashboard" className="px-3.5 sm:px-6 lg:px-8 py-4 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-7xl mx-auto w-full">
      {/* 1. WELCOMING USER SALUTATION */}
      <section className="flex items-center justify-between pt-1">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium block">
            {timeGreeting},
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {firstName}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
              <Check size={11} className="stroke-[3]" />
              Verified User
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdminUser && (
            <button
              type="button"
              id="dashboard-admin-console-btn"
              onClick={() => {
                playTapSound();
                triggerHaptic('light');
                onNavigate('admin');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white text-[11px] font-bold font-mono flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              title="Open VTU Administrator Console"
            >
              <ShieldCheck size={13} className="text-amber-300" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            id="dashboard-sync-btn"
            onClick={handleRefresh}
            disabled={isRefreshing || syncState === 'syncing'}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono cursor-pointer transition-all active:scale-95 disabled:opacity-60 shadow-2xs"
            title="Sync wallet balance & live network rates"
          >
            <RefreshCw
              size={14}
              className={`stroke-[2.5] ${
                isRefreshing || syncState === 'syncing'
                  ? 'animate-spin text-[#0047cc] dark:text-blue-400'
                  : 'text-slate-500'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Broadcast Notice from Admin if active */}
      {broadcastAnnouncement?.active &&
        Boolean(broadcastAnnouncement.text?.trim()) &&
        !broadcastAnnouncement.text.toLowerCase().includes('direct custom backend') &&
        !isAnnouncementDismissed && (
        <section
          id="dashboard-broadcast-banner"
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start justify-between gap-3 shadow-2xs transition-all ${
            broadcastAnnouncement.type === 'urgent'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
              : broadcastAnnouncement.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <Megaphone size={15} className="shrink-0 mt-0.5 text-current" />
            <div className="leading-snug break-words">{broadcastAnnouncement.text}</div>
          </div>
          <button
            type="button"
            id="dismiss-broadcast-announcement-btn"
            onClick={() => {
              setIsAnnouncementDismissed(true);
              try {
                if (broadcastAnnouncement?.text) {
                  localStorage.setItem('jagora_dismissed_announcement_text', broadcastAnnouncement.text);
                }
              } catch {}
            }}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
            title="Dismiss notice"
          >
            <X size={14} />
          </button>
        </section>
      )}


      {/* Maintenance Mode Banner */}
      {isMaintenanceMode && (
        <section
          id="dashboard-maintenance-banner"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-md border border-amber-400/30 space-y-2 animate-in fade-in"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <h3 className="font-heading font-black text-xs sm:text-sm tracking-wide uppercase flex items-center gap-1.5">
                <AlertTriangle size={16} className="shrink-0 text-white" />
                <span>Services Temporarily Paused (Maintenance Mode)</span>
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold uppercase">
              Upgrading Systems
            </span>
          </div>
          <p className="text-xs text-amber-50 leading-relaxed font-normal">
            Telecom switch and payment gateway connections are undergoing scheduled maintenance. All purchasing, recharge, and transfer services are temporarily paused to protect against failed transactions. <strong>Your wallet balance is 100% secure.</strong> Normal service will resume as soon as the maintenance window closes.
          </p>
        </section>
      )}

      {/* 2. RESPONSIVE FINTECH DASHBOARD GRID (Full-width Mobile Stack, 2-Column Desktop Powerhouse) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: FinTech Wallet Card, Services Hub, Frequent Recharges */}
        <div className="md:col-span-7 lg:col-span-8 space-y-5">
          {/* 2A. BESPOKE FINTECH WALLET INSTRUMENT (Compact horizontal layout, reduced height) */}
          <section
            id="dashboard-wallet-card"
            className="rounded-2xl sm:rounded-[22px] text-white bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] shadow-lg shadow-blue-900/20 relative overflow-hidden transition-all card-interactive p-4 sm:p-5 flex flex-col justify-between gap-3"
          >
            {/* Subtle atmospheric design accents */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/[0.06] blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-36 h-36 rounded-full bg-blue-300/[0.1] blur-xl pointer-events-none" />

            {/* Top row: Label + Eye Toggle + Subtle Active badge */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-white/85 tracking-wide">
                  Wallet Balance
                </span>
                <button
                  id="toggle-balance-visibility-btn"
                  type="button"
                  onClick={() => {
                    playTapSound();
                    triggerHaptic('light');
                    setHideBalance(!hideBalance);
                  }}
                  className="text-white/75 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 active:scale-95 cursor-pointer shrink-0"
                  aria-label="Toggle Balance Visibility"
                  title="Hide or show balance"
                >
                  {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10.5px] font-mono font-medium text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active</span>
              </div>
            </div>

            {/* Horizontal Middle/Action Row: Balance Numbers on Left, + Fund Wallet on Right */}
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="min-w-0 flex-1">
                {isLoading || isRefreshing ? (
                  <Skeleton variant="blue" className="w-40 h-9 rounded-lg bg-white/20" />
                ) : (
                  <div className="font-heading font-black tracking-tight text-white text-2xl sm:text-3xl lg:text-4xl truncate">
                    {hideBalance
                      ? '₦ ••••••••'
                      : `₦ ${(typeof user?.balance === 'number' ? user.balance : 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                  </div>
                )}
              </div>

              <button
                id="wallet-card-fund-btn"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('medium');
                  onNavigate('fund-wallet');
                }}
                className="min-h-[44px] px-4 py-2.5 bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-heading font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-950/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus size={16} className="stroke-[3]" />
                <span>+ Fund Wallet</span>
              </button>
            </div>
          </section>

          {/* Low Balance Warning Banner (matching Screen 1) */}
          {user.balance < 500 && (
            <div
              id="dashboard-low-balance-banner"
              onClick={onOpenFundWallet}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/25 text-amber-900 dark:text-amber-200 cursor-pointer hover:bg-amber-500/15 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <AlertTriangle size={18} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-bold text-xs sm:text-sm text-orange-950 dark:text-orange-200">
                    Low Balance (₦{Number(user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })})
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    Top up your wallet to enjoy uninterrupted services.
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-orange-500 shrink-0" />
            </div>
          )}

          {/* 3. SERVICES HUB (Unified Brand Color Consistency Across All VTU Service Buttons) */}
          <section className="space-y-3 pt-1">
            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              What Would You Like To Do Today?
            </h3>

            {/* Services Button Grid (3 cols on mobile, 3 cols in desktop left rail) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              {/* 1. Buy Data */}
              <button
                id="services-btn-buy-data"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigate('data');
                }}
                className="relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-[20px] bg-white dark:bg-[#0c1322] border border-blue-100/90 dark:border-blue-900/40 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer min-h-[96px] card-interactive overflow-hidden"
              >
                {isMaintenanceMode && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-mono font-bold tracking-tight uppercase">
                    Paused
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-108 transition-transform duration-200">
                  <Wifi size={22} className="stroke-[2.4]" />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0047cc] dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  Buy Data
                </span>
                <span className="text-[10px] text-[#0047cc] dark:text-blue-400 font-medium">SME / CG</span>
              </button>

              {/* 2. Buy Airtime */}
              <button
                id="services-btn-buy-airtime"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigate('airtime');
                }}
                className="relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-[20px] bg-white dark:bg-[#0c1322] border border-blue-100/90 dark:border-blue-900/40 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer min-h-[96px] card-interactive overflow-hidden"
              >
                {isMaintenanceMode && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-mono font-bold tracking-tight uppercase">
                    Paused
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-108 transition-transform duration-200">
                  <Smartphone size={22} className="stroke-[2.4]" />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0047cc] dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  Buy Airtime
                </span>
                <span className="text-[10px] text-[#0047cc] dark:text-blue-400 font-medium">Up to 4.5% OFF</span>
              </button>

              {/* 3. Recharge PIN */}
              <button
                id="services-btn-recharge-pin"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigate('recharge-pin');
                }}
                className="relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-[20px] bg-white dark:bg-[#0c1322] border border-blue-100/90 dark:border-blue-900/40 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer min-h-[96px] card-interactive overflow-hidden"
              >
                {isMaintenanceMode && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-mono font-bold tracking-tight uppercase">
                    Paused
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-108 transition-transform duration-200">
                  <ClipboardList size={22} className="stroke-[2.4]" />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0047cc] dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  Recharge PIN
                </span>
                <span className="text-[10px] text-[#0047cc] dark:text-blue-400 font-medium">Print E-PINs</span>
              </button>

              {/* 4. Data Card */}
              <button
                id="services-btn-data-card"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigate('data-card');
                }}
                className="relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-[20px] bg-white dark:bg-[#0c1322] border border-blue-100/90 dark:border-blue-900/40 hover:border-[#0047cc] dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer min-h-[96px] card-interactive overflow-hidden"
              >
                {isMaintenanceMode && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-mono font-bold tracking-tight uppercase">
                    Paused
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-108 transition-transform duration-200">
                  <CreditCard size={22} className="stroke-[2.4]" />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0047cc] dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  Data Card
                </span>
                <span className="text-[10px] text-[#0047cc] dark:text-blue-400 font-medium">Scratch Cards</span>
              </button>

              {/* 5. Fund Wallet */}
              <button
                id="services-btn-fund-wallet"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigate('fund-wallet');
                }}
                className="relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-[20px] bg-white dark:bg-[#0c1322] border border-blue-100/90 dark:border-blue-900/40 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer min-h-[96px] card-interactive overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-108 transition-transform duration-200">
                  <Wallet size={22} className="stroke-[2.4]" />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0047cc] dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  Fund Wallet
                </span>
                <span className="text-[10px] text-[#0047cc] dark:text-blue-400 font-medium">Auto-Virtual Acct</span>
              </button>

              {/* 6. More Services */}
              <button
                id="services-btn-more-services"
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  onOpenMoreServices();
                }}
                className="relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-[20px] bg-white dark:bg-[#0c1322] border border-blue-100/90 dark:border-blue-900/40 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer min-h-[96px] card-interactive overflow-hidden"
              >
                {isMaintenanceMode && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-mono font-bold tracking-tight uppercase">
                    Paused
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052e0] via-[#0047cc] to-[#0038a8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-108 transition-transform duration-200">
                  <LayoutGrid size={22} className="stroke-[2.4]" />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0047cc] dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  More Services
                </span>
                <span className="text-[10px] text-[#0047cc] dark:text-blue-400 font-medium">Bills & Utilities</span>
              </button>
            </div>
          </section>

          {/* 4. FREQUENT PURCHASES (Quick-Repeat Carousel) - ONLY when user has prior recharges */}
          {frequentRecharges.length > 0 && (
            <section className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Recent Recharges
                </h3>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  One-Tap Repeat
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {frequentRecharges.map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => handleRepeatRecharge(item, e)}
                    className="w-56 shrink-0 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] hover:border-blue-400 dark:hover:border-blue-500/60 shadow-2xs transition-all cursor-pointer group select-none active:scale-[0.98] card-interactive"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TelecomLogo network={item.network} size="xs" className="rounded-lg shrink-0" />
                        <div className="min-w-0">
                          <span className="font-heading text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {item.name}
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400 block truncate">
                            {item.phone}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRepeatRecharge(item, e)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white font-mono text-[10px] font-bold transition-all border border-blue-200/80 dark:border-blue-900/60 shrink-0 cursor-pointer"
                      >
                        Repeat
                      </button>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono">
                      <span className="text-slate-500 dark:text-slate-400">{item.lastService}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">₦{item.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Virtual Accounts, Transaction Ledger & Helpdesk Rail */}
        <div className="md:col-span-5 lg:col-span-4 space-y-5">
          {/* 2B. MULTI-BANK AUTOMATED VIRTUAL ACCOUNTS CARD */}
          <section
            id="dashboard-virtual-accounts-card"
            className="rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs space-y-3 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block font-heading">
                    Dedicated Virtual Accounts
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                    Automatic wallet credit in &lt;60s
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                0% Fee
              </span>
            </div>

            {/* Virtual Accounts State: Real XiXapay PalmPay & Kolomoni generation without BVN/NIN */}
            {virtualAccountsList.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-slate-900/80 dark:to-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Dedicated Virtual Accounts
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        No BVN / NIN Needed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Instant PalmPay & Kolomoni MFB accounts for 24/7 automated zero-fee wallet top-ups.
                    </p>
                  </div>
                </div>

                <div className="pt-0.5 space-y-2">
                  <button
                    type="button"
                    disabled={isGeneratingAccounts}
                    onClick={handleGenerateVirtualAccounts}
                    className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#0047cc] to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {isGeneratingAccounts ? (
                      <>
                        <RefreshCw size={13} className="animate-spin text-white" />
                        <span>Activating Real Bank Accounts...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-amber-300 fill-amber-300" />
                        <span>⚡ Generate My Account Numbers (Instant)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        onNavigate('fund-wallet');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 hover:border-slate-300 cursor-pointer"
                    >
                      <span>Other Funding Methods</span>
                      <ArrowRight size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        onNavigate('support');
                      }}
                      className="py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all cursor-pointer hover:border-slate-300"
                    >
                      Help
                    </button>
                  </div>
                </div>
              </div>
            ) : activeVirtualAcc ? (
              <>
                {/* Bank Selection Pills */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl">
                  {virtualAccountsList.map((acc, idx) => {
                    const isSelected = selectedVirtualAccIndex === idx;
                    const shortBank = acc.bank_name.replace(' Bank', '');
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setSelectedVirtualAccIndex(idx);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center truncate cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-[#0047cc] text-[#0047cc] dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {shortBank}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Bank Details & Copy Action */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase">
                        {activeVirtualAcc.bank_name}
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black font-mono tracking-wider text-slate-900 dark:text-white mt-0.5">
                      {activeVirtualAcc.account_number}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {activeVirtualAcc.account_name}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCopyVirtualAccount(activeVirtualAcc.account_number, e)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
                      copiedAccount
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#0047cc] hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {copiedAccount ? (
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
              </>
            ) : null}
          </section>

          {/* 5. FINTECH TRANSACTION LEDGER */}
          <section className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Recent Activity
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {recentTransactions.length}
                </span>
              </div>
              <button
                id="view-all-activity-btn"
                onClick={() => {
                  playTapSound();
                  onNavigate('history');
                }}
                className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Statement</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Ledger Table Container */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
              {isLoading || isRefreshing ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TransactionItemSkeleton key={idx} isLightMode={isLightMode} />
                ))
              ) : recentTransactions.length === 0 ? (
                <div className="p-8 text-center space-y-1">
                  <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    No transactions yet
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Fund your wallet or top-up data to begin recording transactions.
                  </p>
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      playTapSound();
                      onSelectTransaction(tx);
                    }}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group select-none"
                  >
                    {/* Left: Icon + Line Item Metadata */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {renderTxIcon(tx)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">
                            {tx.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="truncate">{tx.recipient || tx.subtitle || 'Direct Order'}</span>
                          <span>•</span>
                          <span className="truncate">{tx.date}</span>
                        </div>
                        <div className="mt-1">
                          {renderLedgerStatusBadge(tx)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Tabular Amount */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-[13px] font-mono font-black block ${
                          tx.isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {tx.isCredit ? '+ ' : '- '}₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium group-hover:text-blue-500 transition-colors mt-0.5 block">
                        Receipt →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 6. SUPPORT & RESOLUTION RAIL */}
          <section
            id="dashboard-support-card"
            className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-900/80 shadow-2xs card-interactive"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60">
                  <Headphones size={18} className="stroke-[2.2]" />
                </div>
                <div>
                  <h5 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
                    Dispute & Instant Helpdesk
                  </h5>
                  <p className="text-[10.5px] font-sans text-slate-500 dark:text-slate-400">
                    Any switch delay auto-refunds • 24/7 WhatsApp Desk
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/2348001234567"
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs transition-all active:scale-95"
              >
                <MessageCircle size={14} />
                <span>Chat</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
