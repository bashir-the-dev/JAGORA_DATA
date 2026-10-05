import React, { useState } from 'react';
import { Transaction, TransactionStatus, TransactionCategory, NetworkId } from '../../types';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Undo2,
  FileText,
  Wifi,
  Smartphone,
  Bolt,
  Tv,
  Wallet,
  ArrowDownLeft,
  X,
  ExternalLink,
  Info,
  TrendingUp,
  Download,
} from 'lucide-react';

interface TransactionTrackerTabProps {
  transactions: Transaction[];
  onRetryTransaction: (txId: string) => void;
  onRefundTransaction: (txId: string) => void;
  onMarkSuccessTransaction?: (txId: string, reverseRefund?: boolean) => void;
  isLightMode?: boolean;
}

export const TransactionTrackerTab: React.FC<TransactionTrackerTabProps> = ({
  transactions,
  onRetryTransaction,
  onRefundTransaction,
  onMarkSuccessTransaction,
  isLightMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Selected Transaction for Audit Details Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    // Search query check
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.recipient && tx.recipient.includes(searchTerm)) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.customerPhone && tx.customerPhone.includes(searchTerm)) ||
      tx.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Category check
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

    // Status check
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    // Network check
    if (networkFilter !== 'all' && tx.network !== networkFilter) return false;

    // Provider check
    if (providerFilter !== 'all' && tx.provider && !tx.provider.toLowerCase().includes(providerFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Calculate totals
  const totalDataVol = transactions
    .filter((t) => t.category === 'data')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAirtimeVol = transactions
    .filter((t) => t.category === 'airtime')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);

  const successCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const successRate = transactions.length > 0 ? (successCount / transactions.length) * 100 : 100;

  // Export CSV simulation
  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Ref,Title,Customer,Recipient,Amount,Cost,Profit,Provider,Status,Date']
        .concat(
          filteredTransactions.map(
            (t) =>
              `${t.id},"${t.title}","${t.customerName || 'N/A'}","${t.recipient || 'N/A'}",${t.amount},${
                t.costPrice || t.amount
              },${t.profit || 0},"${t.provider || 'Gateway'}",${t.status},"${t.date}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vtu_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-tx-tracker-tab" className="space-y-6 pb-16">
      {/* 1. TRANSACTION VOLUME SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm' : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Data Volume</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
                <Wifi size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white">
              ₦{totalDataVol.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>SME & Corporate Gifting</span>
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm' : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Airtime Volume</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Smartphone size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white">
              ₦{totalAirtimeVol.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>VTU direct recharges</span>
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm' : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Total Gross Profit</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              ₦{totalProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Wholesale spread margin</span>
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
            isLightMode ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-sm' : 'bg-slate-900 border-slate-800/80 shadow-xs'
          }`}
        >
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Delivery Success</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tabular-nums tracking-tight text-slate-900 dark:text-white">
              {successRate.toFixed(1)}%
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{successCount} of {transactions.length} orders</span>
          </div>
        </div>
      </div>

      {/* 2. FILTER & CONTROLS TOOLBAR */}
      <div
        className={`p-4 sm:p-5 rounded-xl border space-y-3 transition-all ${
          isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Ref, Phone (080...), Customer Name..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dropdown / Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">All Services</option>
            <option value="data">Data Bundles</option>
            <option value="airtime">Airtime VTU</option>
            <option value="electricity">Electricity</option>
            <option value="cable">Cable TV</option>
            <option value="funding">Wallet Funding</option>
          </select>

          {/* Network */}
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">All Networks</option>
            <option value="mtn">MTN</option>
            <option value="airtel">Airtel</option>
            <option value="glo">Glo</option>
            <option value="9mobile">9mobile</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="PENDING">Pending Orders</option>
            <option value="FAILED">Failed Orders</option>
          </select>

          {/* Provider */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">All Gateways</option>
            <option value="ClubKonnect">ClubKonnect</option>
            <option value="HusmoData">HusmoData</option>
            <option value="VTPass">VTPass</option>
            <option value="Alrahuz">Alrahuz Data</option>
            <option value="SimServer">SimServer</option>
          </select>

          {(categoryFilter !== 'all' ||
            statusFilter !== 'all' ||
            networkFilter !== 'all' ||
            providerFilter !== 'all' ||
            searchTerm) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
                setNetworkFilter('all');
                setProviderFilter('all');
                setSearchTerm('');
              }}
              className="text-[#0047cc] dark:text-blue-400 font-semibold hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. TRANSACTION LEDGER TABLE */}
      <div
        className={`rounded-xl border transition-all overflow-hidden ${
          isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Live Order Dispatch Log ({filteredTransactions.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Real-time gateway webhook sync</span>
        </div>

        {/* MOBILE TRANSACTION CARDS (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">
              No transactions match your filter criteria.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">
                      Ref: {tx.id}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {tx.title}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
                      tx.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                        : tx.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === 'SUCCESS'
                          ? 'bg-emerald-500'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="capitalize">{tx.status.toLowerCase()}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-mono font-medium">
                    {tx.recipient ? `To: ${tx.recipient}` : tx.subtitle}
                  </span>
                  <span className="text-[11px] text-slate-400">{tx.date}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Amount / Margin
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      ₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                    {tx.profit !== undefined && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold ml-1.5">
                        (+₦{tx.profit.toFixed(2)})
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Gateway / Customer
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tx.provider || 'Gateway Router'}
                    </span>
                  </div>
                </div>

                {/* Mobile Touch Action Buttons (min 44px) */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <FileText size={15} className="text-slate-400" />
                    <span>Audit Details</span>
                  </button>

                  {(tx.status === 'FAILED' || tx.status === 'PENDING') && onMarkSuccessTransaction && (
                    <button
                      onClick={() => onMarkSuccessTransaction(tx.id, tx.refunded)}
                      className="min-h-[44px] px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all shadow-xs"
                      title="Mark as confirmed delivered & update status to SUCCESS"
                    >
                      <CheckCircle2 size={15} />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {(tx.status === 'FAILED' || tx.status === 'PENDING') && (
                    <button
                      onClick={() => onRetryTransaction(tx.id)}
                      className="min-h-[44px] px-3.5 rounded-xl bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                    >
                      <RotateCcw size={15} />
                      <span>Retry</span>
                    </button>
                  )}

                  {tx.status === 'FAILED' && !tx.refunded && (
                    <button
                      onClick={() => onRefundTransaction(tx.id)}
                      className="min-h-[44px] px-3.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                    >
                      <Undo2 size={15} />
                      <span>Refund</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans text-[10px] font-semibold">
                <th className="py-3 px-4">Ref ID & Time</th>
                <th className="py-3 px-4">Service & Recipient</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">API Gateway</th>
                <th className="py-3 px-4">Amount / Profit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No transactions match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Ref & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-sans tabular-nums font-semibold text-slate-900 dark:text-white text-xs">
                        {tx.id}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">{tx.date}</div>
                    </td>

                    {/* Service & Recipient */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans tabular-nums">
                        {tx.recipient ? `To: ${tx.recipient}` : tx.subtitle}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {tx.customerName || 'Al\'amin Jagora User'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans tabular-nums">
                        {tx.customerPhone || '08001234567'}
                      </div>
                    </td>

                    {/* Gateway */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-sans text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70">
                        {tx.provider || 'Gateway Router'}
                      </span>
                    </td>

                    {/* Price & Margin */}
                    <td className="py-3.5 px-4">
                      <div className="font-sans tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                        ₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      {tx.profit !== undefined && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans tabular-nums font-semibold mt-0.5">
                          +₦{tx.profit.toFixed(2)} margin
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-500'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        ></span>
                        <span className="capitalize">{tx.status.toLowerCase()}</span>
                      </span>
                      {tx.refunded && (
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                          [Refunded]
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Gateway Audit Details"
                        >
                          <FileText size={14} />
                        </button>

                        {(tx.status === 'FAILED' || tx.status === 'PENDING') && onMarkSuccessTransaction && (
                          <button
                            onClick={() => onMarkSuccessTransaction(tx.id, tx.refunded)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                            title="Confirm order was delivered & mark SUCCESS"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}

                        {(tx.status === 'FAILED' || tx.status === 'PENDING') && (
                          <button
                            onClick={() => onRetryTransaction(tx.id)}
                            className="p-1.5 rounded-lg bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            title="Retry order via fallback provider"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}

                        {tx.status === 'FAILED' && !tx.refunded && (
                          <button
                            onClick={() => onRefundTransaction(tx.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            title="Refund Customer Wallet"
                          >
                            <Undo2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TRANSACTION AUDIT DETAILS MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Transaction Audit & Gateway Log
                </h3>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">{selectedTx.id}</span>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-mono font-bold">Service</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedTx.title}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-mono font-bold">Status</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedTx.status}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-mono font-bold">Recipient</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTx.recipient || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-mono font-bold">Gateway Provider</span>
                  <span className="font-mono font-bold text-[#0047cc] dark:text-blue-400">
                    {selectedTx.provider || 'Default'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-mono font-bold">Customer Retail Price</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₦{selectedTx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-mono font-bold">Wholesale Cost / Profit</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                    ₦{(selectedTx.costPrice || selectedTx.amount).toFixed(2)} (+₦{(selectedTx.profit || 0).toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Raw Gateway Webhook Response */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-mono">
                  Upstream Gateway Response Payload
                </label>
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {selectedTx.gatewayResponse ||
                    `{ "status": 200, "message": "Transaction routed successfully", "timestamp": "${selectedTx.date}" }`}
                </div>
              </div>

              {selectedTx.token && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    Generated Token / PIN Code
                  </span>
                  <span className="font-mono font-black text-sm text-amber-900 dark:text-amber-200 tracking-wider">
                    {selectedTx.token}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {(selectedTx.status === 'FAILED' || selectedTx.status === 'PENDING') && onMarkSuccessTransaction && (
                <button
                  onClick={() => {
                    onMarkSuccessTransaction(selectedTx.id, selectedTx.refunded);
                    setSelectedTx(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>Confirm Delivered (Success)</span>
                </button>
              )}

              {(selectedTx.status === 'FAILED' || selectedTx.status === 'PENDING') && (
                <button
                  onClick={() => {
                    onRetryTransaction(selectedTx.id);
                    setSelectedTx(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RotateCcw size={14} />
                  <span>Retry via Backup Gateway</span>
                </button>
              )}

              {selectedTx.status === 'FAILED' && !selectedTx.refunded && (
                <button
                  onClick={() => {
                    onRefundTransaction(selectedTx.id);
                    setSelectedTx(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Undo2 size={14} />
                  <span>Refund Customer Wallet</span>
                </button>
              )}

              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
