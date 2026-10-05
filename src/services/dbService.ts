/**
 * ==============================================================================
 * DIRECT CUSTOM BACKEND DATA SERVICE (REPLACES GOOGLE CLOUD / FIRESTORE)
 * ==============================================================================
 * Directly connects to the built-in Express Node.js backend (/api/*)
 * with instant local cache and event bus for instantaneous reactive UI.
 */

import { UserProfile, Transaction, TransactionStatus, NotificationItem } from '../types';
import { isSimulationAllowed } from '../utils/environment';
import { resolveApiUrl } from './apiClient';
import { initialUser } from '../data/mockData';

export type Unsubscribe = () => void;

// Storage keys for persistent local caching
const KEY_PREFIX = 'jagora_storage_';
const USER_KEY_PREFIX = `${KEY_PREFIX}user_`;
const TXS_KEY_PREFIX = `${KEY_PREFIX}txs_`;
const NOTIF_KEY_PREFIX = `${KEY_PREFIX}notifications_`;
const SETTINGS_KEY = `${KEY_PREFIX}platform_settings`;
const FEEDBACK_KEY = `${KEY_PREFIX}user_ratings`;

// In-memory fallback if localStorage is unavailable
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Restricted storage
  }
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Restricted storage
  }
  memoryStore.set(key, value);
}

// In-memory event bus for instantaneous reactive UI updates
type Listener<T = any> = (data: T) => void;
const listeners = new Map<string, Set<Listener>>();

function emitEvent<T>(channel: string, data: T) {
  const channelListeners = listeners.get(channel);
  if (channelListeners) {
    channelListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('[Direct Backend Event Error]', err);
      }
    });
  }
}

function addEventListener<T>(channel: string, callback: Listener<T>): Unsubscribe {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set());
  }
  const set = listeners.get(channel)!;
  set.add(callback as Listener);

  return () => {
    set.delete(callback as Listener);
  };
}

// Cross-tab storage synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key.startsWith(USER_KEY_PREFIX)) {
      const phoneKey = e.key.replace(USER_KEY_PREFIX, '');
      try {
        const user = e.newValue ? JSON.parse(e.newValue) : null;
        if (user) emitEvent(`user_${phoneKey}`, user);
      } catch {}
    } else if (e.key.startsWith(TXS_KEY_PREFIX)) {
      const phoneKey = e.key.replace(TXS_KEY_PREFIX, '');
      try {
        const txs = e.newValue ? JSON.parse(e.newValue) : [];
        emitEvent(`txs_${phoneKey}`, txs);
      } catch {}
    } else if (e.key.startsWith(NOTIF_KEY_PREFIX)) {
      const phoneKey = e.key.replace(NOTIF_KEY_PREFIX, '');
      try {
        const notifs = e.newValue ? JSON.parse(e.newValue) : [];
        emitEvent(`notifications_${phoneKey}`, notifs);
      } catch {}
    } else if (e.key === SETTINGS_KEY) {
      try {
        const settings = e.newValue ? JSON.parse(e.newValue) : null;
        if (settings) emitEvent('settings', settings);
      } catch {}
    }
  });
}

/**
 * Normalizes phone number for document keys (e.g., '08123456789')
 */
export function sanitizePhoneKey(phone: string): string {
  return phone ? phone.replace(/[^0-9]/g, '') : '';
}

/**
 * Direct Backend Helper: Request with safety fallback
 */
async function apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    let token = '';
    try {
      token = localStorage.getItem('jagora_auth_token') || localStorage.getItem('jagora_token') || '';
    } catch {
      // Storage fallback
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as any || {})
    };
    const res = await fetch(resolveApiUrl(endpoint), {
      ...options,
      headers
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    // Network or server temporarily unavailable, graceful fallback
    return null;
  }
}

/**
 * Load or initialize user profile from direct custom backend
 */
export async function getOrCreateUserProfile(phone: string): Promise<UserProfile> {
  const phoneKey = sanitizePhoneKey(phone);
  if (!phoneKey) return { ...initialUser };
  const key = `${USER_KEY_PREFIX}${phoneKey}`;

  // 1. Check direct custom backend
  try {
    const remote = await apiCall<any>(`/api/user/profile?phone=${encodeURIComponent(phoneKey)}`);
    if (remote) {
      const profile: UserProfile = {
        name: remote.name || 'Valued Customer',
        phone: remote.phone || phone,
        email: remote.email || '',
        avatarUrl: remote.avatarUrl || '',
        isVerified: remote.isVerified ?? true,
        balance: typeof remote.balance === 'number' ? remote.balance : (parseFloat(remote.balance) || 0.00),
        bonusBalance: typeof remote.bonusBalance === 'number' ? remote.bonusBalance : (typeof remote.bonus_balance === 'number' ? remote.bonus_balance : (parseFloat(remote.bonus_balance) || 0.00)),
        biometricEnabled: remote.biometricEnabled ?? false,
        hasPin: Boolean(remote.hasPin ?? remote.has_pin ?? true),
        role: remote.role || 'user',
        virtualAccounts: Array.isArray(remote.virtualAccounts) ? remote.virtualAccounts : [],
      };
      safeSetItem(key, JSON.stringify(profile));
      return profile;
    }
  } catch {}

  // 2. Read from local cache
  try {
    const raw = safeGetItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        name: data.name || 'Valued Customer',
        phone: data.phone || phone,
        email: data.email || '',
        avatarUrl: data.avatarUrl || '',
        isVerified: data.isVerified ?? true,
        balance: typeof data.balance === 'number' ? data.balance : (parseFloat(data.balance) || 0.00),
        bonusBalance: typeof data.bonusBalance === 'number' ? data.bonusBalance : (parseFloat(data.bonusBalance) || 0.00),
        biometricEnabled: data.biometricEnabled ?? false,
        hasPin: Boolean(data.hasPin ?? true),
        role: data.role || 'user',
        virtualAccounts: Array.isArray(data.virtualAccounts) ? data.virtualAccounts : [],
      };
    }
  } catch {}

  // 3. First time initialization
  const newUser: UserProfile = {
    name: 'Valued Customer',
    phone: phone,
    email: '',
    avatarUrl: '',
    isVerified: true,
    balance: 0.00,
    bonusBalance: 0.00,
    biometricEnabled: false,
    hasPin: true,
    virtualAccounts: [],
  };
  safeSetItem(key, JSON.stringify(newUser));

  // Sync to custom backend
  apiCall('/api/user/profile', {
    method: 'POST',
    body: JSON.stringify({
      phone: newUser.phone,
      name: newUser.name,
      email: newUser.email,
      balance: newUser.balance,
      bonusBalance: newUser.bonusBalance,
      role: newUser.role,
      virtualAccounts: newUser.virtualAccounts,
    })
  });

  return newUser;
}

/**
 * Update user wallet balance in direct custom backend and local storage
 */
export async function updateUserBalanceInDb(
  phone: string,
  newBalance: number,
  bonusBalance?: number
): Promise<boolean> {
  const phoneKey = sanitizePhoneKey(phone);
  const key = `${USER_KEY_PREFIX}${phoneKey}`;

  try {
    const user = await getOrCreateUserProfile(phone);
    user.balance = newBalance;
    if (typeof bonusBalance === 'number') {
      user.bonusBalance = bonusBalance;
    }
    safeSetItem(key, JSON.stringify(user));
    emitEvent(`user_${phoneKey}`, user);

    // Sync to direct custom backend
    apiCall('/api/user/update-balance', {
      method: 'POST',
      body: JSON.stringify({
        phone: phoneKey,
        balance: newBalance,
        bonusBalance
      })
    });

    return true;
  } catch (err) {
    console.warn('[Custom Backend] Error updating balance:', err);
    return false;
  }
}

/**
 * Save / Update full user profile in direct custom backend and local storage
 */
export async function saveUserProfileToDb(profile: UserProfile): Promise<boolean> {
  const phoneKey = sanitizePhoneKey(profile.phone);
  const key = `${USER_KEY_PREFIX}${phoneKey}`;

  try {
    safeSetItem(key, JSON.stringify(profile));
    emitEvent(`user_${phoneKey}`, profile);

    // Sync to direct custom backend
    apiCall('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify({
        phone: phoneKey,
        name: profile.name,
        email: profile.email,
        balance: profile.balance,
        bonusBalance: profile.bonusBalance,
        role: profile.role,
        virtualAccounts: profile.virtualAccounts
      })
    });

    return true;
  } catch (err) {
    console.warn('[Custom Backend] Error saving user profile:', err);
    return false;
  }
}

/**
 * Real-time listener for user profile updates from direct custom backend and storage
 */
export function subscribeToUserProfile(
  phone: string,
  onUpdate: (user: UserProfile) => void
): Unsubscribe {
  const phoneKey = sanitizePhoneKey(phone);

  // Immediately supply current state
  getOrCreateUserProfile(phone).then((u) => onUpdate(u)).catch(() => {});

  const unsubLocal = addEventListener<UserProfile>(`user_${phoneKey}`, onUpdate);

  // Periodic poll to direct custom backend
  const intervalId = setInterval(async () => {
    try {
      const remote = await apiCall<any>(`/api/user/profile?phone=${encodeURIComponent(phoneKey)}`);
      if (remote) {
        const profile: UserProfile = {
          name: remote.name || 'Valued Customer',
          phone: remote.phone || phone,
          email: remote.email || '',
          avatarUrl: remote.avatarUrl || '',
          isVerified: remote.isVerified ?? true,
          balance: typeof remote.balance === 'number' ? remote.balance : (parseFloat(remote.balance) || 0.00),
          bonusBalance: typeof remote.bonusBalance === 'number' ? remote.bonusBalance : (typeof remote.bonus_balance === 'number' ? remote.bonus_balance : (parseFloat(remote.bonus_balance) || 0.00)),
          biometricEnabled: remote.biometricEnabled ?? false,
          hasPin: Boolean(remote.hasPin ?? remote.has_pin ?? true),
          role: remote.role || 'user',
          virtualAccounts: Array.isArray(remote.virtualAccounts) ? remote.virtualAccounts : [],
        };
        onUpdate(profile);
      }
    } catch {}
  }, 10000);

  return () => {
    unsubLocal();
    clearInterval(intervalId);
  };
}

/**
 * Save a new transaction to direct custom backend and local storage
 */
export async function recordTransactionInDb(
  tx: Transaction,
  userPhone: string
): Promise<boolean> {
  try {
    const phoneKey = sanitizePhoneKey(userPhone);
    const key = `${TXS_KEY_PREFIX}${phoneKey}`;
    const raw = safeGetItem(key);
    let list: Transaction[] = [];

    if (raw) {
      try {
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }
    } else {
      list = [];
    }

    const updated = [tx, ...list.filter((item) => item.id !== tx.id)];
    safeSetItem(key, JSON.stringify(updated));
    emitEvent(`txs_${phoneKey}`, updated);

    // Sync to direct custom backend
    apiCall('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        id: tx.id,
        reference: tx.id,
        userId: phoneKey,
        title: tx.title,
        subtitle: tx.subtitle || '',
        recipient: tx.recipient || phoneKey,
        amount: tx.amount,
        type: tx.category || 'VTU',
        status: tx.status,
        isCredit: !!tx.isCredit,
        tokens: (tx as any).tokens || null,
      })
    });

    return true;
  } catch (err) {
    console.warn('[Custom Backend] Error recording transaction:', err);
    return false;
  }
}

/**
 * Load user transactions with direct custom backend query and fallback
 */
export async function loadUserTransactionsFromDb(userPhone: string): Promise<Transaction[]> {
  const phoneKey = sanitizePhoneKey(userPhone);
  if (!phoneKey) return [];
  const key = `${TXS_KEY_PREFIX}${phoneKey}`;

  // 1. Try direct custom backend
  try {
    const remote = await apiCall<any>(`/api/transactions?phone=${encodeURIComponent(phoneKey)}`);
    const rawList: any[] = Array.isArray(remote) ? remote : (Array.isArray(remote?.data) ? remote.data : []);
    if (Array.isArray(rawList)) {
      const list: Transaction[] = rawList.map((t: any) => ({
        id: t.id || t.reference,
        title: t.title || (t.type === 'DATA' ? 'Data Bundle' : t.type === 'AIRTIME' ? 'Airtime Purchase' : 'Wallet Funding'),
        subtitle: t.description || t.subtitle || t.recipient || '',
        recipient: t.recipient || '',
        date: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        group: 'Today',
        amount: parseFloat(t.amount) || 0,
        isCredit: t.type === 'WALLET_FUNDING' || t.type === 'funding' || !!t.isCredit,
        status: t.status || 'SUCCESS',
        category: (t.type || 'vtu').toLowerCase(),
        iconType: t.type === 'AIRTIME' ? 'phone' : t.type === 'DATA' ? 'wifi' : 'wallet',
      }));
      safeSetItem(key, JSON.stringify(list));
      return list;
    }
  } catch {}

  // 2. Try local cache
  try {
    const raw = safeGetItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Strip legacy mock IDs like tx-1, tx-2, etc.
        const clean = list.filter((item: any) => !/^tx-[0-9]+$/.test(String(item.id)));
        return clean;
      }
    }
  } catch {}

  return [];
}

/**
 * Real-time listener for user transactions from direct custom backend
 */
export function subscribeToUserTransactions(
  userPhone: string,
  onUpdate: (txs: Transaction[]) => void
): Unsubscribe {
  const phoneKey = sanitizePhoneKey(userPhone);
  if (!phoneKey) {
    onUpdate([]);
    return () => {};
  }

  loadUserTransactionsFromDb(userPhone).then((txs) => onUpdate(txs)).catch(() => {});

  const unsubLocal = addEventListener<Transaction[]>(`txs_${phoneKey}`, onUpdate);

  // Background refresh from direct custom backend
  const intervalId = setInterval(async () => {
    try {
      const remote = await apiCall<any>(`/api/transactions?phone=${encodeURIComponent(phoneKey)}`);
      const rawList: any[] = Array.isArray(remote) ? remote : (Array.isArray(remote?.data) ? remote.data : []);
      if (Array.isArray(rawList)) {
        const list: Transaction[] = rawList.map((t: any) => ({
          id: t.id || t.reference,
          title: t.title || (t.type === 'DATA' ? 'Data Bundle' : t.type === 'AIRTIME' ? 'Airtime Purchase' : 'Wallet Funding'),
          subtitle: t.description || t.subtitle || t.recipient || '',
          recipient: t.recipient || '',
          date: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          group: 'Today',
          amount: parseFloat(t.amount) || 0,
          isCredit: t.type === 'WALLET_FUNDING' || t.type === 'funding' || !!t.isCredit,
          status: t.status || 'SUCCESS',
          category: (t.type || 'vtu').toLowerCase(),
          iconType: t.type === 'AIRTIME' ? 'phone' : t.type === 'DATA' ? 'wifi' : 'wallet',
        }));
        onUpdate(list);
      }
    } catch {}
  }, 10000);

  return () => {
    unsubLocal();
    clearInterval(intervalId);
  };
}

/**
 * Update transaction status in direct custom backend and local storage
 */
export async function updateTransactionStatusInDb(
  txId: string,
  status: TransactionStatus,
  refunded: boolean = false
): Promise<boolean> {
  try {
    // Sync to direct custom backend
    apiCall('/api/transactions/update-status', {
      method: 'POST',
      body: JSON.stringify({
        id: txId,
        status,
        refunded
      })
    });

    for (let i = 0; i < (typeof window !== 'undefined' && window.localStorage ? window.localStorage.length : 0); i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(TXS_KEY_PREFIX)) {
        const raw = window.localStorage.getItem(k);
        if (raw) {
          const list: Transaction[] = JSON.parse(raw);
          const idx = list.findIndex((t) => t.id === txId);
          if (idx !== -1) {
            list[idx].status = status;
            if (refunded) list[idx].refunded = true;
            window.localStorage.setItem(k, JSON.stringify(list));
            const phoneKey = k.replace(TXS_KEY_PREFIX, '');
            emitEvent(`txs_${phoneKey}`, list);
            return true;
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('[Custom Backend] Error updating transaction status:', err);
    return false;
  }
}

export interface PlatformSettingsState {
  maintenanceMode: boolean;
  broadcastAnnouncement?: { text: string; active: boolean; type: 'info' | 'warning' | 'urgent' };
  supportContacts?: {
    phone: string;
    whatsapp: string;
    email: string;
    whatsappGroup?: string;
  };
  referralSettings?: {
    enabled: boolean;
    hideFromUsers?: boolean;
    bonusAmount?: number;
  };
}

const defaultPlatformSettings: PlatformSettingsState = {
  maintenanceMode: false,
  broadcastAnnouncement: {
    text: '',
    active: false,
    type: 'info',
  },
  supportContacts: {
    phone: '+234 814 838 8844',
    whatsapp: '+234 814 838 8844',
    email: 'support@alaminjagora.ng',
    whatsappGroup: 'https://chat.whatsapp.com/JagoraOfficialGroup',
  },
};

/**
 * Platform settings real-time listener from direct custom backend & storage
 */
export function subscribeToPlatformSettings(
  onUpdate: (settings: PlatformSettingsState) => void
): Unsubscribe {
  // Read current settings
  try {
    const raw = safeGetItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isLegacyNotice =
        parsed.broadcastAnnouncement?.text &&
        parsed.broadcastAnnouncement.text.toLowerCase().includes('direct custom backend');

      const cleanAnnouncement = isLegacyNotice
        ? defaultPlatformSettings.broadcastAnnouncement
        : (parsed.broadcastAnnouncement || defaultPlatformSettings.broadcastAnnouncement);

      if (isLegacyNotice) {
        parsed.broadcastAnnouncement = defaultPlatformSettings.broadcastAnnouncement;
        safeSetItem(SETTINGS_KEY, JSON.stringify(parsed));
      }

      onUpdate({
        maintenanceMode: parsed.maintenanceMode || false,
        broadcastAnnouncement: cleanAnnouncement,
        supportContacts: parsed.supportContacts || defaultPlatformSettings.supportContacts,
        referralSettings: parsed.referralSettings,
      });
    } else {
      onUpdate(defaultPlatformSettings);
    }
  } catch {
    onUpdate(defaultPlatformSettings);
  }

  // Helper to sanitize remote announcement without autodeleting active local announcement
  const sanitizeAnnouncement = (remoteAnn: any, fallbackAnn?: { text: string; active: boolean; type: 'info' | 'warning' | 'urgent' }) => {
    if (remoteAnn && typeof remoteAnn === 'object' && remoteAnn.text && remoteAnn.text.trim()) {
      if (remoteAnn.text.toLowerCase().includes('direct custom backend')) {
        return defaultPlatformSettings.broadcastAnnouncement;
      }
      return {
        text: remoteAnn.text.trim(),
        active: Boolean(remoteAnn.active),
        type: remoteAnn.type || 'info',
      };
    }
    if (typeof remoteAnn === 'string' && remoteAnn.trim()) {
      return {
        text: remoteAnn.trim(),
        active: true,
        type: 'info',
      };
    }
    // If explicitly removed with empty text and active === false
    if (remoteAnn && typeof remoteAnn === 'object' && remoteAnn.active === false && remoteAnn.text === '') {
      return { text: '', active: false, type: 'info' };
    }
    // If remote did not provide an announcement, preserve current active announcement
    if (fallbackAnn && fallbackAnn.text && fallbackAnn.text.trim()) {
      return fallbackAnn;
    }
    return defaultPlatformSettings.broadcastAnnouncement;
  };

  const extractRemoteAnnouncement = (remote: any) => {
    if (!remote) return undefined;
    return remote.broadcastAnnouncement ?? remote.data?.broadcastAnnouncement ?? remote.announcement ?? remote.data?.announcement;
  };

  const getCurrentStoredAnnouncement = () => {
    try {
      const raw = safeGetItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw)?.broadcastAnnouncement : undefined;
    } catch {
      return undefined;
    }
  };

  // Fetch from direct custom backend
  apiCall<any>('/api/settings/platform').then((remote) => {
    if (remote) {
      const resolvedAnnouncement = sanitizeAnnouncement(extractRemoteAnnouncement(remote), getCurrentStoredAnnouncement());
      const state: PlatformSettingsState = {
        maintenanceMode: !!(remote.maintenanceMode ?? remote.data?.maintenanceMode),
        broadcastAnnouncement: resolvedAnnouncement,
        supportContacts: remote.supportContacts || remote.data?.supportContacts || defaultPlatformSettings.supportContacts,
        referralSettings: remote.referralSettings || remote.data?.referralSettings,
      };
      safeSetItem(SETTINGS_KEY, JSON.stringify(state));
      onUpdate(state);
    }
  });

  const unsubLocal = addEventListener<PlatformSettingsState>('settings', onUpdate);

  // Background refresh from direct custom backend
  const intervalId = setInterval(async () => {
    try {
      const remote = await apiCall<any>('/api/settings/platform');
      if (remote) {
        const resolvedAnnouncement = sanitizeAnnouncement(extractRemoteAnnouncement(remote), getCurrentStoredAnnouncement());
        const state: PlatformSettingsState = {
          maintenanceMode: !!(remote.maintenanceMode ?? remote.data?.maintenanceMode),
          broadcastAnnouncement: resolvedAnnouncement,
          supportContacts: remote.supportContacts || remote.data?.supportContacts || defaultPlatformSettings.supportContacts,
          referralSettings: remote.referralSettings || remote.data?.referralSettings,
        };
        safeSetItem(SETTINGS_KEY, JSON.stringify(state));
        onUpdate(state);
      }
    } catch {}
  }, 5000);

  return () => {
    unsubLocal();
    clearInterval(intervalId);
  };
}

/**
 * Update platform settings from Admin Dashboard in direct custom backend and local storage
 */
export async function updatePlatformSettingsInDb(settings: Record<string, any>): Promise<boolean> {
  try {
    const raw = safeGetItem(SETTINGS_KEY);
    const prev = raw ? JSON.parse(raw) : defaultPlatformSettings;
    const updated = { ...prev, ...settings };
    safeSetItem(SETTINGS_KEY, JSON.stringify(updated));
    emitEvent('settings', updated);

    // Sync to direct custom backend
    const remote = await apiCall('/api/settings/platform', {
      method: 'POST',
      body: JSON.stringify(updated)
    });
    if (remote) {
      const finalState = { ...updated, ...remote };
      safeSetItem(SETTINGS_KEY, JSON.stringify(finalState));
      emitEvent('settings', finalState);
    }

    return true;
  } catch (err) {
    console.warn('[Custom Backend] Error updating settings:', err);
    return false;
  }
}

/**
 * User Feedback & Rating in direct custom backend and storage
 */
export interface UserFeedback {
  id: string;
  phone: string;
  name: string;
  rating: number;
  category?: string;
  suggestion: string;
  contactConsent?: boolean;
  createdAt: string;
}

export async function saveUserFeedback(
  feedback: Omit<UserFeedback, 'id' | 'createdAt'>
): Promise<UserFeedback> {
  const item: UserFeedback = {
    ...feedback,
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = safeGetItem(FEEDBACK_KEY);
    const list: UserFeedback[] = raw ? JSON.parse(raw) : [];
    list.unshift(item);
    safeSetItem(FEEDBACK_KEY, JSON.stringify(list));
    emitEvent('user_ratings', list);

    // Sync to direct custom backend
    apiCall('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  } catch (err) {
    console.warn('[Custom Backend] Error saving user feedback:', err);
  }

  return item;
}

export function loadUserFeedbacks(): UserFeedback[] {
  try {
    const raw = safeGetItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Permanently remove or take down the broadcast announcement from user dashboards
 */
export async function removeAnnouncementFromDb(): Promise<boolean> {
  try {
    const raw = safeGetItem(SETTINGS_KEY);
    const prev = raw ? JSON.parse(raw) : defaultPlatformSettings;
    const updated = {
      ...prev,
      broadcastAnnouncement: {
        text: '',
        active: false,
        type: 'info',
      },
    };
    safeSetItem(SETTINGS_KEY, JSON.stringify(updated));
    emitEvent('settings', updated);

    // Sync to direct custom backend
    apiCall('/api/settings/announcement/remove', {
      method: 'POST'
    });

    return true;
  } catch (err) {
    console.warn('[Custom Backend] Error removing announcement:', err);
    return false;
  }
}

/**
 * ==============================================================================
 * IN-APP NOTIFICATIONS & BROADCAST ENGINE
 * Ruthlessly delivers real-time notifications to all users' notification panels
 * ==============================================================================
 */

/**
 * Load notifications for a user with remote sync + local storage fallback
 */
export async function loadNotificationsFromDb(userPhone: string): Promise<NotificationItem[]> {
  const phoneKey = sanitizePhoneKey(userPhone);
  const cacheKey = `${NOTIF_KEY_PREFIX}${phoneKey}`;

  // 1. Try remote backend
  try {
    const res = await apiCall<any>(`/api/notifications?phone=${encodeURIComponent(phoneKey)}`);
    const list: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    if (Array.isArray(list) && list.length > 0) {
      safeSetItem(cacheKey, JSON.stringify(list));
      return list;
    }
  } catch {}

  // 2. Read local cache
  try {
    const raw = safeGetItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
}

/**
 * Real-time subscription to notifications
 */
export function subscribeToNotifications(
  userPhone: string,
  onUpdate: (notifs: NotificationItem[]) => void
): Unsubscribe {
  const phoneKey = sanitizePhoneKey(userPhone);
  const cacheKey = `${NOTIF_KEY_PREFIX}${phoneKey}`;

  // Immediately invoke with cached or loaded items
  loadNotificationsFromDb(userPhone).then((items) => {
    if (Array.isArray(items) && items.length > 0) {
      onUpdate(items);
    }
  }).catch(() => {});

  const unsubLocal = addEventListener<NotificationItem[]>(`notifications_${phoneKey}`, onUpdate);

  // Poll for real-time notification delivery every 4 seconds
  const intervalId = setInterval(async () => {
    try {
      const res = await apiCall<any>(`/api/notifications?phone=${encodeURIComponent(phoneKey)}`);
      const list: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(list)) {
        safeSetItem(cacheKey, JSON.stringify(list));
        onUpdate(list);
      }
    } catch {}
  }, 4000);

  return () => {
    unsubLocal();
    clearInterval(intervalId);
  };
}

/**
 * Mark a single notification read
 */
export async function markNotificationReadInDb(notifId: string, userPhone: string): Promise<boolean> {
  const phoneKey = sanitizePhoneKey(userPhone);
  const cacheKey = `${NOTIF_KEY_PREFIX}${phoneKey}`;

  // Update local cache immediately for snappy UI
  try {
    const raw = safeGetItem(cacheKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const updated = list.map((n: any) => n.id === notifId ? { ...n, read: true } : n);
        safeSetItem(cacheKey, JSON.stringify(updated));
        emitEvent(`notifications_${phoneKey}`, updated);
      }
    }
  } catch {}

  // Sync to backend
  apiCall('/api/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ id: notifId, phone: phoneKey })
  });

  return true;
}

/**
 * Mark all notifications read
 */
export async function markAllNotificationsReadInDb(userPhone: string): Promise<boolean> {
  const phoneKey = sanitizePhoneKey(userPhone);
  const cacheKey = `${NOTIF_KEY_PREFIX}${phoneKey}`;

  // Update local cache immediately
  try {
    const raw = safeGetItem(cacheKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const updated = list.map((n: any) => ({ ...n, read: true }));
        safeSetItem(cacheKey, JSON.stringify(updated));
        emitEvent(`notifications_${phoneKey}`, updated);
      }
    }
  } catch {}

  // Sync to backend
  apiCall('/api/notifications/mark-all-read', {
    method: 'POST',
    body: JSON.stringify({ phone: phoneKey })
  });

  return true;
}

/**
 * Admin: Send customized broadcast notification to all users
 */
export async function sendAdminBroadcastNotification(data: {
  title: string;
  message: string;
  type: NotificationItem['type'];
  target?: string;
}): Promise<{ success: boolean; message: string; count?: number; data?: any }> {
  try {
    const res = await apiCall<any>('/api/admin/broadcast-notification', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res && res.success !== false) {
      // Broadcast locally to all active user channels
      emitEvent('broadcast_notification_dispatched', res.data || data);
      return {
        success: true,
        message: res.message || 'Notification broadcasted to all users successfully.',
        count: res.recipientsCount || res.count || 1,
        data: res.data
      };
    }

    return {
      success: false,
      message: res?.message || 'Failed to dispatch broadcast notification.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error while broadcasting notification.'
    };
  }
}

/**
 * Admin: Fetch broadcast notification history
 */
export async function loadAdminBroadcastHistory(): Promise<any[]> {
  try {
    const res = await apiCall<any>('/api/admin/broadcast-notifications');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  } catch {
    return [];
  }
}

/**
 * Admin: Delete broadcast notification
 */
export async function deleteAdminBroadcastNotification(id: string): Promise<boolean> {
  try {
    const res = await apiCall<any>(`/api/admin/broadcast-notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res?.success !== false;
  } catch {
    return false;
  }
}
