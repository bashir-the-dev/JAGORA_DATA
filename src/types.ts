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
  | 'notifications'
  | 'login'
  | 'register'
  | 'terms'
  | 'privacy'
  | 'admin';

export type NetworkId = 'mtn' | 'airtel' | 'glo' | '9mobile';

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
  network: NetworkId;
  size: string;
  validity: string;
  type: string; // 'Corporate Gifting' | 'SME' | 'Gifting'
  price: number;
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
  todayTxCount: number;
  failedTxCount: number;
  successRate: number;
  reserveRatio: number; // vendor float / user wallets
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
