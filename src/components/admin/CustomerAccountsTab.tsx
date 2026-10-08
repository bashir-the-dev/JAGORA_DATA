import React, { useState } from 'react';
import { PlatformUserAccount } from '../../types';
import {
  Users,
  Search,
  Lock,
  Unlock,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Filter,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface CustomerAccountsTabProps {
  users: PlatformUserAccount[];
  onAdjustUserWallet: (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => void;
  onToggleUserStatus: (userId: string) => void;
  isLightMode?: boolean;
  showToast?: (msg: string) => void;
  onNavigateToWallets?: () => void;
  currentAdmin?: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const CustomerAccountsTab: React.FC<CustomerAccountsTabProps> = ({
  users,
  onAdjustUserWallet,
  onToggleUserStatus,
  isLightMode,
  showToast,
  onNavigateToWallets,
  currentAdmin,
  onRefresh,
  isRefreshing,
}) => {
  // Helper to detect administrative or staff accounts (must never be suspended or listed as customer)
  const isUserAdminOrSelf = (u: PlatformUserAccount) => {
    return (
      u.role === 'admin' ||
      u.role === 'support_agent' ||
      u.role === 'finance_agent' ||
      Boolean(u.isAdmin) ||
      u.id === 'usr_admin_01' ||
      u.phone === '08123456789' ||
      u.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
      (currentAdmin &&
        (u.phone === currentAdmin.phone ||
          u.email?.toLowerCase() === currentAdmin.email?.toLowerCase() ||
          u.id === currentAdmin.id))
    );
  };

  // Pure customer accounts only (Admins and Staff are managed in Staff Management)
  const customerUsers = users.filter((u) => !isUserAdminOrSelf(u));

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'flagged'>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'spent_desc' | 'name_asc'>('balance_desc');

  // Selected user for details drawer
  const [inspectUser, setInspectUser] = useState<PlatformUserAccount | null>(null);

  // User Adjustment Modal State
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<PlatformUserAccount | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Dispute settlement / Auto-funding correction');

  // Aggregate customer calculations (based strictly on customer accounts)
  const totalUsers = customerUsers.length;
  const activeUsersCount = customerUsers.filter((u) => u.status === 'active').length;
  const suspendedUsersCount = customerUsers.filter((u) => u.status === 'suspended' || u.status === 'flagged').length;
  const totalUserBalanceLiability = customerUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalLifetimeSpent = customerUsers.reduce((sum, u) => sum + (u.totalSpent || 0), 0);

  // Filter and sort customer users
  const filteredUsers = customerUsers
    .filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'balance_desc') return b.balance - a.balance;
      if (sortBy === 'balance_asc') return a.balance - b.balance;
      if (sortBy === 'spent_desc') return b.totalSpent - a.totalSpent;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAdjust) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) return;
    onAdjustUserWallet(selectedUserForAdjust.id, num, adjustType, adjustReason);
    setSelectedUserForAdjust(null);
    setAdjustAmount('');
  };

  return (
    <div id="admin-customer-accounts-tab" className="space-y-6 pb-16">
      {/* 1. CUSTOMER OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
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
                Total Customers
              </span>
              <div className="flex items-center gap-1.5">
                {onRefresh && (
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      showToast?.('Customer accounts & sign-ups refreshed');
                    }}
                    disabled={isRefreshing}
                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-[#0047cc] dark:hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Refresh new customer sign-ups"
                  >
                    <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[#0047cc]" : ""} />
                  </button>
                )}
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white">
              {totalUsers.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {activeUsersCount} Active
            </span>
            <span>•</span>
            <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {suspendedUsersCount} Frozen
            </span>
          </div>
        </div>

        {/* User Balance Liabilities */}
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
                Customer Liabilities
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white truncate">
              ₦{totalUserBalanceLiability.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Aggregated user wallet balances</span>
          </div>
        </div>

        {/* Lifetime Spend */}
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
                Lifetime Turnover
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              ₦{totalLifetimeSpent.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Cumulative customer transaction volume</span>
          </div>
        </div>

        {/* Treasury Health Link */}
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
                Platform Floats
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Upstream gateway reserves, solvency ratio & telecom balances.
            </p>
          </div>
          {onNavigateToWallets && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70">
              <button
                onClick={onNavigateToWallets}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0047cc] dark:text-blue-400 font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>View Floats & Reserves</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SEARCH, FILTERS & CONTROLS */}
      <div
        className={`p-4 sm:p-5 rounded-xl border transition-all ${
          isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone number, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter by account status"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0047cc]"
            >
              <option value="all">All Statuses ({totalUsers})</option>
              <option value="active">Active Only ({activeUsersCount})</option>
              <option value="suspended">Suspended ({users.filter((u) => u.status === 'suspended').length})</option>
              <option value="flagged">Flagged ({users.filter((u) => u.status === 'flagged').length})</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort customer list"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0047cc]"
            >
              <option value="balance_desc">Highest Balance First</option>
              <option value="balance_asc">Lowest Balance First</option>
              <option value="spent_desc">Highest Lifetime Spend</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>

            {onRefresh && (
              <button
                type="button"
                onClick={() => {
                  onRefresh();
                  showToast?.('Customer accounts & sign-ups refreshed');
                }}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800 text-[#0047cc] dark:text-blue-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
                title="Refresh customer accounts & recent sign-ups without reloading browser"
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin text-[#0047cc]" : ""} />
                <span>Refresh Sign-ups</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-sans tabular-nums">{filteredUsers.length}</strong> of {totalUsers} registered customer accounts
          </span>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-[#0047cc] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. CUSTOMER ACCOUNTS DIRECTORY / TABLE */}
      <div
        className={`rounded-xl border transition-all overflow-hidden ${
          isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Customer Accounts & Wallets Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage user permissions, audit balances, credit/debit adjustments, and security status
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching customer accounts</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search query or reset the filters.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE-FIRST CUSTOMER CARDS (Screen width < 768px) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.map((u) => {
                const isSuspended = u.status === 'suspended';
                const isFlagged = u.status === 'flagged';

                return (
                  <div
                    key={u.id}
                    className="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Top Row: Customer Info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                            isSuspended
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                              : 'bg-blue-50 text-[#0047cc] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40'
                          }`}
                        >
                          {u.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {u.name}
                          </h3>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>ID: {u.id}</span>
                            <span>•</span>
                            <span>Joined {u.registeredDate || '2024'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                            : isFlagged
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-500'
                              : isFlagged
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="font-mono font-medium">{u.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </div>

                    {/* Balances Block */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">
                          Wallet Balance
                        </span>
                        <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                          ₦{u.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">
                          Total Orders
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {u.totalOrders} txs (₦{u.totalSpent.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row (min 44px tap targets for mobile usability) */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedUserForAdjust(u)}
                        className="flex-1 min-h-[44px] px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
                      >
                        <CreditCard size={15} />
                        <span>Adjust Balance</span>
                      </button>

                      {isUserAdminOrSelf(u) ? (
                        <div
                          className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                          title="Administrator and staff accounts cannot be suspended"
                        >
                          <ShieldCheck size={15} className="text-emerald-500" />
                          <span>Protected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`min-h-[44px] px-3.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                            u.status === 'active'
                              ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 bg-white dark:bg-slate-800'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                          title={u.status === 'active' ? 'Suspend user' : 'Reactivate user'}
                        >
                          {u.status === 'active' ? (
                            <>
                              <Lock size={15} className="text-rose-500" />
                              <span>Freeze</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={15} className="text-emerald-600" />
                              <span>Unfreeze</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setInspectUser(u)}
                        className="min-h-[44px] w-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-98"
                        title="View Full Profile Details"
                        aria-label="View user profile"
                      >
                        <User size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (Screen width >= 768px, KYC Column fully eliminated) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans text-[10px] font-semibold">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contact / Registered</th>
                    <th className="py-3 px-4">Wallet Balance</th>
                    <th className="py-3 px-4">Bonus Balance</th>
                    <th className="py-3 px-4">Lifetime Spent</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.status === 'suspended';
                    const isFlagged = u.status === 'flagged';

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setInspectUser(u)}
                      >
                        {/* Name & Initials */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSuspended
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                  : 'bg-blue-50 text-[#0047cc] dark:bg-blue-950/60 dark:text-blue-400'
                              }`}
                            >
                              {u.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-sans tabular-nums">
                                ID: {u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info & Registration */}
                        <td className="py-3.5 px-4">
                          <div className="font-sans tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                            {u.phone}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {u.email}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Joined {u.registeredDate || '2023'}
                          </div>
                        </td>

                        {/* Wallet Balance */}
                        <td className="py-3.5 px-4 font-sans tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                          ₦{u.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Bonus */}
                        <td className="py-3.5 px-4 font-sans tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                          ₦{u.bonusBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Total Spent */}
                        <td className="py-3.5 px-4 font-sans tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                          <div>₦{u.totalSpent.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                            {u.totalOrders} total orders
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-normal flex items-center gap-1.5 w-fit border ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                                : isFlagged
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'active'
                                  ? 'bg-emerald-500'
                                  : isFlagged
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="capitalize">{u.status}</span>
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserForAdjust(u)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0047cc] dark:text-blue-400 font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                              title="Adjust wallet balance with credit/debit"
                            >
                              <span>Adjust</span>
                            </button>

                            {isUserAdminOrSelf(u) ? (
                              <span
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-100 dark:bg-slate-800/60 inline-flex items-center justify-center"
                                title="Administrator and staff accounts cannot be suspended"
                              >
                                <ShieldCheck size={14} className="text-emerald-500" />
                              </span>
                            ) : (
                              <button
                                onClick={() => onToggleUserStatus(u.id)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  u.status === 'active'
                                    ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                }`}
                                title={u.status === 'active' ? 'Freeze / Suspend Account' : 'Re-activate Account'}
                              >
                                {u.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* INSPECT CUSTOMER DRAWER / MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-md w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  {inspectUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{inspectUser.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
                        inspectUser.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          inspectUser.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      ></span>
                      <span className="capitalize">{inspectUser.status}</span>
                    </span>
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block font-sans tabular-nums mt-0.5">
                    Customer ID: {inspectUser.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Financial Status Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Wallet Balance
                </span>
                <span className="text-base font-bold font-sans tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                  ₦{inspectUser.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Bonus Balance
                </span>
                <span className="text-base font-bold font-sans tabular-nums text-amber-600 dark:text-amber-400 mt-0.5 block">
                  ₦{inspectUser.bonusBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <Phone size={14} />
                  <span>Phone Number</span>
                </div>
                <span className="font-sans tabular-nums font-semibold text-slate-900 dark:text-white">{inspectUser.phone}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <Mail size={14} />
                  <span>Email Address</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{inspectUser.email}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <ShieldCheck size={14} />
                  <span>Account Status</span>
                </div>
                <span className="font-semibold capitalize text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${inspectUser.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {inspectUser.status}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <Calendar size={14} />
                  <span>Registration Date</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{inspectUser.registeredDate}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <ArrowUpRight size={14} />
                  <span>Total Orders & Volume</span>
                </div>
                <span className="font-sans tabular-nums font-semibold text-slate-900 dark:text-white">
                  {inspectUser.totalOrders} orders (₦{inspectUser.totalSpent.toLocaleString()})
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = inspectUser;
                  setInspectUser(null);
                  setSelectedUserForAdjust(target);
                }}
                className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] text-white py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <CreditCard size={14} />
                <span>Adjust Balance</span>
              </button>

              {isUserAdminOrSelf(inspectUser) ? (
                <div
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                  title="Administrator and staff accounts cannot be suspended"
                >
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Protected Account</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onToggleUserStatus(inspectUser.id);
                    setInspectUser((prev) =>
                      prev ? { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' } : null
                    );
                  }}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer active:scale-95 ${
                    inspectUser.status === 'active'
                      ? 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  {inspectUser.status === 'active' ? 'Freeze Account' : 'Activate Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADJUST USER WALLET MODAL */}
      {selectedUserForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-sm w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Manual Wallet Adjustment
                </h4>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-sans tabular-nums mt-0.5">
                  {selectedUserForAdjust.name} ({selectedUserForAdjust.phone})
                </span>
              </div>
              <button
                onClick={() => setSelectedUserForAdjust(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3.5">
              <div className="flex gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/70">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    adjustType === 'credit'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft size={14} />
                  <span>Credit (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    adjustType === 'debit'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight size={14} />
                  <span>Debit (-)</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 font-sans tabular-nums text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Audit Reason / Ticket Reference
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                  required
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-sans tabular-nums">
                Current Wallet Balance: <span className="font-semibold text-slate-700 dark:text-slate-300">₦{selectedUserForAdjust.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAdjust(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 text-white py-2.5 rounded-lg text-xs font-semibold shadow-2xs active:scale-[0.99] cursor-pointer ${
                    adjustType === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Apply {adjustType === 'credit' ? 'Credit' : 'Debit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
