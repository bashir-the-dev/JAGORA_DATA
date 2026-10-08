import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Zap,
  Cloud,
  Tag,
  BarChart3,
  UserCheck,
  Megaphone,
  Eye,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  DollarSign,
  Search,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { PlatformUserAccount, Transaction, AdminPlatformWallet, ApiProvider } from '../../types';
import { AdminTabType } from './AdminHeader';

interface AdminOverviewTabProps {
  users: PlatformUserAccount[];
  transactions: Transaction[];
  platformWallet: AdminPlatformWallet;
  providers: ApiProvider[];
  adminProfile?: any;
  onNavigateTab: (tab: AdminTabType) => void;
  onInspectUser?: (user: PlatformUserAccount) => void;
  onAdjustUserWallet?: (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => void;
  onToggleUserStatus?: (userId: string) => void;
  onResetStatistics?: (resetBalances: boolean) => Promise<void>;
  isLightMode?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  users,
  transactions,
  platformWallet,
  providers,
  adminProfile,
  onNavigateTab,
  onInspectUser,
  onAdjustUserWallet,
  onToggleUserStatus,
  onResetStatistics,
  isLightMode = true,
  onRefresh,
  isRefreshing,
}) => {
  // Fresh Start / Reset Stats Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetBalancesOption, setResetBalancesOption] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleExecuteReset = async () => {
    if (!onResetStatistics) return;
    setIsResetting(true);
    try {
      await onResetStatistics(resetBalancesOption);
      setIsResetModalOpen(false);
    } catch {
      // Handled by parent toast
    } finally {
      setIsResetting(false);
    }
  };
  // Chart timeframe state: '7D' | '30D' | '90D' | '1Y'
  const [chartRange, setChartRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Quick Action menu for table rows
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Helper to detect administrative or staff accounts
  const isUserAdminOrSelf = (u: PlatformUserAccount) => {
    return (
      u.role === 'admin' ||
      u.role === 'support_agent' ||
      u.role === 'finance_agent' ||
      Boolean(u.isAdmin) ||
      u.id === 'usr_admin_01' ||
      u.phone === '08123456789' ||
      u.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
      (adminProfile &&
        (u.phone === adminProfile.phone ||
          u.email?.toLowerCase() === adminProfile.email?.toLowerCase() ||
          u.id === adminProfile.id))
    );
  };

  // Pure customer accounts only
  const customerAccounts = users.filter((u) => !isUserAdminOrSelf(u));

  // Time & Greeting
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const adminFirstName = useMemo(() => {
    const fullName = adminProfile?.name || 'Bashir';
    return fullName.split(' ')[0] || 'Bashir';
  }, [adminProfile?.name]);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  const formattedDateStr = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [currentTime]);

  const formattedTimeStr = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentTime]);

  // Aggregated Metrics
  const totalCustomersCount = users.length;
  const activeCustomersCount = users.filter((u) => u.status === 'active').length;
  const frozenCustomersCount = users.filter((u) => u.status === 'suspended').length;

  const totalCustomerLiabilities = useMemo(() => {
    return users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
  }, [users]);

  const lifetimeTurnover = useMemo(() => {
    const fromTx = transactions.reduce((acc, tx) => {
      if (tx.status === 'SUCCESS' && !tx.isCredit) {
        return acc + Math.abs(Number(tx.amount) || 0);
      }
      return acc;
    }, 0);
    return Math.max(fromTx, platformWallet.todaySalesVolume || 0);
  }, [transactions, platformWallet.todaySalesVolume]);

  const totalFloatReserves = useMemo(() => {
    return providers.reduce((acc, p) => acc + (Number(p.floatBalance) || 0), 0);
  }, [providers]);

  const totalVendorFloat = totalFloatReserves;
  const reserveRatio = totalCustomerLiabilities > 0 ? totalVendorFloat / totalCustomerLiabilities : 1;

  // Generate chart data points based on selected range
  const chartData = useMemo(() => {
    let pointsCount = 9;
    let labelInterval = 'days';

    if (chartRange === '7D') {
      pointsCount = 7;
    } else if (chartRange === '30D') {
      pointsCount = 9;
    } else if (chartRange === '90D') {
      pointsCount = 10;
    } else {
      pointsCount = 12;
    }

    const currentTotal = Math.max(users.length, 3);
    const result: Array<{ label: string; dateStr: string; count: number }> = [];

    const now = new Date();
    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now);
      if (chartRange === '7D') {
        d.setDate(d.getDate() - i);
      } else if (chartRange === '30D') {
        d.setDate(d.getDate() - i * 3.5);
      } else if (chartRange === '90D') {
        d.setDate(d.getDate() - i * 9);
      } else {
        d.setMonth(d.getMonth() - i);
      }

      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Progressive curve towards currentTotal
      const progress = (pointsCount - 1 - i) / (pointsCount - 1);
      const easeProgress = Math.pow(progress, 1.8);
      const simulatedCount = Math.max(1, Math.min(currentTotal, Math.round(1 + (currentTotal - 1) * easeProgress + (i === 0 ? 0 : (Math.sin(i * 1.5) * 0.4)))));

      result.push({
        label,
        dateStr: fullDate,
        count: i === 0 ? currentTotal : simulatedCount,
      });
    }

    return result;
  }, [chartRange, users.length]);

  // SVG dimensions for chart
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(...chartData.map((d) => d.count), 4);
  const minVal = 0;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (chartData.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (val / maxVal) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const points = chartData.map((d, i) => getCoordinates(i, d.count));

  // Build SVG smooth Bezier curve path
  const curvePath = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${curvePath} L ${last.x} ${svgHeight - paddingY} L ${first.x} ${svgHeight - paddingY} Z`;
  }, [curvePath, points, svgHeight, paddingY]);

  // Quick Action Buttons
  const quickActions = [
    {
      title: 'Switch API Gateway',
      icon: Cloud,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      action: () => onNavigateTab('providers'),
    },
    {
      title: 'Update Pricing & Margins',
      icon: Tag,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      action: () => onNavigateTab('pricing'),
    },
    {
      title: 'View Airtime & Data Logs',
      icon: BarChart3,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      action: () => onNavigateTab('transactions'),
    },
    {
      title: 'Manage Customers',
      icon: Users,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      action: () => onNavigateTab('users'),
    },
    {
      title: 'CEO & Staff Agents',
      icon: UserCheck,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      action: () => onNavigateTab('staff'),
    },
    {
      title: 'Broadcast & Controls',
      icon: Megaphone,
      color: 'bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400',
      action: () => onNavigateTab('broadcast'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. GREETING & REAL-TIME WAT CLOCK HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {greeting}, {adminFirstName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your platform today.
          </p>
        </div>

        {/* Top Controls: Date/Time Widget & Fresh Start Reset Button */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onResetStatistics && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              title="Reset dashboard analytics, orders & sales volume to zero for a fresh start"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Fresh Start / Reset Stats</span>
            </button>
          )}

          {/* Date & Time Widget */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-heading">
                {formattedDateStr}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {formattedTimeStr} (WAT)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: TOTAL CUSTOMERS */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-blue-500/10 via-white to-sky-500/5 dark:from-blue-950/40 dark:via-[#0c1322] dark:to-sky-950/20 border-2 border-blue-500/40 dark:border-blue-600/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center justify-center cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Refresh customer sign-ups"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={() => onNavigateTab('users')}
                className="w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="View all customers"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              TOTAL CUSTOMERS
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">
                {totalCustomersCount}
              </span>
              {/* Mini Sparkline SVG */}
              <svg className="w-20 h-8" viewBox="0 0 80 32">
                <path
                  d="M2 28 Q 20 22, 35 24 T 60 12 T 78 4"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>▲</span> +{activeCustomersCount} Active
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <span>●</span> {frozenCustomersCount} Frozen
            </span>
          </div>
        </div>

        {/* Metric 2: CUSTOMER LIABILITIES */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-500/10 via-white to-teal-500/5 dark:from-emerald-950/40 dark:via-[#0c1322] dark:to-teal-950/20 border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="View wallet analytics"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              CUSTOMER LIABILITIES
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ₦{totalCustomerLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {/* Mini Sparkline SVG */}
              <svg className="w-20 h-8" viewBox="0 0 80 32">
                <path
                  d="M2 18 Q 20 28, 40 18 T 65 10 T 78 8"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium truncate">
            Aggregated user wallet balances
          </div>
        </div>

        {/* Metric 3: LIFETIME TURNOVER */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-purple-500/10 via-white to-indigo-500/5 dark:from-purple-950/40 dark:via-[#0c1322] dark:to-indigo-950/20 border-2 border-purple-500/40 dark:border-purple-600/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="w-8 h-8 rounded-lg text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="View transaction tracker"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              LIFETIME TURNOVER
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 font-mono tracking-tight">
                ₦{lifetimeTurnover.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {/* Mini Bar Chart SVG */}
              <div className="flex items-end gap-1 h-7">
                <div className="w-1.5 h-3 bg-purple-300 dark:bg-purple-900 rounded-xs" />
                <div className="w-1.5 h-4 bg-purple-400 dark:bg-purple-800 rounded-xs" />
                <div className="w-1.5 h-6 bg-purple-500 dark:bg-purple-700 rounded-xs" />
                <div className="w-1.5 h-5 bg-purple-600 dark:bg-purple-600 rounded-xs" />
                <div className="w-1.5 h-7 bg-purple-700 dark:bg-purple-400 rounded-xs" />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-900/60 text-xs text-purple-800 dark:text-purple-300 font-medium truncate">
            Cumulative transaction volume
          </div>
        </div>

        {/* Metric 4: PLATFORM FLOATS */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-amber-500/10 via-white to-orange-500/5 dark:from-amber-950/40 dark:via-[#0c1322] dark:to-orange-950/20 border-2 border-amber-500/40 dark:border-amber-600/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="w-8 h-8 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="View upstream floats"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              PLATFORM FLOATS
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ₦{totalVendorFloat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold font-mono text-[10px] border ${
                  reserveRatio >= 1.0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                }`}
              >
                {(reserveRatio * 100).toFixed(0)}% Solvency
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 font-medium truncate">
            Upstream telecom vendor float
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: CUSTOMER GROWTH CHART + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Growth & Activity Chart (7 cols on desktop) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Customer Growth & Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total registered user base progression over time
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
              {(['7D', '30D', '90D', '1Y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    chartRange === range
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Line Graph with Tooltip */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map((step) => {
                const y = svgHeight - paddingY - (step / 4) * (svgHeight - paddingY * 2);
                return (
                  <g key={step}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/70"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                      textAnchor="end"
                    >
                      {Math.round((step / 4) * maxVal)}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill="url(#areaGradient)" />

              {/* Main Line Curve */}
              <path
                d={curvePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredPointIndex === idx;
                const isLast = idx === points.length - 1;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered || isLast ? 5 : 3.5}
                      fill={isHovered || isLast ? '#2563eb' : '#ffffff'}
                      stroke="#2563eb"
                      strokeWidth={isHovered || isLast ? 3 : 2}
                      className="transition-all"
                    />
                  </g>
                );
              })}

              {/* X-Axis Labels */}
              {chartData.map((d, idx) => {
                const pt = points[idx];
                // Only show alternate labels if crowded
                if (chartData.length > 8 && idx % 2 !== 0 && idx !== chartData.length - 1) return null;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={svgHeight - 8}
                    className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPointIndex !== null && points[hoveredPointIndex] && (
              <div
                className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-mono shadow-xl border border-slate-700 dark:border-slate-200"
                style={{
                  left: `${(points[hoveredPointIndex].x / svgWidth) * 100}%`,
                  top: `${(points[hoveredPointIndex].y / svgHeight) * 100}%`,
                  marginTop: '-10px',
                }}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  {chartData[hoveredPointIndex].count} customers
                </div>
                <div className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">
                  {chartData[hoveredPointIndex].dateStr}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (5 cols on desktop) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your platform with ease
                </p>
              </div>
            </div>

            {/* 2x3 Grid on desktop, 1 or 2 col on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
              {quickActions.map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={qa.action}
                    className="min-h-[48px] p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/90 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-2xs transition-all flex items-center justify-between text-left group cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${qa.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 sm:line-clamp-2">
                        {qa.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
            <span className="text-blue-800 dark:text-blue-300 font-medium">
              Need to adjust wallet or review staff?
            </span>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Open Wallets &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: CUSTOMER ACCOUNTS & WALLETS DIRECTORY TABLE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs overflow-hidden">
        {/* Table Header with View All button */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Customer Accounts & Wallets Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage and view all customer accounts, wallet balances and status.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('users')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MOBILE CARD VIEW (< 640px) */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {customerAccounts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No customer accounts registered yet.
            </div>
          ) : (
            customerAccounts.slice(0, 8).map((user, index) => {
              const isSuspended = user.status === 'suspended';

              return (
                <div key={user.id || index} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {user.name}
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {user.phone}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₦{(Number(user.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border mt-0.5 ${
                          isSuspended
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                        }`}
                      >
                        {isSuspended ? 'Frozen' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (onInspectUser) {
                          onInspectUser(user);
                        } else {
                          onNavigateTab('users');
                        }
                      }}
                      className="flex-1 min-h-[44px] px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 font-mono text-xs font-semibold transition-all border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Account</span>
                    </button>

                    {isUserAdminOrSelf(user) ? (
                      <div
                        className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold flex items-center justify-center gap-1"
                        title="Protected Admin Account"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Protected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onToggleUserStatus?.(user.id)}
                        className={`min-h-[44px] px-3.5 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                          isSuspended
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800'
                        }`}
                        title={isSuspended ? 'Unfreeze' : 'Freeze'}
                      >
                        {isSuspended ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unfreeze</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-rose-500" />
                            <span>Freeze</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP DIRECTORY TABLE (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">#</th>
                <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                <th className="py-3.5 px-4 font-semibold">Email</th>
                <th className="py-3.5 px-4 font-semibold">Wallet Balance</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Last Active</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {customerAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                    No customer accounts registered yet.
                  </td>
                </tr>
              ) : (
                customerAccounts.slice(0, 10).map((user, index) => {
                  const isSuspended = user.status === 'suspended';
                  const isMenuOpen = activeMenuUserId === user.id;

                  return (
                    <tr
                      key={user.id || index}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 font-heading font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {user.phone}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {user.email || '—'}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₦{(Number(user.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                            Frozen
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {user.registeredDate || 'Recent'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="relative inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (onInspectUser) {
                                onInspectUser(user);
                              } else {
                                onNavigateTab('users');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white font-mono text-[11px] font-semibold transition-all border border-blue-200/80 dark:border-blue-900/60 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setActiveMenuUserId(isMenuOpen ? null : user.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Dropdown Actions */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-1.5 text-left font-sans">
                              <button
                                onClick={() => {
                                  setActiveMenuUserId(null);
                                  onNavigateTab('users');
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Credit / Debit</span>
                              </button>
                              {!isUserAdminOrSelf(user) && (
                                <button
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    onToggleUserStatus?.(user.id);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  {isSuspended ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Unfreeze Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Freeze Account</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FRESH START / RESET STATISTICS CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => !isResetting && setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                Reset Platform Statistics &amp; Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This utility will clear existing transaction logs to start fresh with a clean slate. Ideal after testing before opening the platform to the public.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <span>⚠️</span> The following metrics will be reset to zeros:
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300/90 text-[11px] font-medium">
                <li><strong className="font-semibold">Lifetime Turnover:</strong> ₦0.00</li>
                <li><strong className="font-semibold">Today's Sales Volume:</strong> ₦0.00</li>
                <li><strong className="font-semibold">Today's Gross Profit:</strong> ₦0.00</li>
                <li><strong className="font-semibold">Orders Processed / Tx Count:</strong> 0 orders</li>
                <li><strong className="font-semibold">Transaction Logs:</strong> Cleared to 0 records</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <input
                id="reset-customer-wallets"
                type="checkbox"
                checked={resetBalancesOption}
                onChange={(e) => setResetBalancesOption(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="reset-customer-wallets" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <strong>Also reset customer wallet balances to ₦0.00</strong>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Resets Customer Liabilities to zero. (Admin accounts are preserved).
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleExecuteReset}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all shadow-md shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resetting to Zeros...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Reset to Zeros</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
