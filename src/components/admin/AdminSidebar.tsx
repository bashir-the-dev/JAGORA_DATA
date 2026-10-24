import React from 'react';
import {
  Home,
  Wallet,
  Cloud,
  Tag,
  BarChart3,
  Users,
  Star,
  ChevronRight,
  Gift,
  UserCheck,
  Megaphone,
  Sliders,
  Moon,
  Sun,
  X,
  Rocket,
  LogOut,
} from 'lucide-react';
import { AdminTabType } from './AdminHeader';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  onSelectTab: (tab: AdminTabType) => void;
  adminProfile?: any;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  adminProfile,
  isOpenMobile,
  onCloseMobile,
  onLogout,
  isLightMode = true,
  onToggleTheme,
}) => {
  const adminName = adminProfile?.name || 'AJDATASUB Admin';
  const adminEmail = adminProfile?.email || 'bashirabubakar458@gmail.com';
  const adminRole = adminProfile?.adminRole || (adminProfile?.isAdmin ? 'super_admin' : 'support_agent');
  const isMasterCEO = (
    adminRole === 'super_admin' ||
    adminProfile?.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
    adminProfile?.email?.toLowerCase() === 'bashirabubakar458@gmail.com' ||
    adminProfile?.phone === '08123456789' ||
    adminProfile?.id === 'usr_admin_01' ||
    adminProfile?.id === 9
  );

  const roleLabel = isMasterCEO ? 'CEO' : adminRole === 'finance_agent' ? 'FINANCE' : 'SUPPORT';

  const allNavItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home, roles: ['super_admin', 'support_agent', 'finance_agent'] },
    { id: 'wallets' as const, label: 'Wallet & Float Balances', icon: Wallet, roles: ['super_admin', 'finance_agent'] },
    { id: 'providers' as const, label: 'API Gateway Switching', icon: Cloud, roles: ['super_admin'] },
    { id: 'transactions' as const, label: 'Airtime & Data Logs', icon: BarChart3, roles: ['super_admin', 'support_agent', 'finance_agent'] },
    { id: 'users' as const, label: 'Customer Accounts', icon: Users, roles: ['super_admin', 'support_agent', 'finance_agent'] },
    { id: 'ratings' as const, label: 'User Ratings & Reviews', icon: Star, roles: ['super_admin'] },
    { id: 'referrals' as const, label: 'Referral Controls', icon: Gift, roles: ['super_admin'] },
    { id: 'staff' as const, label: 'CEO & Staff Agents', icon: UserCheck, roles: ['super_admin'] },
    { id: 'broadcast' as const, label: 'Bulk Push Notifications', icon: Megaphone, roles: ['super_admin', 'support_agent'] },
    { id: 'settings' as const, label: 'Platform Settings', icon: Sliders, roles: ['super_admin'] },
  ];

  const navItems = allNavItems.filter((item) => isMasterCEO || item.roles.includes(adminRole));

  const handleTabClick = (tab: AdminTabType) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/75 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 lg:w-72 bg-[#06112c] text-slate-300 flex flex-col justify-between border-r border-[#0d2259] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-5 border-b border-[#0d2259]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Brand Squircle AJ Badge */}
              <div className="w-11 h-11 rounded-2xl bg-[#1668e8] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-600/35 shrink-0 tracking-tight select-none">
                AJ
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-sm text-white tracking-tight truncate">
                    AJDATASUB
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-[#ff6b00] text-white shrink-0 shadow-2xs">
                    {roleLabel}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                  {adminName}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {adminEmail}
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer group select-none ${
                  isActive
                    ? 'bg-[#1668e8] text-white font-bold shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/6'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* SYSTEM section divider */}
          <div className="pt-4 pb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
              SYSTEM
            </span>
          </div>

          {/* System Online Status Widget */}
          <div className="p-3 rounded-xl bg-[#09183d] border border-[#132c6b] flex items-center justify-between gap-2.5 transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white leading-tight">System Online</div>
                <div className="text-[10px] text-slate-400 truncate">
                  All services are running smoothly
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          {/* Dark Mode Toggle Switch */}
          {onToggleTheme && (
            <div
              onClick={onToggleTheme}
              className="p-3 rounded-xl bg-[#09183d]/60 border border-[#132c6b]/60 flex items-center justify-between cursor-pointer hover:bg-[#09183d] transition-all select-none"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                {isLightMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" />
                )}
                <span>Dark Mode</span>
              </div>

              {/* iOS style toggle slider */}
              <div
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                  !isLightMode ? 'bg-[#1668e8]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    !isLightMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Help Card & Footer */}
        <div className="p-4 border-t border-[#0d2259]/80 space-y-3">
          {/* "Need Help?" Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1f4a] to-[#081533] border border-blue-900/40 relative overflow-hidden shadow-md">
            <div className="w-9 h-9 rounded-xl bg-[#1668e8] text-white flex items-center justify-center shadow-md shadow-blue-600/40">
              <Rocket className="w-4 h-4" />
            </div>

            <div className="mt-2.5">
              <div className="text-sm font-extrabold text-white">Need Help?</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Our support team is always here.
              </div>
            </div>

            <a
              href="https://wa.me/2348123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff9100] hover:from-[#e55f00] hover:to-[#e68200] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all text-center block"
            >
              <span>Contact Support &rarr;</span>
            </a>
          </div>

          {/* Sub Footer */}
          <div className="text-center text-[10px] font-mono text-slate-400 pt-1">
            v2.8.0 • Secure • Reliable • VTU Platform
          </div>

          {/* Sign Out Console Action */}
          {onLogout && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all font-semibold text-xs cursor-pointer shadow-2xs group"
              >
                <LogOut size={14} className="transition-transform group-hover:-translate-x-0.5" />
                <span>Log Out Console</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
