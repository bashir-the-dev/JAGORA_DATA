import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NetworkId, DataPlan, UserProfile } from '../../types';
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
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import { humanizeVtuError } from '../../utils/errorParser';
import { apiGetPricingSettings, apiGetVtuPlans } from '../../services/apiClient';
import {
  playTapSound,
  playErrorTone,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

export type VtuServiceType = 'data' | 'airtime';

export interface VtuTransactionWizardProps {
  user: UserProfile;
  initialServiceType?: VtuServiceType;
  initialNetwork?: NetworkId;
  onBuyData: (plan: DataPlan, phone: string, pin?: string) => boolean | Promise<boolean>;
  onAirtimeSuccess: (network: string, phone: string, amount: number, pin?: string) => boolean | Promise<boolean>;
  onNavigateBack: () => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

interface TransactionReceiptData {
  status: 'SUCCESS' | 'FAILED';
  reference: string;
  serviceType: VtuServiceType;
  network: NetworkId;
  recipient: string;
  planName?: string;
  faceAmount: number;
  chargedAmount: number;
  discountAmount: number;
  message: string;
  timestamp: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export const VtuTransactionWizard: React.FC<VtuTransactionWizardProps> = ({
  user,
  initialServiceType = 'data',
  initialNetwork = 'mtn',
  onBuyData,
  onAirtimeSuccess,
  onNavigateBack,
  isLightMode,
  isMaintenanceMode,
}) => {
  // ---------------------------------------------------------------------------
  // 1. SINGLE PARENT STATE FOR LINEAR WIZARD
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
  const [amount, setAmount] = useState<number>(100);

  // Security & Execution
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);
  const [hasCopiedRef, setHasCopiedRef] = useState(false);

  // Wholesale Airtime Discounts (live updated by admin)
  const [airtimeDiscounts, setAirtimeDiscounts] = useState<Record<string, number>>({
    mtn: 2.5,
    airtel: 3.0,
    glo: 4.0,
    '9mobile': 4.5,
  });

  // Lockout ref against rapid double clicks
  const isSubmittingRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // 2. LIVE CATALOG & ADMIN PRICING SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Fetch live custom prices & discounts
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

    // 2. Fetch authoritative unified VTU catalog from server
    apiGetVtuPlans()
      .then((res) => {
        if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          setPlans((prev) => {
            const serverPlans = res.data as DataPlan[];
            // Merge with local fallback to preserve icons and categories
            const merged = [...serverPlans];
            for (const local of prev) {
              if (!merged.some((m) => m.id === local.id)) {
                merged.push(local);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Update initial network if phone changes
  useEffect(() => {
    if (isManualNetworkOverride) return;
    const norm = normalizeNigerianPhone(phone);
    if (norm.detectedNetwork && norm.detectedNetwork !== network) {
      setNetwork(norm.detectedNetwork);
    }
  }, [phone, isManualNetworkOverride]);

  // Ensure selected plan matches network
  const availablePlans = plans.filter((p) => p.network === network);
  const activePlan = availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0] || plans[0];

  useEffect(() => {
    if (!availablePlans.some((p) => p.id === selectedPlanId) && availablePlans.length > 0) {
      setSelectedPlanId(availablePlans[0].id);
    }
  }, [network, availablePlans]);

  // Calculate pricing & discounts
  const currentDiscountRate = airtimeDiscounts[network] ?? 2.5;
  const airtimeDiscountAmount = Math.round((amount * currentDiscountRate) / 100);
  const airtimeChargeAmount = Math.max(1, amount - airtimeDiscountAmount);

  const effectiveChargeAmount = serviceType === 'data' ? (activePlan?.price || 0) : airtimeChargeAmount;
  const effectiveFaceAmount = serviceType === 'data' ? (activePlan?.price || 0) : amount;
  const currentBalance = user?.balance || 0;
  const hasSufficientBalance = currentBalance >= effectiveChargeAmount;

  // ---------------------------------------------------------------------------
  // 3. STEP VALIDATION CHECKS
  // ---------------------------------------------------------------------------
  const isStep1Valid = Boolean(network && serviceType);

  const phoneNorm = normalizeNigerianPhone(phone);
  const isPhoneValid = phoneNorm.isValid;

  const isStep2Valid =
    isPhoneValid &&
    hasSufficientBalance &&
    (serviceType === 'data' ? Boolean(activePlan && activePlan.price > 0) : amount >= 50 && amount <= 50000);

  const isStep3Valid = pin.length === 4;

  // ---------------------------------------------------------------------------
  // 4. STEP NAVIGATION HANDLERS (PRESERVING ALL ENTERED DATA)
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
      if (!isPhoneValid) {
        setErrorMessage('Please enter a valid 11-digit Nigerian phone number.');
      } else if (!hasSufficientBalance) {
        setErrorMessage(`Insufficient wallet balance. You need ₦${effectiveChargeAmount.toLocaleString()}, but have ₦${currentBalance.toLocaleString()}.`);
      } else if (serviceType === 'airtime' && (amount < 50 || amount > 50000)) {
        setErrorMessage('Airtime recharge amount must be between ₦50 and ₦50,000.');
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
  // 5. TRANSACTION DISPATCH (CONFIRM & PAY)
  // ---------------------------------------------------------------------------
  const handleConfirmAndPay = async () => {
    if (!isStep3Valid || isSubmitting || isSubmittingRef.current) return;

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

      if (serviceType === 'data') {
        if (!activePlan) throw new Error('Selected data plan is invalid.');
        isSuccess = await onBuyData(activePlan, cleanRecipient, pin);
      } else {
        isSuccess = await onAirtimeSuccess(network, cleanRecipient, amount, pin);
      }

      if (isSuccess) {
        playSuccessChime();
        triggerConfetti();
        triggerHaptic('success');

        setReceipt({
          status: 'SUCCESS',
          reference: refId,
          serviceType,
          network,
          recipient: cleanRecipient,
          planName: serviceType === 'data' ? `${activePlan?.size} (${activePlan?.type})` : undefined,
          faceAmount: effectiveFaceAmount,
          chargedAmount: effectiveChargeAmount,
          discountAmount: serviceType === 'airtime' ? airtimeDiscountAmount : 0,
          message:
            serviceType === 'data'
              ? `${activePlan ? `${activePlan.size} (${activePlan.type})` : 'Data bundle'} successfully dispatched to ${cleanRecipient}.`
              : `₦${amount.toLocaleString()} airtime successfully credited to ${cleanRecipient}.`,
          timestamp: new Date().toLocaleString(),
          balanceBefore,
          balanceAfter: Math.max(0, balanceBefore - effectiveChargeAmount),
        });
        setCurrentStep(4);
      } else {
        throw new Error('Transaction was declined by telecom gateway. Your wallet was refunded.');
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
        network,
        recipient: cleanRecipient,
        planName: serviceType === 'data' ? `${activePlan?.size} (${activePlan?.type})` : undefined,
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

  // ---------------------------------------------------------------------------
  // 6. RENDER 4-STEP LINEAR WIZARD
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 sm:px-6 pt-3 overflow-x-hidden">
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
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center justify-center gap-1.5">
            <span>Instant VTU Purchase</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0047cc] dark:text-blue-300 text-[10px] font-bold">
              Step {currentStep} of 4
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentStep === 1 && 'Select Network & Service Type'}
            {currentStep === 2 && 'Enter Recipient & Amount'}
            {currentStep === 3 && 'Review Order & Enter PIN'}
            {currentStep === 4 && 'Digital Transaction Receipt'}
          </p>
        </div>

        <div className="min-w-[44px] text-right">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {currentStep === 1 && '25%'}
            {currentStep === 2 && '50%'}
            {currentStep === 3 && '75%'}
            {currentStep === 4 && '100%'}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar (4 Linear Steps) */}
      <div className="mb-6">
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

        {/* Step Nodes */}
        <div className="grid grid-cols-4 gap-1 mt-2.5 text-center">
          {[
            { num: 1, title: 'Select' },
            { num: 2, title: 'Input' },
            { num: 3, title: 'Review' },
            { num: 4, title: 'Receipt' },
          ].map((item) => {
            const isPassed = currentStep > item.num;
            const isCurrent = currentStep === item.num;
            return (
              <div key={item.num} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isPassed
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#0047cc] text-white ring-4 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isPassed ? <Check size={12} strokeWidth={3} /> : item.num}
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold ${
                    isCurrent
                      ? 'text-[#0047cc] dark:text-blue-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="flex-1 font-medium">{errorMessage}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* STEP 1: SELECT (NETWORK & SERVICE TYPE)                                  */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* 1. Network Selection */}
          <div className="bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              1. Choose Telecom Operator
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'mtn', name: 'MTN', color: '#ffdb3c', badge: 'Fastest 5G', border: 'border-yellow-400' },
                { id: 'airtel', name: 'Airtel', color: '#ff5252', badge: '3.0% OFF', border: 'border-red-400' },
                { id: 'glo', name: 'Glo', color: '#00c853', badge: '4.0% OFF', border: 'border-emerald-400' },
                { id: '9mobile', name: '9mobile', color: '#4caf50', badge: '4.5% OFF', border: 'border-lime-400' },
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
                    className={`min-h-[64px] p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative active:scale-95 ${
                      isSelected
                        ? `bg-blue-50/80 dark:bg-blue-950/40 border-2 border-[#0047cc] dark:border-blue-500 shadow-sm`
                        : `bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0047cc] text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                    <TelecomLogo network={item.id as NetworkId} size="sm" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Service Type Selection (Data vs Airtime) */}
          <div className="bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              2. Select Service Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Mobile Data */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  setServiceType('data');
                }}
                className={`min-h-[80px] p-4 rounded-2xl border flex flex-col items-start justify-between transition-all cursor-pointer active:scale-95 ${
                  serviceType === 'data'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-xl ${serviceType === 'data' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'}`}>
                    <Wifi size={20} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${serviceType === 'data' ? 'bg-white/25 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-[#0047cc]'}`}>
                    SME / CG / Gifting
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm mt-2">Mobile Data</h3>
                  <p className={`text-[11px] ${serviceType === 'data' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    Direct high-speed internet bundle
                  </p>
                </div>
              </button>

              {/* Airtime VTU */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  setServiceType('airtime');
                }}
                className={`min-h-[80px] p-4 rounded-2xl border flex flex-col items-start justify-between transition-all cursor-pointer active:scale-95 ${
                  serviceType === 'airtime'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-xl ${serviceType === 'airtime' ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'}`}>
                    <Smartphone size={20} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${serviceType === 'airtime' ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700'}`}>
                    Up to 4.5% OFF
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm mt-2">Airtime VTU</h3>
                  <p className={`text-[11px] ${serviceType === 'airtime' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    Instant automated airtime recharge
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action Step 1 -> Step 2 */}
          <button
            type="button"
            onClick={handleNextToStep2}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <span>Continue to Input Details</span>
            <ArrowRight size={18} />
          </button>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* STEP 2: INPUT (PHONE & AMOUNT OR DATA PLAN)                             */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          {/* Selected Summary Pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <TelecomLogo network={network} size="sm" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                  {network} • {serviceType === 'data' ? 'Mobile Data' : 'Airtime VTU'}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {serviceType === 'airtime' ? `${currentDiscountRate}% discount applied` : 'Wholesale synced catalog'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBackToStep1}
              className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline px-2 py-1"
            >
              Change
            </button>
          </div>

          {/* Phone Number Input */}
          <div className="bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Recipient Phone Number</span>
              </label>
              {user?.phone && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setPhone(user.phone);
                    setIsManualNetworkOverride(false);
                  }}
                  className="text-[11px] font-semibold text-[#0047cc] dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <BookUser size={13} />
                  <span>My Line</span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Smartphone size={18} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="0801 234 5678"
                maxLength={11}
                className="w-full min-h-[48px] pl-10 pr-24 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isPhoneValid ? (
                  <span className="text-emerald-500 flex items-center gap-1 text-[11px] font-bold">
                    <CheckCircle2 size={16} />
                    <span>Valid</span>
                  </span>
                ) : (
                  phone.length > 0 && (
                    <span className="text-amber-500 text-[10px] font-bold">
                      {11 - phone.replace(/[^0-9]/g, '').length} digits left
                    </span>
                  )
                )}
              </div>
            </div>
            {phoneNorm.detectedNetwork && phoneNorm.detectedNetwork !== network && (
              <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Note: Phone prefix appears to be {phoneNorm.detectedNetwork.toUpperCase()}. You are buying for {network.toUpperCase()}.
              </p>
            )}
          </div>

          {/* Conditional Input: Data Plans vs Airtime Amount */}
          {serviceType === 'data' ? (
            <div className="bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Data Bundle
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

              {/* Data Plan Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                {availablePlans
                  .filter((p) => {
                    if (planCategory === 'ALL') return true;
                    if (planCategory === 'SME') return p.type.includes('SME');
                    if (planCategory === 'CG') return p.type.includes('Corporate') || p.type.includes('CG');
                    return true;
                  })
                  .map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic('light');
                          setSelectedPlanId(p.id);
                        }}
                        className={`min-h-[68px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative active:scale-95 ${
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
          ) : (
            <div className="bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Airtime Amount (₦50 - ₦50,000)
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

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setAmount(quick);
                    }}
                    className={`min-h-[44px] py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      amount === quick
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    ₦{quick.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Discount Cashback Preview */}
              {amount >= 50 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span>
                    Wholesale Discount ({currentDiscountRate}%):
                  </span>
                  <span className="font-bold">
                    -₦{airtimeDiscountAmount.toLocaleString()} (You pay: ₦{airtimeChargeAmount.toLocaleString()})
                  </span>
                </div>
              )}
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
      {/* STEP 3: REVIEW (SUMMARY & PIN VERIFICATION BEFORE DISPATCH)              */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          {/* Order Review Card */}
          <div className="bg-white dark:bg-[#0c1322] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Order Review & Summary
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Verified Carrier Route</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Operator Network</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase">
                  <TelecomLogo network={network} size="xs" />
                  <span>{network}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Service Category</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {serviceType === 'data' ? 'High-Speed Mobile Data' : 'Automated Airtime VTU'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Recipient Phone</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {phoneNorm.formatted}
                </span>
              </div>

              {serviceType === 'data' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Data Plan</span>
                  <span className="font-bold text-[#0047cc] dark:text-blue-400">
                    {activePlan ? `${activePlan.size} (${activePlan.type})` : 'Data Plan'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Face Value</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  ₦{effectiveFaceAmount.toLocaleString()}
                </span>
              </div>

              {serviceType === 'airtime' && airtimeDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Cashback Discount ({currentDiscountRate}%)</span>
                  <span>-₦{airtimeDiscountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Total Amount to Pay</span>
                <span className="font-mono font-extrabold text-base text-[#0047cc] dark:text-blue-400">
                  ₦{effectiveChargeAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 4-Digit Transaction PIN Input */}
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
              className="w-full min-h-[52px] text-center tracking-[1em] text-2xl font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Enter your secure 4-digit PIN to authorize this direct wallet debit.
            </p>
          </div>

          {/* Step 3 Navigation Buttons */}
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
      {/* STEP 4: RECEIPT (SUCCESS OR FAILURE SCREEN)                              */}
      {/* ----------------------------------------------------------------------- */}
      {currentStep === 4 && receipt && (
        <motion.div
          key="step4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          {/* Status Header Banner */}
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
                ? receipt.serviceType === 'data'
                  ? 'Data Bundle Delivered!'
                  : 'Airtime Recharge Successful!'
                : 'Transaction Failed'}
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-xs font-medium">
              {receipt.message}
            </p>
          </div>

          {/* Official Digital Receipt Card */}
          <div className="bg-white dark:bg-[#0c1322] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Official VTU Receipt
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                className="text-[11px] font-bold text-[#0047cc] dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                {hasCopiedRef ? <Check size={12} /> : <Copy size={12} />}
                <span>{hasCopiedRef ? 'Copied' : 'Copy Ref'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Transaction Ref</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px]">
                  {receipt.reference}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Network Provider</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">
                  {receipt.network}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Recipient Phone</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {receipt.recipient}
                </span>
              </div>

              {receipt.planName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Plan Delivered</span>
                  <span className="font-bold text-[#0047cc] dark:text-blue-400">
                    {receipt.planName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Amount Charged</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₦{receipt.chargedAmount.toLocaleString()}
                </span>
              </div>

              {receipt.balanceAfter !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Remaining Balance</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{receipt.balanceAfter.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {receipt.timestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleResetWizard}
              className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-[#0047cc] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <RotateCcw size={16} />
              <span>Make Another Purchase</span>
            </button>

            <button
              type="button"
              onClick={onNavigateBack}
              className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
