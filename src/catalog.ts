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
  // 1. MTN GIFTING DATA (mtn_gifting_data - 25 Plans)
  // -------------------------------------------------------------------------
  'mtn_gifting_data_m110mbs': { id: 'mtn_gifting_data_m110mbs', network: 'mtn', size: '110MB', validity: '1 Day', type: 'Gifting Data', price: 102.31, providerCode: 'M110MBS' },
  'mtn_gifting_data_m230mbs': { id: 'mtn_gifting_data_m230mbs', network: 'mtn', size: '230MB', validity: '1 Day', type: 'Gifting Data', price: 205.67, providerCode: 'M230MBS' },
  'mtn_gifting_data_m500mbs': { id: 'mtn_gifting_data_m500mbs', network: 'mtn', size: '500MB', validity: '1 Day', type: 'Gifting Data', price: 363.84, providerCode: 'M500MBS' },
  'mtn_gifting_data_m1gb': { id: 'mtn_gifting_data_m1gb', network: 'mtn', size: '1GB + 1.5Mins', validity: '1 Day', type: 'Gifting Data', price: 511.56, providerCode: 'M1GB' },
  'mtn_gifting_data_m1a5gb': { id: 'mtn_gifting_data_m1a5gb', network: 'mtn', size: '1.5GB', validity: '2 Days', type: 'Gifting Data', price: 617.02, providerCode: 'M1a5GB' },
  'mtn_gifting_data_m2gb2': { id: 'mtn_gifting_data_m2gb2', network: 'mtn', size: '2GB', validity: '2 Days', type: 'Gifting Data', price: 769.95, providerCode: 'M2GB2' },
  'mtn_gifting_data_m2a5gb': { id: 'mtn_gifting_data_m2a5gb', network: 'mtn', size: '2.5GB', validity: '2 Days', type: 'Gifting Data', price: 922.87, providerCode: 'M2a5GB' },
  'mtn_gifting_data_m1gbs': { id: 'mtn_gifting_data_m1gbs', network: 'mtn', size: '1GB + 5Mins', validity: '7 Days', type: 'Gifting Data', price: 817.41, providerCode: 'M1GBS' },
  'mtn_gifting_data_m1a5gbs': { id: 'mtn_gifting_data_m1a5gbs', network: 'mtn', size: '1.5GB', validity: '7 Days', type: 'Gifting Data', price: 1028.34, providerCode: 'M1a5GBS' },
  'mtn_gifting_data_m3a5gb': { id: 'mtn_gifting_data_m3a5gb', network: 'mtn', size: '3.2GB', validity: '2 Days', type: 'Gifting Data', price: 1028.34, providerCode: 'M3a5GB' },
  'mtn_gifting_data_m3a5gbs': { id: 'mtn_gifting_data_m3a5gbs', network: 'mtn', size: '3.5GB', validity: '7 Days', type: 'Gifting Data', price: 1550.42, providerCode: 'M3a5GBS' },
  'mtn_gifting_data_m6gb': { id: 'mtn_gifting_data_m6gb', network: 'mtn', size: '6GB', validity: '7 Days', type: 'Gifting Data', price: 2578.76, providerCode: 'M6GB' },
  'mtn_gifting_data_m11gb': { id: 'mtn_gifting_data_m11gb', network: 'mtn', size: '11GB', validity: '7 Days', type: 'Gifting Data', price: 3601.84, providerCode: 'M11GB' },
  'mtn_gifting_data_m20gb': { id: 'mtn_gifting_data_m20gb', network: 'mtn', size: '20GB', validity: '7 Days', type: 'Gifting Data', price: 5152.26, providerCode: 'M20GB' },
  'mtn_gifting_data_m2gbs': { id: 'mtn_gifting_data_m2gbs', network: 'mtn', size: '2GB + 2Mins', validity: '30 Days', type: 'Gifting Data', price: 1550.42, providerCode: 'M2GBS' },
  'mtn_gifting_data_m2a7gb': { id: 'mtn_gifting_data_m2a7gb', network: 'mtn', size: '2.7GB + 2Mins', validity: '30 Days', type: 'Gifting Data', price: 2067.21, providerCode: 'M2a7GB' },
  'mtn_gifting_data_m3a5gb2': { id: 'mtn_gifting_data_m3a5gb2', network: 'mtn', size: '3.5GB + 5Mins', validity: '30 Days', type: 'Gifting Data', price: 2578.76, providerCode: 'M3a5GB2' },
  'mtn_gifting_data_m7gb': { id: 'mtn_gifting_data_m7gb', network: 'mtn', size: '7GB', validity: '30 Days', type: 'Gifting Data', price: 3601.84, providerCode: 'M7GB' },
  'mtn_gifting_data_m10gb': { id: 'mtn_gifting_data_m10gb', network: 'mtn', size: '10GB + 10Mins', validity: '30 Days', type: 'Gifting Data', price: 4630.18, providerCode: 'M10GB' },
  'mtn_gifting_data_m12a5gb': { id: 'mtn_gifting_data_m12a5gb', network: 'mtn', size: '12.5GB', validity: '30 Days', type: 'Gifting Data', price: 5658.52, providerCode: 'M12a5GB' },
  'mtn_gifting_data_m16a5gb': { id: 'mtn_gifting_data_m16a5gb', network: 'mtn', size: '16.5GB + 10Mins', validity: '30 Days', type: 'Gifting Data', price: 6686.85, providerCode: 'M16a5GB' },
  'mtn_gifting_data_m20gbs': { id: 'mtn_gifting_data_m20gbs', network: 'mtn', size: '20GB', validity: '30 Days', type: 'Gifting Data', price: 7715.19, providerCode: 'M20GBS' },
  'mtn_gifting_data_m25gb': { id: 'mtn_gifting_data_m25gb', network: 'mtn', size: '25GB', validity: '30 Days', type: 'Gifting Data', price: 9254.99, providerCode: 'M25GB' },
  'mtn_gifting_data_m36gb': { id: 'mtn_gifting_data_m36gb', network: 'mtn', size: '36GB', validity: '30 Days', type: 'Gifting Data', price: 11311.65, providerCode: 'M36GB' },
  'mtn_gifting_data_m75gb': { id: 'mtn_gifting_data_m75gb', network: 'mtn', size: '75GB', validity: '30 Days', type: 'Gifting Data', price: 18510.78, providerCode: 'M75GB' },

  // -------------------------------------------------------------------------
  // 2. GLO DATA (glo_data - 16 Plans)
  // -------------------------------------------------------------------------
  'glo_data_g500mb': { id: 'glo_data_g500mb', network: 'glo', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 230.87, providerCode: 'G500MB' },
  'glo_data_g1gb4': { id: 'glo_data_g1gb4', network: 'glo', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 461.74, providerCode: 'G1GB4' },
  'glo_data_g2gb4': { id: 'glo_data_g2gb4', network: 'glo', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 923.47, providerCode: 'G2GB4' },
  'glo_data_g3gb4': { id: 'glo_data_g3gb4', network: 'glo', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 1385.21, providerCode: 'G3GB4' },
  'glo_data_g5gb4': { id: 'glo_data_g5gb4', network: 'glo', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 2308.68, providerCode: 'G5GB4' },
  'glo_data_g10gb2': { id: 'glo_data_g10gb2', network: 'glo', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 4617.36, providerCode: 'G10GB2' },
  'glo_data_g200mb': { id: 'glo_data_g200mb', network: 'glo', size: '200MB', validity: '14 Days', type: 'Corporate Gifting', price: 99.69, providerCode: 'G200MB' },
  'glo_data_g750mb': { id: 'glo_data_g750mb', network: 'glo', size: '750MB', validity: '1 Day', type: 'Corporate Gifting', price: 204.63, providerCode: 'G750MB' },
  'glo_data_g1a5gb': { id: 'glo_data_g1a5gb', network: 'glo', size: '1.5GB', validity: '1 Day', type: 'Corporate Gifting', price: 309.57, providerCode: 'G1a5GB' },
  'glo_data_g2a5gb': { id: 'glo_data_g2a5gb', network: 'glo', size: '2.5GB', validity: '2 Days', type: 'Corporate Gifting', price: 514.21, providerCode: 'G2a5GB' },
  'glo_data_g1gb3': { id: 'glo_data_g1gb3', network: 'glo', size: '1GB', validity: '3 Days', type: 'Corporate Gifting', price: 299.08, providerCode: 'G1GB3' },
  'glo_data_g3gb3': { id: 'glo_data_g3gb3', network: 'glo', size: '3GB', validity: '3 Days', type: 'Corporate Gifting', price: 897.24, providerCode: 'G3GB3' },
  'glo_data_g5gb3': { id: 'glo_data_g5gb3', network: 'glo', size: '5GB', validity: '3 Days', type: 'Corporate Gifting', price: 1495.39, providerCode: 'G5GB3' },
  'glo_data_g1gb2': { id: 'glo_data_g1gb2', network: 'glo', size: '1GB', validity: '7 Days', type: 'Corporate Gifting', price: 356.79, providerCode: 'G1GB2' },
  'glo_data_g3gb2': { id: 'glo_data_g3gb2', network: 'glo', size: '3GB', validity: '7 Days', type: 'Corporate Gifting', price: 1070.39, providerCode: 'G3GB2' },
  'glo_data_g5gb2': { id: 'glo_data_g5gb2', network: 'glo', size: '5GB', validity: '7 Days', type: 'Corporate Gifting', price: 1783.98, providerCode: 'G5GB2' },

  // -------------------------------------------------------------------------
  // 3. 9MOBILE DATA (9mobile_data - 10 Plans)
  // -------------------------------------------------------------------------
  '9mobile_data_e300mb': { id: '9mobile_data_e300mb', network: '9mobile', size: '300MB', validity: '30 Days', type: 'Corporate Gifting', price: 141.67, providerCode: 'E300MB' },
  '9mobile_data_e500mb': { id: '9mobile_data_e500mb', network: '9mobile', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 236.12, providerCode: 'E500MB' },
  '9mobile_data_e1gb': { id: '9mobile_data_e1gb', network: '9mobile', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 472.23, providerCode: 'E1GB' },
  '9mobile_data_e2gb': { id: '9mobile_data_e2gb', network: '9mobile', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 944.46, providerCode: 'E2GB' },
  '9mobile_data_e3gb': { id: '9mobile_data_e3gb', network: '9mobile', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 1416.69, providerCode: 'E3GB' },
  '9mobile_data_e5gb': { id: '9mobile_data_e5gb', network: '9mobile', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 2361.15, providerCode: 'E5GB' },
  '9mobile_data_e10gb': { id: '9mobile_data_e10gb', network: '9mobile', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 4722.30, providerCode: 'E10GB' },
  '9mobile_data_e15gb': { id: '9mobile_data_e15gb', network: '9mobile', size: '15GB', validity: '30 Days', type: 'Corporate Gifting', price: 7083.45, providerCode: 'E15GB' },
  '9mobile_data_e20gb': { id: '9mobile_data_e20gb', network: '9mobile', size: '20GB', validity: '30 Days', type: 'Corporate Gifting', price: 9864.36, providerCode: 'E20GB' },
  '9mobile_data_e40gb': { id: '9mobile_data_e40gb', network: '9mobile', size: '40GB', validity: '30 Days', type: 'Corporate Gifting', price: 19728.72, providerCode: 'E40GB' },

  // -------------------------------------------------------------------------
  // 4. AIRTEL DATA (airtel_data - 27 Plans)
  // -------------------------------------------------------------------------
  'airtel_data_a200mb': { id: 'airtel_data_a200mb', network: 'airtel', size: '200MB', validity: '1 Day', type: 'Gifting Data', price: 208.83, providerCode: 'A200MB' },
  'airtel_data_a300mb': { id: 'airtel_data_a300mb', network: 'airtel', size: '300MB', validity: '2 Days', type: 'Gifting Data', price: 313.77, providerCode: 'A300MB' },
  'airtel_data_a600mb': { id: 'airtel_data_a600mb', network: 'airtel', size: '600MB', validity: '2 Days', type: 'Gifting Data', price: 523.65, providerCode: 'A600MB' },
  'airtel_data_a1gb': { id: 'airtel_data_a1gb', network: 'airtel', size: '1GB', validity: '1 Day', type: 'Gifting Data', price: 523.65, providerCode: 'A1GB' },
  'airtel_data_a1a5gb': { id: 'airtel_data_a1a5gb', network: 'airtel', size: '1.5GB', validity: '1 Day', type: 'Gifting Data', price: 628.59, providerCode: 'A1a5GB' },
  'airtel_data_a1a5gbs': { id: 'airtel_data_a1a5gbs', network: 'airtel', size: '1.5GB', validity: '2 Days', type: 'Gifting Data', price: 785.99, providerCode: 'A1a5GBS' },
  'airtel_data_a2gb': { id: 'airtel_data_a2gb', network: 'airtel', size: '2GB', validity: '1 Day', type: 'Gifting Data', price: 785.99, providerCode: 'A2GB' },
  'airtel_data_a3a2gb': { id: 'airtel_data_a3a2gb', network: 'airtel', size: '3.2GB', validity: '2 Days', type: 'Gifting Data', price: 1048.35, providerCode: 'A3a2GB' },
  'airtel_data_a5gb': { id: 'airtel_data_a5gb', network: 'airtel', size: '5GB', validity: '2 Days', type: 'Gifting Data', price: 1573.04, providerCode: 'A5GB' },
  'airtel_data_a500mb': { id: 'airtel_data_a500mb', network: 'airtel', size: '500MB', validity: '7 Days', type: 'Gifting Data', price: 523.65, providerCode: 'A500MB' },
  'airtel_data_a1a5gb2': { id: 'airtel_data_a1a5gb2', network: 'airtel', size: '1.5GB', validity: '7 Days', type: 'Gifting Data', price: 1048.35, providerCode: 'A1a5GB2' },
  'airtel_data_a3a5gb': { id: 'airtel_data_a3a5gb', network: 'airtel', size: '3.5GB', validity: '7 Days', type: 'Gifting Data', price: 1573.04, providerCode: 'A3a5GB' },
  'airtel_data_a6gb': { id: 'airtel_data_a6gb', network: 'airtel', size: '6GB', validity: '7 Days', type: 'Gifting Data', price: 2622.45, providerCode: 'A6GB' },
  'airtel_data_a10gb': { id: 'airtel_data_a10gb', network: 'airtel', size: '10GB', validity: '7 Days', type: 'Gifting Data', price: 3147.14, providerCode: 'A10GB' },
  'airtel_data_a18gb': { id: 'airtel_data_a18gb', network: 'airtel', size: '18GB', validity: '7 Days', type: 'Gifting Data', price: 5245.94, providerCode: 'A18GB' },
  'airtel_data_a2gb2': { id: 'airtel_data_a2gb2', network: 'airtel', size: '2GB', validity: '30 Days', type: 'Gifting Data', price: 1573.04, providerCode: 'A2GB2' },
  'airtel_data_a3gb': { id: 'airtel_data_a3gb', network: 'airtel', size: '3GB', validity: '30 Days', type: 'Gifting Data', price: 2097.74, providerCode: 'A3GB' },
  'airtel_data_a4gb': { id: 'airtel_data_a4gb', network: 'airtel', size: '4GB', validity: '30 Days', type: 'Gifting Data', price: 2622.45, providerCode: 'A4GB' },
  'airtel_data_a8gb': { id: 'airtel_data_a8gb', network: 'airtel', size: '8GB', validity: '30 Days', type: 'Gifting Data', price: 3147.14, providerCode: 'A8GB' },
  'airtel_data_a10gb2': { id: 'airtel_data_a10gb2', network: 'airtel', size: '10GB', validity: '30 Days', type: 'Gifting Data', price: 4196.54, providerCode: 'A10GB2' },
  'airtel_data_a13gb': { id: 'airtel_data_a13gb', network: 'airtel', size: '13GB', validity: '30 Days', type: 'Gifting Data', price: 5245.94, providerCode: 'A13GB' },
  'airtel_data_a18gb2': { id: 'airtel_data_a18gb2', network: 'airtel', size: '18GB', validity: '30 Days', type: 'Gifting Data', price: 6295.34, providerCode: 'A18GB2' },
  'airtel_data_a25gb': { id: 'airtel_data_a25gb', network: 'airtel', size: '25GB', validity: '30 Days', type: 'Gifting Data', price: 8394.14, providerCode: 'A25GB' },
  'airtel_data_a35gb': { id: 'airtel_data_a35gb', network: 'airtel', size: '35GB', validity: '30 Days', type: 'Gifting Data', price: 10492.94, providerCode: 'A35GB' },
  'airtel_data_a60gb': { id: 'airtel_data_a60gb', network: 'airtel', size: '60GB', validity: '30 Days', type: 'Gifting Data', price: 15739.94, providerCode: 'A60GB' },
  'airtel_data_a100gb': { id: 'airtel_data_a100gb', network: 'airtel', size: '100GB', validity: '30 Days', type: 'Gifting Data', price: 20986.94, providerCode: 'A100GB' },
  'airtel_data_a160gb': { id: 'airtel_data_a160gb', network: 'airtel', size: '160GB', validity: '30 Days', type: 'Gifting Data', price: 31480.94, providerCode: 'A160GB' },

  // -------------------------------------------------------------------------
  // 5. MTN DATA SHARE (mtn_data_share - 8 Plans)
  // -------------------------------------------------------------------------
  'mtn_data_share_m500mbs': { id: 'mtn_data_share_m500mbs', network: 'mtn', size: '500MB', validity: '7 Days', type: 'Data Share', price: 359.87, providerCode: 'M500MBS' },
  'mtn_data_share_m1gbs': { id: 'mtn_data_share_m1gbs', network: 'mtn', size: '1GB', validity: '7 Days', type: 'Data Share', price: 462.69, providerCode: 'M1GBS' },
  'mtn_data_share_m2gbs': { id: 'mtn_data_share_m2gbs', network: 'mtn', size: '2GB', validity: '7 Days', type: 'Data Share', price: 873.97, providerCode: 'M2GBS' },
  'mtn_data_share_m3gbs': { id: 'mtn_data_share_m3gbs', network: 'mtn', size: '3GB', validity: '7 Days', type: 'Data Share', price: 1233.84, providerCode: 'M3GBS' },
  'mtn_data_share_m5gbs': { id: 'mtn_data_share_m5gbs', network: 'mtn', size: '5GB', validity: '30 Days', type: 'Data Share', price: 1850.76, providerCode: 'M5GBS' },
  'mtn_data_share_m1gv': { id: 'mtn_data_share_m1gv', network: 'mtn', size: '1GB + 3Mins', validity: '7 Days', type: 'Data Share', price: 616.92, providerCode: 'M1GV' },
  'mtn_data_share_m1g1': { id: 'mtn_data_share_m1g1', network: 'mtn', size: '1GB', validity: '30 Days', type: 'Data Share', price: 534.66, providerCode: 'M1G1' },
  'mtn_data_share_m2g1': { id: 'mtn_data_share_m2g1', network: 'mtn', size: '2GB', validity: '30 Days', type: 'Data Share', price: 1028.20, providerCode: 'M2G1' },
};

export function getServerDataPlan(planIdOrCode: string, network?: string): AuthoritativeDataPlan | null {
  if (!planIdOrCode) return null;
  const key = String(planIdOrCode).trim().toLowerCase();

  if (SERVER_DATA_PLANS[key]) {
    return SERVER_DATA_PLANS[key];
  }

  const net = String(network || '').trim().toLowerCase();
  // Check if network is a Peyflex identifier like mtn_gifting_data
  if (net && net.includes('_data')) {
    const compositeKey = `${net}_${key}`;
    if (SERVER_DATA_PLANS[compositeKey]) {
      return SERVER_DATA_PLANS[compositeKey];
    }
  }

  const carrier = net.startsWith('mtn')
    ? 'mtn'
    : net.startsWith('glo')
    ? 'glo'
    : net.startsWith('9mobile')
    ? '9mobile'
    : net.startsWith('airtel')
    ? 'airtel'
    : net;

  for (const plan of Object.values(SERVER_DATA_PLANS)) {
    if (carrier && plan.network !== carrier) continue;
    if (
      plan.id.toLowerCase() === key ||
      plan.providerCode.toLowerCase() === key ||
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
