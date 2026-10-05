import React from 'react';
import { ScreenType } from '../types';
import { LayoutDashboard, History, Headphones, HelpCircle, User, X, LogOut, Server, Zap, Moon, Sun, Globe, Activity, Tv, Gift } from 'lucide-react';
import { useSystemStatus } from '../context/SystemStatusContext';
import { isSimulationAllowed } from '../utils/environment';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenHelp: () => void;
  onOpenApiSettings?: () => void;
  onLogout: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  isReferralsHidden?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
  onOpenHelp,
  onOpenApiSettings,
  onLogout,
  isLightMode,
  onToggleTheme,
  isReferralsHidden = false,
}) => {
  const { isOnline, latencyMs, setIsStatusModalOpen } = useSystemStatus();

  if (!isOpen) return null;

  const allMenuItems: Array<{ id: ScreenType; label: string; icon: any; badge?: string }> = [
    { id: 'landing' as ScreenType, label: 'Landing Page', icon: Globe },
    { id: 'home' as ScreenType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'referrals' as ScreenType, label: 'Refer & Earn', icon: Gift, badge: '₦50' },
    { id: 'cable' as ScreenType, label: 'Bills & Utilities', icon: Tv, badge: 'Instant' },
    { id: 'history' as ScreenType, label: 'History', icon: History },
    { id: 'support' as ScreenType, label: 'Customer Support', icon: Headphones },
    { id: 'profile' as ScreenType, label: 'Profile', icon: User },
  ];

  const menuItems = allMenuItems.filter((item) => item.id !== 'referrals' || !isReferralsHidden);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        id="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <aside
        id="drawer-sidebar"
        className={`relative w-[82%] max-w-xs h-full shadow-2xl flex flex-col z-10 border-r transition-transform duration-300 ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Drawer Header with Royal Blue brand seal */}
        <div className="p-5 flex items-center justify-between border-b bg-[#0047cc] dark:bg-slate-950 dark:border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            {/* Logo Badge */}
            <div className="w-11 h-11 rounded-xl bg-[#0055ff] border border-white/30 flex items-center justify-center shadow-md shrink-0 overflow-hidden p-0.5">
              <img
                src="/logo.png"
                alt="Al'amin Jagora Data"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-sm font-extrabold uppercase tracking-wide text-white block">
                  Al'amin Jagora
                </span>
                <span className="px-1.5 py-0.2 rounded-xs bg-amber-400 text-[#002f8a] text-[9px] font-black uppercase">
                  VTU
                </span>
              </div>
              <span className="text-[11px] text-blue-100/90 font-medium block mt-0.5">
                Premier VTU & Bills
              </span>
            </div>
          </div>
          <button
            id="close-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 font-sans overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                id={`drawer-link-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-[#0047cc] font-bold shadow-xs dark:bg-blue-950/60 dark:text-blue-300'
                    : isLightMode
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={19} className={isActive ? 'stroke-[2.4] text-[#0047cc] dark:text-blue-400' : 'stroke-[1.75]'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider uppercase bg-amber-400 text-slate-950 shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Dark / Light Mode Switch Option */}
          {onToggleTheme && (
            <button
              id="drawer-link-theme"
              onClick={onToggleTheme}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left text-sm font-medium ${
                isLightMode
                  ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isLightMode ? (
                  <Moon size={19} className="stroke-[1.75] text-[#0047cc]" />
                ) : (
                  <Sun size={19} className="stroke-[1.75] text-amber-400" />
                )}
                <span>{isLightMode ? 'Dark Theme' : 'Light Theme'}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isLightMode
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {isLightMode ? 'Off' : 'On'}
              </span>
            </button>
          )}

          {isSimulationAllowed() && onOpenApiSettings && (
            <button
              id="drawer-link-api"
              onClick={() => {
                onOpenApiSettings();
                onClose();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left text-sm font-medium ${
                isLightMode
                  ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Server size={19} className="stroke-[1.75] text-[#0047cc] dark:text-blue-400" />
                <span>Backend API</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </button>
          )}

          {/* System Status & Diagnostics Link */}
          <button
            id="drawer-link-system-status"
            onClick={() => {
              setIsStatusModalOpen(true);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left text-sm font-medium ${
              isLightMode
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Activity size={19} className="stroke-[1.75] text-emerald-600 dark:text-emerald-400" />
              <span>System Status</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                !isOnline
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {!isOnline ? 'Offline' : latencyMs ? `${latencyMs}ms` : 'Operational'}
            </span>
          </button>

          <button
            id="drawer-link-help"
            onClick={() => {
              onOpenHelp();
              onClose();
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left text-sm font-medium ${
              isLightMode
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HelpCircle size={19} className="stroke-[1.75]" />
            <span>Help Center</span>
          </button>
        </nav>

        {/* Drawer Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isLightMode ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-950'
          }`}
        >
          <button
            id="drawer-logout-btn"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono font-semibold">
            v2.4 MVP Release
          </p>
        </div>
      </aside>
    </div>
  );
};
