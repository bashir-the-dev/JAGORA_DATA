import React from 'react';
import { ShieldCheck, RefreshCw, ArrowLeft, Activity, Layers, Server, Tag, Megaphone, Users, LogOut, FileDown, UserCheck, Crown, Headphones, DollarSign, UserCog, Home, Gift } from 'lucide-react';
import { AdminRole } from '../../types';

export type AdminTabType = 'dashboard' | 'wallets' | 'transactions' | 'providers' | 'users' | 'pricing' | 'staff' | 'broadcast' | 'referrals';

interface AdminHeaderProps {
  activeTab: AdminTabType;
  onSelectTab: (tab: AdminTabType) => void;
  onExitAdmin: () => void;
  onLogoutAdmin: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  isLightMode?: boolean;
  adminProfile?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    adminRole?: AdminRole;
  };
  onOpenProfile?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onSelectTab,
  onExitAdmin,
  onLogoutAdmin,
  onRefreshData,
  isRefreshing,
  isLightMode,
  adminProfile,
  onOpenProfile,
}) => {
  const currentRole = adminProfile?.adminRole || 'super_admin';
  const isCEO = currentRole === 'super_admin';

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'wallets' as const, label: 'Wallet & Float Balances', icon: Layers },
    { id: 'providers' as const, label: 'API Gateway Switching', icon: Server },
    { id: 'pricing' as const, label: 'VTU Pricing & Margins', icon: Tag },
    { id: 'transactions' as const, label: 'Airtime & Data Logs', icon: Activity },
    { id: 'users' as const, label: 'Customer Accounts', icon: Users },
    { id: 'referrals' as const, label: 'Referral Controls', icon: Gift },
    { id: 'staff' as const, label: 'CEO & Staff Agents', icon: UserCheck },
    { id: 'broadcast' as const, label: 'Bulk Push Notifications', icon: Megaphone },
  ];

  const adminName = adminProfile?.name || 'Bashir Abubakar';
  const adminEmail = adminProfile?.email || '';

  return (
    <div
      id="admin-header-container"
      className={`border-b sticky top-0 z-20 transition-colors ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
          : 'bg-slate-900 border-slate-800 text-slate-100 shadow-sm'
      }`}
    >
      {/* Top Banner Row */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800/80">
        {/* Left: Brand Identity & Admin Role */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 text-white ${
              isCEO
                ? 'bg-gradient-to-tr from-[#0047cc] to-blue-600'
                : currentRole === 'support_agent'
                ? 'bg-gradient-to-tr from-sky-500 to-blue-600'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
            }`}
          >
            {isCEO ? (
              <Crown size={18} className="text-amber-300 sm:w-5 sm:h-5" />
            ) : currentRole === 'support_agent' ? (
              <Headphones size={18} className="sm:w-5 sm:h-5" />
            ) : (
              <DollarSign size={18} className="sm:w-5 sm:h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-sans text-sm sm:text-base md:text-lg font-bold tracking-tight truncate leading-tight text-slate-900 dark:text-white">
                VTU Admin
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
                  isCEO
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50'
                    : currentRole === 'support_agent'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/50'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50'
                }`}
              >
                {isCEO ? (
                  <>
                    <Crown size={10} className="text-amber-600 dark:text-amber-400" />
                    <span>CEO</span>
                  </>
                ) : currentRole === 'support_agent' ? (
                  <>
                    <Headphones size={10} />
                    <span>Support</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={10} />
                    <span>Finance</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              <span className="truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none text-slate-700 dark:text-slate-300 font-medium">
                {adminName}
              </span>
              {adminEmail && (
                <span className="hidden md:inline text-slate-400 dark:text-slate-500 truncate">
                  ({adminEmail})
                </span>
              )}
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer ml-0.5 shrink-0"
                  title="Edit Admin Profile & Credentials"
                >
                  <UserCog size={11} />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Controls Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Live System Operational Status */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>4 Gateways Online</span>
          </div>

          {onOpenProfile && (
            <button
              id="admin-my-profile-btn"
              onClick={onOpenProfile}
              className="min-h-[36px] min-w-[36px] sm:min-w-0 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
              title="Edit Profile, Email, Password & Security PIN"
            >
              <UserCog size={14} className="text-[#0047cc] dark:text-blue-400" />
              <span className="hidden md:inline">Profile</span>
            </button>
          )}

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="min-h-[36px] min-w-[36px] sm:min-w-0 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
            title="Refresh All Gateway Balances"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#0047cc]' : 'text-slate-500'} />
            <span className="hidden md:inline">Sync</span>
          </button>

          <a
            href="/api/docs/api-guide.pdf"
            download="Alamin_Jagora_Data_API_Integration_Manual.pdf"
            className="hidden xs:flex min-h-[36px] min-w-[36px] sm:min-w-0 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs"
            title="Download PDF Manual for API Integration"
          >
            <FileDown size={14} className="text-[#0047cc] dark:text-blue-400" />
            <span className="hidden lg:inline">API Manual</span>
          </a>

          <button
            onClick={onExitAdmin}
            className="min-h-[36px] min-w-[36px] sm:min-w-0 sm:h-9 px-2 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Return to user view"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">App</span>
          </button>

          <button
            id="admin-logout-btn"
            onClick={onLogoutAdmin}
            className="min-h-[36px] px-2.5 sm:px-3.5 sm:h-9 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            title="Securely exit and lock admin console"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Lock & Log Out</span>
            <span className="sm:hidden">Lock</span>
          </button>
        </div>
      </div>

      {/* Modern Cohesive Navigation Sub-Tabs */}
      <div className="px-3 sm:px-6 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800/60">
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-2" aria-label="Admin Navigation Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-[#0047cc] dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#0047cc] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
