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
 * (e.g., admin.alaminjagora.ng, ops-desk.alaminjagora.ng, hq.alaminjagora.ng)
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
    const isAuthenticated = Boolean(isUserLoggedIn || token);

    // Dedicated Subdomain: Route straight to Admin if authenticated, else to login
    if (isAdminSubdomain()) {
      return isAdmin ? 'admin' : 'login';
    }

    // 1. Direct URL hash / query takes precedence
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
      if (['landing', 'login', 'register', 'support', 'terms', 'privacy'].includes(urlScreen)) {
        return urlScreen;
      }
      if (!isAuthenticated) {
        return 'login';
      }
      return urlScreen;
    }

    // 2. Check saved screen in localStorage
    const saved = localStorage.getItem('jagora_active_screen') as ScreenType | null;
    if (saved && VALID_SCREENS.includes(saved)) {
      if (!isAuthenticated && !['landing', 'login', 'register', 'support', 'terms', 'privacy'].includes(saved)) {
        return 'landing';
      }
      if (isAuthenticated && saved === 'landing') {
        return isAdmin ? 'admin' : 'home';
      }
      return saved;
    }

    // 3. Defaults based on active session
    if (isAdmin) {
      return 'admin';
    }
    if (isAuthenticated) {
      return 'home';
    }
  } catch {}

  // 4. Default for fresh visitors
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
      return savedAuth === 'true' || Boolean(token);
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
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsState>({ maintenanceMode: false });
  const isReferralsHidden = Boolean(platformSettings?.referralSettings?.hideFromUsers || platformSettings?.referralSettings?.enabled === false);

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
      duration: 4200,
    };

    setAlerts((prev) => [...prev.slice(-3), newAlert]);
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
  useEffect(() => {
    // Only apply session auto-lock when a consumer user is actively logged in
    if (!isUserLoggedIn || isAdminSubdomain() || currentScreen === 'admin') {
      return;
    }

    const IDLE_LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of complete inactivity
    const BACKGROUND_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in background / another app tab
    const FULL_LOGOUT_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours total inactivity
    const PROLONGED_OFFLINE_MS = 30 * 60 * 1000; // 30 minutes disconnected from network

    let lastActivityTimestamp = Date.now();
    let offlineStartTimestamp: number | null = !navigator.onLine ? Date.now() : null;

    const resetActivity = () => {
      if (!isSessionLocked) {
        lastActivityTimestamp = Date.now();
      }
    };

    // User interaction events to reset activity timer
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetActivity, { passive: true });
    });

    // Check timer periodically every 15 seconds
    const intervalId = setInterval(() => {
      if (isSessionLocked) return;
      const elapsed = Date.now() - lastActivityTimestamp;

      // Extended inactivity: full logout
      if (elapsed >= FULL_LOGOUT_TIMEOUT_MS) {
        setSessionExpiredNotice('Your session has expired due to 12 hours of inactivity. Please sign in to resume.');
        setIsUserLoggedIn(false);
        setUser(initialUser);
        try {
          localStorage.removeItem('jagora_token');
          localStorage.removeItem('jagora_auth_token');
          localStorage.removeItem('jagora_user_logged_in');
          localStorage.removeItem('jagora_user_profile');
          localStorage.setItem('jagora_active_screen', 'login');
        } catch {}
        setAuthToken(null);
        setCurrentScreen('login');
        showToast('Session expired due to extended inactivity.', 'warning', 'Session Ended');
        return;
      }

      // Idle inactivity: lock screen
      if (elapsed >= IDLE_LOCK_TIMEOUT_MS) {
        setSessionLockReason('idle');
        setIsSessionLocked(true);
      }
    }, 15000);

    // App Visibility / Tab Switching listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background
        lastActivityTimestamp = Date.now();
      } else {
        // App returned to foreground
        const backgroundElapsed = Date.now() - lastActivityTimestamp;
        if (backgroundElapsed >= FULL_LOGOUT_TIMEOUT_MS) {
          setSessionExpiredNotice('Your session expired while the app was in the background. Please sign in.');
          setIsUserLoggedIn(false);
          setUser(initialUser);
          try {
            localStorage.removeItem('jagora_token');
            localStorage.removeItem('jagora_auth_token');
            localStorage.removeItem('jagora_user_logged_in');
            localStorage.removeItem('jagora_user_profile');
            localStorage.setItem('jagora_active_screen', 'login');
          } catch {}
          setAuthToken(null);
          setCurrentScreen('login');
        } else if (backgroundElapsed >= BACKGROUND_LOCK_TIMEOUT_MS && !isSessionLocked) {
          setSessionLockReason('idle');
          setIsSessionLocked(true);
        }
      }
    };

    // Network connectivity gap listener
    const handleOffline = () => {
      offlineStartTimestamp = Date.now();
    };

    const handleOnline = () => {
      if (offlineStartTimestamp) {
        const offlineDuration = Date.now() - offlineStartTimestamp;
        offlineStartTimestamp = null;
        if (offlineDuration >= PROLONGED_OFFLINE_MS && !isSessionLocked) {
          setSessionLockReason('offline_prolonged');
          setIsSessionLocked(true);
          showToast('Network restored. Security lock engaged.', 'info');
        } else {
          // Quick refresh of profile and live balance upon reconnection
          refreshProfileFromApi();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetActivity);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isUserLoggedIn, isSessionLocked, currentScreen]);

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
            if (isMounted && txs) setTransactions(txs);
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
          name: updated.name,
          email: updated.email,
        }));
      }
    });

    // Real-time listener for user transactions
    const unsubTx = subscribeToUserTransactions(user.phone, (txs) => {
      if (isMounted && txs) {
        setTransactions(txs);
      }
    });

    // Real-time listener for platform maintenance and broadcasts
    const unsubSettings = subscribeToPlatformSettings((settings) => {
      if (isMounted) {
        setPlatformSettings(settings);
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
      unsubSettings();
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
        const updatedUser: UserProfile = {
          name: u.name || user.name,
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
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('jagora_user_logged_in', 'true');
          localStorage.setItem('jagora_user_profile', JSON.stringify(updatedUser));
        } catch {}

        if (u.role === 'admin') {
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem('jagora_admin_authenticated', 'true');
          } catch {}
        }

        if (res.data.recentTransactions && Array.isArray(res.data.recentTransactions)) {
          const mapped: Transaction[] = res.data.recentTransactions.map((tx: any) => ({
            id: tx.reference || `tx-${tx.id || Date.now()}`,
            title: tx.title || (tx.type === 'DATA' ? 'Data Bundle' : tx.type === 'AIRTIME' ? 'Airtime Topup' : 'Wallet Funding'),
            subtitle: tx.description || `${tx.type} Transaction`,
            recipient: tx.recipient || '',
            date: tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            group: 'Today',
            amount: parseFloat(tx.amount) || 0,
            isCredit: tx.type === 'WALLET_FUNDING' || tx.type === 'COMMISSION' || tx.type === 'funding' || !!tx.isCredit,
            status: (tx.status?.toUpperCase() === 'SUCCESS' ? 'SUCCESS' : tx.status?.toUpperCase() === 'FAILED' ? 'FAILED' : 'PENDING') as any,
            category: (tx.type?.toLowerCase().includes('data') ? 'data' : tx.type?.toLowerCase().includes('airtime') ? 'airtime' : 'funding') as any,
            iconType: tx.type?.toLowerCase().includes('data') ? 'wifi' : tx.type?.toLowerCase().includes('airtime') ? 'phone' : 'wallet',
          }));
          setTransactions(mapped);
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
    setTransactions((prev) => [newTx, ...prev]);
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
        network: plan.network,
        plan_id: plan.id,
        plan_name: `${plan.network.toUpperCase()} ${plan.size} (${plan.type})`,
        phone,
        amount: plan.price,
        pin: pin || undefined,
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
        setTransactions((prev) => [newTx, ...prev]);
        recordTransactionInDb(newTx, user.phone);

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
        setTransactions((prev) => [newTx, ...prev]);
        recordTransactionInDb(newTx, user.phone);

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
    setTransactions((prev) => [tx, ...prev]);
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

      try {
        localStorage.setItem('jagora_user_logged_in', 'true');
        localStorage.setItem('jagora_user_profile', JSON.stringify(updatedProfile));
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
      try {
        localStorage.setItem('jagora_user_logged_in', 'true');
        localStorage.setItem('jagora_user_profile', JSON.stringify(profile));
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
      setUser(updatedProfile);
      try {
        localStorage.setItem('jagora_user_logged_in', 'true');
        localStorage.setItem('jagora_user_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('jagora_active_screen', 'home');
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
      apiLogout().catch(() => {});
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
        localStorage.setItem('jagora_active_screen', isAdminSubdomain() ? 'admin' : 'login');
      } catch {}
      setAuthToken(null);
      setCurrentScreen(isAdminSubdomain() ? 'admin' : 'login');
      if (window.location.hash === '#admin') {
        history.replaceState(null, '', window.location.pathname);
      }
      showToast('Logged out of Admin Console.');
    } else {
      setAuthLoadingMessage('Securing wallet & ending session...');
      apiLogout().catch(() => {});
      setTimeout(() => {
        try {
          localStorage.removeItem('jagora_token');
          localStorage.removeItem('jagora_auth_token');
          localStorage.removeItem('jagora_user_logged_in');
          localStorage.removeItem('jagora_user_profile');
          localStorage.removeItem('jagora_admin_authenticated');
          localStorage.removeItem('jagora_admin_profile');
          localStorage.setItem('jagora_active_screen', 'landing');
        } catch {}
        setAuthToken(null);
        setIsUserLoggedIn(false);
        setIsAdminAuthenticated(false);
        setAdminProfile(null);
        setUser(initialUser);
        setTransactions([]);
        setAuthLoadingMessage(null);
        setCurrentScreen('landing');
        history.replaceState(null, '', '/' + window.location.search);
        showToast('Logged out of session.');
      }, 450);
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
        return "Al'amin Jagora Data";
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
      default:
        return "Al'amin Jagora Data";
    }
  };

  // Dedicated In-App Professional Loading Screen during Auth / Session transitions
  if (authLoadingMessage) {
    return (
      <LoadingScreen
        message={authLoadingMessage}
        isLightMode={isLightMode}
        fullScreen={true}
      />
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
    if (showStaff2FALogin) {
      return (
        <AdminLoginScreen
          onLoginSuccess={(adminUser) => {
            setIsAdminAuthenticated(true);
            setAdminProfile(adminUser);
            setShowStaff2FALogin(false);
            try {
              localStorage.setItem('jagora_admin_authenticated', 'true');
              localStorage.setItem('jagora_admin_profile', JSON.stringify(adminUser));
              localStorage.setItem('jagora_active_screen', 'admin');
            } catch {}
            const roleLabel =
              adminUser?.adminRole === 'support_agent'
                ? 'Support Agent'
                : adminUser?.adminRole === 'finance_agent'
                ? 'Finance Agent'
                : 'Administrator';
            showToast(`Authenticated as ${roleLabel}. Console unlocked.`);
            setCurrentScreen('admin');
          }}
          onCancel={() => setShowStaff2FALogin(false)}
          isLightMode={isLightMode}
        />
      );
    }

    return (
      <>
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

  if (currentScreen === 'register') {
    return (
      <>
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentScreen('login')}
          onNavigateLanding={() => setCurrentScreen('landing')}
          onOpenApiSettings={isSimulationAllowed() ? () => setIsApiSettingsOpen(true) : undefined}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
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

      // 2. If staff member selected 2FA Master PIN challenge
      if (showStaff2FALogin) {
        return (
          <AdminLoginScreen
            onLoginSuccess={(u) => {
              setIsAdminAuthenticated(true);
              setAdminProfile(u);
              setShowStaff2FALogin(false);
              try {
                localStorage.setItem('jagora_admin_authenticated', 'true');
                localStorage.setItem('jagora_admin_profile', JSON.stringify(u));
                localStorage.setItem('jagora_active_screen', 'admin');
              } catch {}
              const roleLabel =
                u?.adminRole === 'support_agent'
                  ? 'Support Agent'
                  : u?.adminRole === 'finance_agent'
                  ? 'Finance Agent'
                  : 'CEO (Master Admin)';
              showToast(`Authenticated as ${roleLabel}. Console unlocked.`);
            }}
            onCancel={() => setShowStaff2FALogin(false)}
            isLightMode={isLightMode}
          />
        );
      }

      // 3. Shared Login Screen: Admin and regular users share the same login screen
      return (
        <>
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
            sessionExpiredNotice={sessionExpiredNotice || 'Staff Portal: Sign in with your administrator credentials to access the console.'}
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
  if (!isUserLoggedIn && !['landing', 'login', 'register', 'support', 'terms', 'privacy', 'admin'].includes(currentScreen)) {
    return (
      <>
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
                onNavigateBack={() => setCurrentScreen('home')}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'airtime' && (
              <VtuTransactionWizard
                user={user}
                initialServiceType="airtime"
                onBuyData={handleBuyData}
                onAirtimeSuccess={handleAirtimeSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                isLightMode={isLightMode}
              />
            )}

            {(currentScreen === 'cable' || currentScreen === 'electricity' || currentScreen === 'exam-pin') && (
              <BillsScreen
                user={user}
                initialTab={
                  currentScreen === 'electricity'
                    ? 'electricity'
                    : currentScreen === 'exam-pin'
                    ? 'exam'
                    : 'cable'
                }
                onPaymentSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'recharge-pin' && (
              <RechargePinScreen
                user={user}
                onGenerateSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'data-card' && (
              <DataCardScreen
                user={user}
                onGenerateSuccess={handleUtilityOrPinSuccess}
                onNavigateBack={() => setCurrentScreen('home')}
                isLightMode={isLightMode}
              />
            )}

            {currentScreen === 'fund-wallet' && (
              <FundWalletScreen
                virtualAccounts={user.virtualAccounts}
                isLightMode={isLightMode}
                isMaintenanceMode={platformSettings.maintenanceMode}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateSupport={() => setCurrentScreen('support')}
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
                  setTransactions((prev) => [newTx, ...prev]);
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

            {currentScreen === 'support' && (
              <SupportScreen
                user={user}
                isLightMode={isLightMode}
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
        userName={user.name || 'Valued Customer'}
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
