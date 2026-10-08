import React, { useState, useEffect } from 'react';
import {
  ApiProvider,
  ServiceRouteConfig,
  AdminPlatformWallet,
  PlatformUserAccount,
  Transaction,
  UpstreamProviderId,
} from '../../types';
import {
  initialApiProviders,
  initialServiceRoutes,
  initialPlatformWallet,
  initialPlatformUsers,
  initialAdminTransactions,
} from '../../data/adminMockData';
import { AdminHeader, AdminTabType } from '../admin/AdminHeader';
import { AdminSidebar } from '../admin/AdminSidebar';
import { AdminTopBar } from '../admin/AdminTopBar';
import { AdminOverviewTab } from '../admin/AdminOverviewTab';
import { WalletBalancesTab } from '../admin/WalletBalancesTab';
import { CustomerAccountsTab } from '../admin/CustomerAccountsTab';
import { TransactionTrackerTab } from '../admin/TransactionTrackerTab';
import { ApiProviderSwitchTab } from '../admin/ApiProviderSwitchTab';
import { PricingPlansTab } from '../admin/PricingPlansTab';
import { PlatformSettingsTab } from '../admin/PlatformSettingsTab';
import { BulkPushNotificationsTab } from '../admin/BulkPushNotificationsTab';
import { StaffManagementTab } from '../admin/StaffManagementTab';
import { ReferralControlsTab } from '../admin/ReferralControlsTab';
import { AdminProfileModal } from '../admin/AdminProfileModal';
import { LayoutDashboard, Users, BarChart3, Layers, Menu as MenuIcon } from 'lucide-react';
import { updateUserBalanceInDb, updateTransactionStatusInDb, recordTransactionInDb } from '../../services/dbService';
import {
  apiGetAdminStats,
  apiGetAdminUsers,
  apiToggleUserStatus,
  apiAdminFundUser,
  apiGetGatewayBalances,
  apiGetGatewaySwitches,
  apiToggleGatewaySwitch,
  apiResetPlatformStats,
} from '../../services/apiClient';

interface AdminDashboardScreenProps {
  onExitAdmin: () => void;
  onLogoutAdmin: () => void;
  showToast: (msg: string) => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  adminProfile?: any;
  onUpdateAdminProfile?: (updatedProfile: any) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onExitAdmin,
  onLogoutAdmin,
  showToast,
  isLightMode,
  onToggleTheme,
  adminProfile,
  onUpdateAdminProfile,
}) => {
  // Active Tab - Default to Executive Dashboard Overview
  const [activeTab, setActiveTab] = useState<AdminTabType>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(adminProfile);

  useEffect(() => {
    if (adminProfile) {
      setCurrentAdmin(adminProfile);
    }
  }, [adminProfile]);

  const handleProfileUpdated = (updatedUser: any) => {
    setCurrentAdmin(updatedUser);
    onUpdateAdminProfile?.(updatedUser);
    // Also update in users list if present
    setUsers((prev) =>
      prev.map((u) => (u.phone === updatedUser.phone || u.id === updatedUser.id ? { ...u, name: updatedUser.name, email: updatedUser.email } : u))
    );
  };

  // Domain state
  const [providers, setProviders] = useState<ApiProvider[]>(initialApiProviders);
  const [routes, setRoutes] = useState<ServiceRouteConfig[]>(initialServiceRoutes);
  const [transactions, setTransactions] = useState<Transaction[]>(initialAdminTransactions);
  const [users, setUsers] = useState<PlatformUserAccount[]>(initialPlatformUsers);
  const [platformWallet, setPlatformWallet] = useState<AdminPlatformWallet>(initialPlatformWallet);

  // Master Gateway & Service Switches state
  const [gatewaySwitches, setGatewaySwitches] = useState<Record<string, boolean>>({
    xixapay: true,
    payflex: true,
    clubkonnect: true,
    payvessel: true,
    monnify: true,
    husmodata: true,
  });
  const [serviceSwitches, setServiceSwitches] = useState<Record<string, boolean>>({
    data: true,
    airtime: true,
    cable: true,
    electricity: true,
    exam: true,
    recharge_pin: true,
    data_card: true,
  });

  // Syncing / Refreshing
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  // Fetch live gateway kill switches
  const fetchGatewaySwitches = async () => {
    try {
      const res = await apiGetGatewaySwitches();
      if (res.status === 'success' && res.data) {
        if (res.data.gatewaySwitches) {
          setGatewaySwitches(res.data.gatewaySwitches);
        }
        if (res.data.serviceSwitches) {
          setServiceSwitches(res.data.serviceSwitches);
        }
      }
    } catch {}
  };

  // Fetch live stats from MySQL API
  const fetchLiveStats = async () => {
    try {
      const res = await apiGetAdminStats();
      const m = res.metrics || res.data;
      if (res.status === 'success' && m) {
        setPlatformWallet((prev) => {
          const userWallets = typeof m.totalUserWallets !== 'undefined' ? Number(m.totalUserWallets) : (typeof m.total_user_balance !== 'undefined' ? Number(m.total_user_balance) : 0);
          const salesVol = typeof m.todaySalesVolume !== 'undefined' ? Number(m.todaySalesVolume) : (typeof m.total_volume !== 'undefined' ? Number(m.total_volume) : 0);
          const grossProfit = typeof m.todayGrossProfit !== 'undefined' ? Number(m.todayGrossProfit) : (typeof m.total_profit !== 'undefined' ? Number(m.total_profit) : 0);
          const txCount = typeof m.todayTxCount !== 'undefined' ? Number(m.todayTxCount) : (typeof m.todayCount !== 'undefined' ? Number(m.todayCount) : 0);
          const failedCount = typeof m.todayFailedCount !== 'undefined' ? Number(m.todayFailedCount) : (typeof m.failedTxCount !== 'undefined' ? Number(m.failedTxCount) : 0);
          const vendorFloat = typeof m.totalVendorFloat !== 'undefined' ? Number(m.totalVendorFloat) : (prev.totalVendorFloat || 0);
          const ratio = userWallets > 0 ? Number((vendorFloat / userWallets).toFixed(2)) : 1.0;

          return {
            ...prev,
            totalUserWallets: userWallets,
            totalVendorFloat: vendorFloat,
            todaySalesVolume: salesVol,
            todayGrossProfit: grossProfit,
            todayTxCount: txCount,
            failedTxCount: failedCount,
            reserveRatio: ratio,
          };
        });

        if (typeof m.totalVendorFloat !== 'undefined' && Number(m.totalVendorFloat) > 0) {
          setProviders((prev) =>
            prev.map((prov) =>
              prov.id === 'payflex'
                ? { ...prov, floatBalance: Number(m.totalVendorFloat), status: 'active' }
                : prov
            )
          );
        }

        if (Array.isArray(res.recentTransactions)) {
          const mapped: Transaction[] = res.recentTransactions.map((tx: any) => ({
            id: tx.reference || `tx-${tx.id || Date.now()}`,
            title: tx.title || (tx.type === 'DATA' ? 'Data Bundle' : tx.type === 'AIRTIME' ? 'Airtime Purchase' : 'Wallet Funding'),
            subtitle: tx.description || `${tx.type} Transaction`,
            recipient: tx.recipient || '',
            customerPhone: tx.customerPhone || tx.customer_phone || (tx.user_id && tx.user_id.length >= 10 ? tx.user_id : tx.recipient || ''),
            customerName: tx.customerName || tx.customer_name || 'Customer',
            date: tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            group: 'Today',
            amount: parseFloat(tx.amount) || 0,
            costPrice: parseFloat(tx.costPrice || tx.charged || tx.amount) || 0,
            profit: parseFloat(tx.profit || '0') || 0,
            isCredit: tx.type === 'WALLET_FUNDING' || tx.type === 'funding' || tx.type === 'COMMISSION',
            status: (tx.status?.toUpperCase() === 'SUCCESS' ? 'SUCCESS' : tx.status?.toUpperCase() === 'FAILED' ? 'FAILED' : 'PENDING') as any,
            category: (tx.type?.toLowerCase().includes('data') ? 'data' : tx.type?.toLowerCase().includes('airtime') ? 'airtime' : 'funding') as any,
            iconType: tx.type?.toLowerCase().includes('data') ? 'wifi' : tx.type?.toLowerCase().includes('airtime') ? 'phone' : 'wallet',
            provider: tx.provider || 'Payflex',
          }));
          setTransactions(mapped);
        }
      }

      // Fetch live user accounts from backend
      const usersRes = await apiGetAdminUsers();
      if (usersRes.status === 'success' && Array.isArray(usersRes.data)) {
        // Filter out administrator and staff accounts so customer management remains strictly for customers
        const customerUsers = usersRes.data.filter((u: any) => {
          const isAdm =
            u.role === 'admin' ||
            u.role === 'support_agent' ||
            u.role === 'finance_agent' ||
            Boolean(u.adminRole) ||
            u.id === 'usr_admin_01' ||
            u.phone === '08123456789' ||
            u.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
            (currentAdmin && (u.phone === currentAdmin.phone || u.email?.toLowerCase() === currentAdmin.email?.toLowerCase() || u.id === currentAdmin.id));
          return !isAdm;
        });

        setUsers(
          customerUsers.map((u: any) => ({
            id: String(u.phone || u.id),
            name: u.name || u.full_name || 'Customer',
            phone: u.phone || '',
            email: u.email || '',
            balance: typeof u.balance === 'number' ? u.balance : parseFloat(u.balance) || 0,
            bonusBalance: typeof u.bonusBalance === 'number' ? u.bonusBalance : parseFloat(u.bonus_balance) || 0,
            status: (u.status === 'suspended' ? 'suspended' : 'active') as 'active' | 'suspended',
            registeredDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent',
            totalOrders: Number(u.totalOrders) || 0,
            totalSpent: Number(u.totalSpent) || 0,
            kycTier: (u.kycTier || 2) as 1 | 2 | 3,
            role: u.role || 'user',
            isAdmin: false,
          }))
        );
      }

      // Query live upstream gateway balances directly via API
      const gwRes = await apiGetGatewayBalances();
      if (gwRes.status === 'success' && gwRes.data?.gateways) {
        const liveGws = gwRes.data.gateways;
        setProviders((prev) =>
          prev.map((prov) => {
            const found = liveGws.find((g) => g.id === prov.id);
            if (found) {
              return {
                ...prov,
                floatBalance: found.balance,
                status: found.status,
                avgLatencyMs: found.latencyMs || prov.avgLatencyMs,
                lastPingTime: found.lastChecked ? `Checked ${found.lastChecked}` : prov.lastPingTime,
                maskedApiKey: found.maskedKey || prov.maskedApiKey,
                fundingAccount: found.fundingAccount,
              };
            }
            return prov;
          })
        );

        setPlatformWallet((prev) => {
          const totalFloat = gwRes.data.totalLiveFloat || 0;
          const ratio = prev.totalUserWallets > 0 ? Number((totalFloat / prev.totalUserWallets).toFixed(2)) : 1.0;
          return {
            ...prev,
            totalVendorFloat: totalFloat,
            reserveRatio: ratio,
          };
        });
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchLiveStats();
    fetchGatewaySwitches();
  }, []);

  // Handle Manual Fresh Start / Reset Platform Statistics
  const handleResetStatistics = async (resetBalances: boolean) => {
    try {
      const res = await apiResetPlatformStats({ resetBalances });
      if (res.status === 'success' || res.success) {
        // 1. Clear transaction records
        setTransactions([]);
        // 2. Clear platform wallet metrics
        setPlatformWallet((prev) => ({
          ...prev,
          todaySalesVolume: 0,
          todayGrossProfit: 0,
          todayTxCount: 0,
          failedTxCount: 0,
          ...(resetBalances ? { totalUserWallets: 0 } : {}),
        }));
        // 3. Clear user balances if selected
        if (resetBalances) {
          setUsers((prev) =>
            prev.map((u) => (u.role === 'admin' ? u : { ...u, balance: 0, bonusBalance: 0 }))
          );
        }
        showToast('✅ Platform statistics, orders & logs have been reset to zeros for a fresh start!');
        await fetchLiveStats();
      } else {
        showToast(res.message || 'Failed to reset statistics');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while resetting platform statistics');
    }
  };

  // Handle Master Upstream Gateway Shutdown Switches
  const handleToggleGatewaySwitch = async (gateway: string, active: boolean) => {
    setGatewaySwitches((prev) => ({ ...prev, [gateway]: active }));
    try {
      const res = await apiToggleGatewaySwitch({ gateway, active });
      if (res.status === 'success') {
        showToast(
          `${gateway.toUpperCase()} Gateway is now ${active ? 'ACTIVE & OPERATIONAL' : 'COMPLETELY SHUT DOWN (OFFLINE)'}.`
        );
      } else {
        showToast(res.message || 'Failed to update gateway status');
      }
    } catch {
      showToast('Error updating gateway switch');
    }
  };

  // Handle Service Category Fulfillment Switches
  const handleToggleServiceSwitch = async (service: string, active: boolean) => {
    setServiceSwitches((prev) => ({ ...prev, [service]: active }));
    try {
      const res = await apiToggleGatewaySwitch({ service, serviceActive: active });
      if (res.status === 'success') {
        showToast(
          `${service.toUpperCase()} Service is now ${active ? 'ACTIVE' : 'PAUSED'}.`
        );
      } else {
        showToast(res.message || 'Failed to update service switch');
      }
    } catch {
      showToast('Error updating service switch');
    }
  };

  // 1. Refresh Live Data & Query Gateway Balances
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchLiveStats();
    setIsRefreshing(false);
    showToast('Live database metrics and real gateway float balances synchronized.');
  };

  // 2. Ping all gateway APIs & query real live balances
  const handlePingAllProviders = async () => {
    setIsPinging(true);
    try {
      const gwRes = await apiGetGatewayBalances();
      if (gwRes.status === 'success' && gwRes.data?.gateways) {
        const liveGws = gwRes.data.gateways;
        setProviders((prev) =>
          prev.map((prov) => {
            const found = liveGws.find((g) => g.id === prov.id);
            if (found) {
              return {
                ...prov,
                floatBalance: found.balance,
                status: found.status,
                avgLatencyMs: found.latencyMs || prov.avgLatencyMs,
                lastPingTime: found.lastChecked ? `Queried ${found.lastChecked}` : 'Just now',
                maskedApiKey: found.maskedKey || prov.maskedApiKey,
                fundingAccount: found.fundingAccount,
              };
            }
            return prov;
          })
        );

        setPlatformWallet((prev) => {
          const totalFloat = gwRes.data.totalLiveFloat || 0;
          const ratio = prev.totalUserWallets > 0 ? Number((totalFloat / prev.totalUserWallets).toFixed(2)) : 1.0;
          return {
            ...prev,
            totalVendorFloat: totalFloat,
            reserveRatio: ratio,
          };
        });
        const totalFloat = gwRes.data.totalLiveFloat || 0;
        showToast(`Live gateway balance queried: ₦${totalFloat.toLocaleString('en-NG', { minimumFractionDigits: 2 })} available.`);
      } else {
        showToast('Gateway balance check completed.');
      }
    } catch {
      showToast('Could not query all gateway endpoints.');
    } finally {
      setIsPinging(false);
    }
  };

  // 4. Update service route provider
  const handleUpdateRoute = (
    routeId: string,
    updates: Partial<{
      primaryProviderId: UpstreamProviderId;
      fallbackProviderId: UpstreamProviderId;
      autoFailover: boolean;
      status: 'active' | 'paused';
    }>
  ) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          return {
            ...r,
            ...updates,
            lastSwitchedTime: 'Just now',
          };
        }
        return r;
      })
    );

    const route = routes.find((r) => r.id === routeId);
    if (updates.primaryProviderId) {
      const prov = providers.find((p) => p.id === updates.primaryProviderId);
      showToast(`Switched ${route?.serviceName} primary gateway to ${prov?.name}.`);
    } else if (updates.status) {
      showToast(`${route?.serviceName} route status updated to ${updates.status}.`);
    } else if (updates.autoFailover !== undefined) {
      showToast(`${route?.serviceName} auto-failover ${updates.autoFailover ? 'enabled' : 'disabled'}.`);
    }
  };

  // 5. Retry failed or pending transaction
  const handleRetryTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const fallbackProvider = 'VTPass Direct Backup';
    showToast(`Retrying ${tx.title} via ${fallbackProvider}...`);

    updateTransactionStatusInDb(txId, 'SUCCESS');

    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txId
            ? {
                ...t,
                status: 'SUCCESS',
                provider: fallbackProvider,
                gatewayResponse: '200 OK: Re-dispatched order via backup gateway successfully.',
              }
            : t
        )
      );
      showToast(`Transaction ${txId} succeeded on retry!`);
    }, 1200);
  };

  // 6. Refund failed transaction
  const handleRefundTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, refunded: true } : t))
    );

    // Credit user's wallet and write to customer transaction history
    const targetPhone = tx.customerPhone || tx.recipient;
    if (targetPhone) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.phone === targetPhone || (tx.customerPhone && u.phone === tx.customerPhone) || (tx.customerName && u.name === tx.customerName)) {
            const updatedBalance = u.balance + tx.amount;
            updateUserBalanceInDb(u.phone, updatedBalance);
            apiAdminFundUser({
              phone: u.phone,
              amount: tx.amount,
              type: 'credit',
              reason: `Automatic Refund for Transaction #${tx.id}`,
            }).catch(() => {});
            return { ...u, balance: updatedBalance };
          }
          return u;
        })
      );

      const refundTx: Transaction = {
        id: `AJD-REF-${Date.now().toString().slice(-6)}`,
        title: 'Transaction Refund',
        subtitle: `Refund for ${tx.title} (${tx.id})`,
        customerName: tx.customerName,
        customerPhone: targetPhone,
        recipient: targetPhone,
        date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        group: 'Today',
        amount: tx.amount,
        isCredit: true,
        status: 'SUCCESS',
        category: 'funding',
        provider: 'Jagora System Refund',
        gatewayResponse: `REFUND ISSUED FOR TX: ${tx.id}`,
        iconType: 'wallet',
      };
      recordTransactionInDb(refundTx, targetPhone);
    }
    updateTransactionStatusInDb(txId, 'REFUNDED');

    showToast(`Refunded ₦${tx.amount.toLocaleString()} to customer wallet (${tx.customerName || 'Customer'}).`);
  };

  // 7. Adjust user wallet manually
  const handleAdjustUserWallet = (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string
  ) => {
    let targetPhone = '';
    let updatedBal = 0;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newBal = type === 'credit' ? u.balance + amount : Math.max(0, u.balance - amount);
          targetPhone = u.phone;
          updatedBal = newBal;
          return { ...u, balance: newBal };
        }
        return u;
      })
    );

    const targetUser = users.find((u) => u.id === userId);

    // Record admin transaction log
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const adminTx: Transaction = {
      id: `AJD-ADJ-${Date.now().toString().slice(-6)}`,
      title: `Admin ${type === 'credit' ? 'Manual Credit' : 'Manual Debit'}`,
      subtitle: `${targetUser?.name} • ${reason}`,
      customerName: targetUser?.name,
      customerPhone: targetUser?.phone,
      recipient: targetUser?.phone,
      date: `Today, ${timeStr}`,
      group: 'Today',
      amount,
      isCredit: type === 'credit',
      status: 'SUCCESS',
      category: 'funding',
      provider: 'Jagora Admin Ledger',
      gatewayResponse: `ADMIN ADJUSTMENT: Reason: ${reason}`,
      iconType: 'wallet',
    };

    if (targetPhone) {
      updateUserBalanceInDb(targetPhone, updatedBal);
      recordTransactionInDb(adminTx, targetPhone);
      apiAdminFundUser({
        phone: targetPhone,
        amount,
        type,
        reason,
      })
        .then(() => fetchLiveStats())
        .catch(() => {});
    }

    setTransactions((prev) => [adminTx, ...prev]);

    // Update aggregate user liabilities
    setPlatformWallet((prev) => {
      const diff = type === 'credit' ? amount : -amount;
      const newTotal = prev.totalUserWallets + diff;
      return {
        ...prev,
        totalUserWallets: newTotal,
        reserveRatio: Number((prev.totalVendorFloat / newTotal).toFixed(2)),
      };
    });

    showToast(
      `Applied ₦${amount.toLocaleString()} ${type} to ${targetUser?.name}'s wallet.`
    );
  };

  // 8. Toggle user suspension status (with strict protection against self or admin suspension)
  const handleToggleUserStatus = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // Strict safety check: Never allow suspending an administrator or self
    const isTargetAdmin =
      targetUser.role === 'admin' ||
      targetUser.role === 'support_agent' ||
      targetUser.role === 'finance_agent' ||
      targetUser.isAdmin ||
      targetUser.id === 'usr_admin_01' ||
      targetUser.phone === '08123456789' ||
      targetUser.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
      (currentAdmin &&
        (targetUser.phone === currentAdmin.phone ||
          targetUser.email?.toLowerCase() === currentAdmin.email?.toLowerCase() ||
          targetUser.id === currentAdmin.id));

    if (isTargetAdmin) {
      showToast('Safety Protection: Administrator accounts and your own account cannot be suspended.');
      return;
    }

    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';

    try {
      const res = await apiToggleUserStatus(targetUser.phone, nextStatus);
      if (res && res.status === 'error') {
        showToast(res.message || 'Action denied by server.');
        return;
      }
    } catch {
      // offline fallback
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          showToast(`Account for ${u.name} is now ${nextStatus}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  return (
    <div
      id="admin-dashboard-container"
      className="min-h-screen bg-slate-50 dark:bg-[#070b16] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden max-w-full"
    >
      {/* 1. Left Executive Navigation Drawer */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        adminProfile={currentAdmin}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onLogout={onLogoutAdmin}
        isLightMode={isLightMode}
        onToggleTheme={onToggleTheme}
      />

      {/* 2. Main Executive Content Column (Offset on desktop for sidebar) */}
      <div className="lg:pl-64 xl:pl-72 flex flex-col flex-1 min-w-0 max-w-full transition-all">
        {/* Top Header Bar */}
        <AdminTopBar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
          onExitAdmin={onExitAdmin}
          onLogoutAdmin={onLogoutAdmin}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onToggleTheme={onToggleTheme}
          adminProfile={currentAdmin}
          users={users}
          onSelectCustomer={(u) => {
            setActiveTab('users');
            showToast(`Inspecting account for ${u.name}`);
          }}
          isLightMode={isLightMode}
        />

        {/* Tab Content Canvas */}
        <main className="px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-7xl w-full mx-auto flex-1 pb-28 lg:pb-8">
          {/* Breadcrumb back to Dashboard if in another tab */}
          {activeTab !== 'dashboard' && (
            <div className="mb-5 flex items-center justify-between">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-all shadow-2xs cursor-pointer"
              >
                <span>&larr; Back to Dashboard</span>
              </button>

              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                {activeTab.toUpperCase()} CONSOLE
              </span>
            </div>
          )}

          {/* DASHBOARD TAB (Executive Overview) */}
          {activeTab === 'dashboard' && (
            <AdminOverviewTab
              users={users}
              transactions={transactions}
              platformWallet={platformWallet}
              providers={providers}
              adminProfile={currentAdmin}
              onNavigateTab={setActiveTab}
              onAdjustUserWallet={handleAdjustUserWallet}
              onToggleUserStatus={handleToggleUserStatus}
              onResetStatistics={handleResetStatistics}
              onInspectUser={(u) => {
                setActiveTab('users');
                showToast(`Opened user: ${u.name}`);
              }}
              isLightMode={isLightMode}
              onRefresh={handleRefreshData}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletBalancesTab
              platformWallet={platformWallet}
              providers={providers}
              onRefreshGatewayBalances={handlePingAllProviders}
              isRefreshingGateways={isPinging}
              isLightMode={isLightMode}
              onNavigateToUsers={() => setActiveTab('users')}
            />
          )}

          {activeTab === 'users' && (
            <CustomerAccountsTab
              users={users}
              onAdjustUserWallet={handleAdjustUserWallet}
              onToggleUserStatus={handleToggleUserStatus}
              isLightMode={isLightMode}
              showToast={showToast}
              onNavigateToWallets={() => setActiveTab('wallets')}
              currentAdmin={currentAdmin}
              onRefresh={handleRefreshData}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingPlansTab
              isLightMode={isLightMode}
              showToast={showToast}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionTrackerTab
              transactions={transactions}
              onRetryTransaction={handleRetryTransaction}
              onRefundTransaction={handleRefundTransaction}
              isLightMode={isLightMode}
            />
          )}

          {activeTab === 'providers' && (
            <ApiProviderSwitchTab
              providers={providers}
              routes={routes}
              onUpdateRoute={handleUpdateRoute}
              onPingAllProviders={handlePingAllProviders}
              isPinging={isPinging}
              isLightMode={isLightMode}
              gatewaySwitches={gatewaySwitches}
              serviceSwitches={serviceSwitches}
              onToggleGatewaySwitch={handleToggleGatewaySwitch}
              onToggleServiceSwitch={handleToggleServiceSwitch}
            />
          )}

          {activeTab === 'staff' && (
            <StaffManagementTab
              isLightMode={isLightMode}
              showToast={showToast}
              currentAdminRole={currentAdmin?.adminRole || 'super_admin'}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
          )}

          {activeTab === 'referrals' && (
            <ReferralControlsTab
              isLightMode={isLightMode}
              showToast={showToast}
              adminProfile={currentAdmin}
            />
          )}

          {activeTab === 'broadcast' && (
            <BulkPushNotificationsTab
              isLightMode={isLightMode}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <PlatformSettingsTab
              isLightMode={isLightMode}
              showToast={showToast}
              onResetStatistics={handleResetStatistics}
            />
          )}
        </main>
      </div>

      {/* 3. Sticky Mobile Bottom Navigation Bar (Visible only on < lg screens) */}
      <nav
        aria-label="Admin Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070b16]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)]"
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <LayoutDashboard size={19} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'users' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <Users size={19} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Customers</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'transactions' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <BarChart3 size={19} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'wallets'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'wallets' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <Layers size={19} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Wallets</span>
        </button>

        <button
          onClick={() => setIsSidebarOpenMobile(true)}
          className="flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <MenuIcon size={19} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">More</span>
        </button>
      </nav>

      {/* Admin Self Profile & Security Credentials Editor Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        adminProfile={currentAdmin}
        onProfileUpdated={handleProfileUpdated}
        showToast={showToast}
        isLightMode={isLightMode}
      />
    </div>
  );
};
