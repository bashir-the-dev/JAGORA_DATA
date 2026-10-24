import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tv,
  Zap,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Clock,
  Sparkles,
  Search,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { UserProfile, Transaction } from '../../types';
import { PinVerificationModal } from '../modals/PinVerificationModal';
import { OrderConfirmationModal, OrderConfirmationDetails } from '../modals/OrderConfirmationModal';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { humanizeVtuError } from '../../utils/errorParser';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import {
  apiSubscribeCable,
  apiPayElectricity,
  apiBuyExamPin,
} from '../../services/vtuService';
import { apiVerifyBiller } from '../../services/apiClient';
import {
  playTapSound,
  playErrorTone,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

export type BillCategoryTab = 'cable' | 'electricity' | 'exam';

interface BillsScreenProps {
  user: UserProfile;
  onPaymentSuccess: (tx: Transaction) => void;
  onNavigateBack: () => void;
  initialTab?: BillCategoryTab;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

export const BillsScreen: React.FC<BillsScreenProps> = ({
  user,
  onPaymentSuccess,
  onNavigateBack,
  initialTab = 'cable',
  isLightMode,
  isMaintenanceMode,
}) => {
  const [activeTab, setActiveTab] = useState<BillCategoryTab>(initialTab);

  // Sync if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Common UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  // -------------------------------------------------------------
  // 1. CABLE TV STATE & DATA
  // -------------------------------------------------------------
  const [cableProvider, setCableProvider] = useState<'gotv' | 'dstv' | 'startimes' | 'showmax'>('gotv');
  const [smartcard, setSmartcard] = useState('');
  const [verifiedCustomerName, setVerifiedCustomerName] = useState<string>('');
  const [isVerifyingIuc, setIsVerifyingIuc] = useState(false);
  const [selectedBouquet, setSelectedBouquet] = useState('GOtv Jinja');
  const [cablePrice, setCablePrice] = useState(3300);

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
      { name: 'DSTV Compact', cost: 15700, channels: '130+ Channels (Premier League)', duration: 'Monthly' },
      { name: 'DSTV Compact Plus', cost: 25000, channels: '145+ Channels (Champions League)', duration: 'Monthly' },
      { name: 'DSTV Premium', cost: 37000, channels: '160+ HD Channels & Showmax', duration: 'Monthly' },
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

  const savedCableAccounts: Array<{ label: string; iuc: string; provider: 'gotv' | 'dstv' | 'startimes' }> = [];

  const handleProviderChange = (p: 'gotv' | 'dstv' | 'startimes' | 'showmax') => {
    playTapSound();
    triggerHaptic('light');
    setCableProvider(p);
    setErrorMessage('');
    const first = cableBouquets[p][0];
    setSelectedBouquet(first.name);
    setCablePrice(first.cost);
  };

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
        provider: cableProvider === 'showmax' ? 'dstv' : cableProvider
      });
      if (res.success && res.data?.customerName) {
        setVerifiedCustomerName(res.data.customerName);
        playSuccessChime();
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

  // -------------------------------------------------------------
  // 2. ELECTRICITY STATE & DATA
  // -------------------------------------------------------------
  const discos = [
    { id: 'IKEDC', name: 'IKEDC', full: 'Ikeja Electric', state: 'Lagos Mainland' },
    { id: 'EKEDC', name: 'EKEDC', full: 'Eko Electric', state: 'Lagos Island' },
    { id: 'AEDC', name: 'AEDC', full: 'Abuja Electric', state: 'FCT / Niger / Nasarawa' },
    { id: 'IBEDC', name: 'IBEDC', full: 'Ibadan Electric', state: 'Oyo / Ogun / Osun' },
    { id: 'KEDCO', name: 'KEDCO', full: 'Kano Electric', state: 'Kano / Katsina / Jigawa' },
    { id: 'PHED', name: 'PHED', full: 'Port Harcourt Electric', state: 'Rivers / Bayelsa' },
    { id: 'EEDC', name: 'EEDC', full: 'Enugu Electric', state: 'South East' },
    { id: 'KAEDCO', name: 'KAEDCO', full: 'Kaduna Electric', state: 'Kaduna / Sokoto' },
    { id: 'JED', name: 'JED', full: 'Jos Electric', state: 'Plateau / Bauchi' },
    { id: 'BEDC', name: 'BEDC', full: 'Benin Electric', state: 'Edo / Delta / Ondo' },
  ];

  const [selectedDisco, setSelectedDisco] = useState<string>('KEDCO');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterAmount, setMeterAmount] = useState<number>(2000);
  const [verifiedMeterName, setVerifiedMeterName] = useState<string>('');
  const [isVerifyingMeter, setIsVerifyingMeter] = useState(false);

  const quickElectricityAmounts = [1000, 2000, 3000, 5000, 10000, 20000];

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
        meterType
      });
      if (res.success && res.data?.customerName) {
        setVerifiedMeterName(res.data.customerName);
        playSuccessChime();
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

  // -------------------------------------------------------------
  // 3. EXAM PIN STATE & DATA
  // -------------------------------------------------------------
  const examProviders = [
    {
      id: 'waec',
      name: 'WAEC',
      title: 'WAEC Result Checker',
      unitPrice: 3800,
      desc: 'Instant official WAEC scratch card pin for SSCE & GCE results',
      badge: 'Instant Dispense',
    },
    {
      id: 'neco',
      name: 'NECO',
      title: 'NECO Result Token',
      unitPrice: 1400,
      desc: 'Online token for checking National Examinations Council results',
      badge: 'Instant Token',
    },
    {
      id: 'nabteb',
      name: 'NABTEB',
      title: 'NABTEB Scratch Card',
      unitPrice: 1200,
      desc: 'National Business and Technical Examinations Board result checker',
      badge: 'Official PIN',
    },
    {
      id: 'jamb',
      name: 'JAMB',
      title: 'JAMB UTME / DE Profile',
      unitPrice: 6500,
      desc: 'Official Unified Tertiary Matriculation Examination registration e-PIN',
      badge: 'Direct Switch',
    },
  ] as const;

  const [selectedExam, setSelectedExam] = useState<'waec' | 'neco' | 'nabteb' | 'jamb'>('waec');
  const [examQuantity, setExamQuantity] = useState<number>(1);
  const [candidatePhone, setCandidatePhone] = useState(user?.phone || '');

  const currentExamConfig = examProviders.find((e) => e.id === selectedExam) || examProviders[0];
  const examTotalAmount = currentExamConfig.unitPrice * examQuantity;

  // Active Cost computation based on active tab
  const activeCost =
    activeTab === 'cable'
      ? cablePrice
      : activeTab === 'electricity'
      ? meterAmount
      : examTotalAmount;

  // -------------------------------------------------------------
  // SUBMISSION & VALIDATION WORKFLOW
  // -------------------------------------------------------------
  const handleInitiatePayment = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (isMaintenanceMode) {
      playErrorTone();
      setErrorMessage('System maintenance is currently in progress. Bill & utility payments are temporarily paused.');
      return;
    }

    if (activeCost <= 0) {
      setErrorMessage('Please select a valid service package or enter an amount.');
      return;
    }

    if (activeCost > user.balance) {
      setErrorMessage(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          activeCost - user.balance
        ).toFixed(2)} to complete this transaction.`
      );
      playErrorTone();
      return;
    }

    if (activeTab === 'cable') {
      if (!smartcard || smartcard.trim().length < 8) {
        setErrorMessage('Please enter a valid Smartcard / IUC number (minimum 8 digits).');
        return;
      }
    } else if (activeTab === 'electricity') {
      if (!meterNumber || meterNumber.trim().length < 8) {
        setErrorMessage('Please enter a valid meter number (minimum 8 digits).');
        return;
      }
      if (meterAmount < 500 || meterAmount > 500000 || !Number.isInteger(meterAmount)) {
        setErrorMessage('Recharge amount must be an integer between ₦500 and ₦500,000.');
        return;
      }
    } else if (activeTab === 'exam') {
      if (examQuantity < 1 || examQuantity > 20) {
        setErrorMessage('Quantity must be between 1 and 20 cards.');
        return;
      }
    }

    playTapSound();
    triggerHaptic('medium');
    setIsConfirmModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsPinModalOpen(false);
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      if (activeTab === 'cable') {
        const res = await apiSubscribeCable(
          cableProvider === 'showmax' ? 'dstv' : cableProvider,
          smartcard.trim(),
          selectedBouquet,
          cablePrice,
          enteredPin
        );
        setIsProcessing(false);
        isSubmittingRef.current = false;

        if (res.success) {
          playSuccessChime();
          triggerConfetti();
          const tx: Transaction = {
            id: res.reference || `AJD-CAB-${Date.now()}`,
            title: `${cableProvider.toUpperCase()} Subscription`,
            subtitle: `${selectedBouquet} • IUC: ${smartcard.trim()}`,
            recipient: smartcard.trim(),
            date: `Today, ${timeStr}`,
            group: 'Today',
            amount: cablePrice,
            isCredit: false,
            status: 'SUCCESS',
            category: 'cable',
            iconType: 'tv',
          };
          setSuccessMessage(
            res.message ||
              `Successfully activated ${cableProvider.toUpperCase()} ${selectedBouquet} for Smartcard ${smartcard.trim()}!`
          );
          onPaymentSuccess(tx);
        } else {
          playErrorTone();
          setErrorMessage(humanizeVtuError(res.message, 'cable TV subscription'));
        }
      } else if (activeTab === 'electricity') {
        const discoObj = discos.find((d) => d.id === selectedDisco) || discos[0];
        const res = await apiPayElectricity(
          discoObj.name,
          meterNumber.trim(),
          meterAmount,
          meterType,
          enteredPin
        );
        setIsProcessing(false);
        isSubmittingRef.current = false;

        if (res.success) {
          playSuccessChime();
          triggerConfetti();
          const tokenGenerated =
            res.data?.token || `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

          const tx: Transaction = {
            id: res.reference || `AJD-ELEC-${Date.now()}`,
            title: `${discoObj.name} Electricity (${meterType.toUpperCase()})`,
            subtitle: `Meter: ${meterNumber.trim()} • Token: ${tokenGenerated}`,
            recipient: meterNumber.trim(),
            date: `Today, ${timeStr}`,
            group: 'Today',
            amount: meterAmount,
            isCredit: false,
            status: 'SUCCESS',
            category: 'electricity',
            iconType: 'bolt',
            token: tokenGenerated,
          };
          setSuccessMessage(
            res.message ||
              `Electricity payment of ₦${meterAmount.toLocaleString()} successful! Token: ${tokenGenerated}`
          );
          onPaymentSuccess(tx);
        } else {
          playErrorTone();
          setErrorMessage(humanizeVtuError(res.message, 'electricity payment'));
        }
      } else if (activeTab === 'exam') {
        const cleanPhone = normalizeNigerianPhone(candidatePhone).cleaned;
        const res = await apiBuyExamPin(
          selectedExam,
          examQuantity,
          cleanPhone,
          enteredPin
        );
        setIsProcessing(false);
        isSubmittingRef.current = false;

        if (res.success) {
          playSuccessChime();
          triggerConfetti();
          const firstCard = (res.data && res.data[0]) || {
            pin: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            serial: `WR${Date.now().toString().slice(-8)}`,
          };

          const tx: Transaction = {
            id: res.reference || `AJD-EXAM-${Date.now()}`,
            title: `${currentExamConfig.name} Scratch PIN (${examQuantity}x)`,
            subtitle: `Serial: ${firstCard.serial || 'WR-8910248'} • PIN: ${firstCard.pin || 'Generated'}`,
            recipient: cleanPhone,
            date: `Today, ${timeStr}`,
            group: 'Today',
            amount: examTotalAmount,
            isCredit: false,
            status: 'SUCCESS',
            category: 'pin',
            iconType: 'pin',
            token: firstCard.pin,
          };
          setSuccessMessage(
            res.message ||
              `Successfully generated ${examQuantity} ${currentExamConfig.name} Result Checker PIN(s)!`
          );
          onPaymentSuccess(tx);
        } else {
          playErrorTone();
          setErrorMessage(humanizeVtuError(res.message, 'exam scratch card purchase'));
        }
      }
    } catch (err: any) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      playErrorTone();
      setErrorMessage(humanizeVtuError(err, 'bills payment'));
    }
  };

  // Confirmation modal details
  const getConfirmationDetails = (): OrderConfirmationDetails => {
    if (activeTab === 'cable') {
      return {
        serviceType: 'CABLE',
        title: `${cableProvider.toUpperCase()} Decoder Renewal`,
        subtitle: `${selectedBouquet}`,
        recipient: smartcard,
        recipientLabel: 'Smartcard / IUC',
        amount: cablePrice,
        userBalance: user.balance,
        additionalInfo: [
          { label: 'Target IUC / Decoder', value: smartcard },
          { label: 'Bouquet Package', value: selectedBouquet },
          { label: 'Customer Name', value: verifiedCustomerName || '(Unverified Customer)' },
        ],
      };
    } else if (activeTab === 'electricity') {
      const discoObj = discos.find((d) => d.id === selectedDisco) || discos[0];
      return {
        serviceType: 'ELECTRICITY',
        title: `${discoObj.full} Top-Up`,
        subtitle: `${meterType.toUpperCase()} Meter Recharge`,
        recipient: meterNumber,
        recipientLabel: 'Meter Number',
        amount: meterAmount,
        userBalance: user.balance,
        additionalInfo: [
          { label: 'Disco Operator', value: discoObj.name },
          { label: 'Meter Number', value: meterNumber },
          { label: 'Meter Type', value: meterType.toUpperCase() },
          { label: 'Customer Verified', value: verifiedMeterName },
        ],
      };
    } else {
      return {
        serviceType: 'EXAM_PIN',
        title: `${currentExamConfig.title}`,
        subtitle: `${examQuantity} e-PIN Voucher(s)`,
        recipient: candidatePhone,
        recipientLabel: 'Candidate Phone',
        amount: examTotalAmount,
        userBalance: user.balance,
        additionalInfo: [
          { label: 'Exam Board', value: currentExamConfig.name },
          { label: 'Quantity', value: `${examQuantity} Token(s)` },
          { label: 'SMS Delivery Line', value: candidatePhone },
        ],
      };
    }
  };

  return (
    <div
      id="screen-bills-utilities"
      className="px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-5xl mx-auto w-full animate-screen-enter"
    >
      {/* Maintenance Mode Warning */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-slate-900 dark:text-white block text-sm">
              Utility & Bill Payments Temporarily Paused
            </strong>
            <p className="leading-relaxed">
              System maintenance is currently in progress. Cable TV, electricity tokens, and exam PIN orders have been temporarily paused by administration to protect user transactions. Please check back shortly.
            </p>
          </div>
        </div>
      )}

      {/* Subtitle matching Screen 10 */}
      <div className="space-y-1">
        <h1 className="text-base sm:text-lg font-heading font-black text-slate-900 dark:text-white tracking-tight">
          All Utilities & Services
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select any service below to open its direct, goal-centered payment window.
        </p>
      </div>

      {/* 1. TOP UTILITY CATEGORY TABS (Tactile Segmented Bar) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Bill & Utility Service
          </h2>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Instant Switch Gateway
          </span>
        </div>

        {/* 3 Main Categories: Cable TV, Electricity, Exam PINs */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            id="tab-bills-cable"
            onClick={() => {
              playTapSound();
              triggerHaptic('light');
              setActiveTab('cable');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'cable'
                ? 'bg-white dark:bg-slate-800 text-[#0047cc] dark:text-blue-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tv size={16} className={activeTab === 'cable' ? 'stroke-[2.5]' : ''} />
            <span className="truncate">Cable TV</span>
          </button>

          <button
            type="button"
            id="tab-bills-electricity"
            onClick={() => {
              playTapSound();
              triggerHaptic('light');
              setActiveTab('electricity');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'electricity'
                ? 'bg-white dark:bg-slate-800 text-[#0047cc] dark:text-blue-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap size={16} className={activeTab === 'electricity' ? 'stroke-[2.5]' : ''} />
            <span className="truncate">Electricity</span>
          </button>

          <button
            type="button"
            id="tab-bills-exam"
            onClick={() => {
              playTapSound();
              triggerHaptic('light');
              setActiveTab('exam');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'exam'
                ? 'bg-white dark:bg-slate-800 text-[#0047cc] dark:text-blue-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap size={16} className={activeTab === 'exam' ? 'stroke-[2.5]' : ''} />
            <span className="truncate">Exam PINs</span>
          </button>
        </div>
      </section>

      {/* 2. DYNAMIC CONTENT PER TAB */}
      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* TAB 1: CABLE TV SUBSCRIPTIONS                            */}
        {/* ======================================================== */}
        {activeTab === 'cable' && (
          <motion.div
            key="tab-cable-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Provider Switcher */}
            <section className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Select Cable Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'gotv' as const, name: 'GOtv', desc: 'Max, Supa & Jinja', badge: 'Instant' },
                  { id: 'dstv' as const, name: 'DSTV', desc: 'Compact, Yanga, Premium', badge: 'HD Quality' },
                  { id: 'startimes' as const, name: 'StarTimes', desc: 'Basic, Smart & Super', badge: 'DTT / DTH' },
                  { id: 'showmax' as const, name: 'Showmax', desc: 'Mobile & EPL Sports', badge: 'Online Stream' },
                ].map((item) => {
                  const isSelected = cableProvider === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`cable-provider-${item.id}`}
                      onClick={() => handleProviderChange(item.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[76px] ${
                        isSelected
                          ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#0047cc]/25 shadow-xs'
                          : isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-[#0c1322] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-heading font-black tracking-tight text-slate-900 dark:text-white uppercase">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-[#0047cc] dark:text-blue-300">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Smartcard / IUC Input & Verification */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
                  Smartcard / IUC Number
                </label>
                <button
                  type="button"
                  id="btn-verify-iuc"
                  onClick={handleVerifyIuc}
                  disabled={isVerifyingIuc}
                  className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Search size={13} />
                  <span>{isVerifyingIuc ? 'Querying switch...' : 'Verify Decoder Name'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={smartcard}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setSmartcard(raw);
                    setErrorMessage('');
                  }}
                  placeholder="e.g. 7029104819"
                  className="w-full px-4 py-3.5 rounded-2xl border text-base font-mono font-bold bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                />
              </div>

              {verifiedCustomerName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Customer: <strong>{verifiedCustomerName}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-md">
                    Valid IUC
                  </span>
                </div>
              )}

              {/* Quick Saved Decoders */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase shrink-0">
                  Recent:
                </span>
                {savedCableAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSmartcard(acc.iuc);
                      setCableProvider(acc.provider);
                      const b = cableBouquets[acc.provider][0];
                      setSelectedBouquet(b.name);
                      setCablePrice(b.cost);
                      setVerifiedCustomerName(acc.label);
                    }}
                    className="shrink-0 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] text-slate-700 dark:text-slate-300 hover:border-blue-400 font-medium transition-all"
                  >
                    {acc.label} ({acc.iuc.slice(-4)})
                  </button>
                ))}
              </div>
            </section>

            {/* Bouquet / Package Grid */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
                  Select {cableProvider.toUpperCase()} Package
                </label>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  30 Days Validity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {cableBouquets[cableProvider].map((b) => {
                  const isSelected = selectedBouquet === b.name;
                  return (
                    <button
                      key={b.name}
                      type="button"
                      id={`bouquet-${b.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        playTapSound();
                        setSelectedBouquet(b.name);
                        setCablePrice(b.cost);
                        setErrorMessage('');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between min-h-[58px] ${
                        isSelected
                          ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#0047cc]/25 shadow-xs'
                          : isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-[#0c1322] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">
                          {b.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {b.channels || 'Active Channels'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-[#0047cc] dark:text-blue-400">
                          ₦{b.cost.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / month
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ELECTRICITY DISCO BILLS                           */}
        {/* ======================================================== */}
        {activeTab === 'electricity' && (
          <motion.div
            key="tab-electricity-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Meter Type Switcher: Prepaid vs Postpaid */}
            <section className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Meter Billing Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="meter-type-prepaid"
                  onClick={() => {
                    playTapSound();
                    setMeterType('prepaid');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer min-h-[56px] ${
                    meterType === 'prepaid'
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#0047cc]/25 shadow-xs'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-[#0c1322] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-black text-slate-900 dark:text-white uppercase">
                      Prepaid Meter
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      Token Output
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Generates 20-digit recharge token instantly
                  </p>
                </button>

                <button
                  type="button"
                  id="meter-type-postpaid"
                  onClick={() => {
                    playTapSound();
                    setMeterType('postpaid');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer min-h-[56px] ${
                    meterType === 'postpaid'
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#0047cc]/25 shadow-xs'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-[#0c1322] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-black text-slate-900 dark:text-white uppercase">
                      Postpaid Meter
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-[#0047cc] dark:text-blue-300">
                      Bill Payment
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Direct monthly electric energy invoice credit
                  </p>
                </button>
              </div>
            </section>

            {/* Disco Distribution Company Selection */}
            <section className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Select Disco Distribution Company
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {discos.map((d) => {
                  const isSelected = selectedDisco === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      id={`disco-select-${d.id}`}
                      onClick={() => {
                        playTapSound();
                        setSelectedDisco(d.id);
                        setErrorMessage('');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer min-h-[64px] flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#0047cc]/25 shadow-xs'
                          : isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-[#0c1322] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-heading font-black text-slate-900 dark:text-white">
                        {d.id}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {d.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Meter Number Input & Verification */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
                  Meter Number
                </label>
                <button
                  type="button"
                  id="btn-verify-meter"
                  onClick={handleVerifyMeter}
                  disabled={isVerifyingMeter}
                  className="text-xs font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Search size={13} />
                  <span>{isVerifyingMeter ? 'Checking meter...' : 'Verify Customer'}</span>
                </button>
              </div>

              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={meterNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setMeterNumber(raw);
                  setErrorMessage('');
                }}
                placeholder="e.g. 10482910482"
                className="w-full px-4 py-3.5 rounded-2xl border text-base font-mono font-bold bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
              />

              {verifiedMeterName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Customer: <strong>{verifiedMeterName}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              )}
            </section>

            {/* Recharge Amount & Quick Presets */}
            <section className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Recharge Amount (₦)
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {quickElectricityAmounts.map((amt) => {
                  const isSelected = meterAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setMeterAmount(amt);
                        setErrorMessage('');
                      }}
                      className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-2 ring-[#0047cc]/20'
                          : isLightMode
                          ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          : 'bg-[#0c1322] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  );
                })}
              </div>

              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                step="1"
                min={500}
                max={500000}
                value={meterAmount || ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setMeterAmount(raw ? parseInt(raw, 10) : 0);
                  setErrorMessage('');
                }}
                placeholder="Custom Amount (min ₦500)"
                className="w-full px-4 py-3 rounded-2xl border text-base font-mono font-bold bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
              />
            </section>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: EXAM SCRATCH PINs & TOKENS                        */}
        {/* ======================================================== */}
        {activeTab === 'exam' && (
          <motion.div
            key="tab-exam-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Examination Board Selector */}
            <section className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Select Examination Board
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {examProviders.map((ex) => {
                  const isSelected = selectedExam === ex.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      id={`exam-select-${ex.id}`}
                      onClick={() => {
                        playTapSound();
                        setSelectedExam(ex.id);
                        setErrorMessage('');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[90px] ${
                        isSelected
                          ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#0047cc]/25 shadow-xs'
                          : isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-[#0c1322] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-heading font-black text-slate-900 dark:text-white">
                          {ex.title}
                        </span>
                        <span className="text-sm font-mono font-black text-[#0047cc] dark:text-blue-400">
                          ₦{ex.unitPrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {ex.desc}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-[#0047cc] dark:text-blue-300">
                          {ex.badge}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          In Stock (Automated PIN)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Quantity Selector & Candidate Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <section className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                  Quantity (Vouchers)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 10].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setExamQuantity(qty);
                      }}
                      className={`py-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer min-h-[44px] ${
                        examQuantity === qty
                          ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-2 ring-[#0047cc]/20'
                          : isLightMode
                          ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          : 'bg-[#0c1322] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {qty} Card{qty > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </section>

              {/* Delivery Phone */}
              <section className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                  Delivery Phone (SMS / Receipt)
                </label>
                <input
                  type="tel"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  placeholder="08031234567"
                  className="w-full px-4 py-3 rounded-2xl border text-sm font-mono font-bold bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                />
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ORDER SUMMARY CARD */}
      <section className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xs space-y-2 text-xs">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Service & Category</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase">
            {activeTab === 'cable'
              ? `${cableProvider} • ${selectedBouquet}`
              : activeTab === 'electricity'
              ? `${selectedDisco} (${meterType})`
              : `${currentExamConfig.name} (${examQuantity}x)`}
          </span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Target / Recipient</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'cable'
              ? smartcard
              : activeTab === 'electricity'
              ? meterNumber
              : candidatePhone}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
          <span className="text-sm">Total Payable</span>
          <span className="font-mono text-base text-[#0047cc] dark:text-blue-400">
            ₦{activeCost.toLocaleString()}
          </span>
        </div>
      </section>

      {/* Wallet Balance Impact Pill */}
      <WalletImpactPill currentBalance={user.balance} cost={activeCost} />

      {/* Error or Success alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <AlertCircle size={17} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
          <CheckCircle2 size={17} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4. PRIMARY ACTION BUTTON */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        id="bills-submit-payment-btn"
        onClick={handleInitiatePayment}
        disabled={isProcessing || isPinModalOpen || isConfirmModalOpen || activeCost <= 0 || isMaintenanceMode}
        className={`w-full font-heading font-bold text-sm py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md min-h-[48px] ${
          isMaintenanceMode
            ? 'bg-amber-600/80 text-white cursor-not-allowed shadow-none'
            : 'bg-[#0047cc] hover:bg-[#003eb8] text-white shadow-blue-700/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <FintechButtonLoader
            text={`Processing ${activeTab.toUpperCase()}...`}
            subtext="Connecting to central billing switch"
          />
        ) : isMaintenanceMode ? (
          <>
            <AlertCircle size={18} />
            <span>Services Paused (Maintenance Mode)</span>
          </>
        ) : (
          <>
            {activeTab === 'cable' ? (
              <Tv size={18} />
            ) : activeTab === 'electricity' ? (
              <Zap size={18} />
            ) : (
              <GraduationCap size={18} />
            )}
            <span>
              Pay ₦{activeCost.toLocaleString()} ({activeTab.toUpperCase()})
            </span>
            <ArrowRight size={16} />
          </>
        )}
      </motion.button>

      {/* 5. ORDER CONFIRMATION MODAL */}
      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          setIsPinModalOpen(true);
        }}
        details={getConfirmationDetails()}
        isLightMode={isLightMode}
      />

      {/* 6. PIN VERIFICATION MODAL */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title={`Authorize ${activeTab === 'cable' ? 'Cable TV' : activeTab === 'electricity' ? 'Electricity' : 'Exam PIN'} Payment`}
        serviceName={
          activeTab === 'cable'
            ? `${cableProvider.toUpperCase()} - ${selectedBouquet}`
            : activeTab === 'electricity'
            ? `${selectedDisco} Meter Recharge`
            : `${currentExamConfig.name} Result PIN`
        }
        recipient={
          activeTab === 'cable'
            ? smartcard
            : activeTab === 'electricity'
            ? meterNumber
            : candidatePhone
        }
        amount={activeCost}
        biometricEnabled={user.biometricEnabled}
        isLightMode={isLightMode}
      />
    </div>
  );
};
