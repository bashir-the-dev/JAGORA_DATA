import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  RefreshCw,
  Smartphone,
  ChevronDown,
  Crown,
  LogOut,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { PlatformUserAccount } from '../../types';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onExitAdmin: () => void;
  onLogoutAdmin: () => void;
  onOpenProfile?: () => void;
  onToggleTheme?: () => void;
  adminProfile?: {
    name?: string;
    email?: string;
    adminRole?: string;
  };
  users: PlatformUserAccount[];
  onSelectCustomer?: (user: PlatformUserAccount) => void;
  isLightMode?: boolean;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  onToggleSidebar,
  onRefreshData,
  isRefreshing,
  onExitAdmin,
  onLogoutAdmin,
  onOpenProfile,
  onToggleTheme,
  adminProfile,
  users,
  onSelectCustomer,
  isLightMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const adminName = adminProfile?.name || 'Bashir Abubakar';
  const roleLabel = adminProfile?.adminRole === 'support_agent' ? 'Agent' : 'CEO';

  // Global ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsNotificationsOpen(false);
        setIsProfileMenuOpen(false);
        setIsAppMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter users based on search
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [searchQuery, users]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#0c1322] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search customers, phone number, or email..."
              className="w-full pl-10 pr-16 py-2 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden transition-all shadow-2xs font-sans"
            />
            {/* Shortcut Badge */}
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 absolute right-3 pointer-events-none shadow-2xs">
                Ctrl + K
              </span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && searchQuery && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearchFocused(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-mono text-slate-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Customer Matches ({searchResults.length})</span>
                  <span>Press Esc to close</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono">
                    No customers found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectCustomer?.(user);
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {user.phone} {user.email ? `• ${user.email}` : ''}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₦{(Number(user.balance) || 0).toLocaleString()}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase font-semibold ${
                              user.status === 'suspended'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                            }`}
                          >
                            {user.status === 'suspended' ? 'Frozen' : 'Active'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            title="System alerts & notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono flex items-center justify-center">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                    System Alerts
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">
                    Mark all read
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                    <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Gateways Online</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      ClubKonnect and backup VTU routes responding in under 420ms.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Auto-Settlement Ready
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Daily customer transaction reconciliation completed.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Theme Switcher */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle admin color scheme"
          >
            {isLightMode ? (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
            )}
          </button>
        )}

        {/* Sync Button */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="h-9 px-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          title="Synchronize live database metrics"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span className="hidden sm:inline">Sync</span>
        </button>

        {/* App Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
            className="h-9 px-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>App</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isAppMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsAppMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 text-xs">
                <button
                  onClick={() => {
                    setIsAppMenuOpen(false);
                    onExitAdmin();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-800 dark:text-slate-200 font-medium flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    Customer App
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Admin Profile Button */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-amber-300 flex items-center justify-center shadow-xs">
              <Crown className="w-4 h-4 fill-amber-300" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {adminName}
              </div>
              <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold leading-tight">
                {roleLabel}
              </div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2.5">
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {adminName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {adminProfile?.email || 'admin@jagora.ng'}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Admin Profile & PIN</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onExitAdmin();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch to Customer App</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogoutAdmin();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
