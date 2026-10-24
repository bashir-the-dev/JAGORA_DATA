import React, { useState, useMemo } from 'react';
import { Transaction, TransactionCategory } from '../../types';
import { deduplicateTransactions } from '../../services/dbService';
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  Receipt,
  SlidersHorizontal,
  Wifi,
  Bolt,
  Tv,
  ArrowDownLeft,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

interface HistoryScreenProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onRepeatTransaction?: (tx: Transaction) => void;
  isLightMode?: boolean;
}

type CategoryFilter = 'All' | 'data' | 'airtime' | 'utility' | 'funding';
type StatusFilter = 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  transactions,
  onSelectTransaction,
  onRepeatTransaction,
  isLightMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [showStatusFilters, setShowStatusFilters] = useState(false);

  // Category filter tabs
  const categoryTabs: Array<{ label: string; value: CategoryFilter }> = [
    { label: 'All', value: 'All' },
    { label: 'Data', value: 'data' },
    { label: 'Airtime', value: 'airtime' },
    { label: 'Bills', value: 'utility' },
    { label: 'Inflow', value: 'funding' },
  ];

  // Status pills
  const statusOptions: Array<{ label: string; value: StatusFilter }> = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Successful', value: 'SUCCESS' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Refunded', value: 'REFUNDED' },
  ];

  // Deduplicate transactions to guarantee no duplicate history entries
  const uniqueTransactions = useMemo(() => {
    return deduplicateTransactions(transactions);
  }, [transactions]);

  // Filter transactions
  const filtered = uniqueTransactions.filter((tx) => {
    // Category match
    if (selectedCategory !== 'All' && tx.category !== selectedCategory) {
      return false;
    }

    // Status match
    if (selectedStatus !== 'ALL') {
      const rawStatus = String(tx.status || 'SUCCESS').toUpperCase();
      const isRefunded = rawStatus === 'REFUNDED' || String(tx.title || '').toLowerCase().includes('refund');
      if (selectedStatus === 'REFUNDED') {
        if (!isRefunded) return false;
      } else if (selectedStatus === 'SUCCESS') {
        if (rawStatus !== 'SUCCESS' || isRefunded) return false;
      } else if (rawStatus !== selectedStatus) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchTitle = (tx.title || '').toLowerCase().includes(query);
      const matchSubtitle = (tx.subtitle || '').toLowerCase().includes(query);
      const matchRecipient = tx.recipient ? String(tx.recipient).toLowerCase().includes(query) : false;
      const matchId = String(tx.id || '').toLowerCase().includes(query);
      const matchAmount = String(tx.amount ?? '').includes(query);
      if (!matchTitle && !matchSubtitle && !matchRecipient && !matchId && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  // Group transactions by date group
  const groupedTransactions: Record<string, Transaction[]> = {};
  filtered.forEach((tx) => {
    const group = tx.group || 'Recent';
    if (!groupedTransactions[group]) {
      groupedTransactions[group] = [];
    }
    groupedTransactions[group].push(tx);
  });

  const handleResetFilters = () => {
    playTapSound();
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('ALL');
  };

  // Helper for rendering standard transaction logos
  const renderIcon = (tx: Transaction) => {
    const titleLower = (tx.title + ' ' + (tx.subtitle || '')).toLowerCase();

    if (titleLower.includes('mtn')) {
      return <TelecomLogo network="mtn" size="sm" className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs" />;
    }
    if (titleLower.includes('airtel')) {
      return <TelecomLogo network="airtel" size="sm" className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs" />;
    }
    if (titleLower.includes('glo')) {
      return <TelecomLogo network="glo" size="sm" className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs" />;
    }
    if (titleLower.includes('9mobile') || titleLower.includes('etisalat')) {
      return <TelecomLogo network="9mobile" size="sm" className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs" />;
    }
    if (tx.category === 'funding' || tx.isCredit) {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center shrink-0 shadow-2xs">
          <ArrowDownLeft size={18} className="stroke-[2.5]" />
        </div>
      );
    }
    if (tx.iconType === 'bolt' || titleLower.includes('electric') || titleLower.includes('disco')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center shrink-0 shadow-2xs">
          <Bolt size={18} className="stroke-[2.5]" />
        </div>
      );
    }
    if (titleLower.includes('dstv') || titleLower.includes('gotv') || titleLower.includes('startimes') || titleLower.includes('cable')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center shrink-0 shadow-2xs">
          <Tv size={18} className="stroke-[2.5]" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center shrink-0 shadow-2xs">
        <Wifi size={18} className="stroke-[2.5]" />
      </div>
    );
  };

  // Standard status badge
  const renderStatusBadge = (tx: Transaction) => {
    const rawStatus = String(tx.status || 'SUCCESS').toUpperCase();
    const isRefunded = rawStatus === 'REFUNDED' || (tx.title && String(tx.title).toLowerCase().includes('refund'));

    if (isRefunded) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <RotateCcw size={9} className="stroke-[2.5]" />
          <span>Refunded</span>
        </span>
      );
    }

    if (rawStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock size={9} className="stroke-[2.5]" />
          <span>Pending</span>
        </span>
      );
    }

    if (rawStatus === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertCircle size={9} className="stroke-[2.5]" />
          <span>Failed</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
        <CheckCircle2 size={9} className="stroke-[2.5]" />
        <span>Successful</span>
      </span>
    );
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedStatus !== 'ALL';

  return (
    <div id="screen-history" className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-5xl mx-auto w-full">
      {/* 1. STANDARD HEADER */}
      <div className="pt-1">
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Transactions
        </h1>
        <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          History of your top-ups, bills, and wallet activity
        </p>
      </div>

      {/* 2. STANDARD SEARCH & TABS */}
      <section className="space-y-2.5">
        {/* Search Input + Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, phone, or reference..."
              className={`w-full rounded-xl pl-9 pr-9 py-2.5 text-xs font-sans border focus:outline-none transition-all shadow-2xs placeholder:text-slate-400 ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  : 'bg-slate-900 border-slate-800 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowStatusFilters(!showStatusFilters);
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs shrink-0 ${
              showStatusFilters || selectedStatus !== 'ALL'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
            title="Toggle Status Filters"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Standard Category Segmented Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                id={`filter-tab-${tab.value}`}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedCategory(tab.value);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all active:scale-95 border cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Expandable Status Filter Row */}
        {showStatusFilters && (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none animate-in fade-in duration-150">
            <span className="text-[11px] font-sans font-medium text-slate-500 pl-1 shrink-0">Status:</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedStatus(opt.value);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition-all shrink-0 cursor-pointer ${
                  selectedStatus === opt.value
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. STANDARD TRANSACTION LIST */}
      <section className="space-y-4">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
            <Receipt size={32} className="mx-auto text-slate-400 stroke-[1.5] mb-2" />
            <h3 className="font-heading text-sm font-bold text-slate-800 dark:text-slate-200">
              No transactions found
            </h3>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {hasActiveFilters
                ? 'No activity matches your current filters or search terms.'
                : 'Your transactions will appear here once you top-up data, airtime, or fund your wallet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([groupTitle, items]) => (
            <div key={groupTitle} className="space-y-2">
              {/* Standard Group Header */}
              <div className="flex items-center justify-between px-1">
                <span className="font-heading text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                  {groupTitle}
                </span>
                <span className="font-sans text-[11px] text-slate-400 font-medium">
                  {items.length} {items.length === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>

              {/* Standard Group Container */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
                {items.map((tx) => (
                  <div
                    key={tx.id}
                    id={`tx-${tx.id}`}
                    onClick={() => {
                      playTapSound();
                      onSelectTransaction(tx);
                    }}
                    className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group select-none"
                  >
                    {/* Left: Standard Icon + Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {renderIcon(tx)}

                      <div className="min-w-0 flex-1">
                        <div className="font-heading text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {tx.title}
                        </div>
                        <div className="flex items-center gap-1.5 font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="truncate">{tx.recipient || tx.subtitle || 'Account Order'}</span>
                          <span>•</span>
                          <span className="truncate">{tx.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount + Status Badge + Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-mono text-xs sm:text-sm font-bold block tabular-nums ${
                            tx.status === 'FAILED'
                              ? 'text-rose-500 line-through'
                              : tx.isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {tx.isCredit ? '+ ' : '- '}₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="mt-0.5 flex justify-end">
                          {renderStatusBadge(tx)}
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default HistoryScreen;
