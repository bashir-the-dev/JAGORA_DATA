import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  Layers,
  Zap,
  Tag,
  BarChart3,
  Calendar,
  Cloud,
  FileText,
  Smartphone,
  Tv,
  RotateCcw,
  AlertTriangle,
  X,
  MoreVertical,
  Activity,
  ArrowRight,
  Wifi,
  ChevronRight,
} from 'lucide-react';
import { PlatformUserAccount, Transaction, AdminPlatformWallet, ApiProvider } from '../../types';
import { AdminTabType } from './AdminHeader';
import { ProfitReportModal } from './ProfitReportModal';

interface AdminOverviewTabProps {
  users: PlatformUserAccount[];
  transactions: Transaction[];
  platformWallet: AdminPlatformWallet;
  providers: ApiProvider[];
  adminProfile?: any;
  roleConfig?: any;
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
  adminProfile,
  onNavigateTab,
  onResetStatistics,
}) => {
  // Profit Report Audit Modal State
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);

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
      // Handled by parent
    } finally {
      setIsResetting(false);
    }
  };

  // Chart timeframe state
  const [chartRange, setChartRange] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(6);

  // Time & Greeting (West Africa Time)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const adminFirstName = useMemo(() => {
    const fullName = adminProfile?.name || 'Alamin';
    const first = fullName.split(' ')[0] || 'Alamin';
    return first.replace(/[^a-zA-Z]/g, '') || 'Alamin';
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
      month: 'short',
      day: 'numeric',
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

  // Calculations & Metrics
  const totalCustomersCount = users.length;
  const activeCustomersCount = useMemo(() => {
    return users.filter((u) => u.status === 'active').length;
  }, [users]);

  const totalCustomerLiabilities = useMemo(() => {
    if (users && users.length > 0) {
      return users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
    }
    if (typeof platformWallet.totalUserWallets === 'number') {
      return platformWallet.totalUserWallets;
    }
    return 0;
  }, [users, platformWallet.totalUserWallets]);

  const todayProfit = useMemo(() => {
    if (typeof platformWallet.todayProfit !== 'undefined') {
      return Number(platformWallet.todayProfit) || 0;
    }
    if (typeof platformWallet.todayGrossProfit !== 'undefined') {
      return Number(platformWallet.todayGrossProfit) || 0;
    }
    return 0.0;
  }, [platformWallet.todayProfit, platformWallet.todayGrossProfit]);

  const todayTurnover = useMemo(() => {
    if (typeof platformWallet.todaySalesVolume !== 'undefined') {
      return Number(platformWallet.todaySalesVolume) || 0;
    }
    return 0.0;
  }, [platformWallet.todaySalesVolume]);

  const platformFloats = useMemo(() => {
    if (typeof platformWallet.totalVendorFloat !== 'undefined') {
      return Number(platformWallet.totalVendorFloat) || 0;
    }
    return 0.0;
  }, [platformWallet.totalVendorFloat]);

  const totalBalanceAggregate = useMemo(() => {
    return totalCustomerLiabilities + platformFloats;
  }, [totalCustomerLiabilities, platformFloats]);

  // Dual-line Chart Data (Transaction Volume & Active Users)
  const chartPoints = useMemo(() => {
    const pointsCount = chartRange === '7D' ? 7 : chartRange === '30D' ? 10 : 8;
    const baseDate = new Date(currentTime);
    const result: Array<{
      label: string;
      dateStr: string;
      txVolume: number;
      activeUsers: number;
    }> = [];

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      let txVol = 0;
      let usersCount = 0;

      if (i === 0) {
        txVol = todayTurnover;
        usersCount = activeCustomersCount;
      } else if (transactions.length > 0) {
        const dayStr = d.toISOString().slice(0, 10);
        const dayTxs = transactions.filter(t => (t as any).created_at && String((t as any).created_at).startsWith(dayStr));
        txVol = dayTxs.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        usersCount = new Set(dayTxs.map(t => t.recipient || (t as any).user_id || t.customerPhone)).size;
      }

      result.push({
        label,
        dateStr: fullDate,
        txVolume: txVol,
        activeUsers: usersCount,
      });
    }
    return result;
  }, [chartRange, currentTime, todayTurnover, activeCustomersCount, transactions]);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const maxTxVal = Math.max(...chartPoints.map((p) => p.txVolume), 1000);
  const maxUserVal = Math.max(...chartPoints.map((p) => p.activeUsers), 10);

  const getCoordinates = (index: number, val: number, maxV: number) => {
    const x = paddingX + (index / Math.max(1, chartPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (val / Math.max(1, maxV)) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const txCoords = chartPoints.map((p, i) => getCoordinates(i, p.txVolume, maxTxVal));
  const userCoords = chartPoints.map((p, i) => getCoordinates(i, p.activeUsers, maxUserVal));

  // Build Bezier SVG Path
  const makeBezierPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const txPath = makeBezierPath(txCoords);
  const userPath = makeBezierPath(userCoords);
  const txAreaPath = `${txPath} L ${txCoords[txCoords.length - 1]?.x} ${svgHeight - paddingY} L ${txCoords[0]?.x} ${svgHeight - paddingY} Z`;
  const userAreaPath = `${userPath} L ${userCoords[userCoords.length - 1]?.x} ${svgHeight - paddingY} L ${userCoords[0]?.x} ${svgHeight - paddingY} Z`;

  // Recent transactions table rows - Strictly from live database transactions
  const displayTransactions = useMemo(() => {
    return transactions.slice(0, 5).map((t, i) => {
      const titleLower = (t.title || '').toLowerCase();
      const serviceType = titleLower.includes('data')
        ? 'Data'
        : titleLower.includes('airtime')
        ? 'Airtime'
        : titleLower.includes('electric') || titleLower.includes('meter')
        ? 'Electricity'
        : titleLower.includes('cable') || titleLower.includes('dstv') || titleLower.includes('gotv') || titleLower.includes('startimes')
        ? 'Cable TV'
        : titleLower.includes('exam') || titleLower.includes('waec') || titleLower.includes('neco') || titleLower.includes('jamb')
        ? 'Exam PIN'
        : 'VTU Service';

      let network = 'VTU';
      if (titleLower.includes('mtn')) network = 'MTN';
      else if (titleLower.includes('airtel')) network = 'Airtel';
      else if (titleLower.includes('glo')) network = 'Glo';
      else if (titleLower.includes('9mobile')) network = '9mobile';
      else if (titleLower.includes('dstv')) network = 'DStv';
      else if (titleLower.includes('gotv')) network = 'GOtv';
      else if (titleLower.includes('startimes')) network = 'StarTimes';
      else if (titleLower.includes('aedc') || titleLower.includes('ikedc') || titleLower.includes('ekedc')) network = 'Disco';

      return {
        index: i + 1,
        customer: t.recipient || t.customerPhone || 'Customer',
        service: t.title || `${serviceType} (${network})`,
        type: serviceType,
        network,
        amount: Number(t.amount) || 0,
        status: t.status === 'SUCCESS' ? 'Success' : t.status === 'PENDING' ? 'Pending' : 'Failed',
        time: t.date || 'Today',
      };
    });
  }, [transactions]);

  // Service Breakdown for Platform Overview - Dynamically computed from database
  const breakdown = useMemo(() => {
    const sb = platformWallet.serviceBreakdown;
    if (sb && typeof sb === 'object') {
      return {
        airtime: { volume: Number(sb.airtime?.volume || 0), share: Number(sb.airtime?.percentage || 0) },
        data: { volume: Number(sb.data?.volume || 0), share: Number(sb.data?.percentage || 0) },
        electricity: { volume: Number(sb.electricity?.volume || 0), share: Number(sb.electricity?.percentage || 0) },
        cable: { volume: Number(sb.cable?.volume || 0), share: Number(sb.cable?.percentage || 0) },
      };
    }
    let airVol = 0, datVol = 0, eleVol = 0, cabVol = 0;
    for (const t of transactions) {
      if (t.status !== 'SUCCESS') continue;
      const cat = (t.category || t.title || '').toLowerCase();
      const amt = Number(t.amount) || 0;
      if (cat.includes('airtime')) airVol += amt;
      else if (cat.includes('data')) datVol += amt;
      else if (cat.includes('electric') || cat.includes('meter')) eleVol += amt;
      else if (cat.includes('cable') || cat.includes('tv') || cat.includes('dstv') || cat.includes('gotv') || cat.includes('startimes')) cabVol += amt;
    }
    const total = airVol + datVol + eleVol + cabVol;
    return {
      airtime: { volume: airVol, share: total > 0 ? Math.round((airVol / total) * 100) : 0 },
      data: { volume: datVol, share: total > 0 ? Math.round((datVol / total) * 100) : 0 },
      electricity: { volume: eleVol, share: total > 0 ? Math.round((eleVol / total) * 100) : 0 },
      cable: { volume: cabVol, share: total > 0 ? Math.round((cabVol / total) * 100) : 0 },
    };
  }, [platformWallet.serviceBreakdown, transactions]);

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE HERO WAVE BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#061e52] via-[#09296e] to-[#0c358b] text-white overflow-hidden shadow-xl p-6 sm:p-8 border border-blue-900/40">
        {/* Curving Orange & Gold Wave Accent Graphic on Right */}
        <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/3 pointer-events-none overflow-hidden select-none">
          <svg
            className="absolute -right-6 top-0 h-full w-[150%] max-w-none opacity-90"
            viewBox="0 0 400 300"
            preserveAspectRatio="none"
          >
            <path
              d="M 120 0 Q 70 120 180 200 T 320 300 L 400 300 L 400 0 Z"
              fill="url(#orangeWaveGrad)"
            />
            <defs>
              <linearGradient id="orangeWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff5500" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#ff7700" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffa600" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Greeting & Summary Pills */}
          <div className="space-y-4 max-w-2xl">
            <div>
              <span className="text-xs font-semibold text-blue-200 tracking-wide uppercase">
                Welcome back,
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                {greeting}, {adminFirstName} <span className="animate-pulse">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/90 mt-1">
                Here's what's happening with your platform today.
              </p>
            </div>

            {/* 3 Translucent Capsules */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Capsule 1: Total Customers */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-blue-200 block uppercase">
                    Total Customers
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-white font-heading">
                      {totalCustomersCount}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {activeCustomersCount > 0 ? `↑ ${activeCustomersCount} active today` : 'Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capsule 2: Active Users */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-blue-200 block uppercase">
                    Active Users
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-white font-heading">
                      {activeCustomersCount}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {activeCustomersCount > 0 ? '• Active' : 'Idle'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capsule 3: Total Balance */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#ff7700] text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-blue-200 block uppercase">
                    Total Balance
                  </span>
                  <span className="text-base font-black text-white font-mono">
                    ₦{totalBalanceAggregate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Motto Quote & Date/Time Glass Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
            {/* Motto Quote */}
            <div className="text-left lg:text-right">
              <span className="text-2xl font-serif text-[#ffa600] leading-none block -mb-1 select-none">
                “
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white/95 tracking-wide">
                Build, Serve, Grow —
              </p>
              <p className="text-xs sm:text-sm font-semibold text-white/95">
                Your platform, Your success.
              </p>
              <div className="w-8 h-0.5 bg-[#ff7700] rounded-full mt-1.5 ml-0 lg:ml-auto" />
            </div>

            {/* WAT Date & Time Glass Card */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-blue-600/80 text-white flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-white font-heading tracking-tight">
                  {formattedDateStr}
                </div>
                <div className="text-[11px] font-mono text-blue-100 font-semibold">
                  {formattedTimeStr} (WAT)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FIVE METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Customers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#1668e8] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Customers
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-heading">
                {totalCustomersCount}
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>{activeCustomersCount > 0 ? `↑ ${activeCustomersCount} Active today` : 'Registered customers'}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Sparkline curve */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 100 28" fill="none">
              <path
                d="M 2 24 Q 25 20 45 18 T 75 8 T 98 4"
                stroke="#1668e8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <button
              onClick={() => onNavigateTab('users')}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Customers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Daily Profit */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Daily Profit
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-heading">
                ₦{Number(todayProfit).toFixed(2)}
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>{todayProfit > 0 ? '↑ Net profit earned today' : 'Resets daily at 12:00 AM WAT'}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Sparkline curve */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 100 28" fill="none">
              <path
                d="M 2 22 Q 25 18 50 15 T 80 10 T 98 3"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <button
              onClick={() => setIsProfitModalOpen(true)}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
              title="Open detailed daily profit and historical calculation report"
            >
              <span>View Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Customer Liabilities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer Liabilities
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-heading">
                ₦{Number(totalCustomerLiabilities).toFixed(2)}
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>{totalCustomerLiabilities > 0 ? 'Total customer funds in wallets' : 'No customer liabilities'}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Sparkline curve */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 100 28" fill="none">
              <path
                d="M 2 24 Q 28 22 55 16 T 82 10 T 98 4"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <button
              onClick={() => onNavigateTab('wallets')}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Liabilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Platform Turnover */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Platform Turnover
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-heading">
                ₦{Number(todayTurnover).toFixed(2)}
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>{todayTurnover > 0 ? `${platformWallet.todayTxCount || 0} orders processed today` : 'No orders processed today'}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Sparkline curve */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 100 28" fill="none">
              <path
                d="M 2 25 Q 30 20 60 18 T 85 8 T 98 5"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <button
              onClick={() => onNavigateTab('transactions')}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Turnover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 5: Platform Floats */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Platform Floats
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-heading">
                ₦{Number(platformFloats).toFixed(2)}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span>{platformFloats > 0 ? 'Live gateway reserve float' : 'Zero gateway balance'}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Sparkline curve */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 100 28" fill="none">
              <path
                d="M 2 8 Q 30 14 55 18 T 80 22 T 98 25"
                stroke="#ea580c"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <button
              onClick={() => onNavigateTab('wallets')}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Floats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: PLATFORM PERFORMANCE & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Chart (8 cols on desktop) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1668e8] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                  Platform Performance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total transaction volume and active users over time
                </p>
              </div>
            </div>

            {/* Timeframe Filter Pills & Legend */}
            <div className="flex items-center gap-2">
              {(['7D', '30D', '90D', '1Y'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartRange === r
                      ? 'bg-[#1668e8] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1668e8]" />
              <span>Transaction Volume</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
              <span>Active Users</span>
            </div>
          </div>

          {/* SVG Smooth Chart Area */}
          <div className="relative mt-4 w-full overflow-hidden select-none">
            <svg
              className="w-full h-56 sm:h-64"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="txAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1668e8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1668e8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="userAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid guide lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
                const v = Math.round(maxTxVal * step);
                const y = svgHeight - paddingY - (v / Math.max(1, maxTxVal)) * (svgHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/80"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                    >
                      {v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={txAreaPath} fill="url(#txAreaGrad)" />
              <path d={userAreaPath} fill="url(#userAreaGrad)" />

              {/* Stroke Lines */}
              <path
                d={txPath}
                fill="none"
                stroke="#1668e8"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={userPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Points */}
              {txCoords.map((pt, i) => (
                <circle
                  key={'tx-' + i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPointIndex === i ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#1668e8"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                />
              ))}

              {userCoords.map((pt, i) => (
                <circle
                  key={'usr-' + i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPointIndex === i ? 4.5 : 3}
                  fill="#ffffff"
                  stroke="#f97316"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                />
              ))}

              {/* X-Axis date labels */}
              {chartPoints.map((d, idx) => {
                const pt = txCoords[idx];
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={svgHeight - 10}
                    className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
              <div
                className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono shadow-xl border border-slate-700"
                style={{
                  left: `${(txCoords[hoveredPointIndex].x / svgWidth) * 100}%`,
                  top: `${(txCoords[hoveredPointIndex].y / svgHeight) * 100}%`,
                  marginTop: '-12px',
                }}
              >
                <div className="font-bold text-[11px] text-slate-300">
                  {chartPoints[hoveredPointIndex].dateStr}
                </div>
                <div className="flex items-center gap-1.5 text-blue-400 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Transaction Volume: {chartPoints[hoveredPointIndex].txVolume.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Active Users: {chartPoints[hoveredPointIndex].activeUsers.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (4 cols on desktop) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your platform with ease
                </p>
              </div>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {/* Action 1: Switch API Gateway */}
              <button
                onClick={() => onNavigateTab('providers')}
                className="p-4 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-900/50 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                    Switch API Gateway
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Action 2: Wallet & Floats */}
              <button
                onClick={() => onNavigateTab('wallets')}
                className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200/60 dark:border-amber-900/50 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-[#ff6b00] text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#ff6b00] transition-colors">
                    Wallet & Floats
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ff6b00] group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Action 3: Manage Customers */}
              <button
                onClick={() => onNavigateTab('users')}
                className="p-4 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 border border-purple-200/60 dark:border-purple-900/50 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                    Manage Customers
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Action 4: View Logs */}
              <button
                onClick={() => onNavigateTab('transactions')}
                className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-900/50 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                    View Logs
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>


            {/* Discreet Secondary Link for VTU Plan Pricing */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-slate-400">Periodic plan pricing:</span>
              <button
                onClick={() => onNavigateTab('pricing')}
                className="font-bold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Secondary tool: Edit wholesale & retail VTU selling prices"
              >
                <span>Edit VTU Retail Prices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: RECENT TRANSACTIONS & PLATFORM OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions Table (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                  Recent Transactions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest customer transactions on your platform
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          No customer transactions recorded yet
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs">
                          Orders processed via mobile app or website will be displayed here in real time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayTransactions.map((tx) => (
                    <tr key={tx.index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">{tx.index}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{tx.customer}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tx.network === 'MTN'
                                ? 'bg-amber-400'
                                : tx.network === 'Airtel'
                                ? 'bg-red-500'
                                : tx.network === '9mobile'
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {tx.service}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        ₦{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            tx.status === 'Success'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {tx.time}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Overview (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Platform Overview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Key metrics at a glance
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {/* 2x2 Service Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {/* Airtime */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#ff6b00] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Airtime
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  ₦{breakdown.airtime.volume.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {breakdown.airtime.volume > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">↑ {breakdown.airtime.share}% of turnover</span>
                  ) : (
                    <span>0% of turnover</span>
                  )}
                </div>
              </div>

              {/* Data */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Data
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  ₦{breakdown.data.volume.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {breakdown.data.volume > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">↑ {breakdown.data.share}% of turnover</span>
                  ) : (
                    <span>0% of turnover</span>
                  )}
                </div>
              </div>

              {/* Electricity */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Electricity
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  ₦{breakdown.electricity.volume.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {breakdown.electricity.volume > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">↑ {breakdown.electricity.share}% of turnover</span>
                  ) : (
                    <span>0% of turnover</span>
                  )}
                </div>
              </div>

              {/* Cable TV */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Cable TV
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  ₦{breakdown.cable.volume.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {breakdown.cable.volume > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">↑ {breakdown.cable.share}% of turnover</span>
                  ) : (
                    <span>0% of turnover</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fresh Start / Reset Stats Modal (CEO Only) */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-heading font-bold text-lg">
                <AlertTriangle className="w-5 h-5" />
                <span>Reset Platform Statistics</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This action will reset order histories and analytics back to fresh zero.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={resetBalancesOption}
                onChange={(e) => setResetBalancesOption(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-200">
                Also reset customer wallet balances to ₦0.00
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Profit & Historical Margin Audit Report Modal */}
      <ProfitReportModal
        isOpen={isProfitModalOpen}
        onClose={() => setIsProfitModalOpen(false)}
        currentTodayProfit={todayProfit}
        currentTodaySales={todayTurnover}
      />
    </div>
  );
};
