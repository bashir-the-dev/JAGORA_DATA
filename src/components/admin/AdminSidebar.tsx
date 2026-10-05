import React from 'react';
import {
  Home,
  Layers,
  Server,
  Tag,
  BarChart3,
  Users,
  UserCheck,
  Megaphone,
  Crown,
  Activity,
  CheckCircle2,
  X,
  TrendingUp,
  Gift,
  LogOut,
} from 'lucide-react';
import { AdminTabType } from './AdminHeader';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  onSelectTab: (tab: AdminTabType) => void;
  adminProfile?: {
    name?: string;
    email?: string;
    adminRole?: string;
  };
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  adminProfile,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}) => {
  const adminName = adminProfile?.name || 'Bashir Abubakar';
  const adminEmail = adminProfile?.email || 'bashirabubakar650@gmail.com';
  const roleLabel = adminProfile?.adminRole === 'support_agent' ? 'AGENT' : 'CEO';

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'wallets' as const, label: 'Wallet & Float Balances', icon: Layers },
    { id: 'providers' as const, label: 'API Gateway Switching', icon: Server },
    { id: 'pricing' as const, label: 'VTU Pricing & Margins', icon: Tag },
    { id: 'transactions' as const, label: 'Airtime & Data Logs', icon: BarChart3 },
    { id: 'users' as const, label: 'Customer Accounts', icon: Users },
    { id: 'referrals' as const, label: 'Referral Controls', icon: Gift },
    { id: 'staff' as const, label: 'CEO & Staff Agents', icon: UserCheck },
    { id: 'broadcast' as const, label: 'Broadcast & Controls', icon: Megaphone },
  ];

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
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 bg-[#090e1f] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Brand Logo Box */}
              <div className="w-10 h-10 rounded-xl bg-[#0055ff] border border-white/20 flex items-center justify-center shadow-md overflow-hidden p-0.5 shrink-0">
                <img
                  src="/logo.png"
                  alt="Al'amin Jagora Data"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base text-white tracking-tight">
                    VTU Admin
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center gap-0.5">
                    <span>👑</span> {roleLabel}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                  {adminName}
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
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
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
        </div>

        {/* Bottom System Telemetry Card */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          {/* Status Box */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
            <span className="relative flex h-2.5 w-2.5 mt-0.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200">System Online</div>
              <div className="text-[11px] text-slate-400 truncate">
                All services are running smoothly
              </div>
            </div>
          </div>

          {/* Sub Footer */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 px-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Fast. Secure. Reliable. VTU Platform</span>
          </div>

          {/* Sign Out Console Action */}
          {onLogout && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all font-semibold text-xs cursor-pointer shadow-2xs group"
              >
                <LogOut size={15} className="transition-transform group-hover:-translate-x-0.5" />
                <span>Log Out Console</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
