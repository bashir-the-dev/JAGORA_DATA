export type ScreenType = 
  | 'landing'
  | 'home'
  | 'data'
  | 'airtime'
  | 'recharge-pin'
  | 'fund-wallet'
  | 'data-card'
  | 'cable'
  | 'electricity'
  | 'exam-pin'
  | 'wallet'
  | 'history'
  | 'profile'
  | 'referrals'
  | 'support'
  | 'chat'
  | 'notifications'
  | 'login'
  | 'register'
  | 'terms'
  | 'privacy'
  | 'admin';

export type NetworkId = 'mtn' | 'airtel' | 'glo' | '9mobile';

export type PeyflexNetworkIdentifier =
  | 'mtn_data_share'
  | 'mtn_gifting_data'
  | 'airtel_data'
  | 'glo_data'
  | '9mobile_data';

export interface PeyflexDataNetwork {
  name: string;
  identifier: PeyflexNetworkIdentifier;
  carrier: NetworkId;
  badge: string;
  badgeColor: string;
  textColor: string;
  bgColor: string;
  category: string;
}

export interface NetworkProvider {
  id: NetworkId;
  name: string;
  badge: string;
  badgeColor: string;
  textColor: string;
  bgColor: string;
}

export interface DataPlan {
  id: string;
  network: NetworkId | PeyflexNetworkIdentifier;
  networkKey?: PeyflexNetworkIdentifier;
  network_key?: PeyflexNetworkIdentifier;
  size: string;
  validity: string;
  type: string; // 'Corporate Gifting' | 'SME' | 'Gifting' | 'Data Share' | 'Gifting Data'
  price: number;
  costPrice?: number;
  gatewayPrice?: number;
  planCode?: string;
  name?: string;
}

export type VtuNetwork = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE';

export interface VtuPlanModel {
  id: string;
  provider_id: string;
  network: VtuNetwork;
  plan_name: string;
  original_wholesale_price: number;
  custom_retail_price: number;
  api_plan_id: string;
  status: 'active' | 'inactive';
  category?: string;
  size?: string;
  validity?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
}

export interface VtuSyncResult {
  success: boolean;
  count: number;
  inserted: number;
  updated: number;
  provider: string;
  timestamp: string;
  message?: string;
}

export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type TransactionCategory = 'data' | 'airtime' | 'utility' | 'funding' | 'transfer' | 'pin' | 'cable' | 'electricity';

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  recipient?: string;
  date: string; // e.g., 'Today, 10:45 AM'
  group: 'Today' | 'Yesterday' | 'October 24, 2023' | string;
  amount: number;
  isCredit: boolean;
  status: TransactionStatus;
  category: TransactionCategory;
  iconType: 'wifi' | 'phone' | 'bolt' | 'wallet' | 'tv' | 'transfer' | 'pin';
  token?: string; // e.g. electricity token or pin serial
  reference?: string;
  type?: string;
  // Admin & Auditing metadata
  provider?: string;
  costPrice?: number;
  profit?: number;
  customerName?: string;
  customerPhone?: string;
  gatewayResponse?: string;
  planSize?: string;
  network?: NetworkId;
  refunded?: boolean;
}

export interface RechargePinItem {
  id: string;
  network: NetworkId;
  denomination: number;
  pin: string;
  serialNumber: string;
  loadCode: string;
  date: string;
}

export interface DataCardItem {
  id: string;
  network: NetworkId;
  dataSize: string;
  pin: string;
  serialNumber: string;
  loadCode: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  group: 'TODAY' | 'YESTERDAY';
  read: boolean;
  type: 'wallet' | 'security' | 'promo' | 'system' | 'data';
  accentColor: string; // 'primary' | 'error' | 'secondary' | 'neutral'
}

export interface VirtualAccountItem {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface UserProfile {
  name: string;
  username?: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isVerified: boolean;
  balance: number;
  bonusBalance: number;
  biometricEnabled: boolean;
  hasPin?: boolean;
  transactionPin?: string; // Kept as optional for backwards compatibility, but not stored in plaintext
  requirePinForTransactions?: boolean;
  role?: 'admin' | 'user' | 'support_agent' | 'finance_agent';
  adminRole?: 'super_admin' | 'support_agent' | 'finance_agent';
  virtualAccounts?: VirtualAccountItem[];
  authToken?: string;
  kycTier?: 1 | 2 | 3;
  referralCode?: string;
  referredBy?: string;
}

export interface ReferralItem {
  id: string;
  name: string;
  phone: string;
  date: string;
  status: 'COMPLETED' | 'PENDING';
  bonusEarned: number;
}

export interface ReferralProgramSettings {
  enabled: boolean;
  hideFromUsers?: boolean;
  bonusAmount: number;
  eligibilityDays: number;
  minPurchaseAmount: number;
  allowBonusWithdrawal: boolean;
  welcomeBonusEnabled: boolean;
  welcomeBonusAmount: number;
  termsNotice?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  bonusEarned: number;
  bonusBalance: number;
  commissionPerReferral: number;
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  referrals: ReferralItem[];
  programSettings?: ReferralProgramSettings;
}

export type AdminRole = 'super_admin' | 'support_agent' | 'finance_agent';

export interface StaffPermissions {
  canViewTransactions: boolean;
  canRequeryOrders: boolean;
  canRefundOrders: boolean;
  canFundWallets: boolean;
  canModifyPricing: boolean;
  canManageGateways: boolean;
  canManageStaff: boolean;
}

export interface StaffAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'support_agent' | 'finance_agent';
  adminRole: AdminRole;
  status: 'active' | 'suspended';
  balance?: number;
  createdAt: string;
  lastLogin?: string;
  assignedBy?: string;
  permissions: StaffPermissions;
}

// ----------------------------------------------------
// VTU ADMIN DASHBOARD & PROVIDER SWITCHING TYPES
// ----------------------------------------------------

export type UpstreamProviderId = 'payflex' | 'clubkonnect' | 'vtpass' | 'husmodata' | 'alrahuz' | 'simserver';

export interface ApiProvider {
  id: UpstreamProviderId;
  name: string;
  badge: string;
  floatBalance: number;
  status: 'active' | 'degraded' | 'maintenance' | 'offline' | 'unconfigured';
  successRate: number; // percentage, e.g. 99.4
  avgLatencyMs: number; // in milliseconds
  endpointUrl: string;
  maskedApiKey: string;
  lastPingTime: string;
  supportedServices: string[];
  contactSupport: string;
  fundingAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    portalUrl: string;
    instructions: string;
  };
}

export interface ServiceRouteConfig {
  id: string;
  serviceName: string;
  serviceCategory: 'data' | 'airtime' | 'utility' | 'cable';
  network?: NetworkId;
  dataType?: 'SME' | 'Corporate Gifting' | 'Gifting' | 'Direct';
  primaryProviderId: UpstreamProviderId;
  fallbackProviderId: UpstreamProviderId;
  autoFailover: boolean;
  status: 'active' | 'paused' | 'maintenance';
  costPriceDescription: string;
  sellingPriceDescription: string;
  consecutiveFailures: number;
  lastSwitchedTime?: string;
}

export interface AdminPlatformWallet {
  totalUserWallets: number;
  totalVendorFloat: number;
  todaySalesVolume: number;
  todayGrossProfit: number;
  todayProfit?: number;
  todayTxCount: number;
  failedTxCount: number;
  successRate: number;
  reserveRatio: number; // vendor float / user wallets
  activeUsersToday?: number;
  serviceBreakdown?: Record<string, { name: string; volume: number; count: number; percentage: number }>;
  profitGrowthPercent?: number;
  liabilitiesGrowthPercent?: number;
  turnoverGrowthPercent?: number;
  floatsGrowthPercent?: number;
  customerLiabilities?: number;
  platformTurnover?: number;
}

export interface PlatformUserAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  bonusBalance: number;
  status: 'active' | 'suspended' | 'flagged';
  registeredDate: string;
  totalOrders: number;
  totalSpent: number;
  kycTier: 1 | 2 | 3;
  role?: string;
  isAdmin?: boolean;
}

/**
 * Deduplicate transactions list by ID/reference and paired twin entries
 * (e.g. optimistic client log vs authoritative server log for the same top-up)
 */
export function deduplicateTransactions(list: Transaction[]): Transaction[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const result: Transaction[] = [];

  for (const tx of list) {
    if (!tx) continue;
    const cleanId = String(tx.id || tx.reference || '').trim();
    if (cleanId && seenIds.has(cleanId)) continue;

    const recipientDigits = String(tx.recipient || tx.subtitle || '').replace(/\D/g, '').slice(-10);
    const cat = String(tx.category || '').toLowerCase();
    const timeDigits = String(tx.date || '').replace(/[^0-9:]/g, '');

    // Check if an existing entry is a twin for the exact same transaction
    const isTwin = result.some((prev) => {
      const prevDigits = String(prev.recipient || prev.subtitle || '').replace(/\D/g, '').slice(-10);
      const prevCat = String(prev.category || '').toLowerCase();
      const prevTime = String(prev.date || '').replace(/[^0-9:]/g, '');

      if (recipientDigits && prevDigits && recipientDigits === prevDigits && cat === prevCat) {
        const timeClose =
          !timeDigits ||
          !prevTime ||
          timeDigits === prevTime ||
          Math.abs(parseInt(timeDigits.replace(':', '') || '0') - parseInt(prevTime.replace(':', '') || '0')) <= 2;
        if (timeClose) {
          const diff = Math.abs(Number(prev.amount || 0) - Number(tx.amount || 0));
          if (diff <= 5 || diff === 0) {
            return true;
          }
        }
      }
      return false;
    });

    if (!isTwin) {
      if (cleanId) seenIds.add(cleanId);
      result.push(tx);
    }
  }

  return result;
}
