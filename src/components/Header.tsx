import React, { useState, useRef, useEffect } from 'react';
import { ScreenType, UserProfile } from '../types';
import {
  Bell,
  ArrowLeft,
  Sun,
  Moon,
  Wallet,
  Plus,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Wifi,
  PhoneCall,
  Tv,
  Clock,
  Headphones,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { playTapSound, triggerHaptic } from '../utils/soundEffects';
import { isGenericCustomerName } from '../services/dbService';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenDrawer?: () => void;
  unreadNotificationsCount: number;
  user?: UserProfile;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  onOpenApiSettings?: () => void;
  title?: string;
  showBack?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  unreadNotificationsCount,
  user,
  isLightMode,
  onToggleTheme,
  onOpenApiSettings,
  title,
  showBack,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isDashboard = currentScreen === 'home';
  const isNotificationsActive = currentScreen === 'notifications';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleNotificationClick = () => {
    playTapSound();
    triggerHaptic('light');
    if (isNotificationsActive) {
      onNavigate('home');
    } else {
      onNavigate('notifications');
    }
  };

  const navItems = [
    { id: 'home' as ScreenType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data' as ScreenType, label: 'Buy Data', icon: Wifi },
    { id: 'airtime' as ScreenType, label: 'Airtime', icon: PhoneCall },
    { id: 'cable' as ScreenType, label: 'Bills', icon: Tv },
    { id: 'history' as ScreenType, label: 'History', icon: Clock },
    { id: 'support' as ScreenType, label: 'Support', icon: Headphones },
  ];

  const rawFirst = (user?.name && !isGenericCustomerName(user.name))
    ? user.name.trim().split(/\s+/)[0]
    : ((user?.username && !isGenericCustomerName(user.username)) ? user.username : "Al'amin");
  const firstName =
    rawFirst.toUpperCase() === "AL'AMIN" || rawFirst.toUpperCase() === 'ALAMIN'
      ? "Al'amin"
      : rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 w-full bg-[#0047cc] text-white shadow-md shadow-blue-950/15 backdrop-blur-md transition-colors"
    >
      <div className="flex justify-between items-center px-3.5 sm:px-6 lg:px-8 h-16 w-full max-w-7xl mx-auto gap-3">
        {/* Left Side: Brand Logo, Title & Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          {/* Mobile Back Button (only on mobile screens < md when showBack is true) */}
          {showBack && (
            <button
              id="header-back-btn"
              type="button"
              onClick={() => {
                playTapSound();
                triggerHaptic('light');
                onNavigate('home');
              }}
              className="md:hidden p-2 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0 border border-white/20 text-white"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} className="stroke-[2.5]" />
            </button>
          )}

          {/* Logo & Brand Name */}
          <div
            onClick={() => {
              playTapSound();
              triggerHaptic('light');
              onNavigate('home');
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0 group"
          >
            {/* Pristine App Logo Squircle */}
            <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white overflow-hidden shadow-md ring-2 ring-white/30 border border-white/40 flex items-center justify-center p-0.5">
                <img
                  src="/logo.png"
                  alt="ALAMIN JAGORA DATA"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Brand Title (Mobile vs Desktop) */}
            <div className="flex flex-col justify-center min-w-0">
              {/* Mobile View */}
              <div className="md:hidden flex items-center min-w-0">
                {showBack && title && !isDashboard ? (
                  <h1 className="font-heading font-black text-white text-base tracking-tight truncate max-w-[200px]">
                    {title}
                  </h1>
                ) : (
                  <div className="flex flex-col justify-center">
                    <h1 className="font-heading font-black text-white text-sm sm:text-base tracking-tight uppercase whitespace-nowrap leading-tight">
                      AJDATA
                    </h1>
                    <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider uppercase leading-none mt-0.5 truncate max-w-[170px]">
                      ALAMIN JAGORA DATA
                    </span>
                  </div>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:flex flex-col justify-center shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-white text-base lg:text-lg tracking-tight uppercase whitespace-nowrap leading-tight">
                    ALAMIN JAGORA DATA
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs text-[10px] font-black tracking-wider uppercase bg-amber-400 text-[#002f8a]">
                    AJDATA
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-blue-200 tracking-wide mt-0.5">
                  Nigeria's Premier VTU Switch
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Floating Pill Style with stable width) */}
        <nav className="hidden md:flex items-center justify-center shrink-0 mx-auto">
          <div className="flex items-center bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-inner">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    triggerHaptic('light');
                    onNavigate(item.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#0047cc] shadow-sm font-bold scale-[1.02]'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Side: Wallet Balance Pill, Theme Toggle, Notification Bell, User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Desktop Wallet Balance Pill */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-xs text-xs text-white transition-all shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Wallet size={13} className="text-amber-300 stroke-[2.2]" />
                <span className="font-mono font-bold text-white tracking-tight">
                  ₦{Number(user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('medium');
                  onNavigate('fund-wallet');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] cursor-pointer transition-all active:scale-95 shadow-xs"
                title="Fund your wallet"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Fund</span>
              </button>
            </div>
          )}

          {/* Theme Toggle Button (Light/Dark) */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                triggerHaptic('light');
                onToggleTheme();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              aria-label="Toggle theme"
              title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {isLightMode ? (
                <Moon size={16} className="stroke-[2.2] text-amber-200" />
              ) : (
                <Sun size={17} className="stroke-[2.2] text-amber-300" />
              )}
            </button>
          )}

          {/* Notification Button */}
          <button
            id="header-notifications-btn"
            type="button"
            onClick={handleNotificationClick}
            className={`relative w-9 h-9 rounded-full active:scale-95 transition-all cursor-pointer flex items-center justify-center border shadow-2xs ${
              isNotificationsActive
                ? 'bg-white text-[#0047cc] border-white shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            aria-label={isNotificationsActive ? 'Close notifications' : 'Open notifications'}
            title={isNotificationsActive ? 'Turn off notifications' : 'Open notifications'}
          >
            <Bell size={17} className={`stroke-[2.3] ${isNotificationsActive ? 'text-[#0047cc]' : 'text-white'}`} />
            {unreadNotificationsCount > 0 && !isNotificationsActive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0047cc] animate-pulse" />
            )}
          </button>

          {/* Desktop User Avatar & Quick Menu */}
          {user && (
            <div ref={userMenuRef} className="hidden md:relative md:block">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white cursor-pointer transition-all active:scale-95"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  {user?.name && !isGenericCustomerName(user.name) ? user.name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'A')}
                </div>
                <span className="text-xs font-semibold max-w-[85px] truncate">{firstName}</span>
                <ChevronDown
                  size={13}
                  className={`stroke-[2.5] text-blue-200 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Desktop User Dropdown Popup */}
              {isUserMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-xl border p-1.5 z-50 animate-modal-pop backdrop-blur-xl ${
                    isLightMode
                      ? 'bg-white/95 border-slate-200 text-slate-800'
                      : 'bg-slate-900/95 border-slate-800 text-slate-100'
                  }`}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold truncate">{(user?.name && !isGenericCustomerName(user.name)) ? user.name : (user?.username || "Al'amin")}</p>
                      <ShieldCheck size={13} className="text-blue-500 shrink-0" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{user.phone}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400">Balance:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{Number(user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <UserIcon size={14} className="stroke-[2.2] text-[#0047cc] dark:text-blue-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('fund-wallet');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <Wallet size={14} className="stroke-[2.2] text-emerald-600 dark:text-emerald-400" />
                    <span>Fund Wallet</span>
                  </button>

                  {onOpenApiSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenApiSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <Code2 size={14} className="stroke-[2.2] text-amber-500" />
                      <span>Developer API</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left mt-1 border-t border-slate-100 dark:border-slate-800/60"
                    >
                      <LogOut size={14} className="stroke-[2.2]" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
