/**
 * ==============================================================================
 * AL'AMIN JAGORA DATA - BACKEND API CLIENT
 * ==============================================================================
 * Communicates with the PHP / MySQL backend hosted on:
 * - Local XAMPP (e.g., http://localhost/jagora-api)
 * - Live cPanel / Apache Production (e.g., https://yourdomain.com/api)
 */

import { UserProfile, Transaction, DataPlan, VirtualAccountItem, StaffAgent, StaffPermissions, ReferralData, ReferralProgramSettings } from '../types';
import { humanizeVtuError } from '../utils/errorParser';
import { Capacitor } from '@capacitor/core';

const STORAGE_API_KEY = 'jagora_api_base_url';
const STORAGE_TOKEN_KEY = 'jagora_auth_token';

// Production cPanel domain hosted on QServers
export const DEFAULT_PRODUCTION_BACKEND_URL = 'https://alaminjagoradata.com.ng';

// In-memory fallback if localStorage is restricted (e.g. strict iframe, incognito)
const memoryStore = new Map<string, string>();

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Storage access restricted
  }
  return memoryStore.get(key) || null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Storage access restricted
  }
  memoryStore.set(key, value);
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch {
    // Storage access restricted
  }
  memoryStore.delete(key);
}

// Default base URL points to current origin (direct Express backend)
export const DEFAULT_API_BASE_URL = 
  ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';

/**
 * Detects whether the app is running as a compiled native mobile app (Android APK / iOS).
 */
export function isNativeMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      return true;
    }
    if (typeof (window as any).Capacitor !== 'undefined' && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
      return true;
    }
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
      return true;
    }
    // Android WebView running on localhost inside Capacitor wrapper
    // (Notice: dev server on desktop/browser always runs on port :3000, while native Capacitor runs with no port)
    if (
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      !window.location.port &&
      (Boolean((window as any).Capacitor) || Boolean((window as any).androidBridge) || /Android.*Version\/[0-9]/.test(navigator.userAgent))
    ) {
      return true;
    }
    if (Boolean((window as any).androidBridge)) {
      return true;
    }
  } catch {
    // Storage access restricted
  }
  return false;
}

export function getApiBaseUrl(): string {
  const custom = safeGetStorage(STORAGE_API_KEY);
  if (custom) return custom;
  if (DEFAULT_API_BASE_URL) return DEFAULT_API_BASE_URL;
  if (isNativeMobileApp()) {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }
  return '';
}

export function setApiBaseUrl(url: string): void {
  const trimmed = url.replace(/\/+$/, ''); // Strip trailing slash
  safeSetStorage(STORAGE_API_KEY, trimmed);
}

/**
 * Resolves any API endpoint into a fully-qualified or relative URL depending
 * on the execution environment:
 * - On Native Android APK: prepends the live backend URL (e.g. https://alaminjagoradata.com.ng)
 * - On Web: uses relative path (/api/...) to hit the current origin server
 */
export function resolveApiUrl(endpoint: string): string {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (isNativeMobileApp()) {
    const base = getApiBaseUrl() || DEFAULT_PRODUCTION_BACKEND_URL;
    return `${base}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

export function getAuthToken(): string | null {
  return safeGetStorage(STORAGE_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    safeSetStorage(STORAGE_TOKEN_KEY, token);
  } else {
    safeRemoveStorage(STORAGE_TOKEN_KEY);
  }
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error' | '2fa_required';
  message: string;
  data?: T;
  metrics?: Record<string, any>;
  recentTransactions?: any[];
  [key: string]: any;
}

/**
 * Generic Fetch helper with timeout and auth headers
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // On Native Android APK, route all calls to the remote backend.
  // On Web, internal /api routes use relative path against current host.
  const isInternal = cleanEndpoint.startsWith('/api/');
  let baseUrl = '';
  if (isNativeMobileApp()) {
    baseUrl = getApiBaseUrl() || DEFAULT_PRODUCTION_BACKEND_URL;
  } else if (!isInternal) {
    baseUrl = getApiBaseUrl();
  }
  const url = `${baseUrl}${cleanEndpoint}`;

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (!headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = `AJD-IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If unauthorized, wipe expired/invalid credentials and notify application
    if (res.status === 401) {
      const isAdminEndpoint = cleanEndpoint.startsWith('/api/admin') || cleanEndpoint.includes('admin');
      if (!isAdminEndpoint) {
        setAuthToken(null);
        if (typeof window !== 'undefined' && !cleanEndpoint.includes('/auth/login')) {
          window.dispatchEvent(
            new CustomEvent('jagora:unauthorized', {
              detail: { message: 'Your session has expired. Please sign in again.' },
            })
          );
        }
      }
    }

    let json: any;
    try {
      json = await res.json();
    } catch {
      json = { status: 'error', message: 'Unable to process server response. Please try again shortly.' };
    }

    if (!res.ok) {
      const rawMsg = json.message || json.error || `Server error (${res.status})`;
      const errContext = cleanEndpoint.includes('/auth/') || cleanEndpoint.includes('/admin/') ? 'account' : 'transaction';
      return {
        status: 'error',
        message: humanizeVtuError(rawMsg, errContext),
        ...json,
      };
    }

    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errContext = cleanEndpoint.includes('/auth/') || cleanEndpoint.includes('/admin/') ? 'account' : 'transaction';
    return {
      status: 'error',
      message: humanizeVtuError(err, errContext),
    };
  }
}

/**
 * Quick ping / health check to see if the PHP API is reachable
 */
export async function apiTestConnection(): Promise<{ ok: boolean; message: string; plansCount?: number }> {
  try {
    const res = await request('/vtu/plans.php', { method: 'GET' });
    if (res.status === 'success' && res.data) {
      const plans = Array.isArray(res.data) ? res.data : (res.data as any).plans || [];
      return {
        ok: true,
        message: `Connected to API successfully! (${plans.length} VTU packages available)`,
        plansCount: plans.length,
      };
    }
    return { ok: false, message: res.message || 'API responded with an error.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Could not reach backend server.' };
  }
}

/**
 * Register a new user
 */
export async function apiRegister(payload: {
  name: string;
  username?: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
  referralCode?: string;
}): Promise<ApiResponse<{ token: string; user: any; virtualAccounts: VirtualAccountItem[] }>> {
  const res = await request<{ token: string; user: any; virtualAccounts: VirtualAccountItem[] }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 'success' && res.data?.token) {
    setAuthToken(res.data.token);
  }

  return res;
}

/**
 * Fetch user referral code, statistics, earnings, and invited friends ledger
 */
export async function apiGetReferrals(): Promise<ApiResponse<ReferralData>> {
  return request<ReferralData>('/api/user/referrals', {
    method: 'GET',
  });
}

/**
 * Transfer accumulated referral bonus from bonus_balance into the main wallet
 */
export async function apiTransferBonus(amount: number): Promise<ApiResponse<{ balance: number; bonusBalance: number }>> {
  return request<{ balance: number; bonusBalance: number }>('/api/user/referrals/transfer-bonus', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

/**
 * Public/User: Fetch active referral program rules, bonus amount, and promo terms
 */
export async function apiGetReferralConfig(): Promise<ApiResponse<ReferralProgramSettings>> {
  return request<ReferralProgramSettings>('/api/referrals/config', {
    method: 'GET',
  });
}

/**
 * Admin: Fetch full referral program configuration
 */
export async function apiAdminGetReferralSettings(): Promise<ApiResponse<ReferralProgramSettings>> {
  return request<ReferralProgramSettings>('/api/admin/referrals/settings', {
    method: 'GET',
  });
}

/**
 * Admin: Update referral program rules (toggle on/off, bonus amount, days, min spend, withdrawal toggle)
 */
export async function apiAdminUpdateReferralSettings(
  payload: Partial<ReferralProgramSettings>
): Promise<ApiResponse<ReferralProgramSettings>> {
  return request<ReferralProgramSettings>('/api/admin/referrals/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Admin: Fetch comprehensive referral program analytics, conversion metrics, leaderboard & reward logs
 */
export async function apiAdminGetReferralsOverview(): Promise<ApiResponse<any>> {
  return request<any>('/api/admin/referrals/overview', {
    method: 'GET',
  });
}

/**
 * Log in an existing user or admin
 */
export async function apiLogin(payload: {
  username: string; // phone or email
  password: string;
}): Promise<ApiResponse<{ token: string; user: any; virtualAccounts?: VirtualAccountItem[] }>> {
  const res = await request<{ token: string; user: any; virtualAccounts?: VirtualAccountItem[] }>(
    '/auth/login.php',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 'success' && res.data?.token) {
    setAuthToken(res.data.token);
  }

  return res;
}

export interface AdminLoginResponse {
  token?: string;
  user?: any;
  challengeId?: string;
  maskedEmail?: string;
  adminEmail?: string;
  expiresInSeconds?: number;
  resendCooldown?: number;
  previewOtp?: string;
}

/**
 * Initiate administrator authentication (enforces 2FA Email OTP Challenge)
 */
export async function apiAdminLogin(payload: {
  username: string; // phone or email
  password: string;
  pin: string;
  directAuth?: boolean;
}): Promise<ApiResponse<AdminLoginResponse>> {
  const res = await request<AdminLoginResponse>(
    '/api/auth/admin-login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 'success' && res.data?.token) {
    setAuthToken(res.data.token);
  }

  return res;
}

/**
 * Verify 2FA 6-digit Email OTP or Emergency Root Recovery Key
 */
export async function apiAdminVerifyOtp(payload: {
  challengeId: string;
  otp: string;
  backupCode?: string;
}): Promise<ApiResponse<{ token: string; user: any }>> {
  const res = await request<{ token: string; user: any }>(
    '/api/auth/admin-verify-otp',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 'success' && res.data?.token) {
    setAuthToken(res.data.token);
  }

  return res;
}

/**
 * Resend 2FA verification OTP to admin email
 */
export async function apiAdminResendOtp(payload: {
  challengeId: string;
}): Promise<ApiResponse<{
  maskedEmail: string;
  expiresInSeconds: number;
  resendCooldown: number;
  previewOtp?: string;
}>> {
  return request(
    '/api/auth/admin-resend-otp',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export interface ForgotPasswordResponse {
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
  resendCooldown: number;
  previewOtp?: string;
}

/**
 * Request a 6-digit verification code to reset password via email
 */
export async function apiForgotPassword(email: string): Promise<ApiResponse<ForgotPasswordResponse>> {
  return request<ForgotPasswordResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Request a fresh verification code for an existing password reset challenge
 */
export async function apiResendPasswordOtp(challengeId: string): Promise<ApiResponse<ForgotPasswordResponse>> {
  return request<ForgotPasswordResponse>('/api/auth/resend-password-otp', {
    method: 'POST',
    body: JSON.stringify({ challengeId }),
  });
}

/**
 * Complete password reset with verification OTP and new password
 */
export async function apiResetPassword(payload: {
  challengeId: string;
  otp: string;
  newPassword: string;
}): Promise<ApiResponse<null>> {
  return request<null>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch authenticated user profile & balance
 */
export async function apiGetProfile(): Promise<ApiResponse<{
  user: any;
  virtualAccounts: VirtualAccountItem[];
  recentTransactions: any[];
}>> {
  return request('/auth/profile.php', { method: 'GET' });
}

/**
 * Fetch live VTU plans from local hybrid cached catalog
 */
export async function apiGetPlans(network?: string): Promise<ApiResponse<any[]>> {
  const query = network ? `?network=${encodeURIComponent(network)}` : '';
  return request(`/vtu/plans.php${query}`, { method: 'GET' });
}

/**
 * Purchase Data Bundle via Unified Backend (debits wallet & dispatches to wholesale gateway)
 */
export async function apiBuyData(payload: {
  network: string;
  plan_id: string;
  plan_name: string;
  phone: string;
  amount: number;
  pin: string;
  api_plan_id?: string;
}): Promise<ApiResponse<{ reference: string; recipient: string; amount: number; newBalance: number }>> {
  return request('/vtu/buy_data.php', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      api_plan_id: payload.api_plan_id || payload.plan_id,
    }),
  });
}

/**
 * Trigger manual catalog synchronization from wholesale gateway
 */
export async function apiTriggerVtuSync(): Promise<ApiResponse<any>> {
  return request('/api/admin/vtu/sync', { method: 'POST' });
}

/**
 * Fetch VTU synchronization status and gateway details
 */
export async function apiGetVtuSyncStatus(): Promise<ApiResponse<any>> {
  return request('/api/admin/vtu/sync-status', { method: 'GET' });
}

/**
 * Purchase Airtime via PHP Backend
 */
export async function apiBuyAirtime(payload: {
  network: string;
  phone: string;
  amount: number;
  pin?: string;
}): Promise<ApiResponse<{ reference: string; recipient: string; amount: number; charged: number; newBalance: number }>> {
  return request('/vtu/buy_airtime.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Admin Stats & Platform Metrics
 */
export async function apiGetAdminStats(): Promise<ApiResponse<any>> {
  return request('/api/admin/stats', { method: 'GET' });
}

/**
 * Fetch live upstream wholesale gateway wallet float balances
 */
export async function apiGetGatewayBalances(): Promise<ApiResponse<{
  gateways: Array<{
    id: string;
    name: string;
    badge: string;
    balance: number;
    currency: string;
    status: 'active' | 'degraded' | 'offline' | 'unconfigured';
    rawResponse?: any;
    endpointUrl: string;
    maskedKey: string;
    lastChecked: string;
    latencyMs: number;
    fundingAccount?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      portalUrl: string;
      instructions: string;
    };
  }>;
  totalLiveFloat: number;
  queriedAt: string;
}>> {
  return request('/api/admin/gateway-balances', { method: 'GET' });
}

export interface GatewaySwitchesData {
  gatewaySwitches: {
    payflex: boolean;
    clubkonnect: boolean;
    payvessel: boolean;
    monnify: boolean;
    husmodata?: boolean;
    [key: string]: boolean | undefined;
  };
  serviceSwitches: {
    data: boolean;
    airtime: boolean;
    cable: boolean;
    electricity: boolean;
    exam: boolean;
    recharge_pin: boolean;
    data_card: boolean;
    [key: string]: boolean | undefined;
  };
}

/**
 * Fetch Admin Gateway and Service Switches (operational kill switches)
 */
export async function apiGetGatewaySwitches(): Promise<ApiResponse<GatewaySwitchesData>> {
  return request('/api/settings/gateways', { method: 'GET' });
}

/**
 * Toggle Gateway or Service Switch (Emergency kill switch)
 */
export async function apiToggleGatewaySwitch(payload: {
  gateway?: string;
  active?: boolean;
  service?: string;
  serviceActive?: boolean;
  gatewaySwitches?: Record<string, boolean>;
  serviceSwitches?: Record<string, boolean>;
}): Promise<ApiResponse<any>> {
  return request('/api/admin/gateways/toggle', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiAdminFundUser(payload: {
  phone: string;
  amount: number;
  type: 'credit' | 'debit';
  reason?: string;
}): Promise<ApiResponse<any>> {
  return request('/api/admin/fund-user', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Live Biller Verification (Smartcard / IUC & NEPA Meter number via upstream gateway)
 */
export async function apiVerifyBiller(payload: {
  serviceType: 'CABLE' | 'ELECTRICITY';
  identifier: string;
  provider: string;
  meterType?: 'prepaid' | 'postpaid';
}): Promise<ApiResponse<{ customerName: string; verified: boolean; identifier: string; provider: string }>> {
  return request('/api/vtu/verify-biller', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Purchase Cable TV subscription via PHP Backend
 */
export async function apiBuyCable(payload: {
  provider: string;
  iuc: string;
  plan_id?: string;
  plan_name?: string;
  amount: number;
  pin: string;
}): Promise<ApiResponse<{ reference: string; recipient: string; amount: number; newBalance: number }>> {
  return request('/vtu/buy_cable.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Purchase Electricity Prepaid / Postpaid Bill via PHP Backend
 */
export async function apiBuyElectricity(payload: {
  disco: string;
  meter_number: string;
  meter_type?: string;
  amount: number;
  pin: string;
}): Promise<ApiResponse<{ reference: string; meterNumber: string; amount: number; token?: string; units?: string; newBalance: number }>> {
  return request('/vtu/buy_electricity.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Purchase Exam PINs (WAEC, NECO, NABTEB, JAMB) via PHP Backend
 */
export async function apiBuyExam(payload: {
  exam_type: string;
  quantity?: number;
  pin: string;
}): Promise<ApiResponse<{ reference: string; examType: string; quantity: number; cards: any[]; newBalance: number }>> {
  return request('/vtu/buy_exam.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Generate Printable Recharge PINs via PHP Backend
 */
export async function apiGenerateRechargePins(payload: {
  network: string;
  denomination: number;
  quantity: number;
  pin: string;
}): Promise<ApiResponse<{ reference: string; network: string; quantity: number; pins: any[]; newBalance: number }>> {
  return request('/vtu/recharge_pin.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Generate Printable Data Card PINs via PHP Backend
 */
export async function apiGenerateDataCards(payload: {
  network: string;
  plan_name: string;
  quantity: number;
  amount: number;
  pin: string;
}): Promise<ApiResponse<{ reference: string; network: string; quantity: number; cards: any[]; newBalance: number }>> {
  return request('/vtu/data_card.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Peer-to-Peer Wallet Transfer via PHP Backend
 */
export async function apiTransferWallet(payload: {
  recipient: string;
  amount: number;
  pin: string;
}): Promise<ApiResponse<{ reference: string; recipient: string; amount: number; newBalance: number }>> {
  return request('/vtu/transfer.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Set or Change 4-digit Transaction PIN via PHP Backend
 */
export async function apiChangePin(payload: {
  old_pin?: string;
  new_pin: string;
}): Promise<ApiResponse<void>> {
  return request('/auth/change_pin.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Verify user 4-digit transaction PIN against the backend server
 */
export async function apiVerifyPin(pin: string): Promise<ApiResponse<void>> {
  return request('/api/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

/**
 * Reset forgotten transaction PIN using account login password
 */
export async function apiResetPin(payload: {
  password?: string;
  new_pin: string;
  otp?: string;
}): Promise<ApiResponse<void>> {
  return request('/api/auth/reset-pin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Invalidate current session and revoke server token
 */
export async function apiLogout(): Promise<ApiResponse<void>> {
  try {
    return await request('/api/auth/logout', {
      method: 'POST',
    });
  } finally {
    setAuthToken(null);
  }
}

/**
 * ----------------------------------------------------------------------------
 * ADMINISTRATIVE CONSOLE APIS (PRICING & AUDIT)
 * ----------------------------------------------------------------------------
 */
export async function apiGetPricingSettings(): Promise<
  ApiResponse<{
    customPricing: Record<string, { sellingPrice?: number; costPrice?: number; status?: 'active' | 'paused' | 'out_of_stock' }>;
    airtimeDiscounts: { mtn: number; airtel: number; glo: number; '9mobile': number };
  }>
> {
  return request('/api/settings/pricing', {
    method: 'GET',
  });
}

export async function apiUpdatePricingSettings(payload: {
  planId?: string;
  sellingPrice?: number;
  costPrice?: number;
  status?: 'active' | 'paused' | 'out_of_stock';
  airtimeDiscounts?: { mtn?: number; airtel?: number; glo?: number; '9mobile'?: number };
}): Promise<ApiResponse<void>> {
  return request('/api/settings/pricing', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetAdminUsers(): Promise<ApiResponse<any[]>> {
  return request('/api/admin/users', {
    method: 'GET',
  });
}

export async function apiToggleUserStatus(
  phone: string,
  status?: 'active' | 'suspended'
): Promise<ApiResponse<any>> {
  return request('/api/admin/users/toggle-status', {
    method: 'POST',
    body: JSON.stringify({ phone, status }),
  });
}

export async function apiGetAdminAuditLogs(limit = 100): Promise<ApiResponse<any[]>> {
  return request(`/api/admin/audit-logs?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * ----------------------------------------------------------------------------
 * STAFF & DELEGATED AGENTS MANAGEMENT APIS (CEO ROOT RBAC)
 * ----------------------------------------------------------------------------
 */
export async function apiGetStaffAgents(): Promise<ApiResponse<StaffAgent[]>> {
  return request('/api/admin/staff', {
    method: 'GET',
  });
}

export async function apiCreateStaffAgent(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
  adminRole: 'support_agent' | 'finance_agent';
  permissions?: Partial<StaffPermissions>;
}): Promise<ApiResponse<StaffAgent>> {
  return request('/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiToggleStaffStatus(
  identifier: string,
  status?: 'active' | 'suspended'
): Promise<ApiResponse<{ status: 'active' | 'suspended' }>> {
  return request('/api/admin/staff/toggle-status', {
    method: 'POST',
    body: JSON.stringify({ identifier, status }),
  });
}

export async function apiDeleteStaffAgent(identifier: string): Promise<ApiResponse<void>> {
  return request('/api/admin/staff/delete', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

/**
 * ----------------------------------------------------------------------------
 * ADMIN SELF PROFILE & SECURITY CREDENTIALS
 * ----------------------------------------------------------------------------
 */
export async function apiGetAdminProfile(): Promise<ApiResponse<{ user: any }>> {
  return request('/api/admin/profile', {
    method: 'GET',
  });
}

export async function apiUpdateAdminProfile(payload: {
  name?: string;
  email?: string;
  phone?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  currentPin?: string;
  newPin?: string;
}): Promise<ApiResponse<{ user: any; token?: string }>> {
  return request('/api/admin/profile/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch authoritative live VTU catalog with admin customized retail pricing
 */
export async function apiGetVtuPlans(network?: string): Promise<ApiResponse<DataPlan[]>> {
  const query = network ? `?network=${encodeURIComponent(network)}` : '';
  return request(`/api/vtu/plans${query}`, { method: 'GET' });
}

/**
 * Trigger immediate wholesale gateway catalog synchronization (Payflex)
 */
export async function apiSyncVtuPlans(): Promise<ApiResponse<any>> {
  return request('/api/admin/vtu/sync', { method: 'POST' });
}

/**
 * Actively query live upstream VTU provider for unresolved PENDING transactions
 */
export async function apiRequeryTransaction(reference: string): Promise<ApiResponse<any>> {
  return request(`/api/vtu/requery?reference=${encodeURIComponent(reference)}`, { method: 'GET' });
}

/**
 * Get current transaction status and carrier switch resolution details
 */
export async function apiGetTransactionStatus(reference: string): Promise<ApiResponse<any>> {
  return request(`/api/vtu/status?reference=${encodeURIComponent(reference)}`, { method: 'GET' });
}

/**
 * Admin: Broadcast push notification to all users
 */
export async function apiAdminBroadcastNotification(payload: {
  title: string;
  message: string;
  type?: string;
  target?: string;
}): Promise<ApiResponse<any>> {
  return request('/api/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Admin: Fetch broadcast push notification history
 */
export async function apiGetAdminBroadcastNotifications(): Promise<ApiResponse<any[]>> {
  return request('/api/admin/notifications/broadcast', {
    method: 'GET',
  });
}



