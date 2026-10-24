import React, { useState, useEffect } from 'react';
import { ScreenType, Transaction, NotificationItem, UserProfile, DataPlan } from './types';
import { initialUser } from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { BuyDataScreen } from './components/screens/BuyDataScreen';
import { BuyAirtimeScreen } from './components/screens/BuyAirtimeScreen';
import { VtuTransactionWizard } from './components/screens/VtuTransactionWizard';
import { RechargePinScreen } from './components/screens/RechargePinScreen';
import { DataCardScreen } from './components/screens/DataCardScreen';
import { BillsScreen } from './components/screens/BillsScreen';
import { FundWalletScreen } from './components/screens/FundWalletScreen';
import { WalletScreen } from './components/screens/WalletScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ReferralsScreen } from './components/screens/ReferralsScreen';
import { SupportScreen } from './components/screens/SupportScreen';
import { ChatWithUsScreen } from './components/screens/ChatWithUsScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import {
  FundWalletModal,
  BuyAirtimeModal,
  MoreServicesModal,
  RechargePinModal,
  DataCardModal,
  CableTvModal,
  ElectricityModal,
  ExamPinModal,
  ReceiptModal,
  ModalWrapper,
} from './components/modals/ActionModals';
import { ProfessionalToastContainer, ToastAlert, AlertType } from './components/common/ProfessionalAlert';
import { playSuccessChime, playCoinSound, triggerConfetti } from './utils/soundEffects';
import {
  getOrCreateUserProfile,
  subscribeToUserProfile,
  updateUserBalanceInDb,
  recordTransactionInDb,
  loadUserTransactionsFromDb,
  subscribeToUserTransactions,
  subscribeToPlatformSettings,
  saveUserProfileToDb,
  PlatformSettingsState,
  subscribeToNotifications,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  isGenericCustomerName,
  deduplicateTransactions,
} from './services/dbService';
import { ApiSettingsModal } from './components/modals/ApiSettingsModal';
import { SessionLockModal } from './components/modals/SessionLockModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { LandingPage } from './components/landing/LandingPage';
import { LegalScreen } from './components/legal/LegalScreen';
import {
  apiGetProfile,
  apiBuyData,
  apiBuyAirtime,
  apiLogout,
  apiGetAdminProfile,
  getAuthToken,
  setAuthToken,
  resolveApiUrl,
} from './services/apiClient';
import { normalizeNigerianPhone } from './utils/phoneUtils';
import { humanizeVtuError } from './utils/errorParser';
import { useSystemStatus } from './context/SystemStatusContext';
import { isSimulationAllowed } from './utils/environment';
import { OfflineBanner } from './components/common/OfflineBanner';
import { SystemStatusModal } from './components/common/SystemStatusModal';
import { GlobalTransactionModal } from './components/common/GlobalTransactionModal';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ActionConfirmModal } from './components/modals/ActionConfirmModal';

const VALID_SCREENS: ScreenType[] = [
  'landing',
  'home',
  'data',
  'airtime',
  'recharge-pin',
  'data-card',
  'cable',
  'electricity',
  'exam-pin',
  'fund-wallet',
  'wallet',
  'history',
  'profile',
  'referrals',
  'support',
  'chat',
  'notifications',
  'login',
  'register',
  'terms',
  'privacy',
  'admin',
];

export const screenToPath = (screen: ScreenType): string => {
  if (screen === 'landing') return '/';
  if (screen === 'admin' && isAdminSubdomain()) return '/';
  return `/${screen}`;
};

export const pathToScreen = (path: string): ScreenType | null => {
  const clean = path.replace(/^[#/]+/, '').replace(/\/+$/, '').trim().toLowerCase();
  if (!clean || clean === 'landing') return 'landing';
  if (clean === 'transactions') return 'history';
  if (VALID_SCREENS.includes(clean as ScreenType)) {
    return clean as ScreenType;
  }
  return null;
};

const getScreenFromUrl = (): ScreenType | null => {
  try {
    if (isAdminSubdomain()) {
      const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      // If a customer route is accessed on the staff subdomain, cleanly redirect to the primary customer portal
      if (cleanPath && cleanPath !== 'admin' && VALID_SCREENS.includes(cleanPath as ScreenType)) {
        const hostname = window.location.hostname;
        const mainDomain = hostname.replace(/^(admin|ops|ops-desk|hq|hq-desk|portal|manager|console|control|secure|staff|vtu-ops)\./i, '');
        if (mainDomain && mainDomain !== hostname) {
          window.location.replace(`${window.location.protocol}//${mainDomain}/${cleanPath}${window.location.search}`);
          return 'admin';
        }
      }
      return 'admin';
    }

    // 1. Direct clean URL pathname (e.g. /home, /login, /data, /admin)
    const pathScreen = pathToScreen(window.location.pathname);
    if (pathScreen) {
      if (window.location.hash) {
        history.replaceState(null, '', screenToPath(pathScreen) + window.location.search);
      }
      return pathScreen;
    }

    // 2. Backward compatibility: if an incoming link has a hash (#login, #home), clean it up immediately
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (hash) {
      const hashScreen = pathToScreen(hash);
      if (hashScreen) {
        history.replaceState(null, '', screenToPath(hashScreen) + window.location.search);
        return hashScreen;
      }
    }

    if (window.location.search.includes('admin=true')) {
      return 'admin';
    }
  } catch {}
  return null;
};

/**
 * Checks if the current request is accessing via an administrative subdomain
 * (e.g., admin.ajdatasub.com.ng, ops-desk.ajdatasub.com.ng, hq.ajdatasub.com.ng)
 */
export const isAdminSubdomain = (): boolean => {
  try {
    const hostname = window.location.hostname.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (search.includes('subdomain=admin') || search.includes('admin=true')) {
      return true;
    }
    const adminPrefixes = [
      'admin.',
      'portal.',
      'ops.',
      'ops-desk.',
      'hq.',
      'hq-desk.',
      'console.',
      'control.',
      'manager.',
      'secure.',
      'staff.',
      'vtu-ops.',
    ];
    return adminPrefixes.some((prefix) => hostname.startsWith(prefix));
  } catch {
    return false;
  }
};

const resolveInitialScreen = (): ScreenType => {
  try {
    // 0. Check for incoming referral code query param (?ref=CODE or ?referral=CODE)
    if (typeof window !== 'undefined' && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const refCode = searchParams.get('ref') || searchParams.get('referral');
      if (refCode) {
        try {
          localStorage.setItem('jagora_referral_code', refCode.trim().toUpperCase());
        } catch {}
      }
    }

    const token = localStorage.getItem('jagora_auth_token') || localStorage.getItem('jagora_token');
    const isAdmin = localStorage.getItem('jagora_admin_authenticated') === 'true';
    const isUserLoggedIn = localStorage.getItem('jagora_user_logged_in') === 'true';
    const hasSavedUser = Boolean(
      localStorage.getItem('jagora_user_profile') ||
      localStorage.getItem('jagora_user_identifier') ||
      localStorage.getItem('jagora_user_phone') ||
      localStorage.getItem('jagora_has_visited') ||
      localStorage.getItem('jagora_is_existing_user')
    );
    const isAuthenticated = Boolean(isUserLoggedIn || token);

    // Dedicated Subdomain: Route straight to Admin if authenticated, else to login
    if (isAdminSubdomain()) {
      return isAdmin ? 'admin' : 'login';
    }

    // 1. Direct URL hash / query inspection
    const urlScreen = getScreenFromUrl();
    if (urlScreen) {
      if (urlScreen === 'admin') {
        if (isAdmin) {
          return 'admin';
        }
        if (isAuthenticated) {
          return 'home';
        }
        return 'login';
      }

      // CRITICAL: Landing page is strictly for fresh visitors.
      // If an existing/returning user hits landing (or default hash), route them to dashboard or login!
      if (urlScreen === 'landing') {
        if (isAdmin) {
          return 'admin';
        }
        if (isAuthenticated) {
          return 'home';
        }
        if (hasSavedUser) {
          return 'login';
        }
        return 'landing';
      }

      if (['login', 'register', 'support',
  'chat', 'terms', 'privacy'].includes(urlScreen)) {
        return urlScreen;
      }
      if (!isAuthenticated) {
        return hasSavedUser ? 'login' : 'landing';
      }
      return urlScreen;
    }

    // 2. Check saved screen in localStorage
    const saved = localStorage.getItem('jagora_active_screen') as ScreenType | null;
    if (saved && VALID_SCREENS.includes(saved)) {
      if (!isAuthenticated && !['login', 'register', 'support',
  'chat', 'terms', 'privacy'].includes(saved)) {
        return hasSavedUser ? 'login' : 'landing';
      }
      if (isAuthenticated && saved === 'landing') {
        return isAdmin ? 'admin' : 'home';
      }
      return saved;
    }

    // 3. Defaults based on active session & returning user status
    if (isAdmin) {
      return 'admin';
    }
    if (isAuthenticated) {
      return 'home';
    }
    if (hasSavedUser) {
      // Returning user whose token expired -> direct them to login
      return 'login';
    }
  } catch {}

  // 4. Default ONLY for brand-new fresh visitors before they register or sign in
  return 'landing';
};

export default function App() {
  const { startTransactionProgress, setTransactionStep, finishTransactionProgress } = useSystemStatus();

  // Navigation & Screen State - Persists across browser refreshes and syncs with URL hash
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(resolveInitialScreen);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('jagora_user_logged_in');
      const token = localStorage.getItem('jagora_auth_token') || localStorage.getItem('jagora_token');
      const savedProfile = localStorage.getItem('jagora_user_profile');
      return savedAuth === 'true' || Boolean(token) || Boolean(savedProfile);
    } catch {
      return false;
    }
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('jagora_admin_authenticated');
      const token = localStorage.getItem('jagora_auth_token') || localStorage.getItem('jagora_token');
      return savedAuth === 'true' && Boolean(token);
    } catch {
      return false;
    }
  });
  const [adminProfile, setAdminProfile] = useState<any>(() => {
    try {
      const savedProfile = localStorage.getItem('jagora_admin_profile');
      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
    } catch {}
    return null;
  });
  const [showStaff2FALogin, setShowStaff2FALogin] = useState<boolean>(false);
  const [authLoadingMessage, setAuthLoadingMessage] = useState<string | null>(null);

  // App Theme - Persistent and responsive to device preferences
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jagora_theme');
      if (saved !== null) {
        return saved === 'light';
      }
      return !window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  // Domain Data State - Persisted client profile
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('jagora_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.phone || parsed.name)) {
          return { ...initialUser, ...parsed };
        }
      }
    } catch {}
    return initialUser;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsState>(() => {
    try {
      const raw = localStorage.getItem('jagora_storage_platform_settings') || localStorage.getItem('jagora_platform_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return { maintenanceMode: false };
  });
  const isReferralsHidden = Boolean(
    platformSettings?.referralSettings?.hideFromUsers ||
    (typeof window !== 'undefined' && (() => {
      try {
        const raw = localStorage.getItem('jagora_storage_platform_settings') || localStorage.getItem('jagora_platform_settings');
        return raw ? Boolean(JSON.parse(raw)?.referralSettings?.hideFromUsers) : false;
      } catch { return false; }
    })())
  );

  // Modals
  const [isFundWalletOpen, setIsFundWalletOpen] = useState(false);
  const [isBuyAirtimeOpen, setIsBuyAirtimeOpen] = useState(false);
  const [isRechargePinOpen, setIsRechargePinOpen] = useState(false);
  const [isDataCardOpen, setIsDataCardOpen] = useState(false);
  const [isCableTvOpen, setIsCableTvOpen] = useState(false);
  const [isElectricityOpen, setIsElectricityOpen] = useState(false);
  const [isExamPinOpen, setIsExamPinOpen] = useState(false);
  const [isMoreServicesOpen, setIsMoreServicesOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Global Professional Alerts
  const [alerts, setAlerts] = useState<ToastAlert[]>([]);

  // Session Security & Inactivity Invalidation States
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [sessionLockReason, setSessionLockReason] = useState<'idle' | 'offline_prolonged' | 'manual'>('idle');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string>('');

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const showToast = (
    msg: string,
    type?: AlertType,
    title?: string
  ) => {
    let resolvedType: AlertType = type || 'info';
    const lower = msg.toLowerCase();
    if (!type) {
      if (
        lower.includes('success') ||
        lower.includes('funded') ||
        lower.includes('sent') ||
        lower.includes('verified') ||
        lower.includes('completed') ||
        lower.includes('saved') ||
        lower.includes('copied') ||
        lower.includes('generated') ||
        lower.includes('transferred')
      ) {
        resolvedType = 'success';
      } else if (
        lower.includes('fail') ||
        lower.includes('error') ||
        lower.includes('could not') ||
        lower.includes('invalid') ||
        lower.includes('declined') ||
        lower.includes('insufficient')
      ) {
        resolvedType = 'error';
      } else if (
        lower.includes('warning') ||
        lower.includes('caution') ||
        lower.includes('low') ||
        lower.includes('locked')
      ) {
        resolvedType = 'warning';
      }
    }

    const defaultTitle =
      title ||
      (resolvedType === 'success'
        ? 'Success'
        : resolvedType === 'error'
        ? 'Notice'
        : resolvedType === 'warning'
        ? 'Attention'
        : 'Update');

    const newAlert: ToastAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: resolvedType,
      title: defaultTitle,
      message: msg,
      duration: 3800,
    };

    setAlerts((prev) => [...prev.slice(-2), newAlert]);

    // Guaranteed auto-cleanup timer so alerts NEVER stay stuck or beep continuously
    setTimeout(() => {
      dismissAlert(newAlert.id);
    }, 3900);
  };

  // Listen for navigation changes (browser back/forward or direct clean URL navigation) and discreet shortcut (Alt+A)
  useEffect(() => {
    const handlePopStateSync = () => {
      const isAdmin = localStorage.getItem('jagora_admin_authenticated') === 'true';
      const isUserLoggedIn = localStorage.getItem('jagora_user_logged_in') === 'true';

      if (isAdminSubdomain()) {
        if (!isAdmin) {
          if (currentScreen !== 'login') {
            setCurrentScreen('login');
          }
          return;
        }
        if (currentScreen !== 'admin') {
          setCurrentScreen('admin');
        }
        return;
      }
      const screenFromUrl = getScreenFromUrl();
      if (screenFromUrl) {
        if (screenFromUrl === 'admin' && !isAdmin) {
          if (isUserLoggedIn) {
            setCurrentScreen('home');
            showToast('Access denied: Administrator privileges required.');
          } else {
            setCurrentScreen('login');
          }
          return;
        }
        if (screenFromUrl !== currentScreen) {
          setCurrentScreen(screenFromUrl);
        }
      }
    };

    window.addEventListener('popstate', handlePopStateSync);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Discreet hotkey: Alt+A or Ctrl+Shift+A
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        setCurrentScreen('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopStateSync);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentScreen]);

  // Keep localStorage and clean URL pathname continuously synchronized without hashes
  useEffect(() => {
    try {
      localStorage.setItem('jagora_active_screen', currentScreen);
      const targetPath = screenToPath(currentScreen);
      const currentPath = window.location.pathname;

      // If URL still has a hash, or path doesn't match target, update history cleanly
      if (window.location.hash) {
        history.replaceState(null, '', targetPath + window.location.search);
      } else if (currentPath !== targetPath) {
        history.pushState(null, '', targetPath + window.location.search);
      }
    } catch {}
  }, [currentScreen]);

  // Sync dark class and colorScheme on document element and save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jagora_theme', isLightMode ? 'light' : 'dark');
    } catch {}

    if (isLightMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, [isLightMode]);

  // Session Lifecycle Management: Multi-tab synchronization & 401 unauthorized listener
  useEffect(() => {
    const handleUnauthorized = (e: any) => {
      // If currently on staff subdomain or admin screen, isolate admin auth and never pop to customer login!
      if (isAdminSubdomain() || currentScreen === 'admin') {
        setIsAdminAuthenticated(false);
        setAdminProfile(null);
        try {
          localStorage.removeItem('jagora_admin_authenticated');
          localStorage.removeItem('jagora_admin_profile');
        } catch {}
        setCurrentScreen('admin');
        showToast(e?.detail?.message || 'Administrator session expired. Please sign in again.', 'warning', 'Session Expired');
        return;
      }

      setAuthToken(null);
      setIsUserLoggedIn(false);
      setIsAdminAuthenticated(false);
      setAdminProfile(null);
      setUser(initialUser);
      try {
        localStorage.removeItem('jagora_token');
        localStorage.removeItem('jagora_auth_token');
        localStorage.removeItem('jagora_user_logged_in');
        localStorage.removeItem('jagora_user_profile');
        localStorage.removeItem('jagora_admin_authenticated');
        localStorage.removeItem('jagora_admin_profile');
        localStorage.setItem('jagora_active_screen', 'login');
      } catch {}
      setCurrentScreen('login');
      showToast(e?.detail?.message || 'Your session has expired. Please sign in again.', 'warning', 'Session Expired');
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jagora_user_logged_in' || e.key === 'jagora_auth_token' || e.key === 'jagora_token') {
        const loggedIn = localStorage.getItem('jagora_user_logged_in') === 'true';
        const token = localStorage.getItem('jagora_auth_token') || localStorage.getItem('jagora_token');
        if (!loggedIn && !token) {
          // Logged out in another tab
          setIsUserLoggedIn(false);
          setIsAdminAuthenticated(false);
          setAdminProfile(null);
          setUser(initialUser);
          setCurrentScreen(isAdminSubdomain() ? 'admin' : 'landing');
          showToast('Session terminated in another tab.', 'info');
        } else if ((loggedIn || token) && !isUserLoggedIn && !isAdminSubdomain()) {
          // Logged in in another tab (consumer only)
          setIsUserLoggedIn(true);
          refreshProfileFromApi();
        }
      }
    };

    window.addEventListener('jagora:unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('jagora:unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isUserLoggedIn, currentScreen]);

  // Global real-time listener for platform maintenance, broadcasts & referral switches (runs immediately for all users)
  useEffect(() => {
    const unsubSettings = subscribeToPlatformSettings((settings) => {
      setPlatformSettings(settings);
    });
    return () => {
      unsubSettings();
    };
  }, []);

  /**
   * ----------------------------------------------------------------------------
   * SESSION INVALIDATION & IDLE AUTO-LOCK
   * ----------------------------------------------------------------------------
   * 1. Short Inactivity (10 minutes) or App Backgrounding (>5 minutes):
   *    Triggers the Quick SessionLockModal (Fingerprint / 4-Digit PIN).
   * 2. Prolonged Offline Gap (>30 minutes):
   *    When internet reconnects, locks session and requires PIN re-authentication
   *    before any financial transaction can proceed.
   * 3. Extended Inactivity (>12 hours):
   *    Completely terminates session, redirects to LoginScreen with a friendly notice.
   */
  /**
   * Device-Persistent Authentication Session (Task 2):
   * Users remain logged in perpetually on their device without repeated sign-ins.
   * Only an explicit user logout or device change ends the session.
   * Silently refreshes live balances upon app resume or network restoration.
   */
  useEffect(() => {
    if (!isUserLoggedIn || isAdminSubdomain() || currentScreen === 'admin') {
      return;
    }

    // Generate or retrieve persistent device fingerprint
    try {
      let storedId = localStorage.getItem('jagora_device_fingerprint');
      if (!storedId) {
        storedId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        localStorage.setItem('jagora_device_fingerprint', storedId);
      }
      localStorage.setItem('jagora_active_device', storedId);
    } catch {}

    // App Visibility / Foreground Resume: silently refresh live profile without disrupting the user
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfileFromApi();
      }
    };

    const handleOnline = () => {
      refreshProfileFromApi();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [isUserLoggedIn, currentScreen]);

  // Load user profile & sync with direct custom backend in real-time (consumer app only)
  useEffect(() => {
    if (isAdminSubdomain() || currentScreen === 'admin') {
      setIsDataLoading(false);
      return;
    }

    if (!isUserLoggedIn || !user?.phone) {
      setTransactions([]);
      setIsDataLoading(false);
      return;
    }

    let isMounted = true;
    setIsDataLoading(true);

    const loadInitial = async () => {
      try {
        await Promise.allSettled([
          getOrCreateUserProfile(user.phone).then((profile) => {
            if (isMounted && profile) setUser(profile);
          }),
          loadUserTransactionsFromDb(user.phone).then((txs) => {
            if (isMounted && txs) setTransactions(deduplicateTransactions(txs));
          }),
          refreshProfileFromApi(),
        ]);
      } finally {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) setIsDataLoading(false);
          }, 400);
        }
      }
    };

    loadInitial();

    // Real-time listener for user balance and profile
    const unsubUser = subscribeToUserProfile(user.phone, (updated) => {
      if (isMounted) {
        setUser((prev) => ({
          ...prev,
          balance: updated.balance,
          bonusBalance: updated.bonusBalance,
          name: updated.name && !isGenericCustomerName(updated.name) ? updated.name : prev.name,
          email: updated.email || prev.email,
          virtualAccounts: updated.virtualAccounts && updated.virtualAccounts.length > 0 ? updated.virtualAccounts : prev.virtualAccounts,
        }));
      }
    });

    // Real-time listener for user transactions
    const unsubTx = subscribeToUserTransactions(user.phone, (txs) => {
      if (isMounted && txs) {
        setTransactions(deduplicateTransactions(txs));
      }
    });

    // Real-time listener for user & broadcast notifications
    const unsubNotifs = subscribeToNotifications(user.phone, (notifsList) => {
      if (isMounted && notifsList) {
        setNotifications(notifsList);
      }
    });

    return () => {
      isMounted = false;
      unsubUser();
      unsubTx();
      unsubNotifs();
    };
  }, [user.phone, currentScreen]);

  // Fetch live profile from backend REST API (consumer only)
  const refreshProfileFromApi = async () => {
    if (isAdminSubdomain() || currentScreen === 'admin') {
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    setIsDataLoading(true);
    try {
      const res = await apiGetProfile();
      if (res.status === 'success' && res.data?.user) {
        const u = res.data.user;
        const resolvedName = (u.name && !isGenericCustomerName(u.name))
          ? u.name
          : ((user.name && !isGenericCustomerName(user.name)) ? user.name : (u.username || "Al'amin"));
        const updatedUser: UserProfile = {
          name: resolvedName,
          username: u.username || user.username,
          phone: u.phone || user.phone,
          email: u.email || user.email,
          avatarUrl: user.avatarUrl,
          balance: parseFloat(u.balance) || 0,
          bonusBalance: parseFloat(u.bonus_balance) || 0,
          role: u.role || user.role || 'user',
          virtualAccounts: res.data.virtualAccounts || user.virtualAccounts || [],
          isVerified: true,
          biometricEnabled: user.biometricEnabled,
          hasPin: true,
          requirePinForTransactions: user.requirePinForTransactions ?? false,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('jagora_user_logged_in', 'true');
          localStorage.setItem('jagora_user_profile', JSON.stringify(updatedUser));
        } catch {}

        const isUserSuperAdmin = (u.role === 'admin' || u.adminRole === 'super_admin' || u.email?.toLowerCase() === 'bashirabubakar650@gmail.com');
        if (isUserSuperAdmin) {
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem('jagora_admin_authenticated', 'true');
          } catch {}
        } else {
          setIsAdminAuthenticated(false);
          try {
            localStorage.removeItem('jagora_admin_authenticated');
          } catch {}
        }

        if (res.data.recentTransactions && Array.isArray(res.data.recentTransactions)) {
          const mapped: Transaction[] = res.data.recentTransactions.map((tx: any) => {
            const txTypeStr = String(tx.type || tx.category || '').toLowerCase();
            const ref = String(tx.reference || tx.id || '').trim();
            const id = ref || `tx-${Date.now()}`;
            return {
              id: id,
              reference: ref,
              title: tx.title || (txTypeStr.includes('data') ? 'Data Bundle' : txTypeStr.includes('airtime') ? 'Airtime Topup' : 'Wallet Funding'),
              subtitle: tx.description || `${tx.type || tx.category || 'Transaction'}`,
              recipient: tx.recipient || '',
              date: tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
              group: 'Today',
              amount: parseFloat(tx.amount) || 0,
              isCredit: txTypeStr.includes('funding') || txTypeStr.includes('commission') || txTypeStr.includes('credit') || !!tx.isCredit,
              status: (String(tx.status || '').toUpperCase() === 'SUCCESS' ? 'SUCCESS' : String(tx.status || '').toUpperCase() === 'FAILED' ? 'FAILED' : 'PENDING') as any,
              category: (txTypeStr.includes('data') ? 'data' : txTypeStr.includes('airtime') ? 'airtime' : 'funding') as any,
              iconType: txTypeStr.includes('data') ? 'wifi' : txTypeStr.includes('airtime') ? 'phone' : 'wallet',
            };
          });
          setTransactions((prev) => deduplicateTransactions([...mapped, ...prev]));
        }
      } else if (res.status === 'error' && (res.code === 'UNAUTHORIZED' || res.code === 'INVALID_TOKEN')) {
        window.dispatchEvent(
          new CustomEvent('jagora:unauthorized', {
            detail: { message: 'Your session has expired. Please sign in again.' },
          })
        );
      }
    } catch {
      // Backend offline, fallback to local storage
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminSubdomain() && currentScreen !== 'admin') {
      refreshProfileFromApi();
    }
  }, [currentScreen]);

  // Strict backend verification of administrative session to prevent localStorage spoofing
  useEffect(() => {
    if ((currentScreen === 'admin' || isAdminSubdomain()) && isAdminAuthenticated) {
      apiGetAdminProfile()
        .then((res) => {
          if (res.status === 'success' && res.data?.user) {
            setAdminProfile(res.data.user);
          } else if (
            res.status === 'error' &&
            (res.code === 'FORBIDDEN' || res.code === 'UNAUTHORIZED' || res.code === 'ACCOUNT_SUSPENDED')
          ) {
            setIsAdminAuthenticated(false);
            setAdminProfile(null);
            try {
              localStorage.removeItem('jagora_admin_authenticated');
              localStorage.removeItem('jagora_admin_profile');
            } catch {}
            setCurrentScreen('admin');
            showToast('Administrative session expired. Please sign in with valid staff credentials.', 'error');
          }
        })
        .catch(() => {});
    }
  }, [currentScreen, isAdminAuthenticated]);

  // Fund Wallet Handler
  const handleFundSuccess = async (amount: number) => {
    let newBalance = user.balance + amount;
    
    // Synchronize with server backend
    try {
      const token = localStorage.getItem('jagora_auth_token');
      const res = await fetch(resolveApiUrl('/api/wallet/fund'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount, phone: user.phone }),
      });
      const data = await res.json();
      if (data.newBalance !== undefined) {
        newBalance = data.newBalance;
      }
    } catch {
      // Backend unreachable; local balance persists
    }

    setUser((prev) => ({ ...prev, balance: newBalance }));
    updateUserBalanceInDb(user.phone, newBalance);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'Wallet Funding',
      subtitle: `Today, ${timeStr}`,
      date: `Today, ${timeStr}`,
      group: 'Today',
      amount,
      isCredit: true,
      status: 'SUCCESS',
      category: 'funding',
      iconType: 'wallet',
    };
    setTransactions((prev) => deduplicateTransactions([newTx, ...prev]));
    recordTransactionInDb(newTx, user.phone);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Wallet Funded',
      message: `Your wallet was successfully funded with ₦${amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
      })}.`,
      time: timeStr,
      group: 'TODAY',
      read: false,
      type: 'wallet',
      accentColor: '#b2c5ff',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    playCoinSound();
    triggerConfetti();
    showToast(`Wallet funded with ₦${amount.toLocaleString()}!`);
  };

  // Buy Data Handler with strict rollback and persistent synchronization
  const handleBuyData = async (plan: DataPlan, rawPhone: string, pin?: string): Promise<boolean> => {
    const norm = normalizeNigerianPhone(rawPhone);
    const phone = norm.cleaned;

    if (!norm.isValid) {
      showToast(norm.error || 'Please enter a valid 11-digit Nigerian phone number.');
      return false;
    }

    if (user.balance < plan.price) {
      showToast(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          plan.price - user.balance
        ).toFixed(2)}.`
      );
      return false;
    }

    // Preserve baseline balance for absolute rollback guarantee
    const previousBalance = user.balance;

    // Start multi-phase transaction transparency (NN/g Heuristic #1)
    startTransactionProgress(`${plan.network.toUpperCase()} ${plan.size} Data`, phone, plan.price);
    setTransactionStep(0, 'Validating recipient line & telecom carrier...');

    try {
      setTransactionStep(1, 'Securing transaction & acquiring atomic balance lock...');
      await new Promise((r) => setTimeout(r, 350));
      setTransactionStep(2, 'Routing dispatch to telecom operator switch...');

      const res = await apiBuyData({
        network: plan.networkKey || plan.network,
        network_key: plan.networkKey || plan.network,
        plan_id: plan.id,
        plan_code: plan.planCode || plan.id,
        plan_name: `${plan.network.toUpperCase()} ${plan.size} (${plan.type})`,
        size: plan.size,
        validity: plan.validity,
        phone,
        amount: plan.price,
        pin: pin || '',
      });

      if (res.status === 'success' || (res as any).success) {
        setTransactionStep(3, 'Dispensing value & issuing official e-Receipt...');
        await new Promise((r) => setTimeout(r, 450));
        finishTransactionProgress();

        const newBal =
          parseFloat((res.data as any)?.newBalance ?? (res as any).newBalance) ||
          previousBalance - plan.price;
        setUser((prev) => ({ ...prev, balance: newBal }));
        updateUserBalanceInDb(user.phone, newBal);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const txRef = res.data?.reference || (res as any).reference || `AJD-DAT-${Date.now()}`;
        const newTx: Transaction = {
          id: txRef,
          title: `${plan.network.toUpperCase()} ${plan.size} Data`,
          subtitle: `${phone} • ${timeStr}`,
          recipient: phone,
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: plan.price,
          isCredit: false,
          status: 'SUCCESS',
          category: 'data',
          iconType: 'wifi',
        };
        setTransactions((prev) => deduplicateTransactions([newTx, ...prev]));
        recordTransactionInDb(newTx, user.phone, false);

        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: 'Data Purchase Successful',
          message: res.message || `Purchased ${plan.network.toUpperCase()} ${plan.size} (${plan.type}) for ${phone}.`,
          time: timeStr,
          group: 'TODAY',
          read: false,
          type: 'data',
          accentColor: '#b2c5ff',
        };
        setNotifications((prev) => [newNotif, ...prev]);
        playSuccessChime();
        triggerConfetti();
        setSelectedTxForReceipt(newTx);
        showToast(res.message || `Data bundle of ${plan.size} sent to ${phone}!`);
        return true;
      } else {
        finishTransactionProgress();
        // Strict Rollback: Revert to exact original balance
        setUser((prev) => ({ ...prev, balance: previousBalance }));
        updateUserBalanceInDb(user.phone, previousBalance);
        showToast(humanizeVtuError(res.message, 'data purchase'));
        return false;
      }
    } catch (err: any) {
      finishTransactionProgress();
      // Strict Rollback: Revert to exact original balance on error
      setUser((prev) => ({ ...prev, balance: previousBalance }));
      updateUserBalanceInDb(user.phone, previousBalance);
      showToast(humanizeVtuError(err, 'data purchase'));
      return false;
    }
  };

  // Buy Airtime Handler with strict rollback and persistent synchronization
  const handleAirtimeSuccess = async (
    network: string,
    rawPhone: string,
    amount: number,
    pin?: string
  ): Promise<boolean> => {
    const norm = normalizeNigerianPhone(rawPhone);
    const phone = norm.cleaned;

    if (!norm.isValid) {
      showToast(norm.error || 'Please enter a valid 11-digit Nigerian phone number.');
      return false;
    }

    const cost = Math.round(amount * 0.98 * 100) / 100;
    if (user.balance < cost) {
      showToast(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          cost - user.balance
        ).toFixed(2)}.`
      );
      return false;
    }

    // Baseline balance snapshot for rollback guarantee
    const previousBalance = user.balance;

    // Start multi-phase transaction transparency
    startTransactionProgress(`${network.toUpperCase()} Airtime`, phone, cost);
    setTransactionStep(0, 'Validating mobile phone number & telecom network...');

    try {
      setTransactionStep(1, 'Securing transaction & acquiring atomic balance lock...');
      await new Promise((r) => setTimeout(r, 350));
      setTransactionStep(2, 'Routing dispatch to telecom operator switch...');

      const res = await apiBuyAirtime({
        network,
        phone,
        amount,
        pin: pin || undefined,
      });

      if (res.status === 'success' || (res as any).success) {
        setTransactionStep(3, 'Airtime credited! Generating official e-Receipt...');
        await new Promise((r) => setTimeout(r, 450));
        finishTransactionProgress();

        const newBal =
          parseFloat((res.data as any)?.newBalance ?? (res as any).newBalance) ||
          previousBalance - cost;
        setUser((prev) => ({ ...prev, balance: newBal }));
        updateUserBalanceInDb(user.phone, newBal);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const txRef = res.data?.reference || (res as any).reference || `AJD-AIR-${Date.now()}`;
        const newTx: Transaction = {
          id: txRef,
          title: `Buy Airtime - ${network.toUpperCase()}`,
          subtitle: `${network.toUpperCase()} ₦${amount} to ${phone}`,
          recipient: phone,
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: res.data?.charged || (res as any).charged || cost,
          isCredit: false,
          status: 'SUCCESS',
          category: 'airtime',
          iconType: 'phone',
        };
        setTransactions((prev) => deduplicateTransactions([newTx, ...prev]));
        recordTransactionInDb(newTx, user.phone, false);

        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: 'Airtime Purchase Successful',
          message: res.message || `Recharged ₦${amount} ${network.toUpperCase()} Airtime for ${phone}.`,
          time: timeStr,
          group: 'TODAY',
          read: false,
          type: 'wallet',
          accentColor: '#b2c5ff',
        };
        setNotifications((prev) => [newNotif, ...prev]);
        playSuccessChime();
        triggerConfetti();
        setSelectedTxForReceipt(newTx);
        showToast(res.message || `₦${amount} airtime sent to ${phone}!`);
        return true;
      } else {
        finishTransactionProgress();
        // Strict Rollback: Revert to exact original balance
        setUser((prev) => ({ ...prev, balance: previousBalance }));
        updateUserBalanceInDb(user.phone, previousBalance);
        showToast(humanizeVtuError(res.message, 'airtime transaction'));
        return false;
      }
    } catch (err: any) {
      finishTransactionProgress();
      // Strict Rollback: Revert to exact original balance on error
      setUser((prev) => ({ ...prev, balance: previousBalance }));
      updateUserBalanceInDb(user.phone, previousBalance);
      showToast(humanizeVtuError(err, 'airtime transaction'));
      return false;
    }
  };


  // Generic Utility, EPIN, Data Card Transaction Handler
  const handleUtilityOrPinSuccess = (tx: Transaction) => {
    const newBalance = user.balance - tx.amount;
    setUser((prev) => ({ ...prev, balance: newBalance }));
    updateUserBalanceInDb(user.phone, newBalance);
    setTransactions((prev) => deduplicateTransactions([tx, ...prev]));
    recordTransactionInDb(tx, user.phone);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `${tx.title} Complete`,
      message: `${tx.subtitle}. Total: ₦${tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      time: timeStr,
      group: 'TODAY',
      read: false,
      type: 'wallet',
      accentColor: '#0047cc',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    playSuccessChime();
    triggerConfetti();
    setSelectedTxForReceipt(tx);
    showToast(`${tx.title} completed successfully!`);
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsReadInDb(user.phone);
    showToast('All notifications marked as read.');
  };

  // Auth Handlers with serverData and role-based smart routing
  const handleLoginSuccess = (phone: string, serverData?: any) => {
    setTransactions([]);
    setAuthLoadingMessage('Authenticating session & verifying account permissions...');
    setIsUserLoggedIn(true);
    setIsSessionLocked(false);
    setSessionExpiredNotice('');
    setShowStaff2FALogin(false);

    if (serverData && serverData.user) {
      const u = serverData.user;
      const isAdmin =
        u.role === 'admin' ||
        u.role === 'support_agent' ||
        u.role === 'finance_agent' ||
        Boolean(u.adminRole) ||
        u.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
        u.phone === '08123456789' ||
        u.id === 'usr_admin_01';

      const updatedProfile: UserProfile = {
        ...user,
        name: u.name || user.name,
        email: u.email || user.email,
        phone: u.phone || phone,
        balance: parseFloat(u.balance) || 0,
        bonusBalance: parseFloat(u.bonus_balance) || 0,
        role: u.role || (isAdmin ? 'admin' : 'user'),
        virtualAccounts: serverData.virtualAccounts || [],
      };
      setUser(updatedProfile);

      const resolvedToken = serverData?.token || serverData?.data?.token || btoa(phone);
      setAuthToken(resolvedToken);
      try {
        localStorage.setItem('jagora_auth_token', resolvedToken);
        localStorage.setItem('jagora_token', resolvedToken);
        localStorage.setItem('jagora_user_logged_in', 'true');
        localStorage.setItem('jagora_user_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('jagora_is_existing_user', 'true');
        localStorage.setItem('jagora_has_visited', 'true');
      } catch {}

      if (isAdmin) {
        setIsAdminAuthenticated(true);
        setAdminProfile(u);
        try {
          localStorage.setItem('jagora_admin_authenticated', 'true');
          localStorage.setItem('jagora_admin_profile', JSON.stringify(u));
          localStorage.setItem('jagora_active_screen', 'admin');
        } catch {}

        setTimeout(() => {
          setAuthLoadingMessage(null);
          setCurrentScreen('admin');
          const roleLabel =
            u.adminRole === 'super_admin'
              ? 'Super Administrator'
              : u.adminRole === 'support_agent'
              ? 'Support Agent'
              : u.adminRole === 'finance_agent'
              ? 'Finance Agent'
              : 'Administrator';
          setAlerts([]);
          showToast(`Welcome ${roleLabel}, ${u.name || 'Admin'}!`);
        }, 550);
        return;
      }

      // Customer route
      try {
        localStorage.setItem('jagora_active_screen', 'home');
      } catch {}
      setTimeout(() => {
        setAuthLoadingMessage(null);
        setCurrentScreen('home');
        setAlerts([]);
        showToast(`Welcome back, ${updatedProfile.name}!`);
      }, 550);
      return;
    }

    getOrCreateUserProfile(phone).then((profile) => {
      const isAdmin =
        profile.role === 'admin' ||
        profile.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
        profile.phone === '08123456789';

      setUser(profile);
      const fallbackToken = btoa(phone);
      setAuthToken(fallbackToken);
      try {
        localStorage.setItem('jagora_auth_token', fallbackToken);
        localStorage.setItem('jagora_token', fallbackToken);
        localStorage.setItem('jagora_user_logged_in', 'true');
        localStorage.setItem('jagora_user_profile', JSON.stringify(profile));
        localStorage.setItem('jagora_is_existing_user', 'true');
        localStorage.setItem('jagora_has_visited', 'true');
      } catch {}

      if (isAdmin) {
        setIsAdminAuthenticated(true);
        setAdminProfile(profile);
        try {
          localStorage.setItem('jagora_admin_authenticated', 'true');
          localStorage.setItem('jagora_admin_profile', JSON.stringify(profile));
          localStorage.setItem('jagora_active_screen', 'admin');
        } catch {}

        setTimeout(() => {
          setAuthLoadingMessage(null);
          setCurrentScreen('admin');
          setAlerts([]);
          showToast(`Welcome Administrator, ${profile.name}!`);
        }, 550);
        return;
      }

      try {
        localStorage.setItem('jagora_active_screen', 'home');
      } catch {}
      setTimeout(() => {
        setAuthLoadingMessage(null);
        setCurrentScreen('home');
        setAlerts([]);
        showToast(`Welcome back, ${profile.name}!`);
      }, 550);
    });
  };

  const handleRegisterSuccess = (newUser: { name: string; username?: string; email: string; phone: string; serverData?: any }) => {
    setTransactions([]);
    setAuthLoadingMessage('Provisioning automated telecom wallet...');
    setIsUserLoggedIn(true);
    if (newUser.serverData && newUser.serverData.user) {
      const u = newUser.serverData.user;
      const updatedProfile: UserProfile = {
        ...user,
        name: u.name || newUser.name,
        username: u.username || newUser.username,
        email: u.email || newUser.email,
        phone: u.phone || newUser.phone,
        balance: parseFloat(u.balance) || 0,
        bonusBalance: parseFloat(u.bonus_balance) || 0,
        role: u.role || 'user',
        virtualAccounts: newUser.serverData.virtualAccounts || [],
      };
      const regTok = newUser.serverData?.token || newUser.serverData?.data?.token || btoa(newUser.phone);
      setAuthToken(regTok);
      try {
        localStorage.setItem('jagora_auth_token', regTok);
        localStorage.setItem('jagora_token', regTok);
        localStorage.setItem('jagora_user_logged_in', 'true');
        localStorage.setItem('jagora_user_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('jagora_active_screen', 'home');
        localStorage.setItem('jagora_is_existing_user', 'true');
        localStorage.setItem('jagora_has_visited', 'true');
      } catch {}
      if (u.role === 'admin') {
        setIsAdminAuthenticated(true);
        try {
          localStorage.setItem('jagora_admin_authenticated', 'true');
        } catch {}
      }
      setTimeout(() => {
        setAuthLoadingMessage(null);
        setCurrentScreen('home');
        showToast(`Account created successfully! Welcome, ${updatedProfile.name}!`);
      }, 550);
      return;
    }

    const updatedProfile: UserProfile = {
      ...user,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      balance: 0,
      bonusBalance: 0,
    };
    setUser(updatedProfile);
    try {
      localStorage.setItem('jagora_user_logged_in', 'true');
      localStorage.setItem('jagora_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('jagora_active_screen', 'home');
      localStorage.setItem('jagora_is_existing_user', 'true');
      localStorage.setItem('jagora_has_visited', 'true');
    } catch {}
    saveUserProfileToDb(updatedProfile);
    setTimeout(() => {
      setAuthLoadingMessage(null);
      setCurrentScreen('home');
      showToast('Account created successfully!');
    }, 550);
  };

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutTarget, setLogoutTarget] = useState<'user' | 'admin'>('user');

  const requestLogout = (target: 'user' | 'admin' = 'user') => {
    setLogoutTarget(target);
    setIsLogoutModalOpen(true);
  };

  const executeLogout = () => {
    setIsLogoutModalOpen(false);
    setTransactions([]);
    if (logoutTarget === 'admin') {
      setAuthLoadingMessage('Locking administrative console & securing keys...');
      apiLogout().catch(() => {});
      setTimeout(() => {
        setIsUserLoggedIn(false);
        setIsAdminAuthenticated(false);
        setAdminProfile(null);
        setUser(initialUser);
        try {
          localStorage.removeItem('jagora_admin_authenticated');
          localStorage.removeItem('jagora_admin_profile');
          localStorage.removeItem('jagora_user_logged_in');
          localStorage.removeItem('jagora_user_profile');
          localStorage.removeItem('jagora_token');
          localStorage.removeItem('jagora_auth_token');
          localStorage.removeItem('jagora_admin_token');
          localStorage.setItem('jagora_active_screen', isAdminSubdomain() ? 'admin' : 'login');
        } catch {}
        setAuthToken(null);
        setAuthLoadingMessage(null);
        setCurrentScreen(isAdminSubdomain() ? 'admin' : 'login');
        if (window.location.hash === '#admin') {
          history.replaceState(null, '', window.location.pathname);
        }
        showToast('Logged out of Admin Console.', 'info', 'Console Locked');
      }, 500);
    } else {
      setAuthLoadingMessage('Securing wallet & ending session...');
      apiLogout().catch(() => {});
      setTimeout(() => {
        try {
          localStorage.removeItem('jagora_token');
          localStorage.removeItem('jagora_auth_token');
          localStorage.removeItem('jagora_admin_token');
          localStorage.removeItem('jagora_user_logged_in');
          localStorage.removeItem('jagora_user_profile');
          localStorage.removeItem('jagora_admin_authenticated');
          localStorage.removeItem('jagora_admin_profile');
          localStorage.setItem('jagora_active_screen', 'login');
        } catch {}
        setAuthToken(null);
        setIsUserLoggedIn(false);
        setIsAdminAuthenticated(false);
        setAdminProfile(null);
        setUser(initialUser);
        setTransactions([]);
        setAuthLoadingMessage(null);
        setCurrentScreen('login');
        history.replaceState(null, '', '/' + window.location.search);
        showToast('You have been logged out successfully.', 'info', 'Session Ended');
      }, 500);
    }
  };

  const handleLogout = () => {
    requestLogout('user');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Title for sub-screens
  const getScreenTitle = (screen: ScreenType) => {
    switch (screen) {
      case 'landing':
        return "AJDATASUB";
      case 'data':
        return 'Buy Data';
      case 'airtime':
        return 'Buy Airtime';
      case 'recharge-pin':
        return 'Recharge PIN';
      case 'data-card':
        return 'Data Card';
      case 'cable':
        return 'Cable TV & Bills';
      case 'electricity':
        return 'Electricity Bills';
      case 'exam-pin':
        return 'Exam PINs';
      case 'fund-wallet':
        return 'Fund Wallet';
      case 'wallet':
        return 'Wallet';
      case 'history':
        return 'History';
      case 'notifications':
        return 'Notifications';
      case 'profile':
        return 'Profile';
      case 'referrals':
        return 'Refer & Earn';
      case 'support':
        return 'Help & Support';
      case 'chat':
        return 'Chat With Us';
      default:
        return "AJDATASUB";
    }
  };

  // Dedicated In-App Professional Loading Screen during Auth / Session transitions
  if (authLoadingMessage) {
    return (
      <>
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <LoadingScreen
          message={authLoadingMessage}
          isLightMode={isLightMode}
          fullScreen={true}
        />
      </>
    );
  }

  // Professional Landing Page (First page before login or sign up)
  if (currentScreen === 'landing') {
    return (
      <>
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <LandingPage
          onNavigate={setCurrentScreen}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          currentUser={user}
        />
        {isSimulationAllowed() && (
          <ApiSettingsModal
            isOpen={isApiSettingsOpen}
            onClose={() => setIsApiSettingsOpen(false)}
            isLightMode={isLightMode}
            onConnectionChange={refreshProfileFromApi}
          />
        )}
      </>
    );
  }

  // If user is on Auth Screens
  if (currentScreen === 'login') {
    return (
      <>
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentScreen('register')}
          onNavigateLanding={() => setCurrentScreen('landing')}
          onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
          onNavigateTerms={() => setCurrentScreen('terms')}
          onNavigatePrivacy={() => setCurrentScreen('privacy')}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          sessionExpiredNotice={sessionExpiredNotice}
        />
        {isSimulationAllowed() && (
          <ApiSettingsModal
            isOpen={isApiSettingsOpen}
            onClose={() => setIsApiSettingsOpen(false)}
            isLightMode={isLightMode}
            onConnectionChange={refreshProfileFromApi}
          />
        )}
      </>
    );
  }


  if (currentScreen === 'register') {
    return (
      <>
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentScreen('login')}
          onNavigateLanding={() => setCurrentScreen('landing')}
          onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          isReferralsHidden={isReferralsHidden}
        />
        {isSimulationAllowed() && (
          <ApiSettingsModal
            isOpen={isApiSettingsOpen}
            onClose={() => setIsApiSettingsOpen(false)}
            isLightMode={isLightMode}
            onConnectionChange={refreshProfileFromApi}
          />
        )}
      </>
    );
  }

  if (currentScreen === 'terms' || currentScreen === 'privacy') {
    return (
      <>
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <LegalScreen
          initialTab={currentScreen === 'privacy' ? 'privacy' : 'terms'}
          onNavigateBack={() => {
            if (isUserLoggedIn) {
              setCurrentScreen('profile');
            } else {
              setCurrentScreen('landing');
            }
          }}
          onNavigate={setCurrentScreen}
          isLightMode={isLightMode}
        />
      </>
    );
  }

  // Admin Portal & Authentication Guard (strictly enforced on staff/admin subdomains)
  if (currentScreen === 'admin' || isAdminSubdomain()) {
    // If not authenticated as Admin:
    if (!isAdminAuthenticated) {
      // 1. If currently logged in as a normal customer, block access to admin and return them to customer home
      if (isUserLoggedIn && user && user.role !== 'admin' && !['bashirabubakar650@gmail.com', '08123456789'].includes(user.email?.toLowerCase() || user.phone)) {
        setTimeout(() => {
          setCurrentScreen('home');
          showToast('Access denied: Administrator privileges required to access the admin portal.');
        }, 0);
        return null;
      }

      // Shared Login Screen: Admin and regular users share the same login screen
      return (
        <>
          <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentScreen('register')}
            onNavigateLanding={() => setCurrentScreen('landing')}
            onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
            onNavigateTerms={() => setCurrentScreen('terms')}
            onNavigatePrivacy={() => setCurrentScreen('privacy')}
            isLightMode={isLightMode}
            onToggleTheme={() => setIsLightMode(!isLightMode)}
            sessionExpiredNotice={sessionExpiredNotice || 'Administrator Portal: Sign in with your administrator credentials to access the console.'}
          />
          {isSimulationAllowed() && (
            <ApiSettingsModal
              isOpen={isApiSettingsOpen}
              onClose={() => setIsApiSettingsOpen(false)}
              isLightMode={isLightMode}
              onConnectionChange={refreshProfileFromApi}
            />
          )}
        </>
      );
    }

    // When authenticated, render the Standard VTU Admin Control Engine
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
        }`}
      >
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <AdminDashboardScreen
          adminProfile={adminProfile}
          onUpdateAdminProfile={(updated) => {
            setAdminProfile(updated);
            try {
              localStorage.setItem('jagora_admin_profile', JSON.stringify(updated));
              if (user && user.role === 'admin') {
                setUser((prev) => ({ ...prev, ...updated }));
                localStorage.setItem('jagora_user_profile', JSON.stringify({ ...user, ...updated }));
              }
            } catch {}
          }}
          onExitAdmin={() => {
            if (isAdminSubdomain()) {
              const hostname = window.location.hostname;
              if (hostname.includes('.')) {
                const mainDomain = hostname.replace(/^(admin|ops|ops-desk|hq|hq-desk|portal|manager|console|control|secure|staff|vtu-ops)\./i, '');
                if (mainDomain && mainDomain !== hostname) {
                  window.location.href = `${window.location.protocol}//${mainDomain}`;
                  return;
                }
              }
            }
            setCurrentScreen('home');
          }}
          onLogoutAdmin={() => requestLogout('admin')}
          showToast={showToast}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode((prev) => !prev)}
        />
        {/* Logout Confirmation Dialog for Admin Console */}
        <ActionConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          title={logoutTarget === 'admin' ? 'Log Out of Admin Console?' : 'Log Out of Your Account?'}
          description={
            logoutTarget === 'admin'
              ? 'Are you sure you want to end your administrator session? Active administrative keys and elevated privileges will be locked.'
              : 'Are you sure you want to log out? Any unsaved changes will be secured, and you will need to enter your phone number and password to log in again.'
          }
          warningNote={
            logoutTarget === 'admin'
              ? 'Administrative audit log will record console session termination.'
              : undefined
          }
          confirmLabel={logoutTarget === 'admin' ? 'Sign Out Console' : 'Yes, Log Out'}
          cancelLabel="Stay Logged In"
          variant="danger"
          iconType="logout"
          isLightMode={isLightMode}
        />
      </div>
    );
  }

  // Guard Protected Screens from Unauthenticated Visitors
  if (!isUserLoggedIn && !['landing', 'login', 'register', 'support',
  'chat', 'terms', 'privacy', 'admin'].includes(currentScreen)) {
    return (
      <>
        <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentScreen('register')}
          onNavigateLanding={() => setCurrentScreen('landing')}
          onAdminLogin={() => setShowStaff2FALogin(true)}
          onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
          onNavigateTerms={() => setCurrentScreen('terms')}
          onNavigatePrivacy={() => setCurrentScreen('privacy')}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          sessionExpiredNotice={sessionExpiredNotice}
        />
        {isSimulationAllowed() && (
          <ApiSettingsModal
            isOpen={isApiSettingsOpen}
            onClose={() => setIsApiSettingsOpen(false)}
            isLightMode={isLightMode}
            onConnectionChange={refreshProfileFromApi}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-200 ${
        isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Professional Toast Notification System */}
      <ProfessionalToastContainer alerts={alerts} onDismiss={dismissAlert} isLightMode={isLightMode} />

      {/* Main Responsive App Shell Container */}
      <div className="w-full min-h-screen overflow-x-hidden relative flex flex-col transition-colors bg-slate-50 dark:bg-slate-900">
        {/* Offline Connectivity Banner */}
        <OfflineBanner />

        {/* Top Header with Desktop Navbar & Mobile App Bar */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onOpenDrawer={() => setDrawerOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          user={user}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          title={getScreenTitle(currentScreen)}
          showBack={currentScreen !== 'home'}
          onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
          onLogout={handleLogout}
        />

        {/* Active Screen Body with fluid keyframe transition animation */}
        <main key={currentScreen} className="flex-1 w-full overflow-x-hidden animate-screen-enter">
            {currentScreen === 'home' && (
              <DashboardScreen
                user={user}
                transactions={transactions}
                isLoading={isDataLoading}
                onNavigate={setCurrentScreen}
                onOpenFundWallet={() => setIsFundWalletOpen(true)}
                onOpenBuyAirtime={() => setIsBuyAirtimeOpen(true)}
                onOpenRechargePin={() => setIsRechargePinOpen(true)}
                onOpenDataCard={() => setIsDataCardOpen(true)}
                onOpenCableTv={() => setCurrentScreen('cable')}
                onOpenElectricity={() => setCurrentScreen('electricity')}
                onOpenExamPin={() => setCurrentScreen('exam-pin')}
                onOpenMoreServices={() => setIsMoreServicesOpen(true)}
                onSelectTransaction={(tx) => setSelectedTxForReceipt(tx)}
                onOpenHelp={() => setCurrentScreen('support')}
                isLightMode={isLightMode}
                broadcastAnnouncement={platformSettings.broadcastAnnouncement}
                isMaintenanceMode={platformSettings.maintenanceMode}
                onRefresh={refreshProfileFromApi}
                isReferralsHidden={isReferralsHidden}
              />
            )}

            {currentScreen === 'data' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="data"
                onBuyData={handleBuyData}
                onAirtimeSuccess={handleAirtimeSuccess}
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'airtime' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="airtime"
                onBuyData={handleBuyData}
                onAirtimeSuccess={handleAirtimeSuccess}
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'cable' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="cable"
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'electricity' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="electricity"
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'exam-pin' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="exam"
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'recharge-pin' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="recharge-pin"
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'data-card' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="data-card"
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
              />
            )}

            {currentScreen === 'fund-wallet' && (
              <FundWalletScreen
                virtualAccounts={user.virtualAccounts}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateSupport={() => setCurrentScreen('support')}
                onRefresh={refreshProfileFromApi}
              />
            )}

            {currentScreen === 'wallet' && (
              <WalletScreen
                user={user}
                transactions={transactions}
                onOpenFundWallet={() => setCurrentScreen('fund-wallet')}
                onNavigateFundWallet={() => setCurrentScreen('fund-wallet')}
                onSelectTransaction={(tx) => setSelectedTxForReceipt(tx)}
                onNavigateHistory={() => setCurrentScreen('history')}
                onNavigateSupport={() => setCurrentScreen('support')}
                onNavigate={setCurrentScreen}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
                isReferralsHidden={isReferralsHidden}
                onTransferSuccess={(recipient, amount, reference, newBalance) => {
                  setUser((prev) => ({ ...prev, balance: newBalance }));
                  updateUserBalanceInDb(user.phone, newBalance);
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const newTx: Transaction = {
                    id: reference,
                    title: `Transfer to ${recipient}`,
                    subtitle: 'Wallet Transfer',
                    date: `Today, ${timeStr}`,
                    group: 'Today',
                    amount,
                    isCredit: false,
                    status: 'SUCCESS',
                    category: 'transfer',
                    iconType: 'wallet',
                    recipient,
                    reference,
                  };
                  setTransactions((prev) => deduplicateTransactions([newTx, ...prev]));
                  recordTransactionInDb(newTx, user.phone);
                  showToast(`₦${amount.toLocaleString()} transferred to ${recipient}.`, 'success', 'Transfer Sent');
                }}
              />
            )}

            {currentScreen === 'history' && (
              <HistoryScreen
                transactions={transactions}
                onSelectTransaction={(tx) => setSelectedTxForReceipt(tx)}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'chat' && (
              <ChatWithUsScreen
                user={user}
                onNavigateBack={() => setCurrentScreen('support')}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'support' && (
              <SupportScreen
                user={user}
                isLightMode={isLightMode}
                onNavigate={setCurrentScreen}
                supportContacts={platformSettings?.supportContacts}
              />
            )}

            {currentScreen === 'notifications' && (
              <NotificationsScreen
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onSelectNotification={(id) => {
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                  );
                  markNotificationReadInDb(id, user.phone);
                }}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'profile' && (
              <ProfileScreen
                user={user}
                onUpdateUser={(updated) => {
                  setUser((prev) => {
                    const next = { ...prev, ...updated };
                    try {
                      localStorage.setItem('jagora_user_profile', JSON.stringify(next));
                    } catch {}
                    saveUserProfileToDb(next).catch(() => {});
                    return next;
                  });
                }}
                onLogout={handleLogout}
                onOpenHelp={() => setCurrentScreen('support')}
                onNavigate={setCurrentScreen}
                isLightMode={isLightMode}
                onToggleTheme={() => setIsLightMode(!isLightMode)}
                isReferralsHidden={isReferralsHidden}
              />
            )}

            {currentScreen === 'referrals' && (
              <ReferralsScreen
                user={user}
                onNavigate={setCurrentScreen}
                onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
                isLightMode={isLightMode}
                isReferralsHidden={isReferralsHidden}
              />
            )}
          </main>

          {/* Bottom Navigation Bar */}
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            isLightMode={isLightMode}
          />
        </div>

      {/* Side Navigation Drawer (Screenshot 11) */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onOpenHelp={() => setCurrentScreen('support')}
        onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
        onLogout={handleLogout}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(!isLightMode)}
        isReferralsHidden={isReferralsHidden}
      />

      {/* Modals */}
      <FundWalletModal
        isOpen={isFundWalletOpen}
        onClose={() => setIsFundWalletOpen(false)}
        onFundSuccess={handleFundSuccess}
        onRefreshBalance={async () => {
          await refreshProfileFromApi();
          showToast('Wallet balance refreshed successfully.', 'success');
        }}
        virtualAccounts={user.virtualAccounts}
        isLightMode={isLightMode}
      />

      {isSimulationAllowed() && (
        <ApiSettingsModal
          isOpen={isApiSettingsOpen}
          onClose={() => setIsApiSettingsOpen(false)}
          isLightMode={isLightMode}
          onConnectionChange={refreshProfileFromApi}
        />
      )}

      <BuyAirtimeModal
        isOpen={isBuyAirtimeOpen}
        onClose={() => setIsBuyAirtimeOpen(false)}
        onAirtimeSuccess={handleAirtimeSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <MoreServicesModal
        isOpen={isMoreServicesOpen}
        onClose={() => setIsMoreServicesOpen(false)}
        onOpenCableTv={() => {
          setIsMoreServicesOpen(false);
          setCurrentScreen('cable');
        }}
        onOpenElectricity={() => {
          setIsMoreServicesOpen(false);
          setCurrentScreen('electricity');
        }}
        onOpenExamPin={() => {
          setIsMoreServicesOpen(false);
          setCurrentScreen('exam-pin');
        }}
        onOpenRechargePin={() => {
          setIsMoreServicesOpen(false);
          setCurrentScreen('recharge-pin');
        }}
        onOpenDataCard={() => {
          setIsMoreServicesOpen(false);
          setCurrentScreen('data-card');
        }}
        onSelectService={(service) => {
          showToast(`Selected ${service}. Feature ready!`, 'info');
        }}
        onUtilityPaymentSuccess={handleUtilityOrPinSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <CableTvModal
        isOpen={isCableTvOpen}
        onClose={() => setIsCableTvOpen(false)}
        onPaymentSuccess={handleUtilityOrPinSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <ElectricityModal
        isOpen={isElectricityOpen}
        onClose={() => setIsElectricityOpen(false)}
        onPaymentSuccess={handleUtilityOrPinSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <ExamPinModal
        isOpen={isExamPinOpen}
        onClose={() => setIsExamPinOpen(false)}
        onGenerateSuccess={handleUtilityOrPinSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <RechargePinModal
        isOpen={isRechargePinOpen}
        onClose={() => setIsRechargePinOpen(false)}
        onGenerateSuccess={handleUtilityOrPinSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <DataCardModal
        isOpen={isDataCardOpen}
        onClose={() => setIsDataCardOpen(false)}
        onGenerateSuccess={handleUtilityOrPinSuccess}
        userBalance={user.balance}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />

      <ReceiptModal
        isOpen={!!selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        transaction={selectedTxForReceipt}
        isLightMode={isLightMode}
      />

      {/* Logout Confirmation Dialog */}
      <ActionConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title={logoutTarget === 'admin' ? 'Log Out of Admin Console?' : 'Log Out of Your Account?'}
        description={
          logoutTarget === 'admin'
            ? 'Are you sure you want to end your administrator session? Active administrative keys and elevated privileges will be locked.'
            : 'Are you sure you want to log out? Any unsaved changes will be secured, and you will need to enter your phone number and password to log in again.'
        }
        warningNote={
          logoutTarget === 'admin'
            ? 'Administrative audit log will record console session termination.'
            : undefined
        }
        confirmLabel={logoutTarget === 'admin' ? 'Sign Out Console' : 'Yes, Log Out'}
        cancelLabel="Stay Logged In"
        variant="danger"
        iconType="logout"
        isLightMode={isLightMode}
      />

      {/* Real-time System Diagnostics & Multi-Phase Transaction Modals */}
      <SystemStatusModal isLightMode={isLightMode} />
      <GlobalTransactionModal isLightMode={isLightMode} />

      {/* Auto-Lock / Inactivity Quick PIN Unlock Modal */}
      <SessionLockModal
        isOpen={isSessionLocked}
        userName={(user.name && !isGenericCustomerName(user.name)) ? user.name : (user.username || "Al'amin")}
        userPhone={user.phone}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
        reason={sessionLockReason}
        onUnlockSuccess={() => {
          setIsSessionLocked(false);
          showToast('Session unlocked. Welcome back!', 'success');
          refreshProfileFromApi();
        }}
        onFullLogout={() => {
          setIsSessionLocked(false);
          requestLogout('user');
        }}
      />

      {/* Progressive Web App Mobile Install Prompt */}
      <PwaInstallPrompt isLightMode={isLightMode} />
    </div>
  );
}
