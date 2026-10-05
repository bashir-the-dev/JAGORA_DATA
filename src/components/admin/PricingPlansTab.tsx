import React, { useState, useEffect } from 'react';
import { NetworkId } from '../../types';
import {
  Edit3,
  Check,
  X,
  Tag,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Sliders,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiGetPricingSettings, apiUpdatePricingSettings } from '../../services/apiClient';

export type PricingNetworkFilter = 'all' | NetworkId | 'cable' | 'education';

export interface VtuPlanConfig {
  id: string;
  network: NetworkId | 'gotv' | 'dstv' | 'startimes' | 'waec' | 'neco' | 'nabteb' | 'jamb';
  name: string;
  category: 'SME Data' | 'Corporate Gifting' | 'Gifting Data' | 'Data Share' | 'Cable TV' | 'Exam PIN' | 'Airtime VTU' | 'Utility';
  size?: string;
  costPrice: number;
  sellingPrice: number;
  resellerPrice: number;
  apiPrice: number;
  status: 'active' | 'paused' | 'out_of_stock';
  provider: string;
}

const defaultVtuPlans: VtuPlanConfig[] = [
  // -------------------------------------------------------------------------
  // MTN PLANS (SME, CG, Data Share, Direct Gifting)
  // -------------------------------------------------------------------------
  {
    id: 'mtn-500mb',
    network: 'mtn',
    name: 'MTN SME 500MB',
    category: 'SME Data',
    size: '500MB',
    costPrice: 130,
    sellingPrice: 150,
    resellerPrice: 140,
    apiPrice: 135,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-1gb',
    network: 'mtn',
    name: 'MTN SME 1GB',
    category: 'SME Data',
    size: '1GB',
    costPrice: 260,
    sellingPrice: 290,
    resellerPrice: 275,
    apiPrice: 270,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-2gb',
    network: 'mtn',
    name: 'MTN SME 2GB',
    category: 'SME Data',
    size: '2GB',
    costPrice: 520,
    sellingPrice: 580,
    resellerPrice: 550,
    apiPrice: 540,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-3gb',
    network: 'mtn',
    name: 'MTN SME 3GB',
    category: 'SME Data',
    size: '3GB',
    costPrice: 780,
    sellingPrice: 870,
    resellerPrice: 825,
    apiPrice: 810,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-5gb',
    network: 'mtn',
    name: 'MTN SME 5GB',
    category: 'SME Data',
    size: '5GB',
    costPrice: 1300,
    sellingPrice: 1450,
    resellerPrice: 1375,
    apiPrice: 1350,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-10gb',
    network: 'mtn',
    name: 'MTN SME 10GB',
    category: 'SME Data',
    size: '10GB',
    costPrice: 2600,
    sellingPrice: 2900,
    resellerPrice: 2750,
    apiPrice: 2700,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-500mb',
    network: 'mtn',
    name: 'MTN Corp Gifting 500MB',
    category: 'Corporate Gifting',
    size: '500MB',
    costPrice: 140,
    sellingPrice: 160,
    resellerPrice: 150,
    apiPrice: 145,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-1gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 1GB',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 270,
    sellingPrice: 295,
    resellerPrice: 280,
    apiPrice: 275,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-2gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 2GB',
    category: 'Corporate Gifting',
    size: '2GB',
    costPrice: 540,
    sellingPrice: 590,
    resellerPrice: 560,
    apiPrice: 550,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-3gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 3GB',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 810,
    sellingPrice: 885,
    resellerPrice: 840,
    apiPrice: 825,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-5gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 5GB',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 1350,
    sellingPrice: 1475,
    resellerPrice: 1400,
    apiPrice: 1375,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-10gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 10GB',
    category: 'Corporate Gifting',
    size: '10GB',
    costPrice: 2700,
    sellingPrice: 2950,
    resellerPrice: 2800,
    apiPrice: 2750,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-15gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 15GB',
    category: 'Corporate Gifting',
    size: '15GB',
    costPrice: 4050,
    sellingPrice: 4400,
    resellerPrice: 4200,
    apiPrice: 4125,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-cg-20gb',
    network: 'mtn',
    name: 'MTN Corp Gifting 20GB',
    category: 'Corporate Gifting',
    size: '20GB',
    costPrice: 5400,
    sellingPrice: 5850,
    resellerPrice: 5600,
    apiPrice: 5500,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-share-1gb-7d',
    network: 'mtn',
    name: 'MTN Data Share 1GB (7D)',
    category: 'Data Share',
    size: '1GB',
    costPrice: 390,
    sellingPrice: 450,
    resellerPrice: 420,
    apiPrice: 410,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-share-2gb-7d',
    network: 'mtn',
    name: 'MTN Data Share 2GB (7D)',
    category: 'Data Share',
    size: '2GB',
    costPrice: 750,
    sellingPrice: 850,
    resellerPrice: 800,
    apiPrice: 780,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-share-5gb-30d',
    network: 'mtn',
    name: 'MTN Data Share 5GB (30D)',
    category: 'Data Share',
    size: '5GB',
    costPrice: 1600,
    sellingPrice: 1800,
    resellerPrice: 1700,
    apiPrice: 1650,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn-gifting-25gb',
    network: 'mtn',
    name: 'MTN Direct Gifting 25GB',
    category: 'Gifting Data',
    size: '25GB',
    costPrice: 6800,
    sellingPrice: 7500,
    resellerPrice: 7100,
    apiPrice: 7000,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },

  // -------------------------------------------------------------------------
  // AIRTEL PLANS (Corporate Gifting & Direct Gifting)
  // -------------------------------------------------------------------------
  {
    id: 'airtel-500mb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 500MB',
    category: 'Corporate Gifting',
    size: '500MB',
    costPrice: 140,
    sellingPrice: 160,
    resellerPrice: 150,
    apiPrice: 145,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-1gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 1GB',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 265,
    sellingPrice: 295,
    resellerPrice: 280,
    apiPrice: 275,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-2gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 2GB',
    category: 'Corporate Gifting',
    size: '2GB',
    costPrice: 530,
    sellingPrice: 590,
    resellerPrice: 560,
    apiPrice: 550,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-3gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 3GB',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 795,
    sellingPrice: 885,
    resellerPrice: 840,
    apiPrice: 825,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-4gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 4GB',
    category: 'Corporate Gifting',
    size: '4GB',
    costPrice: 1060,
    sellingPrice: 1180,
    resellerPrice: 1120,
    apiPrice: 1100,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-5gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 5GB',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 1325,
    sellingPrice: 1475,
    resellerPrice: 1400,
    apiPrice: 1375,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-10gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 10GB',
    category: 'Corporate Gifting',
    size: '10GB',
    costPrice: 2650,
    sellingPrice: 2950,
    resellerPrice: 2800,
    apiPrice: 2750,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-15gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 15GB',
    category: 'Corporate Gifting',
    size: '15GB',
    costPrice: 3975,
    sellingPrice: 4400,
    resellerPrice: 4200,
    apiPrice: 4100,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-20gb',
    network: 'airtel',
    name: 'Airtel Corp Gifting 20GB',
    category: 'Corporate Gifting',
    size: '20GB',
    costPrice: 5300,
    sellingPrice: 5850,
    resellerPrice: 5600,
    apiPrice: 5500,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-gift-1gb-7d',
    network: 'airtel',
    name: 'Airtel Direct Gifting 1GB (7D)',
    category: 'Gifting Data',
    size: '1GB',
    costPrice: 720,
    sellingPrice: 795,
    resellerPrice: 760,
    apiPrice: 750,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel-gift-8gb-30d',
    network: 'airtel',
    name: 'Airtel Direct Gifting 8GB (30D)',
    category: 'Gifting Data',
    size: '8GB',
    costPrice: 2680,
    sellingPrice: 2975,
    resellerPrice: 2820,
    apiPrice: 2780,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },

  // -------------------------------------------------------------------------
  // GLO PLANS (Corporate Gifting & Bundles)
  // -------------------------------------------------------------------------
  {
    id: 'glo-500mb',
    network: 'glo',
    name: 'Glo Corp Gifting 500MB',
    category: 'Corporate Gifting',
    size: '500MB',
    costPrice: 130,
    sellingPrice: 150,
    resellerPrice: 140,
    apiPrice: 135,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-1gb',
    network: 'glo',
    name: 'Glo Corp Gifting 1GB',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 255,
    sellingPrice: 285,
    resellerPrice: 270,
    apiPrice: 265,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-2gb',
    network: 'glo',
    name: 'Glo Corp Gifting 2GB',
    category: 'Corporate Gifting',
    size: '2GB',
    costPrice: 510,
    sellingPrice: 570,
    resellerPrice: 540,
    apiPrice: 530,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-3gb',
    network: 'glo',
    name: 'Glo Corp Gifting 3GB',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 765,
    sellingPrice: 855,
    resellerPrice: 810,
    apiPrice: 795,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-5gb',
    network: 'glo',
    name: 'Glo Corp Gifting 5GB',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 1275,
    sellingPrice: 1425,
    resellerPrice: 1350,
    apiPrice: 1325,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-10gb',
    network: 'glo',
    name: 'Glo Corp Gifting 10GB',
    category: 'Corporate Gifting',
    size: '10GB',
    costPrice: 2550,
    sellingPrice: 2850,
    resellerPrice: 2700,
    apiPrice: 2650,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-1.5gb',
    network: 'glo',
    name: 'Glo Gifting 1.5GB',
    category: 'Gifting Data',
    size: '1.5GB',
    costPrice: 470,
    sellingPrice: 530,
    resellerPrice: 500,
    apiPrice: 485,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo-7gb',
    network: 'glo',
    name: 'Glo Gifting 7GB',
    category: 'Gifting Data',
    size: '7GB',
    costPrice: 1800,
    sellingPrice: 2000,
    resellerPrice: 1900,
    apiPrice: 1850,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },

  // -------------------------------------------------------------------------
  // 9MOBILE PLANS (SME & Corporate Gifting)
  // -------------------------------------------------------------------------
  {
    id: '9mob-500mb',
    network: '9mobile',
    name: '9mobile SME 500MB',
    category: 'SME Data',
    size: '500MB',
    costPrice: 130,
    sellingPrice: 150,
    resellerPrice: 140,
    apiPrice: 135,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mob-1gb',
    network: '9mobile',
    name: '9mobile SME 1GB',
    category: 'SME Data',
    size: '1GB',
    costPrice: 220,
    sellingPrice: 250,
    resellerPrice: 235,
    apiPrice: 230,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mob-2gb',
    network: '9mobile',
    name: '9mobile SME 2GB',
    category: 'SME Data',
    size: '2GB',
    costPrice: 440,
    sellingPrice: 500,
    resellerPrice: 470,
    apiPrice: 460,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mob-3gb',
    network: '9mobile',
    name: '9mobile SME 3GB',
    category: 'SME Data',
    size: '3GB',
    costPrice: 660,
    sellingPrice: 750,
    resellerPrice: 705,
    apiPrice: 690,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mob-5gb',
    network: '9mobile',
    name: '9mobile SME 5GB',
    category: 'SME Data',
    size: '5GB',
    costPrice: 1100,
    sellingPrice: 1250,
    resellerPrice: 1175,
    apiPrice: 1150,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mob-10gb',
    network: '9mobile',
    name: '9mobile SME 10GB',
    category: 'SME Data',
    size: '10GB',
    costPrice: 2200,
    sellingPrice: 2500,
    resellerPrice: 2350,
    apiPrice: 2300,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mob-20gb',
    network: '9mobile',
    name: '9mobile SME 20GB',
    category: 'SME Data',
    size: '20GB',
    costPrice: 4400,
    sellingPrice: 5000,
    resellerPrice: 4700,
    apiPrice: 4600,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },

  // -------------------------------------------------------------------------
  // CABLE TV PACKAGES (GOtv, DStv, StarTimes)
  // -------------------------------------------------------------------------
  {
    id: 'gotv-smallie',
    network: 'gotv',
    name: 'GOtv Smallie Monthly',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 1500,
    sellingPrice: 1575,
    resellerPrice: 1550,
    apiPrice: 1530,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'gotv-jinja',
    network: 'gotv',
    name: 'GOtv Jinja Package',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 3150,
    sellingPrice: 3300,
    resellerPrice: 3250,
    apiPrice: 3200,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'gotv-jolli',
    network: 'gotv',
    name: 'GOtv Jolli Package',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 4650,
    sellingPrice: 4850,
    resellerPrice: 4780,
    apiPrice: 4720,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'gotv-max',
    network: 'gotv',
    name: 'GOtv Max Package',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 6900,
    sellingPrice: 7200,
    resellerPrice: 7100,
    apiPrice: 7000,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'gotv-supa',
    network: 'gotv',
    name: 'GOtv Supa Package',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 9200,
    sellingPrice: 9600,
    resellerPrice: 9450,
    apiPrice: 9350,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'dstv-padi',
    network: 'dstv',
    name: 'DStv Padi Bouquet',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 3450,
    sellingPrice: 3600,
    resellerPrice: 3550,
    apiPrice: 3500,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'dstv-yanga',
    network: 'dstv',
    name: 'DStv Yanga Bouquet',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 4900,
    sellingPrice: 5100,
    resellerPrice: 5020,
    apiPrice: 4980,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'dstv-confam',
    network: 'dstv',
    name: 'DStv Confam Bouquet',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 8950,
    sellingPrice: 9300,
    resellerPrice: 9180,
    apiPrice: 9100,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'dstv-compact',
    network: 'dstv',
    name: 'DStv Compact Bouquet',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 15100,
    sellingPrice: 15700,
    resellerPrice: 15500,
    apiPrice: 15300,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'dstv-compact-plus',
    network: 'dstv',
    name: 'DStv Compact Plus',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 24200,
    sellingPrice: 25000,
    resellerPrice: 24700,
    apiPrice: 24500,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'startimes-nova',
    network: 'startimes',
    name: 'StarTimes Nova Monthly',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 1600,
    sellingPrice: 1700,
    resellerPrice: 1660,
    apiPrice: 1630,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'startimes-basic',
    network: 'startimes',
    name: 'StarTimes Basic Monthly',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 3150,
    sellingPrice: 3300,
    resellerPrice: 3250,
    apiPrice: 3200,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'startimes-smart',
    network: 'startimes',
    name: 'StarTimes Smart Monthly',
    category: 'Cable TV',
    size: 'Monthly',
    costPrice: 4000,
    sellingPrice: 4200,
    resellerPrice: 4120,
    apiPrice: 4080,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },

  // -------------------------------------------------------------------------
  // EDUCATIONAL RESULT CHECKER PINS (WAEC, NECO, NABTEB, JAMB)
  // -------------------------------------------------------------------------
  {
    id: 'exam-waec',
    network: 'waec',
    name: 'WAEC Result Checker PIN',
    category: 'Exam PIN',
    size: '1 e-PIN',
    costPrice: 3500,
    sellingPrice: 3800,
    resellerPrice: 3650,
    apiPrice: 3600,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'exam-neco',
    network: 'neco',
    name: 'NECO Result Token PIN',
    category: 'Exam PIN',
    size: '1 Token',
    costPrice: 1100,
    sellingPrice: 1250,
    resellerPrice: 1200,
    apiPrice: 1160,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'exam-nabteb',
    network: 'nabteb',
    name: 'NABTEB Result Checker PIN',
    category: 'Exam PIN',
    size: '1 e-PIN',
    costPrice: 950,
    sellingPrice: 1100,
    resellerPrice: 1050,
    apiPrice: 1020,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'exam-jamb',
    network: 'jamb',
    name: 'JAMB UTME / DE Profile PIN',
    category: 'Exam PIN',
    size: 'Profile PIN',
    costPrice: 4500,
    sellingPrice: 4700,
    resellerPrice: 4620,
    apiPrice: 4580,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
];

interface PricingPlansTabProps {
  isLightMode?: boolean;
  showToast: (msg: string) => void;
}

export const PricingPlansTab: React.FC<PricingPlansTabProps> = ({ isLightMode: _isLightMode, showToast }) => {
  const [plans, setPlans] = useState<VtuPlanConfig[]>(defaultVtuPlans);
  const [selectedNetwork, setSelectedNetwork] = useState<PricingNetworkFilter>('all');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Airtime Discount percentages (discount % + customer pay % = 100%)
  const [airtimeDiscounts, setAirtimeDiscounts] = useState({
    mtn: 2.5,
    airtel: 3.0,
    glo: 4.0,
    '9mobile': 4.5,
  });

  // Fetch initial pricing & discounts from server API
  const loadLivePricing = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetPricingSettings();
      if (res.status === 'success' && res.data) {
        if (res.data.airtimeDiscounts) {
          setAirtimeDiscounts(res.data.airtimeDiscounts);
        }
        if (res.data.customPricing) {
          const custom = res.data.customPricing;
          setPlans((prev) =>
            prev.map((p) => {
              const override = custom[p.id];
              if (override) {
                return {
                  ...p,
                  sellingPrice: override.sellingPrice || p.sellingPrice,
                  costPrice: override.costPrice || p.costPrice,
                  status: override.status || p.status,
                };
              }
              return p;
            })
          );
        }
      }
    } catch {
      // Fall back to default plans on offline mode
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLivePricing();
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (selectedNetwork === 'all') return true;
    if (selectedNetwork === 'cable') return p.category === 'Cable TV';
    if (selectedNetwork === 'education') return p.category === 'Exam PIN';
    return p.network === selectedNetwork;
  });

  const handleStartEdit = (plan: VtuPlanConfig) => {
    setEditingPlanId(plan.id);
    setEditPrice(plan.sellingPrice);
    setEditCostPrice(plan.costPrice);
    const grossMargin = plan.sellingPrice > 0 ? ((plan.sellingPrice - plan.costPrice) / plan.sellingPrice) * 100 : 0;
    setTargetMarginPct(Math.round(Math.max(0, Math.min(100, grossMargin))));
  };

  // Adjust selling price from target margin percentage (0 to 100%)
  const handleTargetMarginChange = (costPrice: number, marginPct: number) => {
    const safeMargin = Math.max(0, Math.min(99.9, marginPct));
    setTargetMarginPct(safeMargin);
    // Formula: SellingPrice = CostPrice / (1 - Margin/100)
    const effectiveCost = editCostPrice > 0 ? editCostPrice : costPrice;
    const calculatedSelling = Math.round(effectiveCost / (1 - safeMargin / 100));
    setEditPrice(calculatedSelling);
  };

  const handleSaveEdit = async (planId: string) => {
    if (editPrice <= 0) return;
    setIsSaving(true);
    try {
      const plan = plans.find((p) => p.id === planId);
      const res = await apiUpdatePricingSettings({
        planId,
        sellingPrice: editPrice,
        costPrice: editCostPrice > 0 ? editCostPrice : undefined,
        status: plan?.status || 'active',
      });

      if (res.status === 'success') {
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id === planId) {
              return {
                ...p,
                sellingPrice: editPrice,
                costPrice: editCostPrice > 0 ? editCostPrice : p.costPrice,
              };
            }
            return p;
          })
        );
        setEditingPlanId(null);
        showToast(`Pricing updated: Cost ₦${(editCostPrice || plan?.costPrice || 0).toLocaleString()}, Retail ₦${editPrice.toLocaleString()} (synced live to customer app).`);
      } else {
        showToast(res.message || 'Failed to sync price change to backend.');
      }
    } catch {
      showToast('Network error while saving price update.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const nextStatus = plan.status === 'active' ? 'paused' : 'active';

    try {
      const res = await apiUpdatePricingSettings({
        planId,
        sellingPrice: plan.sellingPrice,
        status: nextStatus,
      });

      if (res.status === 'success') {
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id === planId) {
              return { ...p, status: nextStatus };
            }
            return p;
          })
        );
        showToast(`${plan.name} is now ${nextStatus.toUpperCase()} across the mobile app.`);
      } else {
        showToast(res.message || 'Could not update plan status.');
      }
    } catch {
      showToast('Error syncing plan status.');
    }
  };

  // Airtime discount update: keeps discount % + pay % = exactly 100%
  const handleDiscountChange = async (net: 'mtn' | 'airtel' | 'glo' | '9mobile', val: number) => {
    const safeDiscount = Math.max(0, Math.min(100, val));
    const nextDiscounts = { ...airtimeDiscounts, [net]: safeDiscount };
    setAirtimeDiscounts(nextDiscounts);

    try {
      const res = await apiUpdatePricingSettings({
        airtimeDiscounts: nextDiscounts,
      });
      if (res.status === 'success') {
        const payPct = (100 - safeDiscount).toFixed(1);
        showToast(`${net.toUpperCase()} updated: ${safeDiscount}% discount + ${payPct}% customer pay = 100% total.`);
      }
    } catch {
      showToast('Offline fallback: discount updated locally.');
    }
  };

  return (
    <div id="admin-pricing-tab" className="space-y-6 pb-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag size={20} className="text-[#0047cc] dark:text-blue-400" />
            <span>VTU Pricing & Profit Margin Manager</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Live catalog controls: configure selling prices, airtime discounts & profit margins reaching 100%
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh live prices */}
          <button
            onClick={loadLivePricing}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Reload from server"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          {/* Network & Service Category Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-bold overflow-x-auto max-w-full">
            {([
              { id: 'all', label: 'ALL' },
              { id: 'mtn', label: 'MTN' },
              { id: 'airtel', label: 'AIRTEL' },
              { id: 'glo', label: 'GLO' },
              { id: '9mobile', label: '9MOBILE' },
              { id: 'cable', label: 'CABLE TV' },
              { id: 'education', label: 'EXAM PINS' },
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedNetwork(item.id)}
                className={`px-3 py-1.5 rounded-lg uppercase transition-all whitespace-nowrap text-[11px] ${
                  selectedNetwork === item.id
                    ? 'bg-[#0047cc] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300/60 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-World VTU Pricing Guide: Wholesale vs Retail */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
            ₦
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Payflex Wholesale Cost vs. Customer Retail Selling Price
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-200">Payflex Wallet:</strong> Displays your <span className="underline decoration-blue-500 font-semibold">Wholesale Cost Price</span> (what Payflex deducts from your vendor float per order).<br />
              <strong className="text-slate-800 dark:text-slate-200">This Portal:</strong> You set the <span className="underline decoration-emerald-500 font-semibold">Retail Selling Price</span> (what your customers pay into your Jagora app).<br />
              <strong className="text-slate-800 dark:text-slate-200">Your Real Profit:</strong> <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">Selling Price – Wholesale Cost</span>. Edit any plan below to adjust both numbers in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Airtime VTU Discount Strip with 100% Complement Verification */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Airtime VTU Wholesale Discounts & Customer Pay Percentages
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Discount % + Customer Pay % = Exactly 100.0%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['mtn', 'airtel', 'glo', '9mobile'] as const).map((net) => {
            const discount = airtimeDiscounts[net] ?? 2.5;
            const customerPay = parseFloat((100 - discount).toFixed(1));
            const totalCheck = parseFloat((discount + customerPay).toFixed(1));

            return (
              <div
                key={net}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        net === 'mtn'
                          ? 'bg-amber-500'
                          : net === 'airtel'
                          ? 'bg-rose-500'
                          : net === 'glo'
                          ? 'bg-emerald-600'
                          : 'bg-lime-700'
                      }`}
                    />
                    {net} Airtime
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Auto-calculated</span>
                </div>

                {/* Percentage Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block mb-1">Discount %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={discount}
                        onChange={(e) => handleDiscountChange(net, parseFloat(e.target.value) || 0)}
                        className="w-full pl-2 pr-6 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-center"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block mb-1">Customer Pays %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customerPay}
                        onChange={(e) => {
                          const userPay = parseFloat(e.target.value) || 0;
                          const newDiscount = Math.max(0, Math.min(100, parseFloat((100 - userPay).toFixed(1))));
                          handleDiscountChange(net, newDiscount);
                        }}
                        className="w-full pl-2 pr-6 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-center"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                </div>

                {/* 100% Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex">
                    <div
                      style={{ width: `${discount}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                      title={`Discount: ${discount}%`}
                    />
                    <div
                      style={{ width: `${customerPay}%` }}
                      className="bg-[#0047cc] dark:bg-blue-500 transition-all duration-300"
                      title={`Customer Pays: ${customerPay}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Save {discount}%</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Pay {customerPay}%</span>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-200/60 dark:border-slate-800/80 pt-1.5">
                  <span className="text-slate-500">Reconciled Total:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> {totalCheck}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Plans Pricing & Margin Manager */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Data Bundles Pricing Matrix & Profit Margins (0% – 100%)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info size={12} />
              <span>Gross Margin % = Profit ÷ Retail Selling Price × 100</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {filteredPlans.length} packages active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Plan Name / Network</th>
                <th className="py-3 px-3">Gateway Cost</th>
                <th className="py-3 px-3">Retail Selling Price</th>
                <th className="py-3 px-3">Gross Margin % (0-100%)</th>
                <th className="py-3 px-3">Reseller Price</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans">
              {filteredPlans.map((plan, idx) => {
                const isEditing = editingPlanId === plan.id;
                const activeSellingPrice = isEditing ? editPrice : plan.sellingPrice;
                const activeCostPrice = isEditing ? (editCostPrice > 0 ? editCostPrice : plan.costPrice) : plan.costPrice;
                const profit = activeSellingPrice - activeCostPrice;

                // Gross Margin %: bounded within 0% to 100%
                const grossMarginPct =
                  activeSellingPrice > 0
                    ? Math.max(0, Math.min(100, (profit / activeSellingPrice) * 100))
                    : 0;

                // Markup %: Wholesale markup
                const markupPct = activeCostPrice > 0 ? (profit / activeCostPrice) * 100 : 0;

                return (
                  <tr key={`${plan.id}-${plan.network}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[9px] uppercase text-white ${
                            plan.network === 'mtn'
                              ? 'bg-amber-500'
                              : plan.network === 'airtel'
                              ? 'bg-rose-500'
                              : plan.network === 'glo'
                              ? 'bg-emerald-600'
                              : plan.network === '9mobile'
                              ? 'bg-lime-700'
                              : plan.network === 'gotv'
                              ? 'bg-orange-500'
                              : plan.network === 'dstv'
                              ? 'bg-blue-600'
                              : plan.network === 'startimes'
                              ? 'bg-indigo-600'
                              : 'bg-purple-600'
                          }`}
                        >
                          {plan.category === 'Cable TV' ? 'TV' : plan.category === 'Exam PIN' ? 'PIN' : plan.network[0]}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {plan.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {plan.provider} • {plan.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {isEditing ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-500">₦</span>
                            <input
                              type="number"
                              value={editCostPrice}
                              onChange={(e) => {
                                const newC = parseFloat(e.target.value) || 0;
                                setEditCostPrice(newC);
                                if (editPrice > 0 && newC > 0) {
                                  const gm = ((editPrice - newC) / editPrice) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="w-20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                              title="Payflex Wholesale Cost Price"
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 block font-sans">Payflex Cost</span>
                        </div>
                      ) : (
                        `₦${plan.costPrice.toLocaleString()}`
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-600 dark:text-slate-400">₦</span>
                            <input
                              type="number"
                              autoFocus
                              value={editPrice}
                              onChange={(e) => {
                                const newP = parseFloat(e.target.value) || 0;
                                setEditPrice(newP);
                                if (newP > 0) {
                                  const gm = ((newP - plan.costPrice) / newP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-[#0047cc] text-xs font-mono font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* Quick Margin Slider up to 100% */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Sliders size={11} className="text-slate-400" />
                            <input
                              type="range"
                              min="0"
                              max="90"
                              step="1"
                              value={targetMarginPct}
                              onChange={(e) =>
                                handleTargetMarginChange(plan.costPrice, parseFloat(e.target.value))
                              }
                              className="w-20 accent-[#0047cc]"
                              title={`Set target gross margin: ${targetMarginPct}%`}
                            />
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              {targetMarginPct}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₦{plan.sellingPrice.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Gross Margin % with 100% Scale Progress Bar */}
                    <td className="py-3 px-3 font-mono">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              grossMarginPct >= 15
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : grossMarginPct > 5
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            +₦{profit.toFixed(0)} ({grossMarginPct.toFixed(1)}%)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono" title="Wholesale Markup">
                            {markupPct.toFixed(0)}% markup
                          </span>
                        </div>

                        {/* Visual bar up to 100% */}
                        <div className="w-28 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, grossMarginPct)}%` }}
                            className={`h-full rounded-full transition-all ${
                              grossMarginPct >= 15
                                ? 'bg-emerald-500'
                                : grossMarginPct > 5
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      ₦{plan.resellerPrice.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleStatus(plan.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all ${
                          plan.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {plan.status}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(plan.id)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                            title="Save & sync with client app"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingPlanId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(plan)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
                        >
                          <Edit3 size={13} />
                          <span>Edit Price</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
