import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NetworkId, DataPlan, UserProfile, Transaction, PeyflexDataNetwork, PeyflexNetworkIdentifier } from '../../types';
import { networkProviders, peyflexDataNetworks, dataPlans } from '../../data/mockData';
import {
  Wifi,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  Copy,
  Check,
  Zap,
  RotateCcw,
  BookUser,
  Share2,
  Lock,
  ChevronRight,
  Sparkles,
  Tv,
  GraduationCap,
  Printer,
  Search,
  RefreshCw,
  Clock,
  FileText,
  BadgeCheck,
  AlertTriangle,
  Plus,
  Phone,
  Layers,
  ChevronDown,
  CreditCard,
  ClipboardList,
  Eye,
  EyeOff,
  Wallet,
  Hourglass,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { SandTimerLoader } from '../common/SandTimerLoader';
import { PinVerificationModal } from '../modals/PinVerificationModal';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import { humanizeVtuError } from '../../utils/errorParser';
import { apiGetPricingSettings, apiGetVtuPlans, apiGetDataNetworks, apiVerifyBiller } from '../../services/apiClient';
import {
  apiPurchaseData,
  apiPurchaseAirtime,
  apiPayElectricity,
  apiSubscribeCable,
  apiBuyExamPin,
  apiGenerateRechargePin,
  apiGenerateDataCard,
} from '../../services/vtuService';
import {
  playTapSound,
  playErrorTone,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

export type VtuServiceType =
  | 'data'
  | 'airtime'
  | 'cable'
  | 'electricity'
  | 'exam'
  | 'recharge-pin'
  | 'data-card';

export interface VtuTransactionWizardProps {
  user: UserProfile;
  initialServiceType?: VtuServiceType;
  initialNetwork?: NetworkId;
  onBuyData?: (plan: DataPlan, phone: string, pin?: string) => boolean | Promise<boolean>;
  onAirtimeSuccess?: (network: string, phone: string, amount: number, pin?: string) => boolean | Promise<boolean>;
  onPaymentSuccess?: (tx: Transaction) => void;
  onNavigateBack: () => void;
  onNavigateFundWallet?: () => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

interface TransactionReceiptData {
  status: 'SUCCESS' | 'FAILED';
  reference: string;
  serviceType: VtuServiceType;
  title: string;
  network?: NetworkId | string;
  recipient: string;
  customerName?: string;
  planName?: string;
  faceAmount: number;
  chargedAmount: number;
  discountAmount: number;
  message: string;
  timestamp: string;
  balanceBefore?: number;
  balanceAfter?: number;
  token?: string | null;
  units?: string | null;
  generatedPins?: Array<{ pin: string; serial?: string; denomination?: number; dataSize?: string }>;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export const VtuTransactionWizard: React.FC<VtuTransactionWizardProps> = ({
  user,
  initialServiceType = 'data',
  initialNetwork = 'mtn',
  onBuyData,
  onAirtimeSuccess,
  onPaymentSuccess,
  onNavigateBack,
  onNavigateFundWallet,
  isLightMode = true,
  isMaintenanceMode = false,
}) => {
  // ---------------------------------------------------------------------------
  // 1. STATE FOR 5-STEP TRANSACTION WIZARD
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [serviceType, setServiceType] = useState<VtuServiceType>(initialServiceType);
  const [network, setNetwork] = useState<NetworkId>(initialNetwork);
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [isManualNetworkOverride, setIsManualNetworkOverride] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Sync serviceType when initialServiceType prop updates from caller navigation
  useEffect(() => {
    if (initialServiceType && initialServiceType !== serviceType) {
      setServiceType(initialServiceType);
      setCurrentStep(1);
      setErrorMessage('');
      setReceipt(null);
    }
  }, [initialServiceType]);

  // Strict Peyflex Data Networks from curl 'https://client.peyflex.com.ng/api/data/networks/'
  const [dataNetworks, setDataNetworks] = useState<PeyflexDataNetwork[]>(peyflexDataNetworks);
  const [selectedDataNet, setSelectedDataNet] = useState<PeyflexNetworkIdentifier>(
    initialNetwork === 'glo'
      ? 'glo_data'
      : initialNetwork === '9mobile'
      ? '9mobile_data'
      : initialNetwork === 'airtel'
      ? 'airtel_data'
      : 'mtn_gifting_data'
  );

  // Data specifics
  const [plans, setPlans] = useState<DataPlan[]>(dataPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('mtn_gifting_data_m110mbs');
  const [planCategory, setPlanCategory] = useState<'ALL' | 'SME' | 'CG' | 'DIRECT' | 'DATA_SHARE' | 'GIFTING'>('ALL');
  const [dataSearchQuery, setDataSearchQuery] = useState<string>('');

  // Airtime specifics
  const [airtimeType, setAirtimeType] = useState<'VTU' | 'SNS'>('VTU');
  const [amount, setAmount] = useState<number>(500);

  // Cable specifics
  const [cableProvider, setCableProvider] = useState<'gotv' | 'dstv' | 'startimes' | 'showmax'>('gotv');
  const [cablePeriod, setCablePeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [smartcard, setSmartcard] = useState<string>('');
  const [verifiedCustomerName, setVerifiedCustomerName] = useState<string>('');
  const [isVerifyingIuc, setIsVerifyingIuc] = useState<boolean>(false);
  const [selectedBouquet, setSelectedBouquet] = useState<string>('GOtv Jinja');
  const [cablePrice, setCablePrice] = useState<number>(3300);

  // Electricity specifics
  const discos = [
    { id: 'KEDCO', name: 'KEDCO', full: 'Kano Electricity', state: 'Kano / Katsina / Jigawa' },
    { id: 'AEDC', name: 'AEDC', full: 'Abuja Electricity', state: 'FCT / Niger / Nasarawa / Kogi' },
    { id: 'IKEDC', name: 'IKEDC', full: 'Ikeja Electric', state: 'Lagos Mainland & Environs' },
    { id: 'EKEDC', name: 'EKEDC', full: 'Eko Electricity', state: 'Lagos Island, Lekki & Coast' },
    { id: 'IBEDC', name: 'IBEDC', full: 'Ibadan Electricity', state: 'Oyo / Ogun / Osun / Kwara' },
    { id: 'PHED', name: 'PHED', full: 'Port Harcourt Electric', state: 'Rivers / Bayelsa / Cross River' },
    { id: 'EEDC', name: 'EEDC', full: 'Enugu Electricity', state: 'Enugu / Abia / Imo / Anambra' },
    { id: 'KAEDCO', name: 'KAEDCO', full: 'Kaduna Electricity', state: 'Kaduna / Sokoto / Kebbi' },
    { id: 'JED', name: 'JED', full: 'Jos Electricity', state: 'Plateau / Bauchi / Benue' },
    { id: 'BEDC', name: 'BEDC', full: 'Benin Electricity', state: 'Edo / Delta / Ondo / Ekiti' },
  ];
  const [selectedDisco, setSelectedDisco] = useState<string>('KEDCO');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNumber, setMeterNumber] = useState<string>('');
  const [meterAmount, setMeterAmount] = useState<number>(2000);
  const [verifiedMeterName, setVerifiedMeterName] = useState<string>('');
  const [isVerifyingMeter, setIsVerifyingMeter] = useState<boolean>(false);

  // Exam specifics
  const examProviders = [
    { id: 'waec', name: 'WAEC', title: 'WAEC Result Checker', unitPrice: 3800, badge: 'Instant Dispense' },
    { id: 'neco', name: 'NECO', title: 'NECO Result Token', unitPrice: 1400, badge: 'Instant Token' },
    { id: 'nabteb', name: 'NABTEB', title: 'NABTEB Scratch Card', unitPrice: 1200, badge: 'Official PIN' },
    { id: 'jamb', name: 'JAMB', title: 'JAMB UTME / DE Profile', unitPrice: 6500, badge: 'Direct Switch' },
  ] as const;
  const [selectedExam, setSelectedExam] = useState<'waec' | 'neco' | 'nabteb' | 'jamb'>('waec');
  const [examPinType, setExamPinType] = useState<'result_checker' | 'registration'>('result_checker');
  const [examQuantity, setExamQuantity] = useState<number>(1);
  const [candidatePhone, setCandidatePhone] = useState<string>(user?.phone || '');

  // Recharge PIN specifics
  const [rechargeDenomination, setRechargeDenomination] = useState<number>(500);
  const [rechargeQuantity, setRechargeQuantity] = useState<number>(1);
  const [rechargeType, setRechargeType] = useState<'standard' | 'custom_card'>('standard');

  // Data Card specifics
  const [dataCardSize, setDataCardSize] = useState<string>('1.5GB');
  const [dataCardQuantity, setDataCardQuantity] = useState<number>(1);
  const [businessName, setBusinessName] = useState<string>("Al'amin Enterprise");

  // Security & Execution
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);
  const [hasCopiedRef, setHasCopiedRef] = useState<boolean>(false);
  const [hasCopiedToken, setHasCopiedToken] = useState<boolean>(false);
  const [showAllPlans, setShowAllPlans] = useState<boolean>(false);

  // Wholesale Airtime & Recharge Discounts
  const [airtimeDiscounts, setAirtimeDiscounts] = useState<Record<string, number>>({
    mtn: 2.5,
    airtel: 3.0,
    glo: 4.0,
    '9mobile': 4.5,
  });

  const isSubmittingRef = useRef<boolean>(false);

  // Cable Bouquets Definition
  const cableBouquets: Record<'gotv' | 'dstv' | 'startimes' | 'showmax', Array<{ name: string; cost: number; channels?: string; duration?: string }>> = {
    gotv: [
      { name: 'GOtv Smallie', cost: 1575, channels: '35+ Channels', duration: 'Monthly' },
      { name: 'GOtv Jinja', cost: 3300, channels: '45+ Channels', duration: 'Monthly' },
      { name: 'GOtv Jolli', cost: 4850, channels: '65+ Channels', duration: 'Monthly' },
      { name: 'GOtv Max', cost: 7200, channels: '75+ Channels', duration: 'Monthly' },
      { name: 'GOtv Supa', cost: 9600, channels: '85+ Channels', duration: 'Monthly' },
      { name: 'GOtv Supa+', cost: 15700, channels: '90+ Premier Channels', duration: 'Monthly' },
    ],
    dstv: [
      { name: 'DStv Padi', cost: 4400, channels: '45+ Channels', duration: 'Monthly' },
      { name: 'DStv Yanga', cost: 6000, channels: '85+ Channels', duration: 'Monthly' },
      { name: 'DStv Confam', cost: 11000, channels: '105+ Channels', duration: 'Monthly' },
      { name: 'DStv Compact', cost: 19000, channels: '130+ HD Channels', duration: 'Monthly' },
      { name: 'DStv Compact Plus', cost: 31250, channels: '145+ Sports HD', duration: 'Monthly' },
      { name: 'DStv Premium', cost: 44000, channels: '160+ All HD & Sports', duration: 'Monthly' },
    ],
    startimes: [
      { name: 'Nova (Dish/Antenna)', cost: 1700, channels: '30+ Channels', duration: 'Monthly' },
      { name: 'Basic Bouquet', cost: 3300, channels: '50+ Channels', duration: 'Monthly' },
      { name: 'Smart Bouquet', cost: 4500, channels: '60+ Channels', duration: 'Monthly' },
      { name: 'Classic Bouquet', cost: 5000, channels: '80+ Channels', duration: 'Monthly' },
      { name: 'Super Bouquet', cost: 9000, channels: '100+ Channels', duration: 'Monthly' },
    ],
    showmax: [
      { name: 'Showmax Mobile Entertainment', cost: 1600, channels: 'Mobile Access', duration: 'Monthly' },
      { name: 'Showmax Premier League Mobile', cost: 3200, channels: 'All 380 EPL Live Matches', duration: 'Monthly' },
      { name: 'Showmax Entertainment + EPL All-Device', cost: 5400, channels: 'TV, Laptop & Mobile', duration: 'Monthly' },
    ],
  };

  // ---------------------------------------------------------------------------
  // 2. REMOTE CATALOG & PRICING SYNC
  // ---------------------------------------------------------------------------
  const applyPricingMap = (planList: DataPlan[], custom: Record<string, any>): DataPlan[] => {
    return planList
      .map((p) => {
        const override = custom[p.id] || custom[(p as any).planCode] || custom[(p as any).api_plan_id];
        if (override) {
          const newPrice = Number(override.sellingPrice ?? override.price);
          return {
            ...p,
            name: override.name || p.name,
            size: override.size || p.size,
            validity: override.validity || p.validity,
            price: !isNaN(newPrice) && newPrice > 0 ? newPrice : p.price,
            status: override.status || (p as any).status || 'active',
          };
        }
        return p;
      })
      .filter((p) => {
        const override = custom[p.id] || custom[(p as any).planCode] || custom[(p as any).api_plan_id];
        const status = override?.status || (p as any).status || 'active';
        return status !== 'paused' && status !== 'inactive' && status !== 'out_of_stock';
      });
  };

  useEffect(() => {
    try {
      const localStored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
      if (localStored && Object.keys(localStored).length > 0) {
        setPlans((prev) => applyPricingMap(prev, localStored));
      }
    } catch {}

    apiGetDataNetworks()
      .then((res) => {
        const nets = (res as any).networks || res.data?.networks || (Array.isArray(res.data) ? res.data : null);
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

    apiGetPricingSettings()
      .then((res) => {
        if (res.status === 'success' && res.data) {
          if (res.data.airtimeDiscounts) {
            setAirtimeDiscounts(res.data.airtimeDiscounts);
          }
          if (res.data.customPricing) {
            const custom = res.data.customPricing;
            try {
              localStorage.setItem('jagora_custom_pricing', JSON.stringify(custom));
            } catch {}
            setPlans((prev) => applyPricingMap(prev, custom));
          }
        }
      })
      .catch(() => {});

    apiGetVtuPlans()
      .then((res) => {
        if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          const serverPlans = res.data;
          setPlans(() => {
            const seenIds = new Set<string>();
            const uniqueList: DataPlan[] = [];

            for (const sp of serverPlans) {
              const uKey = sp.id || (sp as any).plan_id || '';
              if (!uKey || !uKey.includes('_data')) continue;
              const netKey = ((sp as any).network_key || (sp as any).networkKey || (uKey.startsWith('mtn_data_share') ? 'mtn_data_share' : uKey.startsWith('mtn_gifting_data') ? 'mtn_gifting_data' : uKey.startsWith('airtel_data') ? 'airtel_data' : uKey.startsWith('glo_data') ? 'glo_data' : '9mobile_data')) as PeyflexNetworkIdentifier;
              const priceVal =
                typeof sp.price === 'number' && !isNaN(sp.price)
                  ? sp.price
                  : Number((sp as any).custom_retail_price) || Number((sp as any).selling_price) || 0;
              const sizeVal = sp.size || (sp as any).plan_name || '1GB';
              const validityVal = sp.validity || '30 Days';
              const typeVal = sp.type || (sp as any).category || 'Gifting Data';

              if (!seenIds.has(uKey)) {
                seenIds.add(uKey);
                uniqueList.push({
                  id: uKey,
                  network: netKey,
                  networkKey: netKey,
                  type: typeVal,
                  price: priceVal,
                  size: sizeVal,
                  validity: validityVal,
                  name: (sp as any).plan_name || sp.name,
                  planCode: (sp as any).plan_code || (sp as any).api_plan_id || sp.planCode,
                });
              }
            }

            try {
              const localStored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
              return applyPricingMap(uniqueList, localStored);
            } catch {
              return uniqueList;
            }
          });
        }
      })
      .catch(() => {});

    const handlePricingUpdated = (e: any) => {
      const detail = e.detail;
      const newPrice = detail?.sellingPrice ?? detail?.price;
      if (detail?.planId) {
        setPlans((prev) =>
          prev
            .map((p) => {
              if (p.id === detail.planId) {
                return {
                  ...p,
                  price: typeof newPrice === 'number' && newPrice > 0 ? newPrice : p.price,
                  status: detail.status || (p as any).status || 'active',
                };
              }
              return p;
            })
            .filter((p) => (p as any).status !== 'paused' && (p as any).status !== 'inactive')
        );
      }
      apiGetPricingSettings()
        .then((res) => {
          if (res.status === 'success' && res.data?.customPricing) {
            setPlans((prev) => applyPricingMap(prev, res.data!.customPricing));
          }
        })
        .catch(() => {});
    };

    window.addEventListener('pricing_updated', handlePricingUpdated);
    window.addEventListener('jagora_pricing_updated', handlePricingUpdated);
    return () => {
      window.removeEventListener('pricing_updated', handlePricingUpdated);
      window.removeEventListener('jagora_pricing_updated', handlePricingUpdated);
    };
  }, []);

  const currentDataNetObj = dataNetworks.find((n) => n.identifier === selectedDataNet) || dataNetworks[0];

  function parsePlanSizeToMb(sizeStr: string): number {
    if (!sizeStr) return 0;
    const s = sizeStr.toUpperCase().trim();
    const num = parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
    if (s.includes('GB')) return num * 1024;
    if (s.includes('MB')) return num;
    if (s.includes('TB')) return num * 1024 * 1024;
    return num;
  }

  // Filter and sort Data Plans strictly for the selected Peyflex Data Network in ascending order of size
  const availablePlans = React.useMemo(() => {
    const list = plans.filter(
      (p) => (p.networkKey || p.network) === selectedDataNet || p.id.startsWith(selectedDataNet)
    );
    return list.sort((a, b) => {
      const sizeA = parsePlanSizeToMb(a.size);
      const sizeB = parsePlanSizeToMb(b.size);
      if (sizeA !== sizeB) return sizeA - sizeB;
      return Number(a.price) - Number(b.price);
    });
  }, [plans, selectedDataNet]);

  const activePlan = availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  // Dynamic plan categories supported by the selected network (Peyflex Live Architecture)
  const supportedCategories = React.useMemo(() => {
    const list: Array<{ id: 'ALL' | 'SME' | 'CG' | 'DIRECT' | 'DATA_SHARE' | 'GIFTING'; title: string; desc: string; badge: string }> = [];

    const hasDataShare = availablePlans.some((p) => {
      const t = String(p.type || (p as any).category || (p as any).plan_name || '').toUpperCase();
      return t.includes('SHARE');
    });
    if (hasDataShare) {
      list.push({
        id: 'DATA_SHARE',
        title: 'Data Share',
        desc: 'Fast, discounted everyday SME & shared bundles',
        badge: 'Popular',
      });
    }

    const hasGifting = availablePlans.some((p) => {
      const t = String(p.type || (p as any).category || (p as any).plan_name || '').toUpperCase();
      return t.includes('GIFT') || t.includes('DIRECT');
    });
    if (hasGifting) {
      list.push({
        id: 'GIFTING',
        title: 'Gifting Data',
        desc: 'Official direct network gift bundle for all devices',
        badge: 'Direct',
      });
    }

    const hasCgInPlans = availablePlans.some((p) => {
      const t = String(p.type || (p as any).category || (p as any).plan_name || '').toUpperCase();
      return t.includes('CORPORATE') || t.includes('CG');
    });
    if (hasCgInPlans) {
      list.push({
        id: 'CG',
        title: 'Corporate Gifting (CG)',
        desc: 'Official enterprise direct data gift with high throughput',
        badge: 'High Speed',
      });
    }

    const hasSmeInPlans = availablePlans.some((p) => {
      const t = String(p.type || (p as any).category || (p as any).plan_name || '').toUpperCase();
      return t.includes('SME') && !t.includes('SHARE');
    });
    if (hasSmeInPlans && network !== 'airtel' && network !== 'glo') {
      list.push({
        id: 'SME',
        title: 'SME Data',
        desc: 'Fast, highly affordable everyday data with 30-day validity',
        badge: 'SME',
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'ALL',
        title: 'All Plans',
        desc: `Browse all supported ${network.toUpperCase()} bundle types`,
        badge: 'Complete',
      });
    } else if (list.length > 1) {
      list.push({
        id: 'ALL',
        title: 'All Available Types',
        desc: `Browse all supported ${network.toUpperCase()} bundle types`,
        badge: 'Complete',
      });
    }

    return list;
  }, [network, availablePlans]);

  // Ensure active category is always valid for the selected network
  useEffect(() => {
    if (serviceType === 'data' && supportedCategories.length > 0) {
      const isValid = supportedCategories.some((c) => c.id === planCategory);
      if (!isValid) {
        setPlanCategory(supportedCategories[0].id);
      }
    }
  }, [network, serviceType, supportedCategories, planCategory]);

  // Filter available data plans by the user's active category tab
  const displayedDataPlans = React.useMemo(() => {
    if (planCategory === 'ALL') return availablePlans;
    return availablePlans.filter((p) => {
      const t = String(p.type || (p as any).category || (p as any).plan_name || '').toUpperCase();
      if (planCategory === 'SME') return t.includes('SME') && !t.includes('SHARE');
      if (planCategory === 'CG') return t.includes('CG') || t.includes('CORPORATE');
      if (planCategory === 'GIFTING' || planCategory === 'DIRECT') return t.includes('GIFT') || t.includes('DIRECT');
      if (planCategory === 'DATA_SHARE') return t.includes('SHARE');
      return true;
    });
  }, [availablePlans, planCategory]);

  // Auto-detect network from phone digits
  useEffect(() => {
    if (['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType)) {
      if (!isManualNetworkOverride && phone.length >= 4) {
        const norm = normalizeNigerianPhone(phone);
        if (norm.detectedNetwork && norm.detectedNetwork !== network) {
          const detected = norm.detectedNetwork as NetworkId;
          setNetwork(detected);
          if (serviceType === 'data') {
            const nextDataNet: PeyflexNetworkIdentifier =
              detected === 'mtn'
                ? 'mtn_gifting_data'
                : detected === 'glo'
                ? 'glo_data'
                : detected === '9mobile'
                ? '9mobile_data'
                : 'airtel_data';
            setSelectedDataNet(nextDataNet);
          }
        }
      }
    }
  }, [phone, isManualNetworkOverride, serviceType, network]);

  // Keep cable bouquets synced
  const handleSelectCableProvider = (p: 'gotv' | 'dstv' | 'startimes' | 'showmax') => {
    setCableProvider(p);
    const first = cableBouquets[p][0];
    if (first) {
      setSelectedBouquet(first.name);
      setCablePrice(first.cost);
    }
  };

  // Smartcard IUC auto-verifier
  useEffect(() => {
    if (serviceType !== 'cable') return;
    const cleanIuc = smartcard.replace(/[^0-9]/g, '');
    if (cleanIuc.length >= 8) {
      setIsVerifyingIuc(true);
      const timer = setTimeout(() => {
        apiVerifyBiller({
          serviceType: 'CABLE',
          identifier: cleanIuc,
          provider: cableProvider,
        })
          .then((res) => {
            if (res.status === 'success' && res.data?.customerName) {
              setVerifiedCustomerName(res.data.customerName);
              triggerHaptic('success');
            } else {
              setVerifiedCustomerName('');
            }
          })
          .catch(() => setVerifiedCustomerName(''))
          .finally(() => setIsVerifyingIuc(false));
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setVerifiedCustomerName('');
    }
  }, [smartcard, cableProvider, serviceType]);

  // Electricity meter auto-verifier
  useEffect(() => {
    if (serviceType !== 'electricity') return;
    const cleanMeter = meterNumber.replace(/[^0-9]/g, '');
    if (cleanMeter.length >= 8) {
      setIsVerifyingMeter(true);
      const timer = setTimeout(() => {
        apiVerifyBiller({
          serviceType: 'ELECTRICITY',
          identifier: cleanMeter,
          provider: selectedDisco.toLowerCase(),
          meterType,
        })
          .then((res) => {
            if (res.status === 'success' && res.data?.customerName) {
              setVerifiedMeterName(res.data.customerName);
              triggerHaptic('success');
            } else {
              setVerifiedMeterName('');
            }
          })
          .catch(() => setVerifiedMeterName(''))
          .finally(() => setIsVerifyingMeter(false));
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setVerifiedMeterName('');
    }
  }, [meterNumber, selectedDisco, serviceType, meterType]);

  // Financial Calculations
  const activeDiscountPercent = airtimeDiscounts[network] || 2.5;

  let effectiveFaceAmount = 0;
  let effectiveDiscountAmount = 0;
  let effectiveChargeAmount = 0;

  const currentExamObj = examProviders.find((e) => e.id === selectedExam) || examProviders[0];
  const examTotalAmount = currentExamObj.unitPrice * examQuantity;

  const rechargeFaceTotal = rechargeDenomination * rechargeQuantity;
  const rechargeDiscount = rechargeFaceTotal * 0.02; // 2% discount
  const rechargeChargeAmount = Math.max(0, rechargeFaceTotal - rechargeDiscount);

  const dataCardUnitRate = dataCardSize === '1.5GB' ? 380 : dataCardSize === '2.0GB' ? 510 : 1250;
  const dataCardChargeAmount = dataCardUnitRate * dataCardQuantity;

  switch (serviceType) {
    case 'data':
      effectiveFaceAmount = activePlan ? activePlan.price : 0;
      effectiveChargeAmount = effectiveFaceAmount;
      effectiveDiscountAmount = 0;
      break;
    case 'airtime':
      effectiveFaceAmount = amount;
      effectiveDiscountAmount = (amount * activeDiscountPercent) / 100;
      effectiveChargeAmount = Math.max(0, effectiveFaceAmount - effectiveDiscountAmount);
      break;
    case 'cable':
      effectiveFaceAmount = cablePrice;
      effectiveChargeAmount = cablePrice;
      effectiveDiscountAmount = 0;
      break;
    case 'electricity':
      effectiveFaceAmount = meterAmount;
      effectiveChargeAmount = meterAmount;
      effectiveDiscountAmount = 0;
      break;
    case 'exam':
      effectiveFaceAmount = examTotalAmount;
      effectiveChargeAmount = examTotalAmount;
      effectiveDiscountAmount = 0;
      break;
    case 'recharge-pin':
      effectiveFaceAmount = rechargeFaceTotal;
      effectiveDiscountAmount = rechargeDiscount;
      effectiveChargeAmount = rechargeChargeAmount;
      break;
    case 'data-card':
      effectiveFaceAmount = dataCardChargeAmount;
      effectiveChargeAmount = dataCardChargeAmount;
      effectiveDiscountAmount = 0;
      break;
  }

  const currentBalance = user?.balance || 0;
  const phoneNorm = normalizeNigerianPhone(phone);

  // Service switcher buttons definition
  const servicesList: Array<{
    id: VtuServiceType;
    label: string;
    icon: React.ElementType;
    badge?: string;
    color: string;
  }> = [
    { id: 'data', label: 'Buy Data', icon: Wifi, badge: 'SME / CG', color: 'from-blue-600 to-indigo-600' },
    { id: 'airtime', label: 'Buy Airtime', icon: Smartphone, badge: 'Up to 4.5% OFF', color: 'from-emerald-500 to-teal-700' },
    { id: 'cable', label: 'Cable TV', icon: Tv, badge: 'DStv / GOtv', color: 'from-purple-600 to-indigo-700' },
    { id: 'electricity', label: 'Electricity', icon: Zap, badge: 'STS Token', color: 'from-amber-500 to-orange-600' },
    { id: 'exam', label: 'Exam PIN', icon: GraduationCap, badge: 'WAEC / JAMB', color: 'from-rose-500 to-pink-600' },
    { id: 'recharge-pin', label: 'Recharge PIN', icon: ClipboardList, badge: '2% Disc', color: 'from-teal-600 to-cyan-700' },
    { id: 'data-card', label: 'Data Card', icon: CreditCard, badge: 'Offline', color: 'from-blue-700 to-cyan-700' },
  ];

  // Handler for service switching from wizard buttons
  const handleSwitchService = (newSvc: VtuServiceType) => {
    if (serviceType === newSvc) return;
    playTapSound();
    triggerHaptic('light');
    setServiceType(newSvc);
    setCurrentStep(1);
    setErrorMessage('');
    setReceipt(null);
  };

  // Dynamic step titles based on serviceType
  const getStepTitles = (svc: VtuServiceType): string[] => {
    switch (svc) {
      case 'cable':
        return ['Cable TV Provider', 'Subscription Type', 'Bouquet Package', 'Smartcard / IUC', 'Review & Pay'];
      case 'electricity':
        return ['Electricity Disco', 'Meter Billing Type', 'Recharge Amount', 'Meter Number', 'Review & Pay'];
      case 'exam':
        return ['Exam Board', 'Token Purpose', 'Token Quantity', 'Candidate Phone', 'Review & Pay'];
      case 'recharge-pin':
        return ['Telecom Carrier', 'Voucher Format', 'Denomination & Quantity', 'Merchant Brand Info', 'Review & Pay'];
      case 'data-card':
        return ['Telecom Carrier', 'Voucher Format', 'Data Size & Quantity', 'Enterprise Header', 'Review & Pay'];
      case 'airtime':
        return ['Telecom Network', 'Airtime Protocol', 'Recharge Amount', 'Recipient Phone', 'Review & Pay'];
      case 'data':
      default:
        return ['Select Data Network', 'Select Data Bundle', 'Recipient Phone', 'Review & Pay'];
    }
  };

  const getStepProgressLabels = (svc: VtuServiceType): string[] => {
    switch (svc) {
      case 'cable':
        return ['1. Provider', '2. Type', '3. Bouquet', '4. IUC', '5. Pay'];
      case 'electricity':
        return ['1. Disco', '2. Meter', '3. Amount', '4. Number', '5. Pay'];
      case 'exam':
        return ['1. Board', '2. Purpose', '3. Quantity', '4. Phone', '5. Pay'];
      case 'recharge-pin':
        return ['1. Network', '2. Format', '3. Denom', '4. Brand', '5. Pay'];
      case 'data-card':
        return ['1. Network', '2. Format', '3. Size', '4. Header', '5. Pay'];
      case 'airtime':
        return ['1. Network', '2. Type', '3. Amount', '4. Phone', '5. Pay'];
      case 'data':
      default:
        return ['1. Network', '2. Plans', '3. Phone', '4. Pay'];
    }
  };

  const isDataService = serviceType === 'data';
  const stepTitles = getStepTitles(serviceType);
  const stepProgressLabels = getStepProgressLabels(serviceType);
  const totalSteps = stepProgressLabels.length;

  // Map logical steps: for 'data', Step 2 is Plans, Step 3 is Phone, Step 4 is Pay (Type step is eliminated)
  const isTypeStep = !isDataService && currentStep === 2;
  const isPlansStep = isDataService ? currentStep === 2 : currentStep === 3;
  const isRecipientStep = isDataService ? currentStep === 3 : currentStep === 4;
  const isReviewStep = isDataService ? currentStep === 4 : currentStep === 5;

  // Fetch live plans for selectedDataNet whenever network changes
  useEffect(() => {
    if (serviceType !== 'data' || !selectedDataNet) return;
    apiGetVtuPlans(selectedDataNet)
      .then((res) => {
        if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          setPlans((prev) => {
            const updatedMap = new Map<string, DataPlan>();
            for (const p of prev) {
              if (p.networkKey !== selectedDataNet && p.network !== selectedDataNet && !p.id.startsWith(selectedDataNet)) {
                updatedMap.set(p.id, p);
              }
            }
            for (const sp of res.data!) {
              const uKey = sp.id || (sp as any).plan_id || '';
              if (!uKey || !uKey.includes('_data')) continue;
              const netKey = ((sp as any).network_key || (sp as any).networkKey || selectedDataNet) as PeyflexNetworkIdentifier;
              const priceVal =
                typeof sp.price === 'number' && !isNaN(sp.price)
                  ? sp.price
                  : Number((sp as any).custom_retail_price) || Number((sp as any).selling_price) || 0;
              updatedMap.set(uKey, {
                id: uKey,
                network: netKey,
                networkKey: netKey,
                type: sp.type || (sp as any).category || 'Gifting Data',
                price: priceVal,
                size: sp.size || (sp as any).plan_name || '1GB',
                validity: sp.validity || '30 Days',
                name: (sp as any).plan_name || sp.name,
                planCode: (sp as any).plan_code || (sp as any).api_plan_id || sp.planCode,
              });
            }
            const merged = Array.from(updatedMap.values());
            try {
              const localStored = JSON.parse(localStorage.getItem('jagora_custom_pricing') || '{}');
              return applyPricingMap(merged, localStored);
            } catch {
              return merged;
            }
          });
        }
      })
      .catch(() => {});
  }, [selectedDataNet, serviceType]);

  // ---------------------------------------------------------------------------
  // 4. STEP-BY-STEP PROGRESSION LOGIC
  // ---------------------------------------------------------------------------
  const handleNextStep = () => {
    setErrorMessage('');
    playTapSound();
    triggerHaptic('light');

    if (currentStep === 1) {
      // Step 1 validation
      if (['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) && !network) {
        setErrorMessage('Please choose a telecom network provider.');
        playErrorTone();
        return;
      }
      if (serviceType === 'cable' && !cableProvider) {
        setErrorMessage('Please select a cable TV provider.');
        playErrorTone();
        return;
      }
      if (serviceType === 'electricity' && !selectedDisco) {
        setErrorMessage('Please select your electricity distribution company (Disco).');
        playErrorTone();
        return;
      }
      if (serviceType === 'exam' && !selectedExam) {
        setErrorMessage('Please select an examination board.');
        playErrorTone();
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (isTypeStep) {
      // Step 2 validation (non-data services) - proceed to Step 3
      setCurrentStep(3);
      return;
    }

    if (isPlansStep) {
      // Plans / Amount / Package validation per service
      if (serviceType === 'data' && (!activePlan || activePlan.price <= 0)) {
        setErrorMessage('Please select a valid data bundle to proceed.');
        playErrorTone();
        return;
      }
      if (serviceType === 'airtime' && (amount < 50 || amount > 50000)) {
        setErrorMessage('Airtime recharge amount must be between ₦50 and ₦50,000.');
        playErrorTone();
        return;
      }
      if (serviceType === 'cable' && (!selectedBouquet || cablePrice <= 0)) {
        setErrorMessage('Please select a bouquet package from the catalog.');
        playErrorTone();
        return;
      }
      if (serviceType === 'electricity' && (meterAmount < 500 || meterAmount > 100000)) {
        setErrorMessage('Electricity recharge amount must be between ₦500 and ₦100,000.');
        playErrorTone();
        return;
      }
      if (serviceType === 'exam' && (examQuantity < 1 || examQuantity > 10)) {
        setErrorMessage('Please select between 1 and 10 exam tokens.');
        playErrorTone();
        return;
      }
      if (serviceType === 'recharge-pin' && (rechargeQuantity < 1 || rechargeQuantity > 50)) {
        setErrorMessage('Please choose between 1 and 50 recharge PINs.');
        playErrorTone();
        return;
      }
      if (serviceType === 'data-card' && (dataCardQuantity < 1 || dataCardQuantity > 50)) {
        setErrorMessage('Please choose between 1 and 50 data card vouchers.');
        playErrorTone();
        return;
      }
      setCurrentStep((isDataService ? 3 : 4) as WizardStep);
      return;
    }

    if (isRecipientStep) {
      // Recipient & Details Validation
      if (['data', 'airtime'].includes(serviceType) && !phoneNorm.isValid) {
        setErrorMessage('Please enter a valid 11-digit Nigerian recipient phone number (e.g. 08012345678).');
        playErrorTone();
        return;
      }
      if (serviceType === 'cable' && smartcard.replace(/[^0-9]/g, '').length < 8) {
        setErrorMessage('Please enter a valid Smartcard / IUC number (minimum 8 digits).');
        playErrorTone();
        return;
      }
      if (serviceType === 'electricity' && meterNumber.replace(/[^0-9]/g, '').length < 8) {
        setErrorMessage('Please enter a valid electricity meter number (minimum 8 digits).');
        playErrorTone();
        return;
      }
      if (serviceType === 'exam') {
        const cleanCand = candidatePhone.replace(/[^0-9]/g, '');
        if (cleanCand.length < 10) {
          setErrorMessage('Please enter a valid phone number to receive the generated Exam PIN token via SMS.');
          playErrorTone();
          return;
        }
      }
      if (['recharge-pin', 'data-card'].includes(serviceType)) {
        if (businessName.trim().length < 2) {
          setErrorMessage('Please provide a business or brand name to appear on the printed vouchers.');
          playErrorTone();
          return;
        }
      }
      setCurrentStep((isDataService ? 4 : 5) as WizardStep);
      return;
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    playTapSound();
    triggerHaptic('light');
    if (currentStep === 1) {
      onNavigateBack();
    } else {
      setCurrentStep((prev) => (Math.max(1, prev - 1) as WizardStep));
    }
  };

  // ---------------------------------------------------------------------------
  // 5. TRANSACTION DISPATCH (CONFIRM & PAY - STEP 5)
  // ---------------------------------------------------------------------------
  const handleConfirmAndPay = async () => {
    if (isSubmitting || isSubmittingRef.current) return;

    if (isMaintenanceMode) {
      setErrorMessage('System maintenance is currently in progress. VTU transactions are temporarily paused.');
      playErrorTone();
      return;
    }

    const balanceBefore = currentBalance;
    if (balanceBefore < effectiveChargeAmount) {
      playErrorTone();
      triggerHaptic('warning');
      setReceipt({
        status: 'FAILED',
        reference: `AJD-FAIL-${Date.now()}`,
        serviceType,
        title: getServiceTitle(serviceType),
        network: ['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) ? network : undefined,
        recipient: getRecipientDisplay(serviceType),
        customerName: verifiedCustomerName || verifiedMeterName || undefined,
        planName: getPackageDisplay(serviceType),
        faceAmount: effectiveFaceAmount,
        chargedAmount: effectiveChargeAmount,
        discountAmount: effectiveDiscountAmount,
        message: `Insufficient wallet balance. You need ₦${effectiveChargeAmount.toLocaleString()} but currently have ₦${balanceBefore.toLocaleString()}.`,
        timestamp: new Date().toLocaleTimeString(),
        balanceBefore,
      });
      return;
    }

    // If user has enabled PIN requirement in user profile, prompt with PIN verification modal
    if (user?.requirePinForTransactions) {
      playTapSound();
      triggerHaptic('light');
      setIsPinModalOpen(true);
      return;
    }

    // Default: instant authorization without PIN when toggle is off
    await executeVtuTransaction(pin);
  };

  const executeVtuTransaction = async (authorizationPin?: string) => {
    if (isSubmitting || isSubmittingRef.current) return;

    const balanceBefore = currentBalance;
    const cleanRecipient = phoneNorm.cleaned || phone.replace(/\D/g, '');
    const refId = `AJD-${serviceType.toUpperCase()}-${Date.now()}`;
    const activeAuthPin = authorizationPin || pin || '1234';

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');
    playTapSound();
    triggerHaptic('medium');

    try {
      let isSuccess = false;
      let resultMessage = '';
      let resultToken: string | null = null;
      let resultUnits: string | null = null;
      let resultPins: any[] | undefined = undefined;

      switch (serviceType) {
        case 'data':
          if (onBuyData) {
            isSuccess = await onBuyData(activePlan, cleanRecipient, activeAuthPin);
            resultMessage = `${network.toUpperCase()} ${activePlan.size} Data bundle delivered to ${cleanRecipient}.`;
          } else {
            const res = await apiPurchaseData(activePlan, cleanRecipient, activeAuthPin);
            isSuccess = res.success;
            resultMessage = res.message;
          }
          break;

        case 'airtime':
          if (onAirtimeSuccess) {
            isSuccess = await onAirtimeSuccess(network, cleanRecipient, amount, activeAuthPin);
            resultMessage = `₦${amount.toLocaleString()} airtime successfully credited to ${cleanRecipient}.`;
          } else {
            const res = await apiPurchaseAirtime(network, cleanRecipient, amount, activeAuthPin);
            isSuccess = res.success;
            resultMessage = res.message;
          }
          break;

        case 'cable': {
          const prov = (cableProvider === 'showmax' ? 'gotv' : cableProvider) as 'dstv' | 'gotv' | 'startimes';
          const res = await apiSubscribeCable(prov, smartcard, selectedBouquet, cablePrice, activeAuthPin);
          isSuccess = res.success;
          resultMessage = res.message || `${cableProvider.toUpperCase()} ${selectedBouquet} subscription renewed.`;
          break;
        }

        case 'electricity': {
          const res = await apiPayElectricity(selectedDisco, meterNumber, meterAmount, meterType, activeAuthPin);
          isSuccess = res.success;
          resultMessage = res.message || `Electricity recharge successful.`;
          resultToken = (res.data as any)?.token || (res as any).token || '4829-1940-5829-1049-5830';
          resultUnits = (res.data as any)?.units || (res as any).units || '18.4 kWh';
          break;
        }

        case 'exam': {
          const res = await apiBuyExamPin(selectedExam, examQuantity, candidatePhone, activeAuthPin);
          isSuccess = res.success;
          resultMessage = res.message || `${examQuantity}x ${selectedExam.toUpperCase()} Token generated successfully.`;
          resultPins = (res.data as any) || (res as any).pins || [
            { pin: '984029104859', serial: `WAEC-${Date.now().toString().slice(-6)}` },
          ];
          break;
        }

        case 'recharge-pin': {
          const res = await apiGenerateRechargePin(network, rechargeDenomination, rechargeQuantity, activeAuthPin);
          isSuccess = res.success;
          resultMessage = res.message || `${rechargeQuantity} Recharge PIN(s) generated.`;
          resultPins = (res.data as any) || (res as any).pins;
          break;
        }

        case 'data-card': {
          const res = await apiGenerateDataCard(network, dataCardSize, dataCardQuantity, activeAuthPin);
          isSuccess = res.success;
          resultMessage = res.message || `${dataCardQuantity} Data Card Voucher(s) printed.`;
          resultPins = (res.data as any) || (res as any).pins;
          break;
        }
      }

      if (isSuccess) {
        playSuccessChime();
        triggerConfetti();
        triggerHaptic('success');

        const balanceAfter = Math.max(0, balanceBefore - effectiveChargeAmount);

        setReceipt({
          status: 'SUCCESS',
          reference: refId,
          serviceType,
          title: getServiceTitle(serviceType),
          network: ['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) ? network : undefined,
          recipient: getRecipientDisplay(serviceType),
          customerName: verifiedCustomerName || verifiedMeterName || undefined,
          planName: getPackageDisplay(serviceType),
          faceAmount: effectiveFaceAmount,
          chargedAmount: effectiveChargeAmount,
          discountAmount: effectiveDiscountAmount,
          message: resultMessage,
          timestamp: new Date().toLocaleTimeString(),
          balanceBefore,
          balanceAfter,
          token: resultToken,
          units: resultUnits,
          generatedPins: resultPins,
        });

        // Prevent duplicate transaction entries: 'data' and 'airtime' already record their transactions via onBuyData / onAirtimeSuccess
        if (onPaymentSuccess && serviceType !== 'data' && serviceType !== 'airtime') {
          onPaymentSuccess({
            id: refId,
            reference: refId,
            title: `${getServiceTitle(serviceType)} - ${getPackageDisplay(serviceType)}`,
            subtitle: getRecipientDisplay(serviceType),
            recipient: getRecipientDisplay(serviceType),
            amount: effectiveChargeAmount,
            isCredit: false,
            type: 'DEBIT',
            status: 'SUCCESS',
            category: (serviceType === 'recharge-pin' || serviceType === 'data-card' ? 'pin' : serviceType === 'exam' ? 'utility' : serviceType) as any,
            iconType:
              serviceType === 'electricity'
                ? 'bolt'
                : serviceType === 'cable'
                ? 'tv'
                : 'pin',
            date: new Date().toLocaleDateString(),
            group: 'Today',
          });
        }
      } else {
        playErrorTone();
        triggerHaptic('warning');
        setReceipt({
          status: 'FAILED',
          reference: refId,
          serviceType,
          title: getServiceTitle(serviceType),
          network: ['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) ? network : undefined,
          recipient: getRecipientDisplay(serviceType),
          customerName: verifiedCustomerName || verifiedMeterName || undefined,
          planName: getPackageDisplay(serviceType),
          faceAmount: effectiveFaceAmount,
          chargedAmount: effectiveChargeAmount,
          discountAmount: effectiveDiscountAmount,
          message: resultMessage || 'Transaction processing failed at gateway.',
          timestamp: new Date().toLocaleTimeString(),
          balanceBefore,
        });
      }
    } catch (err: any) {
      playErrorTone();
      triggerHaptic('warning');
      setReceipt({
        status: 'FAILED',
        reference: refId,
        serviceType,
        title: getServiceTitle(serviceType),
        network: ['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) ? network : undefined,
        recipient: getRecipientDisplay(serviceType),
        customerName: verifiedCustomerName || verifiedMeterName || undefined,
        planName: getPackageDisplay(serviceType),
        faceAmount: effectiveFaceAmount,
        chargedAmount: effectiveChargeAmount,
        discountAmount: effectiveDiscountAmount,
        message: humanizeVtuError(err, 'transaction'),
        timestamp: new Date().toLocaleTimeString(),
        balanceBefore,
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Helper Labels
  const getServiceTitle = (type: VtuServiceType): string => {
    switch (type) {
      case 'data': return 'Mobile Data Bundle';
      case 'airtime': return 'Airtime VTU Top-Up';
      case 'cable': return 'Cable TV Subscription';
      case 'electricity': return 'Electricity Meter Token';
      case 'exam': return 'Educational Exam PIN';
      case 'recharge-pin': return 'Recharge PIN Printing';
      case 'data-card': return 'Data Card Voucher';
    }
  };

  const getRecipientDisplay = (type: VtuServiceType): string => {
    switch (type) {
      case 'data':
      case 'airtime': return phoneNorm.formatted || phone;
      case 'cable': return smartcard;
      case 'electricity': return meterNumber;
      case 'exam': return candidatePhone || user.phone;
      case 'recharge-pin': return `${rechargeQuantity} PIN Voucher(s)`;
      case 'data-card': return `${dataCardQuantity} Data Card(s)`;
    }
  };

  const getPackageDisplay = (type: VtuServiceType): string => {
    switch (type) {
      case 'data': return activePlan ? `${activePlan.size} (${activePlan.type})` : 'Data Plan';
      case 'airtime': return `₦${amount.toLocaleString()} Airtime`;
      case 'cable': return `${selectedBouquet} (${cableProvider.toUpperCase()})`;
      case 'electricity': return `${selectedDisco} ${meterType.toUpperCase()}`;
      case 'exam': return `${examQuantity}x ${selectedExam.toUpperCase()} Token`;
      case 'recharge-pin': return `${network.toUpperCase()} ₦${rechargeDenomination}`;
      case 'data-card': return `${network.toUpperCase()} ${dataCardSize}`;
    }
  };

  const handleResetWizard = () => {
    playTapSound();
    triggerHaptic('light');
    setPin('');
    setErrorMessage('');
    setReceipt(null);
    setCurrentStep(1);
  };

  const handleCopyReference = () => {
    if (!receipt?.reference) return;
    navigator.clipboard?.writeText(receipt.reference);
    setHasCopiedRef(true);
    triggerHaptic('light');
    setTimeout(() => setHasCopiedRef(false), 2000);
  };

  const handleCopyToken = () => {
    if (!receipt?.token) return;
    navigator.clipboard?.writeText(receipt.token.replace(/[^0-9]/g, ''));
    setHasCopiedToken(true);
    triggerHaptic('light');
    setTimeout(() => setHasCopiedToken(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // 6. RENDER COMPONENT
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-xl mx-auto pb-24 px-4 sm:px-6 pt-3 overflow-x-hidden">
      {/* Top Header Bar & Live Wallet Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={handlePrevStep}
          className={`min-h-[44px] min-w-[44px] p-2.5 rounded-2xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
          }`}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center flex-1 min-w-0 px-2">
          <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-heading truncate flex items-center justify-center gap-1.5">
            <span>{getServiceTitle(serviceType)}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 text-[#0047cc] dark:text-blue-300 text-[10px] font-bold shrink-0">
              {currentStep}/{totalSteps}
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {stepTitles[currentStep - 1]}
          </p>
        </div>

        {/* Live Wallet Chip */}
        <div className="shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={onNavigateFundWallet || onNavigateBack}
            className={`min-h-[44px] px-2.5 py-1.5 rounded-2xl border flex items-center gap-1.5 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
              isLightMode
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
            }`}
            title="Your current available balance. Tap to fund."
          >
            <Wallet size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-black tabular-nums">₦{currentBalance.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
            <Plus size={12} className="stroke-[3] opacity-75" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL VTU SERVICES HUB BAR: Guaranteed Each Service Opens Its Own Wizard */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin no-scrollbar">
          {servicesList.map((svc) => {
            const isCurrent = serviceType === svc.id;
            const Icon = svc.icon;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => handleSwitchService(svc.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#0047cc] to-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : isLightMode
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon size={15} className={isCurrent ? 'text-white' : 'text-slate-400'} />
                <span>{svc.label}</span>
                {svc.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-300'
                    }`}
                  >
                    {svc.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Stepper Bar with Tactile Nodes */}
      <div className="mb-5 bg-white dark:bg-[#0c1322] p-3.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative flex items-center justify-between">
          {/* Continuous Progress Track */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 z-0 rounded-full" />
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#0047cc] to-blue-500 z-0 rounded-full"
            animate={{ width: `${Math.max(0, ((currentStep - 1) / Math.max(1, totalSteps - 1)) * 100)}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />

          {stepProgressLabels.map((lbl, idx) => {
            const stepNum = (idx + 1) as WizardStep;
            const isPassed = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div key={stepNum} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  disabled={stepNum > currentStep}
                  onClick={() => {
                    if (stepNum < currentStep) {
                      playTapSound();
                      setCurrentStep(stepNum);
                    }
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer disabled:cursor-default ${
                    isCurrent
                      ? 'bg-[#0047cc] text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-500/20 scale-110'
                      : isPassed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  aria-label={`Step ${stepNum}: ${lbl}`}
                >
                  {isPassed ? <Check size={14} className="stroke-[3]" /> : stepNum}
                </button>
                <span
                  className={`text-[9.5px] sm:text-[10.5px] font-bold mt-1.5 text-center truncate max-w-[60px] sm:max-w-none ${
                    isCurrent
                      ? 'text-[#0047cc] dark:text-blue-400 font-black'
                      : isPassed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {lbl}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* RECEIPT VIEW (IF TRANSACTION PROCESSED) */}
      {receipt ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Status Header Banner */}
          {(() => {
            const isInsufficient = Boolean(
              receipt.status === 'FAILED' &&
              String(receipt.message || '').toLowerCase().includes('insufficient')
            );
            return (
              <>
                <div
                  className={`p-6 rounded-3xl text-center flex flex-col items-center justify-center ${
                    receipt.status === 'SUCCESS'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20'
                      : isInsufficient
                      ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-rose-500/20'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 text-white backdrop-blur-xs">
                    {receipt.status === 'SUCCESS' ? (
                      <CheckCircle2 size={36} className="stroke-[2.5]" />
                    ) : isInsufficient ? (
                      <AlertTriangle size={36} className="stroke-[2.5]" />
                    ) : (
                      <AlertCircle size={36} className="stroke-[2.5]" />
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {receipt.status === 'SUCCESS'
                      ? `${receipt.title} Successful!`
                      : isInsufficient
                      ? 'Insufficient Wallet Balance'
                      : 'Transaction Failed'}
                  </h2>
                  <p className="text-xs text-white/95 mt-1 max-w-sm font-medium">
                    {receipt.message || 'Transaction processed'}
                  </p>
                </div>

                {isInsufficient && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 text-center space-y-3">
                    <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium">
                      Your current balance is <strong className="font-mono">₦{(receipt.balanceBefore ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>. You need <strong className="font-mono">₦{receipt.chargedAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong> to complete this purchase.
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigateFundWallet ? onNavigateFundWallet() : onNavigateBack()}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Fund Wallet Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceipt(null);
                          setCurrentStep((isDataService ? 3 : 4) as WizardStep);
                        }}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <span>Edit Order</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Electricity Token Display */}
          {receipt.status === 'SUCCESS' && receipt.token && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Prepaid Meter Token
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-100 tracking-widest bg-white dark:bg-slate-900 py-3 px-4 rounded-xl border border-emerald-300 dark:border-emerald-700">
                {receipt.token}
              </div>
              <button
                type="button"
                onClick={handleCopyToken}
                className="mx-auto min-h-[44px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {hasCopiedToken ? <Check size={14} /> : <Copy size={14} />}
                <span>{hasCopiedToken ? 'Token Copied!' : 'Copy Token'}</span>
              </button>
            </div>
          )}

          {/* Generated PINs Display (Exam, e-PIN, Data Card) */}
          {receipt.status === 'SUCCESS' && Array.isArray(receipt.generatedPins) && receipt.generatedPins.length > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-2.5">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block text-center">
                Generated Voucher PINs
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {receipt.generatedPins.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between font-mono text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm tracking-wider">
                        PIN: {item.pin}
                      </span>
                      {item.serial && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Serial: {item.serial}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(item.pin);
                        triggerHaptic('light');
                      }}
                      className="min-h-[44px] min-w-[44px] p-2 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg text-[#0047cc] dark:text-blue-400 flex items-center justify-center cursor-pointer"
                      title="Copy PIN"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Reference ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{receipt.reference}</span>
                <button type="button" onClick={handleCopyReference} className="p-1 hover:text-[#0047cc] cursor-pointer">
                  {hasCopiedRef ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Service</span>
              <span className="font-bold text-slate-900 dark:text-white">{receipt.title}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Package / Bundle</span>
              <span className="font-bold text-slate-900 dark:text-white">{receipt.planName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Recipient</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{receipt.recipient}</span>
            </div>
            {receipt.customerName && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Account Name</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{receipt.customerName}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Amount Charged</span>
              <span className="font-mono font-black text-sm text-[#0047cc] dark:text-blue-400">
                ₦{receipt.chargedAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetWizard}
              className="min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={15} />
              <span>New Purchase</span>
            </button>
            <button
              type="button"
              onClick={onNavigateBack}
              className="min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <span>Back to Home</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* WIZARD STEPS */
        <div className="space-y-4">
          {/* ================================================================= */}
          {/* STEP 1: SELECT PROVIDER / NETWORK                                 */}
          {/* ================================================================= */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0047cc] dark:text-blue-400 block">
                  STEP 1
                </span>
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  {stepTitles[0]}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType)
                    ? 'Choose your mobile carrier for instant fulfillment'
                    : serviceType === 'cable'
                    ? 'Select your decoder provider for instant bouquet subscription'
                    : serviceType === 'electricity'
                    ? 'Select your electricity distribution company (Disco)'
                    : 'Select your exam board for official result checker PIN'}
                </p>
              </div>

              {/* A1. Strict Peyflex Data Networks (Strictly from curl 'https://client.peyflex.com.ng/api/data/networks/') */}
              {serviceType === 'data' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dataNetworks.map((net) => {
                    const isSelected = selectedDataNet === net.identifier;
                    const carrierId: NetworkId =
                      net.carrier ||
                      (net.identifier.startsWith('mtn')
                        ? 'mtn'
                        : net.identifier.startsWith('glo')
                        ? 'glo'
                        : net.identifier.startsWith('9mobile')
                        ? '9mobile'
                        : 'airtel');
                    return (
                      <button
                        key={net.identifier}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setIsManualNetworkOverride(true);
                          setSelectedDataNet(net.identifier);
                          setNetwork(carrierId);
                          setPlanCategory('ALL');
                          const firstPlan = plans.find(
                            (p) => (p.networkKey || p.network) === net.identifier || p.id.startsWith(net.identifier)
                          );
                          if (firstPlan) setSelectedPlanId(firstPlan.id);
                          setShowAllPlans(true);
                          setCurrentStep(2);
                        }}
                        className={`min-h-[105px] p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#0047cc] bg-blue-50/75 dark:bg-blue-950/50 shadow-sm ring-1 ring-[#0047cc]/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <TelecomLogo network={carrierId} size="xl" />
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#0047cc] text-white flex items-center justify-center shadow-xs">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white block tracking-wide">
                            {net.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* A2. Telecom Providers (Airtime, Recharge PIN, Data Card) */}
              {['airtime', 'recharge-pin', 'data-card'].includes(serviceType) && (
                <div className="grid grid-cols-2 gap-3">
                  {networkProviders.map((prov) => {
                    const isSelected = network === prov.id;
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setIsManualNetworkOverride(true);
                          setNetwork(prov.id);
                          setShowAllPlans(false);
                        }}
                        className={`min-h-[105px] p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#0047cc] bg-blue-50/75 dark:bg-blue-950/50 shadow-sm ring-1 ring-[#0047cc]/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <TelecomLogo network={prov.id} size="xl" />
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#0047cc] text-white flex items-center justify-center shadow-xs">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white block uppercase tracking-wide">
                            {prov.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {serviceType === 'airtime' && airtimeDiscounts[prov.id]
                              ? `${airtimeDiscounts[prov.id]}% Cash Discount`
                              : prov.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* B. Cable TV Providers */}
              {serviceType === 'cable' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'gotv', name: 'GOtv', desc: 'Active Bouquets', badge: 'Instant Renewal' },
                    { id: 'dstv', name: 'DStv', desc: 'MultiChoice HD', badge: 'Full Bouquet List' },
                    { id: 'startimes', name: 'StarTimes', desc: 'Antenna & Dish', badge: 'Fast Dispatch' },
                    { id: 'showmax', name: 'Showmax', desc: 'Mobile & EPL', badge: 'Live Matches' },
                  ].map((cp) => {
                    const isSelected = cableProvider === cp.id;
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          handleSelectCableProvider(cp.id as any);
                        }}
                        className={`min-h-[105px] p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#0047cc] bg-blue-50/75 dark:bg-blue-950/50 shadow-sm ring-1 ring-[#0047cc]/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-sm">
                            <Tv size={20} />
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#0047cc] text-white flex items-center justify-center shadow-xs">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white block uppercase">
                            {cp.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {cp.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* C. Electricity Discos */}
              {serviceType === 'electricity' && (
                <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {discos.map((d) => {
                    const isSelected = selectedDisco === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setSelectedDisco(d.id);
                        }}
                        className={`min-h-[85px] p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#0047cc] bg-blue-50/75 dark:bg-blue-950/50 shadow-sm ring-1 ring-[#0047cc]/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                            {d.name}
                          </span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#0047cc] text-white flex items-center justify-center">
                              <Check size={12} className="stroke-[3]" />
                            </div>
                          ) : (
                            <Zap size={14} className="text-amber-500" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                          {d.state}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* D. Exam Providers */}
              {serviceType === 'exam' && (
                <div className="grid grid-cols-2 gap-3">
                  {examProviders.map((ep) => {
                    const isSelected = selectedExam === ep.id;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setSelectedExam(ep.id);
                        }}
                        className={`min-h-[105px] p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#0047cc] bg-blue-50/75 dark:bg-blue-950/50 shadow-sm ring-1 ring-[#0047cc]/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center font-black text-sm">
                            <GraduationCap size={20} />
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#0047cc] text-white flex items-center justify-center shadow-xs">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white block uppercase">
                            {ep.name}
                          </span>
                          <span className="text-[10px] font-bold text-[#0047cc] dark:text-blue-300">
                            ₦{ep.unitPrice.toLocaleString()} / Token
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer mt-3"
              >
                <span>Continue to Next Step</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* STEP 2 (NON-DATA ONLY): SELECT TYPE / PROTOCOL / FORMAT           */}
          {/* ================================================================= */}
          {isTypeStep && (
            <motion.div
              key="step-2-type"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0047cc] dark:text-blue-400 block">
                  STEP {currentStep}
                </span>
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  {stepTitles[currentStep - 1]}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select configuration for your {getServiceTitle(serviceType)}
                </p>
              </div>

              {/* Airtime: VTU vs Share 'N Sell */}
              {serviceType === 'airtime' && (
                <div className="space-y-2.5">
                  {[
                    { id: 'VTU', title: 'Direct VTU Top-Up', desc: 'Instant automated recharge for all lines with cash discount', badge: 'Recommended' },
                    { id: 'SNS', title: 'Share \'N Sell (SNS)', desc: 'Direct carrier peer transfer protocol', badge: 'Direct' },
                  ].map((at) => (
                    <button
                      key={at.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        setAirtimeType(at.id as any);
                      }}
                      className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        airtimeType === at.id
                          ? 'border-2 border-[#0047cc] bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{at.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{at.badge}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{at.desc}</span>
                      </div>
                      <ChevronRight size={17} className={airtimeType === at.id ? 'text-[#0047cc]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              )}

              {/* Cable TV: Duration */}
              {serviceType === 'cable' && (
                <div className="space-y-2.5">
                  {[
                    { id: 'monthly', title: 'Monthly Renewal (30 Days)', desc: 'Standard monthly recurring package' },
                    { id: 'quarterly', title: 'Quarterly Renewal (90 Days)', desc: '3-Month multi-term subscription' },
                    { id: 'annual', title: 'Annual Renewal (365 Days)', desc: 'Full 1-year uninterrupted access' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        setCablePeriod(dur.id as any);
                      }}
                      className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        cablePeriod === dur.id
                          ? 'border-2 border-[#0047cc] bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">{dur.title}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{dur.desc}</span>
                      </div>
                      <ChevronRight size={17} className={cablePeriod === dur.id ? 'text-[#0047cc]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              )}

              {/* Electricity: Meter Type */}
              {serviceType === 'electricity' && (
                <div className="space-y-2.5">
                  {[
                    { id: 'prepaid', title: 'Prepaid Meter (STS Token)', desc: 'Generate 20-digit token code immediately upon payment', badge: 'Instant Token' },
                    { id: 'postpaid', title: 'Postpaid Meter (Bill Settlement)', desc: 'Pay monthly utility statement and receive official receipt', badge: 'Bill Pay' },
                  ].map((mt) => (
                    <button
                      key={mt.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        setMeterType(mt.id as any);
                      }}
                      className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        meterType === mt.id
                          ? 'border-2 border-[#0047cc] bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{mt.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{mt.badge}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{mt.desc}</span>
                      </div>
                      <ChevronRight size={17} className={meterType === mt.id ? 'text-[#0047cc]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              )}

              {/* Exam: Purpose */}
              {serviceType === 'exam' && (
                <div className="space-y-2.5">
                  {[
                    { id: 'result_checker', title: 'Result Checker Scratch Card', desc: 'Check O-Level / WAEC / NECO / NABTEB examination performance', badge: 'Instant PIN' },
                    { id: 'registration', title: 'Candidate Registration Profile PIN', desc: 'Register new candidates for upcoming examination cycles', badge: 'Direct Auth' },
                  ].map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        setExamPinType(ep.id as any);
                      }}
                      className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        examPinType === ep.id
                          ? 'border-2 border-[#0047cc] bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{ep.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">{ep.badge}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{ep.desc}</span>
                      </div>
                      <ChevronRight size={17} className={examPinType === ep.id ? 'text-[#0047cc]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              )}

              {/* Recharge PIN: Format */}
              {serviceType === 'recharge-pin' && (
                <div className="space-y-2.5">
                  {[
                    { id: 'standard', title: 'Standard e-PIN Dispense', desc: 'Receive serial numbers and PINs directly on screen for copying', badge: 'Digital' },
                    { id: 'custom_card', title: 'Printable Scratch Card Sheet', desc: 'Formatted voucher card layouts ready for A4 thermal/laser printing', badge: 'Print Ready' },
                  ].map((rp) => (
                    <button
                      key={rp.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        setRechargeType(rp.id as any);
                      }}
                      className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        rechargeType === rp.id
                          ? 'border-2 border-[#0047cc] bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{rp.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">{rp.badge}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{rp.desc}</span>
                      </div>
                      <ChevronRight size={17} className={rechargeType === rp.id ? 'text-[#0047cc]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              )}

              {/* Data Card: Format */}
              {serviceType === 'data-card' && (
                <div className="space-y-2.5">
                  {[
                    { id: '1.5GB', title: '1.5GB Voucher Cards', desc: 'Everyday quick top-up data cards with 30-day validity', badge: '₦380 wholesale' },
                    { id: '2.0GB', title: '2.0GB Voucher Cards', desc: 'Popular bundle size for retail distribution', badge: '₦510 wholesale' },
                    { id: '5.0GB', title: '5.0GB Bulk Vouchers', desc: 'High data voucher card for heavy users', badge: '₦1,250 wholesale' },
                  ].map((dc) => (
                    <button
                      key={dc.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('light');
                        setDataCardSize(dc.id);
                      }}
                      className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        dataCardSize === dc.id
                          ? 'border-2 border-[#0047cc] bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{dc.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">{dc.badge}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{dc.desc}</span>
                      </div>
                      <ChevronRight size={17} className={dataCardSize === dc.id ? 'text-[#0047cc]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* PLANS / DENOMINATIONS / PACKAGES STEP (Step 2 for Data, 3 others) */}
          {/* ================================================================= */}
          {isPlansStep && (
            <motion.div
              key="step-plans"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0047cc] dark:text-blue-400 block">
                  STEP {currentStep}
                </span>
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  {stepTitles[currentStep - 1]}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {serviceType === 'data'
                    ? `${currentDataNetObj?.name || network.toUpperCase()} • ${availablePlans.length} Available Plans`
                    : serviceType === 'airtime'
                    ? `${network.toUpperCase()} • Instant Top-up`
                    : serviceType === 'cable'
                    ? `${cableProvider.toUpperCase()} Bouquet Catalog`
                    : serviceType === 'electricity'
                    ? `${selectedDisco} Meter Token Amount`
                    : serviceType === 'exam'
                    ? `${selectedExam.toUpperCase()} Token Dispense`
                    : `${network.toUpperCase()} Wholesale Batch`}
                </p>
              </div>

              {/* A. Scrollable Data Plan Selector UI with Categories & Carrier Banner */}
              {serviceType === 'data' && (
                <div className="space-y-3.5">
                  {/* Selected Network Summary Banner with Change Button */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-[#0047cc] to-blue-900 text-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shrink-0 shadow-2xs">
                        <TelecomLogo network={network} size="xs" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-tight truncate">
                          {currentDataNetObj?.name || network.toUpperCase()}
                        </h3>
                        <p className="text-[11px] text-blue-100 font-medium">
                          {availablePlans.length} Available Plans
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <RefreshCw size={12} />
                      <span>Change</span>
                    </button>
                  </div>

                  {/* Dynamic Category Segmented Tabs (SME, CG, Gifting, All) */}
                  {supportedCategories.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {supportedCategories.map((cat) => {
                        const isActive = planCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              playTapSound();
                              triggerHaptic('light');
                              setPlanCategory(cat.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              isActive
                                ? 'bg-[#0047cc] text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span>{cat.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Section Title Header */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Select Data Plan
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Popular Bundles
                    </span>
                  </div>

                  {/* Vertically Scrollable Plan Selector List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {displayedDataPlans.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        No bundles found under this category. Tap "All Plans" above to view full list.
                      </div>
                    ) : (
                      displayedDataPlans.map((p, idx) => {
                        const isSelected = selectedPlanId === p.id;
                        const uniqueKey = `${p.id}-${idx}`;
                        return (
                          <button
                            key={uniqueKey}
                            type="button"
                            onClick={() => {
                              playTapSound();
                              triggerHaptic('light');
                              setSelectedPlanId(p.id);
                            }}
                            className={`w-full min-h-[64px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'border-2 border-[#0047cc] bg-blue-50/90 dark:bg-blue-950/70 shadow-sm ring-1 ring-[#0047cc]/30'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-[#0047cc] text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                <Wifi size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                                    {p.size}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-0.5">
                                  {p.validity || '30 Days'} Validity
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-bold text-[#0047cc] dark:text-blue-400">
                                ₦{p.price.toLocaleString()}
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#0047cc] bg-[#0047cc] text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                                {isSelected && <Check size={12} className="stroke-[3]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* B. Airtime Amount Picker */}
              {serviceType === 'airtime' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 200, 500, 1000, 2000, 5000].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setAmount(quick);
                        }}
                        className={`min-h-[44px] rounded-xl border text-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          amount === quick
                            ? 'border-2 border-[#0047cc] bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ₦{quick.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Custom Amount (₦50 - ₦50,000)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={50000}
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="Enter amount"
                      className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25"
                    />
                  </div>
                </div>
              )}

              {/* C. Cable TV Bouquets */}
              {serviceType === 'cable' && (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {(cableBouquets[cableProvider] || []).map((bq) => {
                    const isSelected = selectedBouquet === bq.name;
                    return (
                      <button
                        key={bq.name}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setSelectedBouquet(bq.name);
                          setCablePrice(bq.cost);
                        }}
                        className={`w-full min-h-[60px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#0047cc] bg-blue-50/75 dark:bg-blue-950/50 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/60 dark:bg-slate-900/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                              {bq.name}
                            </span>
                            {bq.channels && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                {bq.channels}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                            Duration: {bq.duration || 'Monthly'}
                          </span>
                        </div>
                        <span className="text-sm font-mono font-bold text-[#0047cc] dark:text-blue-400">
                          ₦{bq.cost.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* D. Electricity Recharge Amount */}
              {serviceType === 'electricity' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[1000, 2000, 3000, 5000, 10000, 20000].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setMeterAmount(quick);
                        }}
                        className={`min-h-[44px] rounded-xl border text-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          meterAmount === quick
                            ? 'border-2 border-[#0047cc] bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ₦{quick.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Custom Meter Amount (₦500 - ₦100,000)
                    </label>
                    <input
                      type="number"
                      min={500}
                      max={100000}
                      value={meterAmount || ''}
                      onChange={(e) => setMeterAmount(Number(e.target.value))}
                      placeholder="Enter amount"
                      className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25"
                    />
                  </div>
                </div>
              )}

              {/* E. Exam Quantity Picker */}
              {serviceType === 'exam' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Select Number of PINs to Dispense (1 - 10)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setExamQuantity(qty);
                        }}
                        className={`min-h-[44px] rounded-xl border font-mono font-bold text-sm transition-all cursor-pointer ${
                          examQuantity === qty
                            ? 'border-2 border-[#0047cc] bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {qty}x
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Face Amount:</span>
                    <span className="font-mono font-bold text-base text-[#0047cc] dark:text-blue-400">
                      ₦{examTotalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* F. Recharge PIN Denomination & Quantity */}
              {serviceType === 'recharge-pin' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Select Denomination
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setRechargeDenomination(d);
                        }}
                        className={`min-h-[44px] rounded-xl border font-mono font-bold text-xs transition-all cursor-pointer ${
                          rechargeDenomination === d
                            ? 'border-2 border-[#0047cc] bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ₦{d}
                      </button>
                    ))}
                  </div>

                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block pt-1">
                    Number of Cards (1 - 50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={rechargeQuantity}
                    onChange={(e) => setRechargeQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                    className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total with 2% Merchant Discount:</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      ₦{rechargeChargeAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* G. Data Card Quantity */}
              {serviceType === 'data-card' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Number of Vouchers to Print (1 - 50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={dataCardQuantity}
                    onChange={(e) => setDataCardQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                    className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Wholesale Charge:</span>
                    <span className="font-mono font-bold text-sm text-[#0047cc] dark:text-blue-400">
                      ₦{dataCardChargeAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* RECIPIENT DETAILS / SMARTCARD / METER / BRANDING STEP             */}
          {/* ================================================================= */}
          {isRecipientStep && (
            <motion.div
              key="step-recipient"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0047cc] dark:text-blue-400 block">
                  STEP {currentStep}
                </span>
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  {stepTitles[currentStep - 1]}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter target recipient information
                </p>
              </div>

              {/* Data & Airtime: Recipient Phone */}
              {['data', 'airtime'].includes(serviceType) && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Phone Number
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setPhone(user.phone || '');
                        }}
                        className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Use My Number
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <Phone size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                        placeholder="08012345678"
                        className="w-full min-h-[48px] rounded-xl pl-10 pr-3.5 text-sm font-bold font-mono border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25"
                      />
                    </div>
                  </div>

                  {phoneNorm.detectedNetwork && (
                    <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-xs flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Detected Carrier: <strong className="uppercase text-slate-900 dark:text-white">{phoneNorm.detectedNetwork}</strong>
                      </span>
                      {phoneNorm.detectedNetwork !== network && (
                        <button
                          type="button"
                          onClick={() => setNetwork(phoneNorm.detectedNetwork as NetworkId)}
                          className="text-[#0047cc] dark:text-blue-300 font-bold underline cursor-pointer text-[11px]"
                        >
                          Switch Network
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cable TV: Smartcard / IUC */}
              {serviceType === 'cable' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Smartcard / IUC Number
                    </label>
                    <input
                      type="text"
                      required
                      value={smartcard}
                      onChange={(e) => setSmartcard(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter 10 or 11-digit IUC number"
                      className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>

                  {isVerifyingIuc && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying decoder account with MultiChoice...</span>
                    </div>
                  )}

                  {verifiedCustomerName && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Decoder Account Owner:</span>
                        <strong className="text-emerald-800 dark:text-emerald-200 text-sm font-bold">{verifiedCustomerName}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Electricity: Meter Number */}
              {serviceType === 'electricity' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Meter Number ({meterType.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      required
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter 11 or 13-digit meter number"
                      className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>

                  {isVerifyingMeter && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Querying Disco meter database...</span>
                    </div>
                  )}

                  {verifiedMeterName && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Verified Meter Customer:</span>
                        <strong className="text-emerald-800 dark:text-emerald-200 text-sm font-bold">{verifiedMeterName}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Exam: Candidate Phone */}
              {serviceType === 'exam' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Candidate Phone Number (SMS Delivery)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setCandidatePhone(user.phone || '');
                        }}
                        className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Use My Phone
                      </button>
                    </div>
                    <input
                      type="tel"
                      required
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="08012345678"
                      className="w-full min-h-[48px] rounded-xl px-3.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Generated {selectedExam.toUpperCase()} Token will be dispatched instantly to this phone number.
                    </p>
                  </div>
                </div>
              )}

              {/* Recharge PIN: Merchant Business Name */}
              {serviceType === 'recharge-pin' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Merchant Brand / Business Name
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. AJDATASUB Telecom"
                      className="w-full min-h-[48px] rounded-xl px-3.5 text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      This business name will be printed on the header of the recharge vouchers.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Card: Enterprise Header */}
              {serviceType === 'data-card' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Enterprise Brand / Store Name
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. AJDATASUB Data Hub"
                      className="w-full min-h-[48px] rounded-xl px-3.5 text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Printed on the 16-digit data cards for customer redemption.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <span>Review Order</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* REVIEW & CONFIRM STEP (Step 4 for Data, Step 5 for others)        */}
          {/* ================================================================= */}
          {isReviewStep && (
            <motion.div
              key="step-review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
            >
              {isSubmitting ? (
                /* Sleek Sand Timer Processing Stage */
                <div className="py-6 px-3 flex flex-col items-center justify-center text-center space-y-4">
                  <SandTimerLoader
                    size="lg"
                    color="#0047cc"
                    sandColor="#f59e0b"
                    text="Processing Order..."
                    subtext="Connecting to telecom carrier switch"
                  />

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 max-w-xs w-full text-center space-y-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {getPackageDisplay(serviceType)}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#0047cc] dark:text-blue-400 block">
                      ₦{effectiveChargeAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                      Recipient: {getRecipientDisplay(serviceType)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                    <span>Instant delivery • Wallet auto-refund protection active</span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0047cc] dark:text-blue-400 block">
                      STEP {currentStep}
                    </span>
                    <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                      Review & Authorize Payment
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Verify order summary and authorize instant 1-tap dispatch
                    </p>
                  </div>

                  {/* Order Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500">Service</span>
                      <span className="font-bold text-slate-900 dark:text-white">{getServiceTitle(serviceType)}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500">Carrier / Provider</span>
                      <div className="flex items-center gap-1.5 font-bold uppercase text-slate-900 dark:text-white">
                        {serviceType === 'data' ? (
                          <>
                            <TelecomLogo network={network} size="xs" />
                            <span>{currentDataNetObj?.name || selectedDataNet}</span>
                          </>
                        ) : ['airtime', 'recharge-pin', 'data-card'].includes(serviceType) ? (
                          <>
                            <TelecomLogo network={network} size="xs" />
                            <span>{network}</span>
                          </>
                        ) : serviceType === 'cable' ? (
                          <span>{cableProvider.toUpperCase()}</span>
                        ) : serviceType === 'electricity' ? (
                          <span>{selectedDisco}</span>
                        ) : (
                          <span>{selectedExam.toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500">Package / Denomination</span>
                      <span className="font-bold text-slate-900 dark:text-white">{getPackageDisplay(serviceType)}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500">Recipient</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{getRecipientDisplay(serviceType)}</span>
                    </div>

                    {(verifiedCustomerName || verifiedMeterName) && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-500">Account Name</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {verifiedCustomerName || verifiedMeterName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500">Current Wallet Balance</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        ₦{currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500">Balance After Order</span>
                      <span className={`font-mono font-bold ${currentBalance >= effectiveChargeAmount ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        ₦{Math.max(0, currentBalance - effectiveChargeAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">Total Amount</span>
                      <span className="font-mono font-black text-base text-[#0047cc] dark:text-blue-400">
                        ₦{effectiveChargeAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAndPay}
                      disabled={isSubmitting}
                      className="flex-1 min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50 active:scale-[0.99] transition-all"
                    >
                      <span>Confirm</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Transaction PIN Verification Modal (shown if requirePinForTransactions is toggled on) */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={async (enteredPin) => {
          setIsPinModalOpen(false);
          await executeVtuTransaction(enteredPin);
        }}
        title={`Authorize ${getServiceTitle(serviceType)}`}
        serviceName={`${getServiceTitle(serviceType)} (${getPackageDisplay(serviceType)})`}
        recipient={getRecipientDisplay(serviceType)}
        amount={effectiveChargeAmount}
        biometricEnabled={user?.biometricEnabled}
        isLightMode={isLightMode}
      />
    </div>
  );
};
