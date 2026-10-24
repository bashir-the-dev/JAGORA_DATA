import React, { useState, useEffect } from 'react';
import { NetworkId, PeyflexDataNetwork, PeyflexNetworkIdentifier } from '../../types';
import { peyflexDataNetworks } from '../../data/mockData';
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
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import {
  apiGetPricingSettings,
  apiUpdatePricingSettings,
  apiGetDataNetworks,
  apiGetVtuPlans,
  apiCreateVtuPlan,
  apiUpdateVtuPlan,
  apiToggleVtuPlanStatus,
  apiDeleteVtuPlan,
} from '../../services/apiClient';

export type PricingNetworkFilter =
  | 'all'
  | 'mtn_gifting_data'
  | 'glo_data'
  | '9mobile_data'
  | 'airtel_data'
  | 'mtn_data_share';

export interface VtuPlanConfig {
  id: string;
  network: NetworkId | 'gotv' | 'dstv' | 'startimes' | 'waec' | 'neco' | 'nabteb' | 'jamb';
  networkKey?: string;
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
  // AUTHORITATIVE LIVE PEYFLEX API RESELLER DATA PLANS (86 PLANS)
  // -------------------------------------------------------------------------
  {
    id: 'mtn_data_share_m500mbs',
    network: 'mtn',
    name: '500MB = N350 (7 Days)',
    category: 'Data Share',
    size: '500MB',
    costPrice: 339.50,
    sellingPrice: 359.87,
    resellerPrice: 349.69,
    apiPrice: 339.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m1gbs',
    network: 'mtn',
    name: '1GB = N450 (7 Days)',
    category: 'Data Share',
    size: '1GB',
    costPrice: 436.50,
    sellingPrice: 462.69,
    resellerPrice: 449.60,
    apiPrice: 436.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m2gbs',
    network: 'mtn',
    name: '2GB = N850 (7 Days)',
    category: 'Data Share',
    size: '2GB',
    costPrice: 824.50,
    sellingPrice: 873.97,
    resellerPrice: 849.24,
    apiPrice: 824.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m3gbs',
    network: 'mtn',
    name: '3GB = N1200 (7 Days)',
    category: 'Data Share',
    size: '3GB',
    costPrice: 1164.00,
    sellingPrice: 1233.84,
    resellerPrice: 1198.92,
    apiPrice: 1164.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m1gbs2',
    network: 'mtn',
    name: '1GB = N580 (30 Days)',
    category: 'Data Share',
    size: '1GB',
    costPrice: 562.60,
    sellingPrice: 596.36,
    resellerPrice: 579.48,
    apiPrice: 562.60,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m2gbs2',
    network: 'mtn',
    name: '2GB = N950 (30 Days)',
    category: 'Data Share',
    size: '2GB',
    costPrice: 921.50,
    sellingPrice: 976.79,
    resellerPrice: 949.14,
    apiPrice: 921.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m3gbs2',
    network: 'mtn',
    name: '3GB = N1250 (30 Days)',
    category: 'Data Share',
    size: '3GB',
    costPrice: 1212.50,
    sellingPrice: 1285.25,
    resellerPrice: 1248.88,
    apiPrice: 1212.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_data_share_m5gbs',
    network: 'mtn',
    name: '5GB = N1800 (30 Days)',
    category: 'Data Share',
    size: '5GB',
    costPrice: 1746.00,
    sellingPrice: 1850.76,
    resellerPrice: 1798.38,
    apiPrice: 1746.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m110mbs',
    network: 'mtn',
    name: '110MB = N99 (1 Day)',
    category: 'Gifting Data',
    size: '110MB',
    costPrice: 98.50,
    sellingPrice: 104.41,
    resellerPrice: 101.45,
    apiPrice: 98.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m1m2gb',
    network: 'mtn',
    name: '1.2GB = N495 (1 month) Access All Social Apps',
    category: 'Gifting Data',
    size: '1.2GB',
    costPrice: 492.52,
    sellingPrice: 522.07,
    resellerPrice: 507.30,
    apiPrice: 492.52,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m2m5gbs',
    network: 'mtn',
    name: '2.5GB = N893 (2 Days)',
    category: 'Gifting Data',
    size: '2.5GB',
    costPrice: 888.53,
    sellingPrice: 941.84,
    resellerPrice: 915.19,
    apiPrice: 888.53,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m2gbs',
    network: 'mtn',
    name: '2GB = N745 (2 Days)',
    category: 'Gifting Data',
    size: '2GB',
    costPrice: 741.27,
    sellingPrice: 785.75,
    resellerPrice: 763.51,
    apiPrice: 741.27,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m3m2gbs',
    network: 'mtn',
    name: '3.2GB =N990 (2 Days)',
    category: 'Gifting Data',
    size: '3.2GB',
    costPrice: 985.05,
    sellingPrice: 1044.15,
    resellerPrice: 1014.60,
    apiPrice: 985.05,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m1gbs',
    network: 'mtn',
    name: '1GB = N796 (7Days)',
    category: 'Gifting Data',
    size: '1GB',
    costPrice: 792.02,
    sellingPrice: 839.54,
    resellerPrice: 815.78,
    apiPrice: 792.02,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m2m5gbs1',
    network: 'mtn',
    name: '2.5GB = N2480 (1 Month)',
    category: 'Gifting Data',
    size: '2.5GB',
    costPrice: 2467.60,
    sellingPrice: 2615.66,
    resellerPrice: 2541.63,
    apiPrice: 2467.60,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m2m7gbs',
    network: 'mtn',
    name: '2.7GB = N1990 (1Month)',
    category: 'Gifting Data',
    size: '2.7GB',
    costPrice: 1980.05,
    sellingPrice: 2098.85,
    resellerPrice: 2039.45,
    apiPrice: 1980.05,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m3m5gbs',
    network: 'mtn',
    name: '3.5GB = N2480 (1 Month)',
    category: 'Gifting Data',
    size: '3.5GB',
    costPrice: 2467.60,
    sellingPrice: 2615.66,
    resellerPrice: 2541.63,
    apiPrice: 2467.60,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m6gbs',
    network: 'mtn',
    name: '6GB = N2480 (Weekly)',
    category: 'Gifting Data',
    size: '6GB',
    costPrice: 2467.60,
    sellingPrice: 2615.66,
    resellerPrice: 2541.63,
    apiPrice: 2467.60,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m7gbs',
    network: 'mtn',
    name: '7GB = N3450 (1 Month) +2GB All Night Streaming',
    category: 'Gifting Data',
    size: '7GB',
    costPrice: 3432.75,
    sellingPrice: 3638.72,
    resellerPrice: 3535.73,
    apiPrice: 3432.75,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m11gbs',
    network: 'mtn',
    name: '11GB = N3500 (Weekly)',
    category: 'Gifting Data',
    size: '11GB',
    costPrice: 3482.50,
    sellingPrice: 3691.45,
    resellerPrice: 3586.97,
    apiPrice: 3482.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m12m5gbs',
    network: 'mtn',
    name: '12.5GB = N5435(1 Month)',
    category: 'Gifting Data',
    size: '12.5GB',
    costPrice: 5407.82,
    sellingPrice: 5732.29,
    resellerPrice: 5570.05,
    apiPrice: 5407.82,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m14m5gbs',
    network: 'mtn',
    name: '14.5GB = N4950 (1 Month)',
    category: 'Gifting Data',
    size: '14.5GB',
    costPrice: 4925.25,
    sellingPrice: 5220.77,
    resellerPrice: 5073.01,
    apiPrice: 4925.25,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m20gbs',
    network: 'mtn',
    name: '20GB = N7380 (1MONTH) + 4GB All Night Streaming',
    category: 'Gifting Data',
    size: '20GB',
    costPrice: 7343.10,
    sellingPrice: 7783.69,
    resellerPrice: 7563.39,
    apiPrice: 7343.10,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m25gbs',
    network: 'mtn',
    name: '25GB = N8850 (1 Month)',
    category: 'Gifting Data',
    size: '25GB',
    costPrice: 8805.75,
    sellingPrice: 9334.10,
    resellerPrice: 9069.92,
    apiPrice: 8805.75,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m36gbs',
    network: 'mtn',
    name: '36GB = N10850 (1 Month)',
    category: 'Gifting Data',
    size: '36GB',
    costPrice: 10795.75,
    sellingPrice: 11443.50,
    resellerPrice: 11119.62,
    apiPrice: 10795.75,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m65gbs',
    network: 'mtn',
    name: '65GB = N15800 (1 Month)',
    category: 'Gifting Data',
    size: '65GB',
    costPrice: 15721.00,
    sellingPrice: 16664.26,
    resellerPrice: 16192.63,
    apiPrice: 15721.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m75gbs',
    network: 'mtn',
    name: '75GB = N17800 (1 Month)',
    category: 'Gifting Data',
    size: '75GB',
    costPrice: 17711.00,
    sellingPrice: 18773.66,
    resellerPrice: 18242.33,
    apiPrice: 17711.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m90gbs',
    network: 'mtn',
    name: '90GB = N24650 (2 Months)',
    category: 'Gifting Data',
    size: '90GB',
    costPrice: 24526.75,
    sellingPrice: 25998.35,
    resellerPrice: 25262.55,
    apiPrice: 24526.75,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m150gbs',
    network: 'mtn',
    name: '150GB = N39500 (2 Months)',
    category: 'Gifting Data',
    size: '150GB',
    costPrice: 39302.50,
    sellingPrice: 41660.65,
    resellerPrice: 40481.58,
    apiPrice: 39302.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m165gbs',
    network: 'mtn',
    name: '165GB = N34500 (1 Month)',
    category: 'Gifting Data',
    size: '165GB',
    costPrice: 34327.50,
    sellingPrice: 36387.15,
    resellerPrice: 35357.33,
    apiPrice: 34327.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m200gbs',
    network: 'mtn',
    name: '200GB = N49200 (2 Months)',
    category: 'Gifting Data',
    size: '200GB',
    costPrice: 48954.00,
    sellingPrice: 51891.24,
    resellerPrice: 50422.62,
    apiPrice: 48954.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m250gbs',
    network: 'mtn',
    name: '250GB  = N54500 (1 Month)',
    category: 'Gifting Data',
    size: '250GB',
    costPrice: 54227.50,
    sellingPrice: 57481.15,
    resellerPrice: 55854.33,
    apiPrice: 54227.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'mtn_gifting_data_m800gbs',
    network: 'mtn',
    name: '800GB  = N123500 (1 Year)',
    category: 'Gifting Data',
    size: '800GB',
    costPrice: 122882.50,
    sellingPrice: 130255.45,
    resellerPrice: 126568.98,
    apiPrice: 122882.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a200mb',
    network: 'airtel',
    name: '200MB =N199 (2Days)  social plan',
    category: 'Gifting Data',
    size: '200MB',
    costPrice: 197.01,
    sellingPrice: 208.83,
    resellerPrice: 202.92,
    apiPrice: 197.01,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a300mb',
    network: 'airtel',
    name: '300MB =N298 (2Days)  social plan',
    category: 'Gifting Data',
    size: '300MB',
    costPrice: 295.02,
    sellingPrice: 312.72,
    resellerPrice: 303.87,
    apiPrice: 295.02,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a1gbs',
    network: 'airtel',
    name: '1GB =N338 (3Days) social plan',
    category: 'Gifting Data',
    size: '1GB',
    costPrice: 334.62,
    sellingPrice: 354.70,
    resellerPrice: 344.66,
    apiPrice: 334.62,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a2gbs',
    network: 'airtel',
    name: '2GB =N745 (2 Days)  social plan',
    category: 'Gifting Data',
    size: '2GB',
    costPrice: 737.55,
    sellingPrice: 781.80,
    resellerPrice: 759.68,
    apiPrice: 737.55,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a4gbs',
    network: 'airtel',
    name: '4GB = N990 (2Days) Bing plan',
    category: 'Gifting Data',
    size: '4GB',
    costPrice: 980.10,
    sellingPrice: 1038.91,
    resellerPrice: 1009.50,
    apiPrice: 980.10,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a6gbs',
    network: 'airtel',
    name: '6GB = N1485 (2Days)',
    category: 'Gifting Data',
    size: '6GB',
    costPrice: 1470.15,
    sellingPrice: 1558.36,
    resellerPrice: 1514.25,
    apiPrice: 1470.15,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a1gb',
    network: 'airtel',
    name: '1GB =N795 (7Days)',
    category: 'Gifting Data',
    size: '1GB',
    costPrice: 787.05,
    sellingPrice: 834.27,
    resellerPrice: 810.66,
    apiPrice: 787.05,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a1a5gb',
    network: 'airtel',
    name: '1.5GB =N530 (7Days) Social Plan',
    category: 'Gifting Data',
    size: '1.5GB',
    costPrice: 524.70,
    sellingPrice: 556.18,
    resellerPrice: 540.44,
    apiPrice: 524.70,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a1a5gbs',
    network: 'airtel',
    name: '1.5GB =N995 (7Days) Weekly Plan',
    category: 'Gifting Data',
    size: '1.5GB',
    costPrice: 985.05,
    sellingPrice: 1044.15,
    resellerPrice: 1014.60,
    apiPrice: 985.05,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a3a5gb',
    network: 'airtel',
    name: '3.5GB = N1488 (7Days)',
    category: 'Gifting Data',
    size: '3.5GB',
    costPrice: 1473.12,
    sellingPrice: 1561.51,
    resellerPrice: 1517.31,
    apiPrice: 1473.12,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a6gb',
    network: 'airtel',
    name: '6GB = N1970 (7Days)',
    category: 'Gifting Data',
    size: '6GB',
    costPrice: 1950.30,
    sellingPrice: 2067.32,
    resellerPrice: 2008.81,
    apiPrice: 1950.30,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a8gbs',
    network: 'airtel',
    name: '8GB = N2487 (7Days)',
    category: 'Gifting Data',
    size: '8GB',
    costPrice: 2462.13,
    sellingPrice: 2609.86,
    resellerPrice: 2535.99,
    apiPrice: 2462.13,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a10gbs',
    network: 'airtel',
    name: '10GB = N2975 (7Days)',
    category: 'Gifting Data',
    size: '10GB',
    costPrice: 2945.25,
    sellingPrice: 3121.97,
    resellerPrice: 3033.61,
    apiPrice: 2945.25,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a20gb',
    network: 'airtel',
    name: '20GB =N4950 (7Days)',
    category: 'Gifting Data',
    size: '20GB',
    costPrice: 4900.50,
    sellingPrice: 5194.53,
    resellerPrice: 5047.52,
    apiPrice: 4900.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a35gb',
    network: 'airtel',
    name: '35GB =N9900 (7Days) Ulimited Ultra Router',
    category: 'Gifting Data',
    size: '35GB',
    costPrice: 9801.00,
    sellingPrice: 10389.06,
    resellerPrice: 10095.03,
    apiPrice: 9801.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a2gb2',
    network: 'airtel',
    name: '2GB = N1478 (30Days)',
    category: 'Gifting Data',
    size: '2GB',
    costPrice: 1463.22,
    sellingPrice: 1551.01,
    resellerPrice: 1507.12,
    apiPrice: 1463.22,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a3gb',
    network: 'airtel',
    name: '3GB =N1980 (30Days)',
    category: 'Gifting Data',
    size: '3GB',
    costPrice: 1960.20,
    sellingPrice: 2077.81,
    resellerPrice: 2019.01,
    apiPrice: 1960.20,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a4gb',
    network: 'airtel',
    name: '4GB =N2477 (30Days)',
    category: 'Gifting Data',
    size: '4GB',
    costPrice: 2452.23,
    sellingPrice: 2599.36,
    resellerPrice: 2525.80,
    apiPrice: 2452.23,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a8gb',
    network: 'airtel',
    name: '8GB =N2975 (30Days)',
    category: 'Gifting Data',
    size: '8GB',
    costPrice: 2945.25,
    sellingPrice: 3121.97,
    resellerPrice: 3033.61,
    apiPrice: 2945.25,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a10gb',
    network: 'airtel',
    name: '10GB =N3950 (30Days)',
    category: 'Gifting Data',
    size: '10GB',
    costPrice: 3910.50,
    sellingPrice: 4145.13,
    resellerPrice: 4027.82,
    apiPrice: 3910.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a13gb',
    network: 'airtel',
    name: '13GB =N4955 (30Days)',
    category: 'Gifting Data',
    size: '13GB',
    costPrice: 4905.45,
    sellingPrice: 5199.78,
    resellerPrice: 5052.61,
    apiPrice: 4905.45,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a18gb',
    network: 'airtel',
    name: '18GB =N5940 (30Days)',
    category: 'Gifting Data',
    size: '18GB',
    costPrice: 5880.60,
    sellingPrice: 6233.44,
    resellerPrice: 6057.02,
    apiPrice: 5880.60,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a25gb',
    network: 'airtel',
    name: '25GB =N7900 (30Days)',
    category: 'Gifting Data',
    size: '25GB',
    costPrice: 7821.00,
    sellingPrice: 8290.26,
    resellerPrice: 8055.63,
    apiPrice: 7821.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a60gb',
    network: 'airtel',
    name: '60GB =N14900 (30Days)',
    category: 'Gifting Data',
    size: '60GB',
    costPrice: 14751.00,
    sellingPrice: 15636.06,
    resellerPrice: 15193.53,
    apiPrice: 14751.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a75gb',
    network: 'airtel',
    name: '75GB =N14980 (30Days) Router Plan',
    category: 'Gifting Data',
    size: '75GB',
    costPrice: 14830.20,
    sellingPrice: 15720.01,
    resellerPrice: 15275.11,
    apiPrice: 14830.20,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a100gb',
    network: 'airtel',
    name: '100GB =N19800 (30Days)',
    category: 'Gifting Data',
    size: '100GB',
    costPrice: 19602.00,
    sellingPrice: 20778.12,
    resellerPrice: 20190.06,
    apiPrice: 19602.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'airtel_data_a160gb',
    network: 'airtel',
    name: '160GB =N29750 (1 month)',
    category: 'Gifting Data',
    size: '160GB',
    costPrice: 29452.50,
    sellingPrice: 31219.65,
    resellerPrice: 30336.08,
    apiPrice: 29452.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g500mb',
    network: 'glo',
    name: '500MB = N245 (30 DAYS)',
    category: 'Corporate Gifting',
    size: '500MB',
    costPrice: 242.55,
    sellingPrice: 257.10,
    resellerPrice: 249.83,
    apiPrice: 242.55,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g1gb1',
    network: 'glo',
    name: '1GB = N335 ( 3 DAYS)',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 331.65,
    sellingPrice: 351.55,
    resellerPrice: 341.60,
    apiPrice: 331.65,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g3gb1',
    network: 'glo',
    name: '3GB = N850 ( 3 DAYS)',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 841.50,
    sellingPrice: 891.99,
    resellerPrice: 866.75,
    apiPrice: 841.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g5gb1',
    network: 'glo',
    name: '5GB = N1380 (3 DAYS)',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 1366.20,
    sellingPrice: 1448.17,
    resellerPrice: 1407.19,
    apiPrice: 1366.20,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g1gb2',
    network: 'glo',
    name: '1GB = N360 (7 DAYS)',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 356.40,
    sellingPrice: 377.78,
    resellerPrice: 367.09,
    apiPrice: 356.40,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g3gb2',
    network: 'glo',
    name: '3GB = N990 (7 DAYS)',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 980.10,
    sellingPrice: 1038.91,
    resellerPrice: 1009.50,
    apiPrice: 980.10,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g5gb2',
    network: 'glo',
    name: '5GB = N1580 (7DAYS)',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 1564.20,
    sellingPrice: 1658.05,
    resellerPrice: 1611.13,
    apiPrice: 1564.20,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g1gb3',
    network: 'glo',
    name: '1GB = N360 (14 DAYS) Night Plan',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 356.40,
    sellingPrice: 377.78,
    resellerPrice: 367.09,
    apiPrice: 356.40,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g3gb3',
    network: 'glo',
    name: '3GB = N990 (14 DAYS) Night Plan',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 980.10,
    sellingPrice: 1038.91,
    resellerPrice: 1009.50,
    apiPrice: 980.10,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g5gb3',
    network: 'glo',
    name: '5GB = N1640   (14 DAYS)Night Plan',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 1623.60,
    sellingPrice: 1721.02,
    resellerPrice: 1672.31,
    apiPrice: 1623.60,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g10gb1',
    network: 'glo',
    name: '10GB = N3300   (14 DAYS)Night Plan',
    category: 'Corporate Gifting',
    size: '10GB',
    costPrice: 3267.00,
    sellingPrice: 3463.02,
    resellerPrice: 3365.01,
    apiPrice: 3267.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g1gb4',
    network: 'glo',
    name: '1GB = N450 (30 DAYS)',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 445.50,
    sellingPrice: 472.23,
    resellerPrice: 458.87,
    apiPrice: 445.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g2gb4',
    network: 'glo',
    name: '2GB = N900  (30 DAYS)',
    category: 'Corporate Gifting',
    size: '2GB',
    costPrice: 891.00,
    sellingPrice: 944.46,
    resellerPrice: 917.73,
    apiPrice: 891.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g3gb4',
    network: 'glo',
    name: '3GB = N1350 (30 DAYS)',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 1336.50,
    sellingPrice: 1416.69,
    resellerPrice: 1376.60,
    apiPrice: 1336.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g5gb4',
    network: 'glo',
    name: '5GB = N2200 (30 DAYS)',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 2178.00,
    sellingPrice: 2308.68,
    resellerPrice: 2243.34,
    apiPrice: 2178.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: 'glo_data_g10gb2',
    network: 'glo',
    name: '10GB = N4250 (30 DAYS)',
    category: 'Corporate Gifting',
    size: '10GB',
    costPrice: 4207.50,
    sellingPrice: 4459.95,
    resellerPrice: 4333.73,
    apiPrice: 4207.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e300mb',
    network: '9mobile',
    name: '300MB = N200 (30 Days)',
    category: 'Corporate Gifting',
    size: '300MB',
    costPrice: 198.00,
    sellingPrice: 209.88,
    resellerPrice: 203.94,
    apiPrice: 198.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e500mb',
    network: '9mobile',
    name: '500MB = NGN300 (30 Days)',
    category: 'Corporate Gifting',
    size: '500MB',
    costPrice: 297.00,
    sellingPrice: 314.82,
    resellerPrice: 305.91,
    apiPrice: 297.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e1gb',
    network: '9mobile',
    name: '1GB = NGN500 (30 Days)',
    category: 'Corporate Gifting',
    size: '1GB',
    costPrice: 495.00,
    sellingPrice: 524.70,
    resellerPrice: 509.85,
    apiPrice: 495.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e2gb',
    network: '9mobile',
    name: '2GB  = NGN980 (30 Days)',
    category: 'Corporate Gifting',
    size: '2GB',
    costPrice: 970.20,
    sellingPrice: 1028.41,
    resellerPrice: 999.31,
    apiPrice: 970.20,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e3gb',
    network: '9mobile',
    name: '3GB = NGN1500 (30 Days)',
    category: 'Corporate Gifting',
    size: '3GB',
    costPrice: 1485.00,
    sellingPrice: 1574.10,
    resellerPrice: 1529.55,
    apiPrice: 1485.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e5gb',
    network: '9mobile',
    name: '5GB = NGN2500 (30 Days)',
    category: 'Corporate Gifting',
    size: '5GB',
    costPrice: 2475.00,
    sellingPrice: 2623.50,
    resellerPrice: 2549.25,
    apiPrice: 2475.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e10gb',
    network: '9mobile',
    name: '10GB = NGN5000 (30 Days)',
    category: 'Corporate Gifting',
    size: '10GB',
    costPrice: 4950.00,
    sellingPrice: 5247.00,
    resellerPrice: 5098.50,
    apiPrice: 4950.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e15gb',
    network: '9mobile',
    name: '15GB = NGN6950 (30 Days){Gifting}',
    category: 'Corporate Gifting',
    size: '15GB',
    costPrice: 6880.50,
    sellingPrice: 7293.33,
    resellerPrice: 7086.91,
    apiPrice: 6880.50,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e20gb',
    network: '9mobile',
    name: '20GB = NGN9500 (30 Days)',
    category: 'Corporate Gifting',
    size: '20GB',
    costPrice: 9405.00,
    sellingPrice: 9969.30,
    resellerPrice: 9687.15,
    apiPrice: 9405.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
  {
    id: '9mobile_data_e40gb',
    network: '9mobile',
    name: '40GB = NGN18800 (30 Days)',
    category: 'Corporate Gifting',
    size: '40GB',
    costPrice: 18612.00,
    sellingPrice: 19728.72,
    resellerPrice: 19170.36,
    apiPrice: 18612.00,
    status: 'active',
    provider: 'Payflex (Peyflex)',
  },
];

interface PricingPlansTabProps {
  isLightMode?: boolean;
  showToast: (msg: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const PricingPlansTab: React.FC<PricingPlansTabProps> = ({ isLightMode: _isLightMode, showToast, onNavigateTab }) => {
  const [plans, setPlans] = useState<VtuPlanConfig[]>(defaultVtuPlans);
  const [selectedNetwork, setSelectedNetwork] = useState<PricingNetworkFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<VtuPlanConfig | null>(null);

  // Strict Peyflex Data Networks from curl 'https://client.peyflex.com.ng/api/data/networks/'
  const [dataNetworks, setDataNetworks] = useState<PeyflexDataNetwork[]>(peyflexDataNetworks);

  // Add form fields
  const [addNet, setAddNet] = useState<PeyflexNetworkIdentifier>('mtn_gifting_data');
  const [addCategory, setAddCategory] = useState<'SME Data' | 'Corporate Gifting' | 'Gifting Data' | 'Data Share'>('Gifting Data');
  const [addName, setAddName] = useState('');
  const [addSize, setAddSize] = useState('1GB');
  const [addValidity, setAddValidity] = useState('30 Days');
  const [addCostPrice, setAddCostPrice] = useState<number>(260);
  const [addSellingPrice, setAddSellingPrice] = useState<number>(290);
  const [addStatus, setAddStatus] = useState<'active' | 'paused'>('active');

  // Edit form fields
  const [editFullName, setEditFullName] = useState('');
  const [editFullCategory, setEditFullCategory] = useState<string>('SME Data');
  const [editFullSize, setEditFullSize] = useState('1GB');
  const [editFullValidity, setEditFullValidity] = useState('30 Days');
  const [editFullCost, setEditFullCost] = useState<number>(0);
  const [editFullSelling, setEditFullSelling] = useState<number>(0);
  const [editFullStatus, setEditFullStatus] = useState<'active' | 'paused'>('active');

  // Airtime Discount percentages (discount % + customer pay % = 100%)
  const [airtimeDiscounts, setAirtimeDiscounts] = useState({
    mtn: 2.5,
    airtel: 3.0,
    glo: 4.0,
    '9mobile': 4.5,
  });

  // Fetch initial pricing, live Peyflex networks & discounts from server API
  const loadLivePricing = async () => {
    setIsLoading(true);
    try {
      const localStored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
      if (localStored && Object.keys(localStored).length > 0) {
        setPlans((prev) =>
          prev.map((p) => {
            const override = localStored[p.id];
            if (override) {
              return {
                ...p,
                name: override.name || p.name,
                size: override.size || p.size,
                category: (override.category as any) || p.category,
                sellingPrice: Number(override.sellingPrice ?? override.price ?? p.sellingPrice),
                costPrice: Number(override.costPrice ?? p.costPrice),
                status: override.status || p.status,
              };
            }
            return p;
          })
        );
      }
    } catch {}

    try {
      apiGetDataNetworks()
        .then((netRes) => {
          const nets = (netRes as any).networks || netRes.data?.networks || (Array.isArray(netRes.data) ? netRes.data : null);
          if (Array.isArray(nets) && nets.length > 0) {
            setDataNetworks(
              nets.map((n: any) => {
                const id = (n.identifier || n.id) as PeyflexNetworkIdentifier;
                const fallback = peyflexDataNetworks.find((f) => f.identifier === id) || peyflexDataNetworks[0];
                return {
                  ...fallback,
                  ...n,
                  identifier: id,
                  name: n.name || fallback.name,
                  carrier: n.carrier || fallback.carrier,
                };
              })
            );
          }
        })
        .catch(() => {});

      const [res, vtuRes] = await Promise.all([
        apiGetPricingSettings().catch(() => null),
        apiGetVtuPlans(undefined, true).catch(() => null),
      ]);

      if (vtuRes && vtuRes.status === 'success' && Array.isArray(vtuRes.data) && vtuRes.data.length > 0) {
        setPlans((prev) => {
          const prevById = new Map<string, VtuPlanConfig>();
          for (const p of prev) {
            prevById.set(p.id, p);
          }

          const mergedList: VtuPlanConfig[] = [];
          const seenIds = new Set<string>();

          for (const sp of vtuRes.data!) {
            const uKey = sp.id || (sp as any).plan_id || (sp as any).api_plan_id;
            if (!uKey || seenIds.has(uKey)) continue;
            seenIds.add(uKey);

            const existing = prevById.get(uKey);
            const netKey = ((sp as any).network_key ||
              (sp as any).network_identifier ||
              existing?.networkKey ||
              (uKey.startsWith('mtn_data_share')
                ? 'mtn_data_share'
                : uKey.startsWith('mtn_gifting_data')
                ? 'mtn_gifting_data'
                : uKey.startsWith('glo_data')
                ? 'glo_data'
                : uKey.startsWith('9mobile_data')
                ? '9mobile_data'
                : 'airtel_data')) as PeyflexNetworkIdentifier;

            const carrier: NetworkId = netKey.startsWith('mtn')
              ? 'mtn'
              : netKey.startsWith('glo')
              ? 'glo'
              : netKey.startsWith('9mobile')
              ? '9mobile'
              : 'airtel';

            const sellVal = Number(
              sp.price ??
                (sp as any).custom_retail_price ??
                (sp as any).selling_price ??
                existing?.sellingPrice ??
                0
            );
            const costVal = Number(
              sp.wholesaleCost ??
                (sp as any).cost_price ??
                (sp as any).original_wholesale_price ??
                (sp as any).reseller_price ??
                existing?.costPrice ??
                0
            );
            const rawStatus = sp.status || existing?.status || 'active';
            const catVal = (sp.type ||
              (sp as any).category ||
              existing?.category ||
              (netKey === 'mtn_data_share'
                ? 'Data Share'
                : netKey === 'glo_data' || netKey === '9mobile_data'
                ? 'Corporate Gifting'
                : 'Gifting Data')) as any;

            const finalCost = !isNaN(costVal) && costVal > 0 ? costVal : existing?.costPrice || 100;
            const finalSell = !isNaN(sellVal) && sellVal > 0 ? sellVal : existing?.sellingPrice || Math.round(finalCost * 1.06);

            mergedList.push({
              id: uKey,
              network: carrier,
              networkKey: netKey,
              name: (sp as any).plan_name || sp.name || existing?.name || `${sp.size || '1GB'} (${sp.validity || '30 Days'})`,
              category: catVal,
              size: sp.size || existing?.size || '1GB',
              validity: sp.validity || (existing as any)?.validity || '30 Days',
              costPrice: finalCost,
              sellingPrice: finalSell,
              resellerPrice: Math.round(finalCost * 1.03),
              apiPrice: finalCost,
              status: rawStatus === 'inactive' || rawStatus === 'paused' ? 'paused' : 'active',
              provider: 'Payflex (Peyflex)',
            } as VtuPlanConfig);
          }

          return mergedList.length > 0 ? mergedList : prev;
        });
      }

      if (res && res.status === 'success' && res.data) {
        if (res.data.airtimeDiscounts) {
          setAirtimeDiscounts(res.data.airtimeDiscounts);
        }
        if (res.data.customPricing) {
          const custom = res.data.customPricing as Record<string, any>;
          try {
            localStorage.setItem('jagora_custom_pricing', JSON.stringify(custom));
          } catch {}
          setPlans((prev) =>
            prev.map((p) => {
              const override = custom[p.id];
              if (override) {
                const sellVal = Number(override.sellingPrice ?? override.price ?? p.sellingPrice);
                const costVal = Number(override.costPrice ?? override.wholesaleCost ?? p.costPrice);
                return {
                  ...p,
                  name: override.name || p.name,
                  size: override.size || p.size,
                  category: (override.category as any) || p.category,
                  validity: override.validity || (p as any).validity || '30 Days',
                  sellingPrice: !isNaN(sellVal) && sellVal > 0 ? sellVal : p.sellingPrice,
                  costPrice: !isNaN(costVal) && costVal > 0 ? costVal : p.costPrice,
                  status: override.status === 'inactive' ? 'paused' : override.status || p.status,
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
    const matchesNetwork =
      selectedNetwork === 'all'
        ? true
        : p.id.startsWith(selectedNetwork) || p.networkKey === selectedNetwork;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.status === 'active'
        : p.status === 'paused' || p.status === 'out_of_stock';

    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.size && p.size.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesNetwork && matchesStatus && matchesSearch;
  });

  const handleOpenAddModal = () => {
    const validNetIds = dataNetworks.map((n) => n.identifier);
    const defaultNet: PeyflexNetworkIdentifier = validNetIds.includes(selectedNetwork as PeyflexNetworkIdentifier)
      ? (selectedNetwork as PeyflexNetworkIdentifier)
      : 'mtn_gifting_data';
    setAddNet(defaultNet);
    setAddCategory(
      defaultNet === 'mtn_data_share'
        ? 'Data Share'
        : defaultNet === 'glo_data' || defaultNet === '9mobile_data'
        ? 'Corporate Gifting'
        : 'Gifting Data'
    );
    setAddSize('1GB');
    setAddValidity('30 Days');
    setAddCostPrice(260);
    setAddSellingPrice(295);
    setAddName('');
    setAddStatus('active');
    setIsAddModalOpen(true);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addSellingPrice <= 0) {
      showToast('Please enter a valid retail price greater than ₦0.');
      return;
    }
    const netObj = dataNetworks.find((n) => n.identifier === addNet) || dataNetworks[0];
    const carrierId: NetworkId =
      netObj?.carrier ||
      (addNet.startsWith('mtn')
        ? 'mtn'
        : addNet.startsWith('glo')
        ? 'glo'
        : addNet.startsWith('9mobile')
        ? '9mobile'
        : 'airtel');
    const finalName = addName.trim() || `${addSize} - ${addValidity} (${netObj?.name || addNet})`;
    setIsSaving(true);
    try {
      const res = await apiCreateVtuPlan({
        network: addNet as any,
        name: finalName,
        category: addCategory,
        size: addSize,
        validity: addValidity,
        costPrice: addCostPrice,
        sellingPrice: addSellingPrice,
        status: addStatus,
      });

      if (res.status === 'success') {
        const newPlanId = res.data?.id || `${addNet}_custom_${Date.now()}`;
        const createdConfig: VtuPlanConfig = {
          id: newPlanId,
          network: carrierId,
          networkKey: addNet,
          name: finalName,
          category: addCategory,
          size: addSize,
          costPrice: addCostPrice,
          sellingPrice: addSellingPrice,
          resellerPrice: Math.round(addCostPrice * 1.05),
          apiPrice: addCostPrice,
          status: addStatus,
          provider: 'Payflex (Peyflex)',
        };
        setPlans((prev) => [createdConfig, ...prev]);
        window.dispatchEvent(new CustomEvent('pricing_updated', { detail: { planId: newPlanId, sellingPrice: addSellingPrice, status: addStatus } }));
        window.dispatchEvent(new CustomEvent('jagora_pricing_updated', { detail: { planId: newPlanId, sellingPrice: addSellingPrice, status: addStatus } }));
        setIsAddModalOpen(false);
        showToast(`✅ Plan "${finalName}" added under ${netObj?.name || addNet} and is now ${addStatus.toUpperCase()}!`);
      } else {
        showToast(res.message || 'Failed to create plan.');
      }
    } catch {
      showToast('Network error while creating plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFullEdit = (plan: VtuPlanConfig) => {
    setPlanToEdit(plan);
    setEditFullName(plan.name);
    setEditFullCategory(plan.category);
    setEditFullSize(plan.size || '1GB');
    setEditFullValidity((plan as any).validity || '30 Days');
    setEditFullCost(plan.costPrice);
    setEditFullSelling(plan.sellingPrice);
    setEditFullStatus(plan.status === 'active' ? 'active' : 'paused');
    setIsFullEditModalOpen(true);
  };

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToEdit || editFullSelling <= 0) return;
    setIsSaving(true);
    try {
      const res = await apiUpdateVtuPlan({
        id: planToEdit.id,
        name: editFullName,
        category: editFullCategory,
        size: editFullSize,
        validity: editFullValidity,
        costPrice: editFullCost,
        sellingPrice: editFullSelling,
        status: editFullStatus,
      });

      if (res.status === 'success') {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === planToEdit.id
              ? {
                  ...p,
                  name: editFullName || p.name,
                  category: editFullCategory as any,
                  size: editFullSize,
                  validity: editFullValidity,
                  costPrice: editFullCost,
                  sellingPrice: editFullSelling,
                  status: editFullStatus,
                }
              : p
          )
        );
        try {
          const stored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
          stored[planToEdit.id] = {
            sellingPrice: editFullSelling,
            costPrice: editFullCost,
            status: editFullStatus,
            name: editFullName,
            category: editFullCategory,
            size: editFullSize,
            validity: editFullValidity,
          };
          localStorage.setItem('jagora_custom_pricing', JSON.stringify(stored));
          const evDetail = {
            planId: planToEdit.id,
            price: editFullSelling,
            sellingPrice: editFullSelling,
            costPrice: editFullCost,
            status: editFullStatus,
            name: editFullName,
          };
          window.dispatchEvent(new CustomEvent('pricing_updated', { detail: evDetail }));
          window.dispatchEvent(new CustomEvent('jagora_pricing_updated', { detail: evDetail }));
        } catch {}
        setIsFullEditModalOpen(false);
        showToast(`✅ Plan "${editFullName}" saved and synchronized.`);
      } else {
        showToast(res.message || 'Failed to update plan.');
      }
    } catch {
      showToast('Error syncing plan changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (plan: VtuPlanConfig) => {
    if (!window.confirm(`Are you sure you want to deactivate "${plan.name}"? Customers will no longer be able to purchase it.`)) {
      return;
    }
    try {
      const res = await apiDeleteVtuPlan(plan.id);
      if (res.status === 'success') {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
        showToast(`🗑️ Plan "${plan.name}" deactivated.`);
      } else {
        showToast(res.message || 'Could not delete plan.');
      }
    } catch {
      showToast('Error deactivating plan.');
    }
  };

  const handleToggleStatus = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const nextStatus = plan.status === 'active' ? 'paused' : 'active';

    try {
      const res = await apiToggleVtuPlanStatus(planId, nextStatus);
      if (res.status === 'success') {
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id === planId) {
              return { ...p, status: nextStatus };
            }
            return p;
          })
        );
        try {
          const stored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
          if (!stored[planId]) stored[planId] = {};
          stored[planId].status = nextStatus;
          localStorage.setItem('jagora_custom_pricing', JSON.stringify(stored));
          const evDetail = { planId, status: nextStatus };
          window.dispatchEvent(new CustomEvent('pricing_updated', { detail: evDetail }));
          window.dispatchEvent(new CustomEvent('jagora_pricing_updated', { detail: evDetail }));
        } catch {}
        showToast(`👁️ "${plan.name}" is now ${nextStatus === 'active' ? 'VISIBLE' : 'HIDDEN'} across mobile apps.`);
      } else {
        showToast(res.message || 'Could not update plan status.');
      }
    } catch {
      showToast('Error syncing plan status.');
    }
  };

  const handleStartEdit = (plan: VtuPlanConfig) => {
    setEditingPlanId(plan.id);
    setEditPrice(plan.sellingPrice);
    setEditCostPrice(plan.costPrice);
    const grossMargin = plan.sellingPrice > 0 ? ((plan.sellingPrice - plan.costPrice) / plan.sellingPrice) * 100 : 0;
    setTargetMarginPct(Math.round(Math.max(0, Math.min(100, grossMargin))));
  };

  const handleTargetMarginChange = (costPrice: number, marginPct: number) => {
    const safeMargin = Math.max(0, Math.min(99.9, marginPct));
    setTargetMarginPct(safeMargin);
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
                // STRICT GUARANTEE: size and validity are unchanged
                size: p.size,
                name: p.name,
                category: p.category,
                sellingPrice: editPrice,
                costPrice: editCostPrice > 0 ? editCostPrice : p.costPrice,
              };
            }
            return p;
          })
        );
        try {
          const stored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
          stored[planId] = {
            sellingPrice: editPrice,
            costPrice: editCostPrice > 0 ? editCostPrice : plan?.costPrice,
            status: plan?.status || 'active',
            // Preserve exact data size
            size: plan?.size,
            validity: (plan as any)?.validity,
            name: plan?.name,
          };
          localStorage.setItem('jagora_custom_pricing', JSON.stringify(stored));
          const evDetail = {
            planId,
            price: editPrice,
            sellingPrice: editPrice,
            costPrice: editCostPrice,
            status: plan?.status || 'active',
            size: plan?.size,
          };
          window.dispatchEvent(new CustomEvent('pricing_updated', { detail: evDetail }));
          window.dispatchEvent(new CustomEvent('jagora_pricing_updated', { detail: evDetail }));
        } catch {}
        setEditingPlanId(null);
        showToast(`✅ Price updated: ₦${editPrice.toLocaleString()} is live across all customer mobile apps.`);
      } else {
        showToast(res.message || 'Failed to sync price change.');
      }
    } catch {
      showToast('Network error while saving price update.');
    } finally {
      setIsSaving(false);
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
      {/* Top Breadcrumb & Live Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors shadow-2xs self-start cursor-pointer active:scale-95"
          >
            <span>&larr; Back to Platform Settings</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold self-start sm:self-auto shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Customer Sync: Every price change propagates instantly</span>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 font-heading">
            <Tag size={20} className="text-[#1668e8]" />
            <span>VTU Plan Pricing & Margins</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Configure retail selling prices, wholesale API cost rates & margin spreads. Changes update live across all devices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add New Plan CTA */}
          <button
            onClick={handleOpenAddModal}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Plan</span>
          </button>

          {/* Search plans */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plan or size..."
            className="px-3 py-1.5 min-h-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs w-44"
          />

          {/* Refresh live prices */}
          <button
            onClick={loadLivePricing}
            disabled={isLoading}
            className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Reload from server"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Visibility / Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter By Status:</span>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`min-h-[38px] px-3 py-1 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Plans ({plans.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`min-h-[38px] px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            <Eye size={12} />
            <span>Active ({plans.filter((p) => p.status === 'active').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('hidden')}
            className={`min-h-[38px] px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'hidden'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            <EyeOff size={12} />
            <span>Hidden ({plans.filter((p) => p.status === 'paused' || p.status === 'out_of_stock').length})</span>
          </button>
        </div>
      </div>

      {/* Network & Service Category Filter Tabs (Strictly driven by curl 'https://client.peyflex.com.ng/api/data/networks/') */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold overflow-x-auto max-w-full">
        {[
          { id: 'all' as PricingNetworkFilter, label: 'ALL PACKAGES' },
          ...dataNetworks.map((net) => ({
            id: net.identifier as PricingNetworkFilter,
            label: net.name,
          })),
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedNetwork(item.id)}
            className={`px-3.5 py-2 rounded-xl uppercase transition-all whitespace-nowrap text-xs font-bold cursor-pointer ${
              selectedNetwork === item.id
                ? 'bg-[#1668e8] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
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

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[700px]">
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
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            ₦{plan.costPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-sans">
                            API Reseller Rate
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = Math.max(1, editPrice - 10);
                                setEditPrice(nextP);
                                if (nextP > 0) {
                                  const gm = ((nextP - plan.costPrice) / nextP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs cursor-pointer select-none"
                              title="Decrement price by ₦10"
                            >
                              -
                            </button>
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
                              className="w-20 px-1.5 py-1 text-center rounded bg-slate-100 dark:bg-slate-800 border border-[#0047cc] text-xs font-mono font-bold text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = editPrice + 10;
                                setEditPrice(nextP);
                                if (nextP > 0) {
                                  const gm = ((nextP - plan.costPrice) / nextP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs cursor-pointer select-none"
                              title="Increment price by ₦10"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Increment/Decrement Chips without modifying plan data size */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = Math.max(1, editPrice - 50);
                                setEditPrice(nextP);
                                if (nextP > 0) {
                                  const gm = ((nextP - plan.costPrice) / nextP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              title="Decrement price by ₦50"
                            >
                              -₦50
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = Math.max(1, editPrice - 10);
                                setEditPrice(nextP);
                                if (nextP > 0) {
                                  const gm = ((nextP - plan.costPrice) / nextP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                              title="Decrement price by ₦10"
                            >
                              -₦10
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = editPrice + 10;
                                setEditPrice(nextP);
                                if (nextP > 0) {
                                  const gm = ((nextP - plan.costPrice) / nextP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                              title="Increment price by ₦10"
                            >
                              +₦10
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = editPrice + 50;
                                setEditPrice(nextP);
                                if (nextP > 0) {
                                  const gm = ((nextP - plan.costPrice) / nextP) * 100;
                                  setTargetMarginPct(Math.round(Math.max(0, Math.min(100, gm))));
                                }
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                              title="Increment price by ₦50"
                            >
                              +₦50
                            </button>
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
                        className={`min-h-[44px] px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          plan.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                        title={plan.status === 'active' ? 'Click to HIDE plan from customers' : 'Click to SHOW plan to customers'}
                      >
                        {plan.status === 'active' ? <Eye size={12} className="text-emerald-500" /> : <EyeOff size={12} className="text-amber-500" />}
                        <span>{plan.status === 'active' ? 'ACTIVE' : 'HIDDEN'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(plan.id)}
                            disabled={isSaving}
                            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
                            title="Save & sync with client app"
                          >
                            <Check size={16} />
                            <span className="hidden sm:inline">Save</span>
                          </button>
                          <button
                            onClick={() => setEditingPlanId(null)}
                            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
                            title="Cancel editing"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenFullEdit(plan)}
                            className="min-h-[44px] px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0047cc] dark:text-blue-400 text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="Full Plan Settings"
                          >
                            <Edit3 size={13} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan)}
                            className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="Deactivate / Delete Plan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD NEW VTU PLAN
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Add New VTU Plan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish a custom package live across mobile apps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs font-sans">
              {/* Strict Peyflex Data Network Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Peyflex Data Network (Live API Identifier)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dataNetworks.map((net) => (
                    <button
                      key={net.identifier}
                      type="button"
                      onClick={() => {
                        setAddNet(net.identifier);
                        if (net.identifier === 'mtn_data_share') setAddCategory('Data Share');
                        else if (net.identifier === 'glo_data' || net.identifier === '9mobile_data') setAddCategory('Corporate Gifting');
                        else setAddCategory('Gifting Data');
                      }}
                      className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-start justify-center gap-0.5 cursor-pointer border ${
                        addNet === net.identifier
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate w-full text-left">{net.name}</span>
                      <span className="font-mono text-[9px] opacity-70 truncate w-full text-left">{net.identifier}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Plan Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Category / Protocol
                  </label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="SME Data">SME Data</option>
                    <option value="Corporate Gifting">Corporate Gifting</option>
                    <option value="Gifting Data">Direct Gifting</option>
                    <option value="Data Share">Data Share</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Data Size / Allocation
                  </label>
                  <input
                    type="text"
                    required
                    value={addSize}
                    onChange={(e) => setAddSize(e.target.value)}
                    placeholder="e.g. 1GB, 2.5GB, 5GB"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Plan Name & Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder={`e.g. ${addNet.toUpperCase()} ${addCategory} ${addSize}`}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Validity Period
                  </label>
                  <input
                    type="text"
                    required
                    value={addValidity}
                    onChange={(e) => setAddValidity(e.target.value)}
                    placeholder="e.g. 30 Days, 7 Days"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pricing & Margins */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Wholesale Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={addCostPrice}
                    onChange={(e) => setAddCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Deducted from float</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Retail Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={addSellingPrice}
                    onChange={(e) => setAddSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500 dark:border-emerald-500 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Charged to customer</span>
                </div>

                {/* Profit preview */}
                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Projected Margin:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +₦{(addSellingPrice - addCostPrice).toFixed(0)} profit
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {addSellingPrice > 0 ? (((addSellingPrice - addCostPrice) / addSellingPrice) * 100).toFixed(1) : 0}% margin
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Radio */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Initial Plan Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="add_status"
                      checked={addStatus === 'active'}
                      onChange={() => setAddStatus('active')}
                      className="accent-emerald-600"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Active (Visible immediately)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="add_status"
                      checked={addStatus === 'paused'}
                      onChange={() => setAddStatus('paused')}
                      className="accent-amber-600"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Hidden / Draft</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>{isSaving ? 'Creating...' : 'Create & Publish Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT VTU PLAN DETAILS
          ========================================================================= */}
      {isFullEditModalOpen && planToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0047cc] dark:text-blue-400 flex items-center justify-center font-bold">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Edit Plan Settings
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {planToEdit.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFullEditModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Category / Type
                  </label>
                  <input
                    type="text"
                    value={editFullCategory}
                    onChange={(e) => setEditFullCategory(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Size / Validity
                  </label>
                  <input
                    type="text"
                    value={editFullSize}
                    onChange={(e) => setEditFullSize(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Wholesale Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editFullCost}
                    onChange={(e) => setEditFullCost(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Retail Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={editFullSelling}
                    onChange={(e) => setEditFullSelling(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Margin Breakdown:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +₦{(editFullSelling - editFullCost).toFixed(0)} profit
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {editFullSelling > 0 ? (((editFullSelling - editFullCost) / editFullSelling) * 100).toFixed(1) : 0}% margin
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Radio */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Visibility Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_status"
                      checked={editFullStatus === 'active'}
                      onChange={() => setEditFullStatus('active')}
                      className="accent-emerald-600"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Active (Visible to users)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_status"
                      checked={editFullStatus === 'paused'}
                      onChange={() => setEditFullStatus('paused')}
                      className="accent-amber-600"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Hidden / Paused</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFullEditModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Plan Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
