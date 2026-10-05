/**
 * Authoritative Server-Side Product & Pricing Catalog
 * ----------------------------------------------------------------------------
 * CRITICAL SECURITY PRINCIPLE: NEVER trust prices or product details sent by
 * the client. The backend must strictly validate and re-derive all transaction
 * amounts from this catalog before deducting wallet balances or calling
 * upstream telecom gateways.
 * ----------------------------------------------------------------------------
 */

export interface AuthoritativeDataPlan {
  id: string;
  network: 'mtn' | 'airtel' | 'glo' | '9mobile';
  size: string;
  validity: string;
  type: string;
  price: number; // in Naira
  providerCode: string;
}

export const SERVER_DATA_PLANS: Record<string, AuthoritativeDataPlan> = {
  // -------------------------------------------------------------------------
  // MTN PLANS (SME, Corporate Gifting, Data Share / Gifting)
  // -------------------------------------------------------------------------
  'mtn-500mb': { id: 'mtn-500mb', network: 'mtn', size: '500MB', validity: '30 Days', type: 'SME Bundle', price: 150, providerCode: 'M500MBS' },
  'mtn-1gb': { id: 'mtn-1gb', network: 'mtn', size: '1GB', validity: '30 Days', type: 'SME Bundle', price: 290, providerCode: 'M1GBS' },
  'mtn-2gb': { id: 'mtn-2gb', network: 'mtn', size: '2GB', validity: '30 Days', type: 'SME Bundle', price: 580, providerCode: 'M2GBS' },
  'mtn-3gb': { id: 'mtn-3gb', network: 'mtn', size: '3GB', validity: '30 Days', type: 'SME Bundle', price: 870, providerCode: 'M3GBS' },
  'mtn-5gb': { id: 'mtn-5gb', network: 'mtn', size: '5GB', validity: '30 Days', type: 'SME Bundle', price: 1450, providerCode: 'M5GBS' },
  'mtn-10gb': { id: 'mtn-10gb', network: 'mtn', size: '10GB', validity: '30 Days', type: 'SME Bundle', price: 2900, providerCode: 'M10GBS' },

  'mtn-cg-500mb': { id: 'mtn-cg-500mb', network: 'mtn', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 160, providerCode: 'M500MBS' },
  'mtn-cg-1gb': { id: 'mtn-cg-1gb', network: 'mtn', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 295, providerCode: 'M1GBS' },
  'mtn-cg-2gb': { id: 'mtn-cg-2gb', network: 'mtn', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 590, providerCode: 'M2GBS' },
  'mtn-cg-3gb': { id: 'mtn-cg-3gb', network: 'mtn', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 885, providerCode: 'M3GBS' },
  'mtn-cg-5gb': { id: 'mtn-cg-5gb', network: 'mtn', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 1475, providerCode: 'M5GBS' },
  'mtn-cg-10gb': { id: 'mtn-cg-10gb', network: 'mtn', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 2950, providerCode: 'M10GBS' },
  'mtn-cg-15gb': { id: 'mtn-cg-15gb', network: 'mtn', size: '15GB', validity: '30 Days', type: 'Corporate Gifting', price: 4400, providerCode: 'M15GBS' },
  'mtn-cg-20gb': { id: 'mtn-cg-20gb', network: 'mtn', size: '20GB', validity: '30 Days', type: 'Corporate Gifting', price: 5850, providerCode: 'M20GBS' },

  'mtn-share-1gb-7d': { id: 'mtn-share-1gb-7d', network: 'mtn', size: '1GB', validity: '7 Days', type: 'Data Share', price: 450, providerCode: 'M1GBS' },
  'mtn-share-2gb-7d': { id: 'mtn-share-2gb-7d', network: 'mtn', size: '2GB', validity: '7 Days', type: 'Data Share', price: 850, providerCode: 'M2GBS' },
  'mtn-share-3gb-7d': { id: 'mtn-share-3gb-7d', network: 'mtn', size: '3GB', validity: '7 Days', type: 'Data Share', price: 1200, providerCode: 'M3GBS' },
  'mtn-share-5gb-30d': { id: 'mtn-share-5gb-30d', network: 'mtn', size: '5GB', validity: '30 Days', type: 'Data Share', price: 1800, providerCode: 'M5GBS' },
  'mtn-gifting-25gb': { id: 'mtn-gifting-25gb', network: 'mtn', size: '25GB', validity: '30 Days', type: 'Direct Gifting', price: 7500, providerCode: 'M25GB' },
  'mtn-gifting-40gb': { id: 'mtn-gifting-40gb', network: 'mtn', size: '40GB', validity: '30 Days', type: 'Direct Gifting', price: 11500, providerCode: 'M40GB' },
  
  // -------------------------------------------------------------------------
  // AIRTEL PLANS (Corporate Gifting, Gifting)
  // -------------------------------------------------------------------------
  'airtel-500mb': { id: 'airtel-500mb', network: 'airtel', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 160, providerCode: 'A500MB' },
  'airtel-1gb': { id: 'airtel-1gb', network: 'airtel', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 295, providerCode: 'A1GB' },
  'airtel-2gb': { id: 'airtel-2gb', network: 'airtel', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 590, providerCode: 'A2GB2' },
  'airtel-3gb': { id: 'airtel-3gb', network: 'airtel', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 885, providerCode: 'A3GB' },
  'airtel-4gb': { id: 'airtel-4gb', network: 'airtel', size: '4GB', validity: '30 Days', type: 'Corporate Gifting', price: 1180, providerCode: 'A4GB' },
  'airtel-5gb': { id: 'airtel-5gb', network: 'airtel', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 1475, providerCode: 'A5GB' },
  'airtel-10gb': { id: 'airtel-10gb', network: 'airtel', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 2950, providerCode: 'A10GB' },
  'airtel-15gb': { id: 'airtel-15gb', network: 'airtel', size: '15GB', validity: '30 Days', type: 'Corporate Gifting', price: 4400, providerCode: 'A13GB' },
  'airtel-20gb': { id: 'airtel-20gb', network: 'airtel', size: '20GB', validity: '30 Days', type: 'Corporate Gifting', price: 5850, providerCode: 'A20GB' },

  'airtel-gift-1gb-7d': { id: 'airtel-gift-1gb-7d', network: 'airtel', size: '1GB', validity: '7 Days', type: 'Direct Gifting', price: 795, providerCode: 'A1GB' },
  'airtel-gift-1.5gb-7d': { id: 'airtel-gift-1.5gb-7d', network: 'airtel', size: '1.5GB', validity: '7 Days', type: 'Direct Gifting', price: 995, providerCode: 'A1a5GBS' },
  'airtel-gift-8gb-30d': { id: 'airtel-gift-8gb-30d', network: 'airtel', size: '8GB', validity: '30 Days', type: 'Direct Gifting', price: 2975, providerCode: 'A8GB' },
  'airtel-gift-25gb-30d': { id: 'airtel-gift-25gb-30d', network: 'airtel', size: '25GB', validity: '30 Days', type: 'Direct Gifting', price: 7900, providerCode: 'A25GB' },

  // -------------------------------------------------------------------------
  // GLO PLANS (Corporate Gifting, Gifting Bundles)
  // -------------------------------------------------------------------------
  'glo-500mb': { id: 'glo-500mb', network: 'glo', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 150, providerCode: 'G500MB' },
  'glo-1gb': { id: 'glo-1gb', network: 'glo', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 285, providerCode: 'G1GB4' },
  'glo-2gb': { id: 'glo-2gb', network: 'glo', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 570, providerCode: 'G2GB4' },
  'glo-3gb': { id: 'glo-3gb', network: 'glo', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 855, providerCode: 'G3GB4' },
  'glo-5gb': { id: 'glo-5gb', network: 'glo', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 1425, providerCode: 'G5GB4' },
  'glo-10gb': { id: 'glo-10gb', network: 'glo', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 2850, providerCode: 'G10GB2' },

  'glo-1.5gb': { id: 'glo-1.5gb', network: 'glo', size: '1.5GB', validity: '30 Days', type: 'Gifting Bundle', price: 530, providerCode: 'G1GB4' },
  'glo-3gb-gift': { id: 'glo-3gb-gift', network: 'glo', size: '3GB', validity: '30 Days', type: 'Gifting Bundle', price: 1000, providerCode: 'G3GB4' },
  'glo-7gb': { id: 'glo-7gb', network: 'glo', size: '7GB', validity: '30 Days', type: 'Gifting Bundle', price: 2000, providerCode: 'G5GB4' },
  'glo-14gb': { id: 'glo-14gb', network: 'glo', size: '14GB', validity: '30 Days', type: 'Gifting Bundle', price: 3900, providerCode: 'G10GB2' },

  // -------------------------------------------------------------------------
  // 9MOBILE PLANS (SME, Corporate Gifting)
  // -------------------------------------------------------------------------
  '9mob-500mb': { id: '9mob-500mb', network: '9mobile', size: '500MB', validity: '30 Days', type: 'SME Bundle', price: 150, providerCode: 'E500MB' },
  '9mob-1gb': { id: '9mob-1gb', network: '9mobile', size: '1GB', validity: '30 Days', type: 'SME Bundle', price: 250, providerCode: 'E1GB' },
  '9mob-1.5gb': { id: '9mob-1.5gb', network: '9mobile', size: '1.5GB', validity: '30 Days', type: 'SME Bundle', price: 375, providerCode: 'E1GB' },
  '9mob-2gb': { id: '9mob-2gb', network: '9mobile', size: '2GB', validity: '30 Days', type: 'SME Bundle', price: 500, providerCode: 'E2GB' },
  '9mob-3gb': { id: '9mob-3gb', network: '9mobile', size: '3GB', validity: '30 Days', type: 'SME Bundle', price: 750, providerCode: 'E3GB' },
  '9mob-4gb': { id: '9mob-4gb', network: '9mobile', size: '4GB', validity: '30 Days', type: 'SME Bundle', price: 1000, providerCode: 'E3GB' },
  '9mob-5gb': { id: '9mob-5gb', network: '9mobile', size: '5GB', validity: '30 Days', type: 'SME Bundle', price: 1250, providerCode: 'E5GB' },
  '9mob-10gb': { id: '9mob-10gb', network: '9mobile', size: '10GB', validity: '30 Days', type: 'SME Bundle', price: 2500, providerCode: 'E10GB' },
  '9mob-15gb': { id: '9mob-15gb', network: '9mobile', size: '15GB', validity: '30 Days', type: 'SME Bundle', price: 3750, providerCode: 'E15GB' },
  '9mob-20gb': { id: '9mob-20gb', network: '9mobile', size: '20GB', validity: '30 Days', type: 'SME Bundle', price: 5000, providerCode: 'E20GB' },
  '9mob-40gb': { id: '9mob-40gb', network: '9mobile', size: '40GB', validity: '30 Days', type: 'SME Bundle', price: 9900, providerCode: 'E40GB' },
};

export function getServerDataPlan(planIdOrCode: string, network?: string): AuthoritativeDataPlan | null {
  if (!planIdOrCode) return null;
  const key = String(planIdOrCode).trim().toLowerCase();

  if (SERVER_DATA_PLANS[key]) {
    return SERVER_DATA_PLANS[key];
  }

  // Fallback match by network and size/providerCode
  const net = String(network || '').trim().toLowerCase();
  for (const plan of Object.values(SERVER_DATA_PLANS)) {
    if (net && plan.network !== net) continue;
    if (
      plan.id.toLowerCase() === key ||
      plan.providerCode === key ||
      plan.size.toLowerCase() === key ||
      `${plan.network}-${plan.size}`.toLowerCase() === key
    ) {
      return plan;
    }
  }

  return null;
}

export interface CableBouquet {
  id: string;
  provider: 'gotv' | 'dstv' | 'startimes' | 'showmax';
  name: string;
  price: number;
}

export const SERVER_CABLE_BOUQUETS: Record<string, CableBouquet> = {
  // GOtv
  'gotv-smallie': { id: 'gotv-smallie', provider: 'gotv', name: 'GOtv Smallie', price: 1575 },
  'gotv-jinja': { id: 'gotv-jinja', provider: 'gotv', name: 'GOtv Jinja', price: 3300 },
  'gotv-jolli': { id: 'gotv-jolli', provider: 'gotv', name: 'GOtv Jolli', price: 4850 },
  'gotv-max': { id: 'gotv-max', provider: 'gotv', name: 'GOtv Max', price: 7200 },
  'gotv-supa': { id: 'gotv-supa', provider: 'gotv', name: 'GOtv Supa', price: 9600 },

  // DStv
  'dstv-padi': { id: 'dstv-padi', provider: 'dstv', name: 'DStv Padi', price: 3600 },
  'dstv-yanga': { id: 'dstv-yanga', provider: 'dstv', name: 'DStv Yanga', price: 5100 },
  'dstv-confam': { id: 'dstv-confam', provider: 'dstv', name: 'DStv Confam', price: 9300 },
  'dstv-compact': { id: 'dstv-compact', provider: 'dstv', name: 'DStv Compact', price: 15700 },
  'dstv-compact-plus': { id: 'dstv-compact-plus', provider: 'dstv', name: 'DStv Compact Plus', price: 25000 },
  'dstv-premium': { id: 'dstv-premium', provider: 'dstv', name: 'DStv Premium', price: 37000 },

  // StarTimes
  'startimes-nova': { id: 'startimes-nova', provider: 'startimes', name: 'StarTimes Nova', price: 1700 },
  'startimes-basic': { id: 'startimes-basic', provider: 'startimes', name: 'StarTimes Basic', price: 3300 },
  'startimes-smart': { id: 'startimes-smart', provider: 'startimes', name: 'StarTimes Smart', price: 4200 },
  'startimes-classic': { id: 'startimes-classic', provider: 'startimes', name: 'StarTimes Classic', price: 5000 },
  'startimes-super': { id: 'startimes-super', provider: 'startimes', name: 'StarTimes Super', price: 9000 },

  // Showmax
  'showmax-mobile': { id: 'showmax-mobile', provider: 'showmax', name: 'Showmax Mobile', price: 1600 },
  'showmax-pro': { id: 'showmax-pro', provider: 'showmax', name: 'Showmax Pro', price: 3200 },
};

export function getServerCableBouquet(provider: string, identifier: string): CableBouquet | null {
  const normProv = String(provider || '').trim().toLowerCase();
  const normId = String(identifier || '').trim().toLowerCase();

  // Try direct key
  const directKey = `${normProv}-${normId}`.replace(/[\s_]+/g, '-');
  if (SERVER_CABLE_BOUQUETS[directKey]) {
    return SERVER_CABLE_BOUQUETS[directKey];
  }
  if (SERVER_CABLE_BOUQUETS[normId]) {
    return SERVER_CABLE_BOUQUETS[normId];
  }

  // Scan by matching provider and name contains
  for (const bouquet of Object.values(SERVER_CABLE_BOUQUETS)) {
    if (bouquet.provider === normProv) {
      if (
        bouquet.name.toLowerCase().includes(normId) ||
        normId.includes(bouquet.name.toLowerCase()) ||
        bouquet.id.toLowerCase().includes(normId)
      ) {
        return bouquet;
      }
    }
  }

  return null;
}

export const SERVER_EXAM_PRICES: Record<string, number> = {
  WAEC: 3800,
  NECO: 1250,
  NABTEB: 1100,
  JAMB: 4700
};

export function getServerExamUnitPrice(examType: string): number | null {
  const norm = String(examType || '').trim().toUpperCase();
  return SERVER_EXAM_PRICES[norm] || null;
}

export const ALLOWED_RECHARGE_DENOMINATIONS = [50, 100, 200, 500, 1000, 2000, 5000];

export function isValidRechargeDenomination(denom: number): boolean {
  return ALLOWED_RECHARGE_DENOMINATIONS.includes(Number(denom));
}

export const AIRTIME_LIMITS = {
  MIN: 50,
  MAX: 50000,
  DISCOUNT_RATE: 0.02 // 2% discount
};
