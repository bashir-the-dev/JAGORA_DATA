import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NetworkId, DataPlan, UserProfile, Transaction } from '../../types';
import { networkProviders, dataPlans } from '../../data/mockData';
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
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import { humanizeVtuError } from '../../utils/errorParser';
import { apiGetPricingSettings, apiGetVtuPlans, apiVerifyBiller } from '../../services/apiClient';
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

export const VtuTransactionWizard: React.FC<VtuTransactionWizardProps> = ({
  user,
  initialServiceType = 'data',
  initialNetwork = 'mtn',
  onBuyData,
  onAirtimeSuccess,
  onPaymentSuccess,
  onNavigateBack,
  isLightMode,
  isMaintenanceMode,
}) => {
  // ---------------------------------------------------------------------------
  // 1. SINGLE PARENT STATE FOR 4-STEP LINEAR WIZARD
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [serviceType, setServiceType] = useState<VtuServiceType>(initialServiceType);
  const [network, setNetwork] = useState<NetworkId>(initialNetwork);
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [isManualNetworkOverride, setIsManualNetworkOverride] = useState(false);

  // Data specifics
  const [plans, setPlans] = useState<DataPlan[]>(dataPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('mtn-1gb');
  const [planCategory, setPlanCategory] = useState<'ALL' | 'SME' | 'CG' | 'DIRECT'>('ALL');

  // Airtime specifics
  const [amount, setAmount] = useState<number>(500);

  // Cable specifics
  const [cableProvider, setCableProvider] = useState<'gotv' | 'dstv' | 'startimes' | 'showmax'>('gotv');
  const [smartcard, setSmartcard] = useState<string>('');
  const [verifiedCustomerName, setVerifiedCustomerName] = useState<string>('');
  const [isVerifyingIuc, setIsVerifyingIuc] = useState<boolean>(false);
  const [selectedBouquet, setSelectedBouquet] = useState<string>('GOtv Jinja');
  const [cablePrice, setCablePrice] = useState<number>(3300);

  // Electricity specifics
  const discos = [
    { id: 'KEDCO', name: 'KEDCO', full: 'Kano Electric', state: 'Kano / Katsina / Jigawa' },
    { id: 'AEDC', name: 'AEDC', full: 'Abuja Electric', state: 'FCT / Niger / Nasarawa' },
    { id: 'IKEDC', name: 'IKEDC', full: 'Ikeja Electric', state: 'Lagos Mainland' },
    { id: 'EKEDC', name: 'EKEDC', full: 'Eko Electric', state: 'Lagos Island' },
    { id: 'IBEDC', name: 'IBEDC', full: 'Ibadan Electric', state: 'Oyo / Ogun / Osun' },
    { id: 'PHED', name: 'PHED', full: 'Port Harcourt Electric', state: 'Rivers / Bayelsa' },
    { id: 'EEDC', name: 'EEDC', full: 'Enugu Electric', state: 'South East' },
    { id: 'KAEDCO', name: 'KAEDCO', full: 'Kaduna Electric', state: 'Kaduna / Sokoto' },
    { id: 'JED', name: 'JED', full: 'Jos Electric', state: 'Plateau / Bauchi' },
    { id: 'BEDC', name: 'BEDC', full: 'Benin Electric', state: 'Edo / Delta / Ondo' },
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
  const [examQuantity, setExamQuantity] = useState<number>(1);
  const [candidatePhone, setCandidatePhone] = useState<string>(user?.phone || '');

  // Recharge PIN specifics
  const [rechargeDenomination, setRechargeDenomination] = useState<number>(500);
  const [rechargeQuantity, setRechargeQuantity] = useState<number>(1);

  // Data Card specifics
  const [dataCardSize, setDataCardSize] = useState<string>('1.5GB');
  const [dataCardQuantity, setDataCardQuantity] = useState<number>(1);
  const [businessName, setBusinessName] = useState<string>('Al\'amin Enterprise');

  // Security & Execution
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);
  const [hasCopiedRef, setHasCopiedRef] = useState<boolean>(false);
  const [hasCopiedToken, setHasCopiedToken] = useState<boolean>(false);

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
      { name: 'GOtv Supa Plus', cost: 13900, channels: '90+ Premier Sports', duration: 'Monthly' },
    ],
    dstv: [
      { name: 'DSTV Padi', cost: 4400, channels: '45+ Channels', duration: 'Monthly' },
      { name: 'DSTV Yanga', cost: 5100, channels: '85+ Channels', duration: 'Monthly' },
      { name: 'DSTV Confam', cost: 9300, channels: '105+ Channels', duration: 'Monthly' },
      { name: 'DSTV Compact', cost: 15700, channels: '130+ Channels', duration: 'Monthly' },
      { name: 'DSTV Compact Plus', cost: 25000, channels: '145+ Channels', duration: 'Monthly' },
      { name: 'DSTV Premium', cost: 37000, channels: '160+ HD Channels', duration: 'Monthly' },
    ],
    startimes: [
      { name: 'Nova Bouquet', cost: 1700, channels: '25+ Channels', duration: 'Monthly' },
      { name: 'Basic Bouquet', cost: 3300, channels: '40+ Channels', duration: 'Monthly' },
      { name: 'Smart Bouquet', cost: 4200, channels: '60+ Channels', duration: 'Monthly' },
      { name: 'Classic Bouquet', cost: 5000, channels: '75+ Channels', duration: 'Monthly' },
      { name: 'Super Bouquet', cost: 8200, channels: '90+ HD Channels', duration: 'Monthly' },
    ],
    showmax: [
      { name: 'Showmax Mobile', cost: 1600, channels: 'Mobile Streaming', duration: '30 Days' },
      { name: 'Showmax Entertainment', cost: 2900, channels: 'Full HD & Series', duration: '30 Days' },
      { name: 'Showmax Pro Mobile', cost: 3200, channels: 'Live Sports & EPL', duration: '30 Days' },
    ],
  };

  // ---------------------------------------------------------------------------
  // 2. LIVE CATALOG & ADMIN PRICING SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    apiGetPricingSettings()
      .then((res) => {
        if (res.status === 'success' && res.data) {
          if (res.data.airtimeDiscounts) {
            setAirtimeDiscounts(res.data.airtimeDiscounts);
          }
          if (res.data.customPricing) {
            const custom = res.data.customPricing;
            setPlans((prev) =>
              prev
                .map((p) => {
                  const override = custom[p.id];
                  if (override) {
                    return {
                      ...p,
                      price: override.sellingPrice || p.price,
                    };
                  }
                  return p;
                })
                .filter((p) => {
                  const override = custom[p.id];
                  return !override || override.status !== 'paused';
                })
            );
          }
        }
      })
      .catch(() => {});

    apiGetVtuPlans()
      .then((res) => {
        if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          setPlans((prev) => {
            const serverPlans = res.data as DataPlan[];
            const seenIds = new Set<string>();
            const uniqueList: DataPlan[] = [];

            for (const sp of serverPlans) {
              const uKey = sp.id || `${sp.network}-${sp.size}-${(sp as any).api_plan_id || ''}`;
              if (!seenIds.has(uKey)) {
                seenIds.add(uKey);
                uniqueList.push({ ...sp, id: uKey });
              }
            }

            for (const local of prev) {
              const uKey = local.id || `${local.network}-${local.size}`;
              if (!seenIds.has(uKey)) {
                seenIds.add(uKey);
                uniqueList.push(local);
              }
            }
            return uniqueList;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Update initial network if phone changes for mobile services
  useEffect(() => {
    if (isManualNetworkOverride) return;
    if (['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType)) {
      const norm = normalizeNigerianPhone(phone);
      if (norm.detectedNetwork && norm.detectedNetwork !== network) {
        setNetwork(norm.detectedNetwork);
      }
    }
  }, [phone, isManualNetworkOverride, serviceType, network]);

  // Ensure selected plan matches network
  const availablePlans = plans.filter((p) => p.network === network);
  const activePlan = availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0] || plans[0];

  useEffect(() => {
    if (!availablePlans.some((p) => p.id === selectedPlanId) && availablePlans.length > 0) {
      setSelectedPlanId(availablePlans[0].id);
    }
  }, [network, availablePlans, selectedPlanId]);

  // Cable provider change handler
  const handleCableProviderChange = (p: 'gotv' | 'dstv' | 'startimes' | 'showmax') => {
    playTapSound();
    triggerHaptic('light');
    setCableProvider(p);
    setVerifiedCustomerName('');
    const first = cableBouquets[p][0];
    setSelectedBouquet(first.name);
    setCablePrice(first.cost);
  };

  // Live IUC verification
  const handleVerifyIuc = async () => {
    if (!smartcard || smartcard.trim().length < 8) {
      setErrorMessage('Please enter a valid Smartcard / IUC number (minimum 8 digits).');
      return;
    }
    playTapSound();
    setIsVerifyingIuc(true);
    setErrorMessage('');
    try {
      const res = await apiVerifyBiller({
        serviceType: 'CABLE',
        identifier: smartcard.trim(),
        provider: cableProvider === 'showmax' ? 'dstv' : cableProvider,
      });
      if (res.success && res.data?.customerName) {
        setVerifiedCustomerName(res.data.customerName);
        playSuccessChime();
        triggerHaptic('light');
      } else {
        setErrorMessage(res.message || 'Unable to verify Smartcard / IUC number with upstream provider.');
        playErrorTone();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Verification network request failed.');
      playErrorTone();
    } finally {
      setIsVerifyingIuc(false);
    }
  };

  // Live Meter verification
  const handleVerifyMeter = async () => {
    if (!meterNumber || meterNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid meter number (minimum 8 digits).');
      return;
    }
    playTapSound();
    setIsVerifyingMeter(true);
    setErrorMessage('');
    try {
      const res = await apiVerifyBiller({
        serviceType: 'ELECTRICITY',
        identifier: meterNumber.trim(),
        provider: selectedDisco,
        meterType,
      });
      if (res.success && res.data?.customerName) {
        setVerifiedMeterName(res.data.customerName);
        playSuccessChime();
        triggerHaptic('light');
      } else {
        setErrorMessage(res.message || 'Unable to verify meter with upstream electricity gateway.');
        playErrorTone();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Meter verification failed.');
      playErrorTone();
    } finally {
      setIsVerifyingMeter(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. FINANCIAL CALCULATIONS FOR EACH SERVICE TYPE
  // ---------------------------------------------------------------------------
  const currentDiscountRate = airtimeDiscounts[network] ?? 2.5;
  const airtimeDiscountAmount = Math.round((amount * currentDiscountRate) / 100);
  const airtimeChargeAmount = Math.max(1, amount - airtimeDiscountAmount);

  // Recharge PIN calculations
  const rechargeFaceValue = rechargeDenomination * rechargeQuantity;
  const rechargeDiscountAmount = Math.round(rechargeFaceValue * 0.02);
  const rechargeChargeAmount = rechargeFaceValue - rechargeDiscountAmount;

  // Data Card calculations
  const dataCardUnitPrices: Record<string, number> = {
    '1.5GB': 340,
    '2GB': 450,
    '5GB': 1100,
    '10GB': 2200,
  };
  const dataCardChargeAmount = (dataCardUnitPrices[dataCardSize] || 340) * dataCardQuantity;

  // Exam calculations
  const activeExamConfig = examProviders.find((e) => e.id === selectedExam) || examProviders[0];
  const examTotalAmount = activeExamConfig.unitPrice * examQuantity;

  // Unified Effective Charge and Face Amounts
  let effectiveFaceAmount = 0;
  let effectiveChargeAmount = 0;
  let effectiveDiscountAmount = 0;

  switch (serviceType) {
    case 'data':
      effectiveFaceAmount = activePlan?.price || 0;
      effectiveChargeAmount = activePlan?.price || 0;
      break;
    case 'airtime':
      effectiveFaceAmount = amount;
      effectiveChargeAmount = airtimeChargeAmount;
      effectiveDiscountAmount = airtimeDiscountAmount;
      break;
    case 'cable':
      effectiveFaceAmount = cablePrice;
      effectiveChargeAmount = cablePrice;
      break;
    case 'electricity':
      effectiveFaceAmount = meterAmount;
      effectiveChargeAmount = meterAmount;
      break;
    case 'exam':
      effectiveFaceAmount = examTotalAmount;
      effectiveChargeAmount = examTotalAmount;
      break;
    case 'recharge-pin':
      effectiveFaceAmount = rechargeFaceValue;
      effectiveChargeAmount = rechargeChargeAmount;
      effectiveDiscountAmount = rechargeDiscountAmount;
      break;
    case 'data-card':
      effectiveFaceAmount = dataCardChargeAmount;
      effectiveChargeAmount = dataCardChargeAmount;
      break;
  }

  const currentBalance = user?.balance || 0;
  const hasSufficientBalance = currentBalance >= effectiveChargeAmount;
  const phoneNorm = normalizeNigerianPhone(phone);

  // ---------------------------------------------------------------------------
  // 4. STEP VALIDATIONS
  // ---------------------------------------------------------------------------
  const isStep1Valid = Boolean(serviceType);

  let isStep2Valid = false;
  switch (serviceType) {
    case 'data':
      isStep2Valid = phoneNorm.isValid && hasSufficientBalance && Boolean(activePlan && activePlan.price > 0);
      break;
    case 'airtime':
      isStep2Valid = phoneNorm.isValid && hasSufficientBalance && amount >= 50 && amount <= 50000;
      break;
    case 'cable':
      isStep2Valid = smartcard.trim().length >= 8 && cablePrice > 0 && hasSufficientBalance;
      break;
    case 'electricity':
      isStep2Valid = meterNumber.trim().length >= 8 && meterAmount >= 500 && meterAmount <= 100000 && hasSufficientBalance;
      break;
    case 'exam':
      isStep2Valid = examQuantity >= 1 && examTotalAmount > 0 && hasSufficientBalance;
      break;
    case 'recharge-pin':
      isStep2Valid = rechargeQuantity >= 1 && rechargeChargeAmount > 0 && hasSufficientBalance;
      break;
    case 'data-card':
      isStep2Valid = dataCardQuantity >= 1 && dataCardChargeAmount > 0 && hasSufficientBalance;
      break;
  }

  const isStep3Valid = pin.length === 4;

  // ---------------------------------------------------------------------------
  // 5. STEP NAVIGATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleNextToStep2 = () => {
    if (!isStep1Valid) return;
    playTapSound();
    triggerHaptic('light');
    setErrorMessage('');
    setCurrentStep(2);
  };

  const handleNextToStep3 = () => {
    if (!isStep2Valid) {
      if (!hasSufficientBalance) {
        setErrorMessage(
          `Insufficient wallet balance. You need ₦${effectiveChargeAmount.toLocaleString()}, but have ₦${currentBalance.toLocaleString()}.`
        );
      } else if (['data', 'airtime'].includes(serviceType) && !phoneNorm.isValid) {
        setErrorMessage('Please enter a valid 11-digit Nigerian phone number.');
      } else if (serviceType === 'cable' && smartcard.trim().length < 8) {
        setErrorMessage('Please enter a valid Smartcard / IUC number (minimum 8 digits).');
      } else if (serviceType === 'electricity' && meterNumber.trim().length < 8) {
        setErrorMessage('Please enter a valid meter number (minimum 8 digits).');
      } else if (serviceType === 'electricity' && (meterAmount < 500 || meterAmount > 100000)) {
        setErrorMessage('Electricity recharge amount must be between ₦500 and ₦100,000.');
      } else {
        setErrorMessage('Please fill in all required fields accurately.');
      }
      playErrorTone();
      triggerHaptic('medium');
      return;
    }
    playTapSound();
    triggerHaptic('light');
    setErrorMessage('');
    setCurrentStep(3);
  };

  const handleBackToStep1 = () => {
    playTapSound();
    triggerHaptic('light');
    setErrorMessage('');
    setCurrentStep(1);
  };

  const handleBackToStep2 = () => {
    playTapSound();
    triggerHaptic('light');
    setErrorMessage('');
    setCurrentStep(2);
  };

  // ---------------------------------------------------------------------------
  // 6. TRANSACTION DISPATCH (CONFIRM & PAY)
  // ---------------------------------------------------------------------------
  const handleConfirmAndPay = async () => {
    if (!isStep3Valid || isSubmitting || isSubmittingRef.current) return;

    if (isMaintenanceMode) {
      setErrorMessage('System maintenance is currently in progress. VTU transactions are temporarily paused.');
      playErrorTone();
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');
    playTapSound();
    triggerHaptic('medium');

    const cleanRecipient = phoneNorm.cleaned;
    const balanceBefore = currentBalance;
    const refId = `AJD-${serviceType.toUpperCase()}-${Date.now()}`;

    try {
      let isSuccess = false;
      let resultMessage = '';
      let resultToken: string | null = null;
      let resultUnits: string | null = null;
      let resultPins: any[] | undefined = undefined;

      switch (serviceType) {
        case 'data':
          if (onBuyData) {
            isSuccess = await onBuyData(activePlan, cleanRecipient, pin);
            resultMessage = `${network.toUpperCase()} ${activePlan.size} Data bundle delivered to ${cleanRecipient}.`;
          } else {
            const res = await apiPurchaseData(activePlan, cleanRecipient, pin);
            isSuccess = res.success;
            resultMessage = res.message;
          }
          break;

        case 'airtime':
          if (onAirtimeSuccess) {
            isSuccess = await onAirtimeSuccess(network, cleanRecipient, amount, pin);
            resultMessage = `₦${amount.toLocaleString()} airtime successfully credited to ${cleanRecipient}.`;
          } else {
            const res = await apiPurchaseAirtime(network, cleanRecipient, amount, pin);
            isSuccess = res.success;
            resultMessage = res.message;
          }
          break;

        case 'cable': {
          const res = await apiSubscribeCable(
            cableProvider === 'showmax' ? 'dstv' : (cableProvider as any),
            smartcard.trim(),
            selectedBouquet,
            cablePrice,
            pin
          );
          isSuccess = res.success;
          resultMessage = res.message;
          if (isSuccess && onPaymentSuccess) {
            onPaymentSuccess({
              id: res.reference || refId,
              title: `Cable TV - ${cableProvider.toUpperCase()}`,
              subtitle: `${selectedBouquet} (${smartcard.trim()})`,
              amount: cablePrice,
              recipient: smartcard.trim(),
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              group: 'Today',
              status: 'SUCCESS',
              category: 'utility',
              iconType: 'tv',
              isCredit: false,
            });
          }
          break;
        }

        case 'electricity': {
          const res = await apiPayElectricity(selectedDisco, meterNumber.trim(), meterAmount, meterType, pin);
          isSuccess = res.success;
          resultMessage = res.message;
          resultToken = res.data?.token || null;
          resultUnits = res.data?.units || null;
          if (isSuccess && onPaymentSuccess) {
            onPaymentSuccess({
              id: res.reference || refId,
              title: `Electricity - ${selectedDisco}`,
              subtitle: `${meterType.toUpperCase()} (Meter: ${meterNumber.trim()})`,
              amount: meterAmount,
              recipient: meterNumber.trim(),
              token: resultToken || undefined,
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              group: 'Today',
              status: 'SUCCESS',
              category: 'utility',
              iconType: 'bolt',
              isCredit: false,
            });
          }
          break;
        }

        case 'exam': {
          const res = await apiBuyExamPin(selectedExam, examQuantity, candidatePhone, pin);
          isSuccess = res.success;
          resultMessage = res.message;
          resultPins = res.data;
          if (isSuccess && onPaymentSuccess) {
            onPaymentSuccess({
              id: res.reference || refId,
              title: `Exam PIN - ${selectedExam.toUpperCase()}`,
              subtitle: `${examQuantity}x ${selectedExam.toUpperCase()} Token`,
              amount: examTotalAmount,
              recipient: candidatePhone,
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              group: 'Today',
              status: 'SUCCESS',
              category: 'utility',
              iconType: 'pin',
              isCredit: false,
            });
          }
          break;
        }

        case 'recharge-pin': {
          const res = await apiGenerateRechargePin(network, rechargeDenomination, rechargeQuantity, pin);
          isSuccess = res.success;
          resultMessage = res.message;
          resultPins = res.data;
          if (isSuccess && onPaymentSuccess) {
            onPaymentSuccess({
              id: res.reference || refId,
              title: `Recharge PIN - ${network.toUpperCase()}`,
              subtitle: `${rechargeQuantity}x ₦${rechargeDenomination} PINs`,
              amount: rechargeChargeAmount,
              recipient: user.phone,
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              group: 'Today',
              status: 'SUCCESS',
              category: 'utility',
              iconType: 'pin',
              isCredit: false,
            });
          }
          break;
        }

        case 'data-card': {
          const res = await apiGenerateDataCard(network, dataCardSize, dataCardQuantity, pin);
          isSuccess = res.success;
          resultMessage = res.message;
          resultPins = res.data;
          if (isSuccess && onPaymentSuccess) {
            onPaymentSuccess({
              id: res.reference || refId,
              title: `Data Card - ${network.toUpperCase()}`,
              subtitle: `${dataCardQuantity}x ${dataCardSize} Vouchers`,
              amount: dataCardChargeAmount,
              recipient: user.phone,
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              group: 'Today',
              status: 'SUCCESS',
              category: 'utility',
              iconType: 'wifi',
              isCredit: false,
            });
          }
          break;
        }
      }

      if (isSuccess) {
        playSuccessChime();
        triggerConfetti();
        triggerHaptic('success');

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
          message: resultMessage || 'Transaction executed and delivered successfully!',
          timestamp: new Date().toLocaleString(),
          balanceBefore,
          balanceAfter: Math.max(0, balanceBefore - effectiveChargeAmount),
          token: resultToken,
          units: resultUnits,
          generatedPins: resultPins,
        });
        setCurrentStep(4);
      } else {
        throw new Error(resultMessage || 'Transaction was declined by gateway. Your wallet was refunded.');
      }
    } catch (err: any) {
      playErrorTone();
      triggerHaptic('warning');
      const friendlyMsg = humanizeVtuError(err?.message || 'Transaction could not be completed.');
      setErrorMessage(friendlyMsg);

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
        chargedAmount: 0,
        discountAmount: 0,
        message: friendlyMsg,
        timestamp: new Date().toLocaleString(),
        balanceBefore,
        balanceAfter: balanceBefore,
      });
      setCurrentStep(4);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const getServiceTitle = (type: VtuServiceType): string => {
    switch (type) {
      case 'data': return 'Mobile Data Bundle';
      case 'airtime': return 'Automated Airtime VTU';
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
  // 7. RESPONSIVE DESKTOP & MOBILE RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-xl lg:max-w-3xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 pt-4 overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            if (currentStep > 1 && currentStep < 4) {
              setCurrentStep((prev) => (prev - 1) as any);
            } else {
              onNavigateBack();
            }
          }}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white font-heading flex items-center justify-center gap-2">
            <span>Instant VTU Portal</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0047cc] dark:text-blue-300 text-[10px] sm:text-xs font-bold">
              Step {currentStep} of 4
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentStep === 1 && '1. Choose Service & Provider'}
            {currentStep === 2 && '2. Enter Details & Package'}
            {currentStep === 3 && '3. Review Order & Authorize'}
            {currentStep === 4 && '4. Official Digital Receipt'}
          </p>
        </div>

        <div className="min-w-[44px] text-right">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            {currentStep === 1 && '25%'}
            {currentStep === 2 && '50%'}
            {currentStep === 3 && '75%'}
            {currentStep === 4 && '100%'}
          </span>
        </div>
      </div>

      {/* Visual Stepper Bar (Responsive on Mobile & Desktop) */}
      <div className="mb-6 bg-white dark:bg-[#0c1322] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"
            initial={{ width: '25%' }}
            animate={{
              width:
                currentStep === 1
                  ? '25%'
                  : currentStep === 2
                  ? '50%'
                  : currentStep === 3
                  ? '75%'
                  : '100%',
            }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          {[
            { num: 1, title: 'Provider', desc: 'Select carrier' },
            { num: 2, title: 'Details', desc: 'Recipient & plan' },
            { num: 3, title: 'Review', desc: 'Verify & PIN' },
            { num: 4, title: 'Receipt', desc: 'Instant voucher' },
          ].map((item) => {
            const isPassed = currentStep > item.num;
            const isCurrent = currentStep === item.num;
            return (
              <div key={item.num} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isPassed
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#0047cc] text-white ring-4 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isPassed ? <Check size={14} strokeWidth={3} /> : item.num}
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-1.5 font-bold ${
                    isCurrent
                      ? 'text-[#0047cc] dark:text-blue-400'
                      : isPassed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {item.title}
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400">
                  {item.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="flex-1 font-medium">{errorMessage}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* STEP 1: SELECT (SERVICE & PROVIDER)                                     */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Service Switcher Tabs */}
          <div className="bg-white dark:bg-[#0c1322] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
              Service Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
              {[
                { id: 'data', label: 'Data', icon: Wifi },
                { id: 'airtime', label: 'Airtime', icon: Smartphone },
                { id: 'cable', label: 'Cable TV', icon: Tv },
                { id: 'electricity', label: 'Electricity', icon: Zap },
                { id: 'exam', label: 'Exam PIN', icon: GraduationCap },
                { id: 'recharge-pin', label: 'Airtime PIN', icon: Printer },
                { id: 'data-card', label: 'Data Card', icon: FileText },
              ].map((s) => {
                const Icon = s.icon;
                const isSelected = serviceType === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      triggerHaptic('light');
                      setServiceType(s.id as VtuServiceType);
                      setErrorMessage('');
                    }}
                    className={`min-h-[50px] p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0047cc] text-white shadow-md shadow-blue-500/20 font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[11px] truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Selection Card */}
          <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            {/* For Mobile Networks (Data, Airtime, Recharge PIN, Data Card) */}
            {['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Telecom Network
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    Instant 4G/5G Switch
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'mtn', name: 'MTN', badge: 'Fastest 5G', color: 'from-amber-400/20 to-yellow-500/10' },
                    { id: 'airtel', name: 'Airtel', badge: '3.0% OFF', color: 'from-red-400/20 to-rose-500/10' },
                    { id: 'glo', name: 'Glo', badge: '4.0% OFF', color: 'from-emerald-400/20 to-green-500/10' },
                    { id: '9mobile', name: '9mobile', badge: '4.5% OFF', color: 'from-lime-400/20 to-teal-500/10' },
                  ].map((item) => {
                    const isSelected = network === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setNetwork(item.id as NetworkId);
                          setIsManualNetworkOverride(true);
                        }}
                        className={`min-h-[82px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative active:scale-95 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <TelecomLogo network={item.id as NetworkId} size="sm" />
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#0047cc] text-white flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white uppercase">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {item.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* For Cable TV */}
            {serviceType === 'cable' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Cable TV Operator
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    Instant Signal Activation
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'gotv', name: 'GOtv', desc: 'Direct DTT' },
                    { id: 'dstv', name: 'DStv', desc: 'Direct DTH' },
                    { id: 'startimes', name: 'StarTimes', desc: 'Dish & Antenna' },
                    { id: 'showmax', name: 'Showmax', desc: 'Online Streaming' },
                  ].map((c) => {
                    const isSelected = cableProvider === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCableProviderChange(c.id as any)}
                        className={`min-h-[80px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Tv size={20} className={isSelected ? 'text-[#0047cc] dark:text-blue-400' : 'text-slate-500'} />
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#0047cc] text-white flex items-center justify-center">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{c.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* For Electricity Discos */}
            {serviceType === 'electricity' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Electricity Distribution Company (DISCO)
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    STS Token Ready
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
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
                          setVerifiedMeterName('');
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Zap size={16} className={isSelected ? 'text-amber-500' : 'text-slate-400'} />
                          {isSelected && <Check size={12} className="text-[#0047cc] dark:text-blue-400 stroke-[3]" />}
                        </div>
                        <div className="mt-1.5">
                          <div className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                            {d.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{d.state}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* For Exam PINs */}
            {serviceType === 'exam' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Examination Body
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    Official e-PIN Dispenser
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {examProviders.map((ex) => {
                    const isSelected = selectedExam === ex.id;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setSelectedExam(ex.id as any);
                        }}
                        className={`min-h-[88px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <GraduationCap size={20} className={isSelected ? 'text-[#0047cc]' : 'text-slate-400'} />
                          {isSelected && <Check size={12} className="text-[#0047cc] stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-heading font-extrabold text-sm text-slate-900 dark:text-white uppercase">
                            {ex.name}
                          </div>
                          <div className="text-[11px] font-bold text-[#0047cc] dark:text-blue-400">
                            ₦{ex.unitPrice.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Step 1 Continue CTA */}
          <button
            type="button"
            onClick={handleNextToStep2}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <span>Proceed to Step 2</span>
            <ArrowRight size={18} />
          </button>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* STEP 2: INPUT DETAILS & PACKAGE SELECTION                                */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          {/* SERVICE SPECIFIC INPUTS */}
          {/* A. MOBILE DATA SPECIFICS */}
          {serviceType === 'data' && (
            <>
              {/* Phone Input Card */}
              <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Recipient Phone Number
                  </label>
                  {phoneNorm.detectedNetwork && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                      phoneNorm.detectedNetwork === network 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-extrabold ring-1 ring-amber-400'
                    }`}>
                      Line: {phoneNorm.detectedNetwork}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <TelecomLogo network={network} size="xs" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhone(val);
                      setErrorMessage('');
                      const norm = normalizeNigerianPhone(val);
                      if (norm.detectedNetwork) {
                        if (norm.detectedNetwork !== network) {
                          setNetwork(norm.detectedNetwork);
                          setIsManualNetworkOverride(false);
                        }
                      } else {
                        setIsManualNetworkOverride(false);
                      }
                    }}
                    placeholder="08012345678"
                    className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Real-time Carrier Mismatch Warning Banner */}
                {phoneNorm.detectedNetwork && phoneNorm.detectedNetwork !== network && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                      <div className="text-amber-900 dark:text-amber-200">
                        <span className="font-bold">Carrier Mismatch Detected: </span>
                        <span>This number is an <strong className="uppercase font-mono">{phoneNorm.detectedNetwork}</strong> line, but you have <strong className="uppercase font-mono">{network}</strong> selected.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('medium');
                        setNetwork(phoneNorm.detectedNetwork!);
                        setIsManualNetworkOverride(false);
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <TelecomLogo network={phoneNorm.detectedNetwork} size="xs" />
                      <span>Switch to {phoneNorm.detectedNetwork.toUpperCase()}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Data Bundles Grid */}
              <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Bundle
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-[10px] font-bold">
                    {(['ALL', 'SME', 'CG'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPlanCategory(cat)}
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          planCategory === cat
                            ? 'bg-[#0047cc] text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {availablePlans
                    .filter((p) => {
                      if (planCategory === 'ALL') return true;
                      if (planCategory === 'SME') return p.type.includes('SME');
                      if (planCategory === 'CG') return p.type.includes('Corporate') || p.type.includes('CG');
                      return true;
                    })
                    .map((p, idx) => {
                      const isSelected = selectedPlanId === p.id;
                      const uniquePlanKey = `${p.id}-${(p as any).api_plan_id || (p as any).plan_id || p.size || 'plan'}-${idx}`;
                      return (
                        <button
                          key={uniquePlanKey}
                          type="button"
                          onClick={() => {
                            playTapSound();
                            triggerHaptic('light');
                            setSelectedPlanId(p.id);
                          }}
                          className={`min-h-[70px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                              {p.size}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#0047cc] dark:text-blue-300">
                              {p.type || 'SME'}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-bold text-[#0047cc] dark:text-blue-400">
                              ₦{p.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {p.validity || '30 Days'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          {/* B. AIRTIME SPECIFICS */}
          {serviceType === 'airtime' && (
            <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Recipient Phone Number
                  </label>
                  {phoneNorm.detectedNetwork && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                      phoneNorm.detectedNetwork === network 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-extrabold ring-1 ring-amber-400'
                    }`}>
                      Line: {phoneNorm.detectedNetwork}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <TelecomLogo network={network} size="xs" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhone(val);
                      setErrorMessage('');
                      const norm = normalizeNigerianPhone(val);
                      if (norm.detectedNetwork) {
                        if (norm.detectedNetwork !== network) {
                          setNetwork(norm.detectedNetwork);
                          setIsManualNetworkOverride(false);
                        }
                      } else {
                        setIsManualNetworkOverride(false);
                      }
                    }}
                    placeholder="08012345678"
                    className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Real-time Carrier Mismatch Warning Banner */}
                {phoneNorm.detectedNetwork && phoneNorm.detectedNetwork !== network && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                      <div className="text-amber-900 dark:text-amber-200">
                        <span className="font-bold">Carrier Mismatch Detected: </span>
                        <span>This number is an <strong className="uppercase font-mono">{phoneNorm.detectedNetwork}</strong> line, but you have <strong className="uppercase font-mono">{network}</strong> selected.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        triggerHaptic('medium');
                        setNetwork(phoneNorm.detectedNetwork!);
                        setIsManualNetworkOverride(false);
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <TelecomLogo network={phoneNorm.detectedNetwork} size="xs" />
                      <span>Switch to {phoneNorm.detectedNetwork.toUpperCase()}</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Recharge Amount (₦50 - ₦50,000)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-500">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setAmount(val);
                      setErrorMessage('');
                    }}
                    placeholder="500"
                    min={50}
                    max={50000}
                    className="w-full min-h-[48px] pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3">
                  {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setAmount(quick);
                      }}
                      className={`min-h-[42px] py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        amount === quick
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      ₦{quick.toLocaleString()}
                    </button>
                  ))}
                </div>

                {amount >= 50 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <span>Wholesale Discount ({currentDiscountRate}%):</span>
                    <span className="font-bold">
                      -₦{airtimeDiscountAmount.toLocaleString()} (You pay: ₦{airtimeChargeAmount.toLocaleString()})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. CABLE TV SPECIFICS */}
          {serviceType === 'cable' && (
            <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Smartcard / IUC Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={smartcard}
                    onChange={(e) => {
                      setSmartcard(e.target.value.replace(/[^0-9]/g, ''));
                      setVerifiedCustomerName('');
                      setErrorMessage('');
                    }}
                    placeholder="e.g. 1023847291"
                    maxLength={15}
                    className="flex-1 min-h-[48px] px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyIuc}
                    disabled={isVerifyingIuc || smartcard.trim().length < 8}
                    className="min-h-[48px] px-4 rounded-xl bg-[#0047cc] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isVerifyingIuc ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Verify IUC</span>
                  </button>
                </div>

                {verifiedCustomerName && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Customer: <strong>{verifiedCustomerName}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Select Bouquet Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {cableBouquets[cableProvider]?.map((b) => {
                    const isSelected = selectedBouquet === b.name;
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setSelectedBouquet(b.name);
                          setCablePrice(b.cost);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {b.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{b.channels} • {b.duration}</div>
                        </div>
                        <div className="font-mono font-bold text-sm text-[#0047cc] dark:text-blue-400">
                          ₦{b.cost.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* D. ELECTRICITY SPECIFICS */}
          {serviceType === 'electricity' && (
            <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Meter Type
                </span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['prepaid', 'postpaid'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMeterType(t)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                        meterType === t
                          ? 'bg-[#0047cc] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Meter Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={meterNumber}
                    onChange={(e) => {
                      setMeterNumber(e.target.value.replace(/[^0-9]/g, ''));
                      setVerifiedMeterName('');
                      setErrorMessage('');
                    }}
                    placeholder="e.g. 45019284712"
                    maxLength={15}
                    className="flex-1 min-h-[48px] px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyMeter}
                    disabled={isVerifyingMeter || meterNumber.trim().length < 8}
                    className="min-h-[48px] px-4 rounded-xl bg-[#0047cc] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isVerifyingMeter ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Verify Meter</span>
                  </button>
                </div>

                {verifiedMeterName && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Customer: <strong>{verifiedMeterName}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Recharge Amount (₦500 - ₦100,000)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-500">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={meterAmount || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setMeterAmount(val);
                      setErrorMessage('');
                    }}
                    placeholder="2000"
                    min={500}
                    max={100000}
                    className="w-full min-h-[48px] pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2.5">
                  {[1000, 2000, 3000, 5000, 10000, 20000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setMeterAmount(quick)}
                      className={`min-h-[40px] py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        meterAmount === quick
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      ₦{quick.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* E. EXAM PIN SPECIFICS */}
          {serviceType === 'exam' && (
            <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Quantity of Examination PIN(s)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 5, 10].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setExamQuantity(q)}
                      className={`min-h-[44px] py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        examQuantity === q
                          ? 'bg-[#0047cc] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {q} {q === 1 ? 'PIN' : 'PINs'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Candidate Delivery Phone
                </label>
                <input
                  type="tel"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* F. RECHARGE PIN SPECIFICS */}
          {serviceType === 'recharge-pin' && (
            <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Denomination
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((den) => (
                    <button
                      key={den}
                      type="button"
                      onClick={() => setRechargeDenomination(den)}
                      className={`min-h-[44px] py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        rechargeDenomination === den
                          ? 'bg-[#0047cc] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ₦{den}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Quantity
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 5, 10, 20].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setRechargeQuantity(q)}
                      className={`min-h-[44px] py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        rechargeQuantity === q
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {q} pcs
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* G. DATA CARD SPECIFICS */}
          {serviceType === 'data-card' && (
            <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Data Card Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1.5GB', '2GB', '5GB', '10GB'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setDataCardSize(sz)}
                      className={`min-h-[44px] py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        dataCardSize === sz
                          ? 'bg-[#0047cc] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Quantity of Vouchers
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 5, 10, 20].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDataCardQuantity(q)}
                      className={`min-h-[44px] py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        dataCardQuantity === q
                          ? 'bg-[#0047cc] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {q} cards
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Wallet Balance Check */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <WalletImpactPill
              currentBalance={currentBalance}
              cost={effectiveChargeAmount}
            />
          </div>

          {/* Step 2 Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackToStep1}
              className="min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextToStep3}
              disabled={!isStep2Valid}
              className="min-h-[48px] py-3 px-4 rounded-xl bg-[#0047cc] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 disabled:pointer-events-none"
            >
              <span>Review Order</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* STEP 3: REVIEW ORDER (SIMPLICITY, CLARITY, ACCURACY & AUTHORIZATION)    */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          {/* Reassurance Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Instant Carrier Fulfillment</span>
            </span>
            <span className="text-[11px] font-mono opacity-90">Auto-Refund Guarantee</span>
          </div>

          {/* HERO AMOUNT CARD (Hick's Law: Immediate unambiguous comprehension) */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-900 dark:to-[#0c1322] border border-blue-200/80 dark:border-blue-900/60 text-center shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Amount to Debit
            </span>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0047cc] dark:text-blue-400 my-1 font-mono tracking-tight">
              ₦{effectiveChargeAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {effectiveDiscountAmount > 0 && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                Saved ₦{effectiveDiscountAmount.toLocaleString()} via wholesale discount
              </span>
            )}
          </div>

          {/* STREAMLINED SPECIFICATION BREAKDOWN */}
          <div className="bg-white dark:bg-[#0c1322] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3">
              <span className="text-slate-500 dark:text-slate-400">Service</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {getServiceTitle(serviceType)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-500 dark:text-slate-400">Operator / Biller</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase">
                {['data', 'airtime', 'recharge-pin', 'data-card'].includes(serviceType) ? (
                  <>
                    <TelecomLogo network={network} size="xs" />
                    <span>{network}</span>
                  </>
                ) : serviceType === 'cable' ? (
                  <span>{cableProvider}</span>
                ) : serviceType === 'electricity' ? (
                  <span>{selectedDisco}</span>
                ) : (
                  <span>{selectedExam}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-500 dark:text-slate-400">
                {serviceType === 'cable'
                  ? 'Smartcard (IUC)'
                  : serviceType === 'electricity'
                  ? 'Meter Number'
                  : serviceType === 'exam'
                  ? 'Candidate'
                  : 'Recipient'}
              </span>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {getRecipientDisplay(serviceType)}
                </span>
                {(verifiedCustomerName || verifiedMeterName) && (
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {verifiedCustomerName || verifiedMeterName}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-500 dark:text-slate-400">Package / Details</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {getPackageDisplay(serviceType)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-500 dark:text-slate-400">Convenience Fee</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₦0.00 (Free)</span>
            </div>
          </div>

          {/* WALLET BALANCE TRANSPARENCY CARD */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <div>
              <div className="text-slate-500">Current Balance</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                ₦{currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Balance After Debit</div>
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                ₦{Math.max(0, currentBalance - effectiveChargeAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 4-DIGIT PIN INPUT CARD */}
          <div className="bg-white dark:bg-[#0c1322] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock size={14} className="text-blue-600" />
                <span>Enter 4-Digit Transaction PIN</span>
              </label>
              <span className="text-[11px] text-slate-500">Security Check</span>
            </div>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                setPin(val);
                setErrorMessage('');
              }}
              placeholder="••••"
              className="w-full min-h-[52px] text-center tracking-[1em] text-2xl font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Authorize instant wallet debit with your secure 4-digit PIN.
            </p>
          </div>

          {/* Step 3 Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackToStep2}
              disabled={isSubmitting}
              className="min-h-[50px] py-3.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              <span>Back (Edit)</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmAndPay}
              disabled={!isStep3Valid || isSubmitting}
              className="min-h-[50px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <FintechButtonLoader text="Connecting Gateway..." />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Confirm & Pay ₦{effectiveChargeAmount.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* STEP 4: RECEIPT (SUCCESS / FAILED WITH RICH VOUCHER/TOKEN DISPLAY)      */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 4 && receipt && (
        <motion.div
          key="step4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          {/* Status Banner */}
          <div
            className={`p-6 rounded-3xl text-center flex flex-col items-center justify-center ${
              receipt.status === 'SUCCESS'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-rose-500/20'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 text-white backdrop-blur-xs">
              {receipt.status === 'SUCCESS' ? (
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              ) : (
                <AlertCircle size={36} className="stroke-[2.5]" />
              )}
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {receipt.status === 'SUCCESS'
                ? `${receipt.title} Successful!`
                : 'Transaction Failed'}
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-sm font-medium">
              {receipt.message}
            </p>
          </div>

          {/* STS Prepaid Electricity Token Display */}
          {receipt.status === 'SUCCESS' && receipt.token && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Generated STS Prepaid Token
              </span>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-amber-950 dark:text-amber-100 tracking-wider select-all">
                {receipt.token}
              </div>
              {receipt.units && (
                <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                  Units Generated: <strong>{receipt.units}</strong>
                </div>
              )}
              <button
                type="button"
                onClick={handleCopyToken}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                {hasCopiedToken ? <Check size={14} /> : <Copy size={14} />}
                <span>{hasCopiedToken ? 'Copied Token!' : 'Copy Prepaid Token'}</span>
              </button>
            </div>
          )}

          {/* Generated Exam or Recharge PINs Display */}
          {receipt.status === 'SUCCESS' && receipt.generatedPins && receipt.generatedPins.length > 0 && (
            <div className="bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dispensed PIN(s) ({receipt.generatedPins.length})
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Ready to Print / Recharge</span>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {receipt.generatedPins.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-slate-400 font-mono text-[10px]">PIN #{idx + 1}: </span>
                      <strong className="font-mono font-bold text-slate-900 dark:text-white select-all">
                        {item.pin}
                      </strong>
                      {item.serial && (
                        <div className="text-[10px] text-slate-500 font-mono">SN: {item.serial}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(item.pin);
                        triggerHaptic('light');
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-700 font-semibold text-[11px] cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Digital Receipt Card */}
          <div className="bg-white dark:bg-[#0c1322] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Official Digital Receipt
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                className="text-[11px] font-bold text-[#0047cc] dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                {hasCopiedRef ? <Check size={12} /> : <Copy size={12} />}
                <span>{hasCopiedRef ? 'Copied' : 'Copy Ref'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white select-all">
                  {receipt.reference}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-slate-900 dark:text-white">{receipt.title}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Recipient / Target</span>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{receipt.recipient}</div>
                  {receipt.customerName && (
                    <div className="text-[11px] font-bold text-emerald-600">{receipt.customerName}</div>
                  )}
                </div>
              </div>

              {receipt.planName && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Package / Details</span>
                  <span className="font-bold text-slate-900 dark:text-white">{receipt.planName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                  ₦{receipt.chargedAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{receipt.timestamp}</span>
              </div>

              {receipt.balanceAfter !== undefined && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">New Wallet Balance</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{receipt.balanceAfter.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetWizard}
              className="min-h-[50px] py-3.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw size={16} />
              <span>New Transaction</span>
            </button>

            <button
              type="button"
              onClick={onNavigateBack}
              className="min-h-[50px] py-3.5 px-4 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span>Return Home</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
