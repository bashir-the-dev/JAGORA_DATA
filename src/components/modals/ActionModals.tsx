import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, NetworkId } from '../../types';
import {
  X,
  CheckCircle,
  Copy,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Phone,
  Tv,
  CreditCard,
  Printer,
  FileText,
  AlertCircle,
  Download,
  Check,
  Repeat,
  ExternalLink,
  Sparkles,
  QrCode,
  User,
  Image as ImageIcon,
  Loader2,
  GraduationCap,
  Building2,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Layers,
  Search,
} from 'lucide-react';
import { captureReceiptAsImage } from '../../utils/receiptImage';
import { TelecomLogo } from '../common/TelecomLogo';
import {
  apiGenerateRechargePin,
  apiGenerateDataCard,
  apiPayElectricity,
  apiSubscribeCable,
  apiBuyExamPin,
  detectNetworkFromPhone,
} from '../../services/vtuService';
import { PinVerificationModal } from './PinVerificationModal';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { FintechButtonLoader, FintechSpinner } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { useSystemStatus } from '../../context/SystemStatusContext';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import { humanizeVtuError } from '../../utils/errorParser';
import { apiGetPricingSettings, apiVerifyBiller } from '../../services/apiClient';
import {
  playTapSound,
  playCoinSound,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLightMode?: boolean;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isLightMode,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className={`relative w-full max-w-md rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border z-10 max-h-[92dvh] sm:max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 ${
              isLightMode
                ? 'bg-white border-slate-200/90 text-slate-900'
                : 'bg-[#0b1220] border-slate-800/90 text-slate-100'
            }`}
          >
            {/* Mobile Sheet Pull Bar */}
            <div
              className={`pt-2.5 pb-1 flex justify-center sm:hidden transition-colors ${
                isLightMode ? 'bg-slate-50/90' : 'bg-[#090f1c]'
              }`}
            >
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Modal Header */}
            <div
              className={`px-5 py-3.5 sm:py-4 flex items-center justify-between border-b transition-colors ${
                isLightMode
                  ? 'bg-slate-50/90 border-slate-200/90 text-slate-900'
                  : 'bg-[#090f1c] border-slate-800 text-white'
              }`}
            >
              <h3 className="font-heading text-sm sm:text-base font-extrabold tracking-tight">{title}</h3>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLightMode
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 1. FUND WALLET MODAL
interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundSuccess: (amount: number) => void;
  virtualAccounts?: Array<{ bank_name: string; account_number: string; account_name: string }>;
  isLightMode?: boolean;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  onFundSuccess,
  virtualAccounts: userVirtualAccounts,
  isLightMode,
}) => {
  const [amount, setAmount] = useState<number>(2000);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  }, [isOpen]);

  const activeAccounts = (userVirtualAccounts && Array.isArray(userVirtualAccounts) && userVirtualAccounts.length > 0)
    ? userVirtualAccounts
    : [];

  const handleCopy = (num: string, bank: string) => {
    navigator.clipboard.writeText(num);
    playTapSound();
    triggerHaptic('light');
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 3000);
  };

  const handleVerifyTransfer = () => {
    if (amount <= 0 || isProcessing || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);
    playTapSound();
    setTimeout(() => {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      playCoinSound();
      triggerConfetti();
      onFundSuccess(amount);
      onClose();
    }, 900);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Fund Wallet" isLightMode={isLightMode}>
      {/* 0% Charge Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
            0% Deposit Fee • Instant Auto-Credit
          </span>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>

      <div className="space-y-4">
        {activeAccounts.length === 0 ? (
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <ShieldCheck size={20} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-heading">
                    Dedicated Bank Accounts Pending
                  </h4>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-[#0047cc] dark:text-blue-400 border border-blue-500/20">
                    Protected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                  Real dedicated bank accounts are generated directly by CBN-licensed payment gateways (Monnify / Payvessel). Dummy or fake bank numbers are strictly prohibited to prevent loss of funds.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your personalized accounts will appear automatically upon verification. If you need immediate assistance, please reach out to Customer Support.
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Transfer to your personalized account below using any banking app (OPay, Kuda, PalmPay, GTB, Zenith). Your Jagora balance updates in under 60 seconds.
            </p>

        {/* Virtual Account Cards */}
        <div className="space-y-2.5">
          {activeAccounts.map((acc, i) => {
            const bankName = (acc as any).bank_name || (acc as any).bank || 'Virtual Bank';
            const accNum = (acc as any).account_number || (acc as any).number || '0000000000';
            const accHolder = (acc as any).account_name || (acc as any).name || "Al'amin Jagora";
            const isCopied = copiedBank === bankName;

            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCopied
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : isLightMode
                    ? 'bg-white border-slate-200/90 hover:border-blue-300 shadow-2xs'
                    : 'bg-slate-800/80 border-slate-700/80 hover:border-blue-500 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-black text-[10px]">
                      {bankName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{bankName}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Auto-credited
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <div className="text-lg font-black font-mono tracking-wider text-[#0047cc] dark:text-blue-400">
                      {accNum}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {accHolder}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(accNum, bankName)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#0047cc] hover:bg-[#003eb8] text-white shadow-xs'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {copiedBank && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={15} />
            <span>{copiedBank} account number copied to clipboard!</span>
          </div>
        )}

        {/* Goal-Centered Direct Verification */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Instant Transfer Verification
            </label>
            <span className="text-[11px] text-slate-500 font-medium">Select Amount</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1000, 2000, 5000, 10000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playTapSound();
                  setAmount(val);
                }}
                className={`py-2 text-xs font-bold font-mono rounded-xl border transition-all cursor-pointer ${
                  amount === val
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                ₦{val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleVerifyTransfer}
            disabled={isProcessing}
            className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-80"
          >
            {isProcessing ? (
              <FintechButtonLoader text="Verifying Transfer..." subtext="Polling automated virtual banking switch" />
            ) : (
              <>
                <Sparkles size={16} className="text-amber-300 fill-current" />
                <span>I Have Sent ₦{amount.toLocaleString()} • Verify Now</span>
              </>
            )}
          </motion.button>
        </div>
        </>
      )}
      </div>
    </ModalWrapper>
  );
};

// 2. BUY AIRTIME MODAL
interface BuyAirtimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAirtimeSuccess: (network: string, phone: string, amount: number, pin?: string) => void | boolean | Promise<boolean>;
  userBalance: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
  initialPhone?: string;
  initialAmount?: number;
  initialNetwork?: NetworkId;
}

export const BuyAirtimeModal: React.FC<BuyAirtimeModalProps> = ({
  isOpen,
  onClose,
  onAirtimeSuccess,
  userBalance,
  userPin,
  biometricEnabled = false,
  isLightMode,
  initialPhone,
  initialAmount,
  initialNetwork,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(initialNetwork || 'mtn');
  const [phone, setPhone] = useState(initialPhone || '');
  const [isManualNetworkOverride, setIsManualNetworkOverride] = useState(false);
  const [amount, setAmount] = useState(initialAmount || 100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  // Dynamic wholesale discounts configured in admin panel
  const [networkDiscounts, setNetworkDiscounts] = useState<Record<string, number>>({
    mtn: 2.5,
    airtel: 3.0,
    glo: 4.0,
    '9mobile': 4.5,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialPhone) setPhone(initialPhone);
      if (initialAmount) setAmount(initialAmount);
      if (initialNetwork) setSelectedNetwork(initialNetwork);

      // Fetch dynamic discounts from admin
      apiGetPricingSettings()
        .then((res) => {
          if (res.status === 'success' && res.data?.airtimeDiscounts) {
            setNetworkDiscounts(res.data.airtimeDiscounts);
          }
        })
        .catch(() => {});
    } else {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setIsConfirmModalOpen(false);
      setIsPinModalOpen(false);
      setError('');
    }
  }, [isOpen, initialPhone, initialAmount, initialNetwork]);

  const networks = [
    { id: 'mtn' as NetworkId, name: 'MTN', color: '#ffdb3c' },
    { id: 'airtel' as NetworkId, name: 'Airtel', color: '#ff5252' },
    { id: 'glo' as NetworkId, name: 'Glo', color: '#00c853' },
    { id: '9mobile' as NetworkId, name: '9mobile', color: '#4caf50' },
  ];

  const quickBeneficiaries = initialPhone ? [
    { name: 'My Line', phone: initialPhone, network: (normalizeNigerianPhone(initialPhone).detectedNetwork || 'mtn') as NetworkId }
  ] : [];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setError('');
    const norm = normalizeNigerianPhone(val);
    if (norm.detectedNetwork && norm.detectedNetwork !== selectedNetwork) {
      setSelectedNetwork(norm.detectedNetwork);
      setIsManualNetworkOverride(false);
    }
  };

  const handleSelectBeneficiary = (b: typeof quickBeneficiaries[0]) => {
    playTapSound();
    triggerHaptic('light');
    setPhone(b.phone);
    setSelectedNetwork(b.network);
    setIsManualNetworkOverride(true);
    setError('');
  };

  const handleResetAutoDetect = () => {
    playTapSound();
    setIsManualNetworkOverride(false);
    const norm = normalizeNigerianPhone(phone);
    if (norm.detectedNetwork) {
      setSelectedNetwork(norm.detectedNetwork);
    }
  };

  const currentDiscountPct = networkDiscounts[selectedNetwork] ?? 2.5;
  const safeDiscountPct = Math.max(0, Math.min(100, currentDiscountPct));
  const payPercentage = parseFloat((100 - safeDiscountPct).toFixed(1));
  const payVal = Math.round((amount * payPercentage) / 100 * 100) / 100;
  const discountVal = Math.round((amount - payVal) * 100) / 100; // Strictly sums to 100%

  const handleBuy = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    playTapSound();

    if (payVal > userBalance) {
      setError(
        `Insufficient balance (₦${userBalance.toFixed(2)}). Fund your wallet with at least ₦${(
          payVal - userBalance
        ).toFixed(2)}.`
      );
      return;
    }

    const norm = normalizeNigerianPhone(phone);
    if (!norm.isValid) {
      setError(norm.error || 'Please enter a valid 11-digit Nigerian phone number.');
      return;
    }

    setError('');
    setIsConfirmModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsPinModalOpen(false);
    setIsProcessing(true);
    setError('');

    const norm = normalizeNigerianPhone(phone);
    const cleanPhone = norm.cleaned;

    try {
      const result = await onAirtimeSuccess(selectedNetwork.toUpperCase(), cleanPhone, amount, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (result !== false) {
        playSuccessChime();
        triggerConfetti();
        onClose();
      } else {
        setError('Airtime transaction could not be completed. Your wallet was not charged.');
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      setError(humanizeVtuError(err, 'airtime purchase'));
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Buy Airtime" isLightMode={isLightMode}>
      <div className="space-y-4">
        {/* Quick Beneficiaries */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              Quick Beneficiaries
            </span>
            <span className="text-[11px] text-[#0047cc] dark:text-blue-400 font-bold">Auto-fills provider</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickBeneficiaries.map((b, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectBeneficiary(b)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                  phone === b.phone
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/70 text-[#0047cc] dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0047cc] dark:text-blue-300 flex items-center justify-center text-[10px] font-bold uppercase">
                  {b.name[0]}
                </span>
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Network Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block">
              Select Network
            </label>
            {isManualNetworkOverride && (
              <button
                type="button"
                onClick={handleResetAutoDetect}
                className="text-[11px] text-[#0047cc] dark:text-blue-400 font-bold hover:underline"
              >
                Reset to Auto-detect
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {networks.map((net) => (
              <button
                key={net.id}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedNetwork(net.id);
                  setIsManualNetworkOverride(true);
                }}
                className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                  selectedNetwork === net.id
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 shadow-xs ring-1 ring-[#0047cc]/40'
                    : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:bg-slate-50'
                }`}
              >
                <TelecomLogo network={net.id} size="sm" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{net.name}</span>
              </button>
            ))}
          </div>
          {isManualNetworkOverride && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
              Manual network selection active (ideal for ported numbers).
            </p>
          )}
        </div>

        {/* Phone Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              Recipient Phone
            </label>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold uppercase">
              Network: {selectedNetwork.toUpperCase()}
            </span>
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="080 1234 5678"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-mono text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc] shadow-xs"
            />
          </div>
          {phone.trim().length > 0 && (
            <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 px-1">
              {normalizeNigerianPhone(phone).isValid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={12} className="stroke-[3]" />
                  <span>Valid 11-digit line ({normalizeNigerianPhone(phone).detectedNetwork?.toUpperCase() || 'Verified'})</span>
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  {normalizeNigerianPhone(phone).cleaned.length}/11 digits • {normalizeNigerianPhone(phone).error || 'Enter 11 digits'}
                </span>
              )}
              {normalizeNigerianPhone(phone).detectedNetwork && (
                <span className="text-[#0047cc] dark:text-blue-400 font-bold uppercase">
                  Detected: {normalizeNigerianPhone(phone).detectedNetwork}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1">
            Amount (₦)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
            {[100, 200, 500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playTapSound();
                  setAmount(val);
                }}
                className={`min-h-[44px] flex items-center justify-center text-xs font-mono rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  amount === val
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-300 font-bold ring-1 ring-[#0047cc]/40'
                    : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                ₦{val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={50}
            max={50000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Custom amount"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-mono text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc] shadow-xs"
          />
        </div>

        {/* Discount breakdown pill with 100% total reconciliation */}
        <div className="flex items-center justify-between text-xs font-medium p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="font-bold">You pay ({safeDiscountPct}% Discount):</span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                Customer pays {payPercentage}% of face value (100% total)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm">₦{payVal.toFixed(2)}</span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
              Save ₦{discountVal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Real-time Financial Visibility (NN/g Heuristic #1) */}
        <WalletImpactPill currentBalance={userBalance} cost={payVal} />

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleBuy}
          disabled={isProcessing || isPinModalOpen}
          className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans text-sm font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <FintechButtonLoader text="Dispensing Airtime..." subtext="Switching order" />
          ) : (
            <>
              <Zap size={16} className="text-amber-300 fill-current" />
              <span>Buy ₦{amount} Airtime</span>
            </>
          )}
        </motion.button>
      </div>

      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          setIsPinModalOpen(true);
        }}
        details={{
          serviceType: 'AIRTIME',
          title: 'Confirm Airtime Purchase',
          subtitle: `${selectedNetwork.toUpperCase()} ₦${amount} Airtime`,
          network: selectedNetwork,
          recipient: phone,
          recipientLabel: 'Recipient Phone',
          amount: amount,
          discount: discountVal,
          userBalance: userBalance,
        }}
        isLightMode={isLightMode}
      />

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Authorize Airtime Purchase"
        serviceName={`${selectedNetwork.toUpperCase()} ₦${amount} Airtime`}
        recipient={phone}
        amount={amount * 0.98}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </ModalWrapper>
  );
};

// 3. RECHARGE PIN MODAL (EPIN Printing / Generation)
interface RechargePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess: (tx: Transaction) => void;
  userBalance: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const RechargePinModal: React.FC<RechargePinModalProps> = ({
  isOpen,
  onClose,
  onGenerateSuccess,
  userBalance,
  userPin,
  biometricEnabled = false,
  isLightMode,
}) => {
  const [network, setNetwork] = useState<NetworkId>('mtn');
  const [denomination, setDenomination] = useState<number>(500);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [generatedPins, setGeneratedPins] = useState<Array<{ pin: string; serial: string; denomination: number }> | null>(null);
  const [copiedPinIdx, setCopiedPinIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setIsPinModalOpen(false);
      setError('');
      setGeneratedPins(null);
    }
  }, [isOpen]);

  const faceValue = denomination * quantity;
  const discountAmount = faceValue * 0.02; // 2% wholesale discount
  const totalCost = faceValue - discountAmount;

  const handleGenerate = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    if (totalCost > userBalance) {
      setError(
        `Insufficient balance (₦${userBalance.toFixed(2)}). Fund your wallet with at least ₦${(
          totalCost - userBalance
        ).toFixed(2)}.`
      );
      return;
    }
    setError('');
    setIsPinModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsPinModalOpen(false);
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiGenerateRechargePin(network, denomination, quantity, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (res.success && res.data) {
        setGeneratedPins(res.data);
        playSuccessChime();
        triggerConfetti();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tx: Transaction = {
          id: res.reference || `PIN-${Date.now()}`,
          title: `Recharge PIN - ${network.toUpperCase()}`,
          subtitle: `${quantity}x ₦${denomination} Vouchers`,
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: totalCost,
          isCredit: false,
          status: 'SUCCESS',
          category: 'pin',
          iconType: 'pin',
          token: res.data[0]?.pin,
        };
        onGenerateSuccess(tx);
      } else {
        setError(humanizeVtuError(res.message, 'recharge pin generation'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      setError(humanizeVtuError(err, 'recharge pin generation'));
    }
  };

  const handleCopySingle = (pin: string, idx: number) => {
    navigator.clipboard.writeText(pin);
    playTapSound();
    triggerHaptic('light');
    setCopiedPinIdx(idx);
    setTimeout(() => setCopiedPinIdx(null), 2000);
  };

  const handleCopyAll = () => {
    if (!generatedPins) return;
    const text = generatedPins
      .map(
        (p, i) =>
          `[#${i + 1}] ${network.toUpperCase()} ₦${p.denomination}\nPIN: ${p.pin}\nSerial: ${p.serial}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    playTapSound();
    triggerHaptic('medium');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const getDialCode = (net: NetworkId) => {
    switch (net) {
      case 'mtn':
        return '*555*PIN#';
      case 'airtel':
        return '*126*PIN#';
      case 'glo':
        return '*123*PIN#';
      case '9mobile':
        return '*222*PIN#';
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Recharge PIN Printing" isLightMode={isLightMode}>
      {!generatedPins ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Generate offline airtime recharge vouchers with serial numbers. Enjoy an automated 2% wholesale merchant discount.
          </p>

          {/* Network Selector */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Select Network
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['mtn', 'airtel', 'glo', '9mobile'] as NetworkId[]).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setNetwork(net);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold uppercase border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    network === net
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <TelecomLogo network={net} size="xs" />
                  <span className="text-[11px]">{net}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Denomination */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Denomination (Face Value)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setDenomination(val);
                  }}
                  className={`py-2.5 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                    denomination === val
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ₦{val}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Quantity (Vouchers)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setQuantity(q);
                  }}
                  className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                    quantity === q
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {q} {q === 1 ? 'voucher' : 'vouchers'}
                </button>
              ))}
            </div>
          </div>

          {/* Transparent Cost Breakdown */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Face Value ({quantity}x ₦{denomination})</span>
              <span className="font-mono">₦{faceValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Reseller Discount (2%)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">-₦{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
              <span>Total Payable</span>
              <span className="font-mono text-sm text-[#0047cc] dark:text-blue-400">₦{totalCost.toLocaleString()}</span>
            </div>
          </div>

          <WalletImpactPill currentBalance={userBalance} cost={totalCost} />

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isProcessing || isPinModalOpen}
            className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <FintechButtonLoader text="Generating e-PINs..." subtext="Printing offline vouchers" />
            ) : (
              <>
                <Printer size={16} />
                <span>Generate {quantity} Voucher(s) • ₦{totalCost.toLocaleString()}</span>
              </>
            )}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>Successfully Generated {generatedPins.length} {network.toUpperCase()} PIN(s)</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {generatedPins.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs space-y-1.5"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0047cc] dark:text-blue-400 uppercase">
                    {network} ₦{item.denomination} Voucher
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SN: {item.serial}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="font-mono font-black text-base tracking-widest text-slate-900 dark:text-white">
                    {item.pin}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingle(item.pin, idx)}
                    className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-100"
                    title="Copy PIN"
                  >
                    {copiedPinIdx === idx ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                  Load Code: Dial {getDialCode(network)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedAll ? <Check size={14} className="stroke-[3] text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedAll ? 'All Copied!' : 'Copy All'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGeneratedPins(null);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Authorize Recharge PIN Generation"
        serviceName={`${quantity}x ₦${denomination} ${network.toUpperCase()} Voucher(s)`}
        amount={totalCost}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </ModalWrapper>
  );
};

// 4. DATA CARD MODAL (Data PINs)
interface DataCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess: (tx: Transaction) => void;
  userBalance: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const DataCardModal: React.FC<DataCardModalProps> = ({
  isOpen,
  onClose,
  onGenerateSuccess,
  userBalance,
  userPin,
  biometricEnabled = false,
  isLightMode,
}) => {
  const [network, setNetwork] = useState<NetworkId>('mtn');
  const [dataSize, setDataSize] = useState<string>('1.5GB');
  const [price, setPrice] = useState<number>(450);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [generatedCard, setGeneratedCard] = useState<{ pin: string; serial: string; dataSize: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setIsPinModalOpen(false);
      setError('');
      setGeneratedCard(null);
    }
  }, [isOpen]);

  const bundles = [
    { size: '500MB', cost: 160 },
    { size: '1.0GB', cost: 290 },
    { size: '1.5GB', cost: 450 },
    { size: '2.0GB', cost: 580 },
    { size: '2.5GB', cost: 700 },
    { size: '5.0GB', cost: 1350 },
  ];

  const handleGenerate = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    if (price > userBalance) {
      setError(
        `Insufficient balance (₦${userBalance.toFixed(2)}). Fund your wallet with at least ₦${(
          price - userBalance
        ).toFixed(2)}.`
      );
      return;
    }
    setError('');
    setIsPinModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsPinModalOpen(false);
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiGenerateDataCard(network, dataSize, 1, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (res.success && res.data && res.data[0]) {
        setGeneratedCard(res.data[0]);
        playSuccessChime();
        triggerConfetti();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tx: Transaction = {
          id: res.reference || `DC-${Date.now()}`,
          title: `Data Card - ${network.toUpperCase()} ${dataSize}`,
          subtitle: `PIN Generated`,
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: price,
          isCredit: false,
          status: 'SUCCESS',
          category: 'data',
          iconType: 'wifi',
          token: res.data[0].pin,
        };
        onGenerateSuccess(tx);
      } else {
        setError(humanizeVtuError(res.message, 'data card generation'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      setError(humanizeVtuError(err, 'data card generation'));
    }
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    playTapSound();
    triggerHaptic('light');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Data Card Printing" isLightMode={isLightMode}>
      {!generatedCard ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Generate and print offline data recharge vouchers that customers load directly via standard USSD.
          </p>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Select Network
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['mtn', 'airtel', 'glo', '9mobile'] as NetworkId[]).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setNetwork(net);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold uppercase border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    network === net
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <TelecomLogo network={net} size="xs" />
                  <span className="text-[11px]">{net}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Select Data Bundle
            </label>
            <div className="grid grid-cols-3 gap-2">
              {bundles.map((item) => (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setDataSize(item.size);
                    setPrice(item.cost);
                  }}
                  className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                    dataSize === item.size
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.size}</p>
                  <p className="text-[11px] text-[#0047cc] dark:text-blue-400 font-mono font-bold mt-0.5">₦{item.cost}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-bold">Total Amount:</span>
            <span className="font-mono font-bold text-sm text-[#0047cc] dark:text-blue-400">₦{price.toLocaleString()}</span>
          </div>

          <WalletImpactPill currentBalance={userBalance} cost={price} />

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isProcessing || isPinModalOpen}
            className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <FintechButtonLoader text="Generating Voucher..." subtext="Securing offline bundle allocation" />
            ) : (
              <>
                <Printer size={16} />
                <span>Generate Data Card (₦{price})</span>
              </>
            )}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border-2 border-dashed border-[#0047cc]/40 bg-blue-50/50 dark:bg-blue-950/30 text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0047cc] dark:text-blue-400">
              {network.toUpperCase()} {generatedCard.dataSize} Data Card
            </span>
            <div className="flex items-center justify-center gap-2">
              <p className="font-mono text-xl font-black tracking-widest text-slate-900 dark:text-white">
                {generatedCard.pin}
              </p>
              <button
                type="button"
                onClick={() => handleCopyPin(generatedCard.pin)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-[#0047cc] dark:text-blue-300 border border-blue-200 dark:border-blue-900 cursor-pointer"
              >
                {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
              Serial: {generatedCard.serial}
            </p>
            <div className="pt-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg">
              Load: Dial <strong className="font-mono text-[#0047cc]">*460*PIN#</strong> or send PIN to 131
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Card</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGeneratedCard(null);
                onClose();
              }}
              className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] text-white py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Authorize Data Card Generation"
        serviceName={`${network.toUpperCase()} ${dataSize} Data Card`}
        amount={price}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </ModalWrapper>
  );
};

// 5. CABLE TV MODAL (Direct Goal-Centered Subscription)
interface CableTvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (tx: Transaction) => void;
  userBalance: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const CableTvModal: React.FC<CableTvModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  userBalance,
  userPin,
  biometricEnabled = false,
  isLightMode,
}) => {
  const [provider, setProvider] = useState<'dstv' | 'gotv' | 'startimes' | 'showmax'>('gotv');
  const [smartcard, setSmartcard] = useState('');
  const [isVerifyingIuc, setIsVerifyingIuc] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string>('');
  const [selectedBouquet, setSelectedBouquet] = useState('GOtv Jinja');
  const [price, setPrice] = useState(3300);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setIsPinModalOpen(false);
      setError('');
    }
  }, [isOpen]);

  const bouquets = {
    gotv: [
      { name: 'GOtv Smallie', cost: 1575 },
      { name: 'GOtv Jinja', cost: 3300 },
      { name: 'GOtv Jolli', cost: 4850 },
      { name: 'GOtv Max', cost: 7200 },
      { name: 'GOtv Supa', cost: 9600 },
      { name: 'GOtv Supa Plus', cost: 13900 },
    ],
    dstv: [
      { name: 'DSTV Padi', cost: 4400 },
      { name: 'DSTV Yanga', cost: 5100 },
      { name: 'DSTV Confam', cost: 9300 },
      { name: 'DSTV Compact', cost: 15700 },
      { name: 'DSTV Compact Plus', cost: 25000 },
      { name: 'DSTV Premium', cost: 37000 },
    ],
    startimes: [
      { name: 'Nova Bouquet', cost: 1700 },
      { name: 'Basic Bouquet', cost: 3300 },
      { name: 'Smart Bouquet', cost: 4200 },
      { name: 'Classic Bouquet', cost: 5000 },
      { name: 'Super Bouquet', cost: 8200 },
    ],
    showmax: [
      { name: 'Showmax Mobile', cost: 1600 },
      { name: 'Showmax Entertainment', cost: 2900 },
      { name: 'Showmax Pro Mobile', cost: 3200 },
    ],
  };

  const handleProviderChange = (p: typeof provider) => {
    playTapSound();
    setProvider(p);
    const first = bouquets[p][0];
    setSelectedBouquet(first.name);
    setPrice(first.cost);
  };

  const handleVerifyIuc = async () => {
    const cleanId = smartcard.replace(/[^0-9]/g, '');
    if (!cleanId || cleanId.length < 8) {
      setError('Please enter a valid 8-15 digit smartcard / IUC number.');
      return;
    }
    setIsVerifyingIuc(true);
    setError('');
    try {
      const res = await apiVerifyBiller({
        serviceType: 'CABLE',
        identifier: cleanId,
        provider: provider === 'showmax' ? 'dstv' : provider,
      });
      if (res.success && res.data?.customerName) {
        setVerifiedName(res.data.customerName);
      } else {
        setVerifiedName('');
        setError(res.message || 'Could not verify IUC with provider.');
      }
    } catch {
      setVerifiedName('');
      setError('Could not verify IUC. Please check the smartcard number.');
    } finally {
      setIsVerifyingIuc(false);
    }
  };

  const handlePay = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    if (price > userBalance) {
      setError(
        `Insufficient balance (₦${userBalance.toFixed(2)}). Fund your wallet with at least ₦${(
          price - userBalance
        ).toFixed(2)}.`
      );
      return;
    }
    if (!smartcard || smartcard.trim().length < 8) {
      setError('Please enter a valid Smartcard / IUC number (minimum 8 digits).');
      return;
    }
    setError('');
    setIsPinModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsPinModalOpen(false);
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiSubscribeCable(
        provider === 'showmax' ? 'dstv' : provider,
        smartcard.trim(),
        selectedBouquet,
        price,
        enteredPin
      );
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (res.success) {
        playSuccessChime();
        triggerConfetti();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tx: Transaction = {
          id: res.reference || `CABLE-${Date.now()}`,
          title: `${provider.toUpperCase()} Renewal`,
          subtitle: `${selectedBouquet} • IUC: ${smartcard.trim()}`,
          recipient: smartcard.trim(),
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: price,
          isCredit: false,
          status: 'SUCCESS',
          category: 'cable',
          iconType: 'tv',
        };
        onPaymentSuccess(tx);
        onClose();
      } else {
        setError(humanizeVtuError(res.message, 'cable tv subscription'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      setError(humanizeVtuError(err, 'cable tv subscription'));
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Cable TV Subscription" isLightMode={isLightMode}>
      <div className="space-y-4">
        {/* Provider Switcher */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
            Select Provider
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['gotv', 'dstv', 'startimes', 'showmax'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`py-2 px-1 rounded-xl text-xs font-bold uppercase border transition-all cursor-pointer ${
                  provider === p
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Smartcard / IUC Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              Smartcard / IUC Number
            </label>
            <button
              type="button"
              onClick={handleVerifyIuc}
              disabled={isVerifyingIuc}
              className="text-[11px] font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer"
            >
              {isVerifyingIuc ? 'Checking...' : 'Verify IUC'}
            </button>
          </div>
          <div className="relative">
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={smartcard}
              onChange={(e) => setSmartcard(e.target.value)}
              placeholder="e.g. 7029104819"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc]"
            />
          </div>
          {verifiedName && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>Customer: {verifiedName}</span>
            </div>
          )}
        </div>

        {/* Bouquet Selection */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
            Select Package / Bouquet
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {bouquets[provider].map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedBouquet(b.name);
                  setPrice(b.cost);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedBouquet === b.name
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 ring-1 ring-[#0047cc]/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{b.name}</p>
                <p className="text-[11px] font-mono font-bold text-[#0047cc] dark:text-blue-400 mt-0.5">
                  ₦{b.cost.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Provider & Bouquet</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{provider.toUpperCase()} • {selectedBouquet}</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Target IUC</span>
            <span className="font-mono font-bold">{smartcard}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
            <span>Total Payable</span>
            <span className="font-mono text-sm text-[#0047cc] dark:text-blue-400">₦{price.toLocaleString()}</span>
          </div>
        </div>

        <WalletImpactPill currentBalance={userBalance} cost={price} />

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={isProcessing || isPinModalOpen}
          className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <FintechButtonLoader text="Activating Decoder..." subtext="Querying Multichoice / StarTimes switch" />
          ) : (
            <>
              <Tv size={16} />
              <span>Renew {provider.toUpperCase()} (₦{price.toLocaleString()})</span>
            </>
          )}
        </motion.button>
      </div>

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Authorize Cable TV Renewal"
        serviceName={`${provider.toUpperCase()} - ${selectedBouquet}`}
        recipient={smartcard}
        amount={price}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </ModalWrapper>
  );
};

// 6. ELECTRICITY MODAL (Direct Goal-Centered Payment)
interface ElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (tx: Transaction) => void;
  userBalance: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const ElectricityModal: React.FC<ElectricityModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  userBalance,
  userPin,
  biometricEnabled = false,
  isLightMode,
}) => {
  const [disco, setDisco] = useState('IKEDC (Ikeja Electric)');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState(2000);
  const [verifiedName, setVerifiedName] = useState<string>('');
  const [isVerifyingMeter, setIsVerifyingMeter] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setIsPinModalOpen(false);
      setError('');
    }
  }, [isOpen]);

  const discos = [
    'IKEDC (Ikeja Electric)',
    'EKEDC (Eko Electric)',
    'AEDC (Abuja Electric)',
    'IBEDC (Ibadan Electric)',
    'KEDCO (Kano Electric)',
    'PHED (Port Harcourt Electric)',
    'EEDC (Enugu Electric)',
    'KAEDCO (Kaduna Electric)',
    'JED (Jos Electric)',
    'BEDC (Benin Electric)',
  ];

  const handleVerifyMeter = async () => {
    const cleanId = meterNumber.replace(/[^0-9]/g, '');
    if (!cleanId || cleanId.length < 8) {
      setError('Please enter a valid 8-15 digit meter number.');
      return;
    }
    const discoCode = disco.split(' ')[0].toLowerCase();
    setIsVerifyingMeter(true);
    setError('');
    try {
      const res = await apiVerifyBiller({
        serviceType: 'ELECTRICITY',
        identifier: cleanId,
        provider: discoCode,
        meterType,
      });
      if (res.success && res.data?.customerName) {
        setVerifiedName(res.data.customerName);
      } else {
        setVerifiedName('');
        setError(res.message || 'Could not verify meter number with DISCO.');
      }
    } catch {
      setVerifiedName('');
      setError('Could not verify meter number. Please check the digits and try again.');
    } finally {
      setIsVerifyingMeter(false);
    }
  };

  const handlePay = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    if (!amount || isNaN(amount) || !Number.isInteger(amount) || amount < 500 || amount > 500000) {
      setError('Recharge amount must be a positive integer between ₦500 and ₦500,000 (decimals are not permitted).');
      return;
    }
    if (amount > userBalance) {
      setError(
        `Insufficient balance (₦${userBalance.toFixed(2)}). Fund your wallet with at least ₦${(
          amount - userBalance
        ).toFixed(2)}.`
      );
      return;
    }
    if (!meterNumber || meterNumber.trim().length < 8) {
      setError('Please enter a valid meter number (minimum 8 digits).');
      return;
    }
    setError('');
    setIsPinModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsPinModalOpen(false);
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiPayElectricity(disco, meterNumber.trim(), amount, meterType, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (res.success) {
        playSuccessChime();
        triggerConfetti();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tx: Transaction = {
          id: res.reference || `ELEC-${Date.now()}`,
          title: `${disco.split(' ')[0]} ${meterType.toUpperCase()}`,
          subtitle: `Meter: ${meterNumber.trim()} • Token Generated`,
          recipient: meterNumber.trim(),
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount,
          isCredit: false,
          status: 'SUCCESS',
          category: 'electricity',
          iconType: 'bolt',
          token: res.data?.token,
        };
        onPaymentSuccess(tx);
        onClose();
      } else {
        setError(humanizeVtuError(res.message, 'electricity payment'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      setError(humanizeVtuError(err, 'electricity payment'));
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Electricity Bill Payment" isLightMode={isLightMode}>
      <div className="space-y-4">
        {/* Disco Provider */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
            DISCO Distribution Company
          </label>
          <select
            value={disco}
            onChange={(e) => setDisco(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-[#0047cc]"
          >
            {discos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Meter Type Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setMeterType('prepaid');
            }}
            className={`py-2 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              meterType === 'prepaid'
                ? 'bg-white dark:bg-slate-900 text-[#0047cc] dark:text-blue-400 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Prepaid (Get Token)
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setMeterType('postpaid');
            }}
            className={`py-2 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              meterType === 'postpaid'
                ? 'bg-white dark:bg-slate-900 text-[#0047cc] dark:text-blue-400 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Postpaid (Clear Bill)
          </button>
        </div>

        {/* Meter Number */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              Meter Number
            </label>
            <button
              type="button"
              onClick={handleVerifyMeter}
              disabled={isVerifyingMeter}
              className="text-[11px] font-bold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer"
            >
              {isVerifyingMeter ? 'Checking...' : 'Verify Meter'}
            </button>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={meterNumber}
            onChange={(e) => setMeterNumber(e.target.value)}
            placeholder="e.g. 10482910482"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc]"
          />
          {verifiedName && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>{verifiedName}</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
            Amount (₦)
          </label>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[1000, 2000, 5000, 10000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playTapSound();
                  setAmount(val);
                }}
                className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                  amount === val
                    ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                ₦{val.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            step="1"
            min={500}
            max={500000}
            value={amount || ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setAmount(raw ? parseInt(raw, 10) : 0);
              setError('');
            }}
            placeholder="Enter custom amount"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc]"
          />
        </div>

        {amount > 0 && (
          <WalletImpactPill currentBalance={userBalance} cost={amount} />
        )}

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={isProcessing || isPinModalOpen || amount <= 0}
          className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <FintechButtonLoader text="Dispensing Electricity..." subtext="Querying DISCO Gateway & Generating Token" />
          ) : (
            <>
              <Zap size={16} />
              <span>Pay ₦{amount.toLocaleString()} Electricity</span>
            </>
          )}
        </motion.button>
      </div>

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Authorize Electricity Payment"
        serviceName={`${disco} (${meterNumber})`}
        recipient={meterNumber}
        amount={amount}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </ModalWrapper>
  );
};

// 7. EXAM PIN MODAL (WAEC, NECO, NABTEB, JAMB)
interface ExamPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess: (tx: Transaction) => void;
  userBalance: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const ExamPinModal: React.FC<ExamPinModalProps> = ({
  isOpen,
  onClose,
  onGenerateSuccess,
  userBalance,
  userPin,
  biometricEnabled = false,
  isLightMode,
}) => {
  const [examType, setExamType] = useState<'waec' | 'neco' | 'nabteb' | 'jamb'>('waec');
  const [quantity, setQuantity] = useState<number>(1);
  const [candidatePhone, setCandidatePhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [generatedPins, setGeneratedPins] = useState<Array<{ pin: string; serial: string; exam: string; amount: number }> | null>(null);
  const [copiedPinIdx, setCopiedPinIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setIsPinModalOpen(false);
      setError('');
      setGeneratedPins(null);
    }
  }, [isOpen]);

  const examPrices: Record<string, number> = {
    waec: 3800,
    neco: 1250,
    nabteb: 1100,
    jamb: 4700,
  };

  const unitPrice = examPrices[examType] || 2000;
  const totalCost = unitPrice * quantity;

  const handleBuy = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    if (!quantity || isNaN(quantity) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      setError('Quantity must be a positive integer between 1 and 10.');
      return;
    }
    if (totalCost > userBalance) {
      setError(
        `Insufficient balance (₦${userBalance.toFixed(2)}). Fund your wallet with at least ₦${(
          totalCost - userBalance
        ).toFixed(2)}.`
      );
      return;
    }
    setError('');
    setIsPinModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsPinModalOpen(false);
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiBuyExamPin(examType, quantity, candidatePhone, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (res.success && res.data) {
        setGeneratedPins(res.data);
        playSuccessChime();
        triggerConfetti();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tx: Transaction = {
          id: res.reference || `EXAM-${Date.now()}`,
          title: `${examType.toUpperCase()} Result Checker PIN`,
          subtitle: `${quantity}x Token(s) Issued`,
          recipient: candidatePhone,
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: totalCost,
          isCredit: false,
          status: 'SUCCESS',
          category: 'pin',
          iconType: 'pin',
          token: res.data[0]?.pin,
        };
        onGenerateSuccess(tx);
      } else {
        setError(humanizeVtuError(res.message, 'exam pin purchase'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      setError(humanizeVtuError(err, 'exam pin purchase'));
    }
  };

  const handleCopySingle = (pin: string, idx: number) => {
    navigator.clipboard.writeText(pin);
    playTapSound();
    triggerHaptic('light');
    setCopiedPinIdx(idx);
    setTimeout(() => setCopiedPinIdx(null), 2000);
  };

  const getExamInstructions = (ex: string) => {
    switch (ex) {
      case 'waec':
        return 'Check online at: www.waecdirect.org';
      case 'neco':
        return 'Check online at: result.neco.gov.ng';
      case 'nabteb':
        return 'Check online at: eworld.nabteb.gov.ng';
      case 'jamb':
        return 'Check online at: efacility.jamb.gov.ng';
      default:
        return 'Check official examination portal';
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Exam Scratch Cards & PINs" isLightMode={isLightMode}>
      {!generatedPins ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Purchase official result checker scratch cards and registration tokens with instant delivery.
          </p>

          {/* Exam Body Grid */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Select Examination Body
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'waec', name: 'WAEC Result Checker', price: 3800 },
                { id: 'neco', name: 'NECO Result Token', price: 1250 },
                { id: 'nabteb', name: 'NABTEB Scratch Card', price: 1100 },
                { id: 'jamb', name: 'JAMB UTME / DE PIN', price: 4700 },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setExamType(item.id as any);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    examType === item.id
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs font-mono font-bold text-[#0047cc] dark:text-blue-400 mt-1">
                    ₦{item.price.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Quantity
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setQuantity(q);
                  }}
                  className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                    quantity === q
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {q} PIN{q > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Phone */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block mb-1">
              Candidate Phone (Optional SMS Copy)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              value={candidatePhone}
              onChange={(e) => setCandidatePhone(e.target.value)}
              placeholder="e.g. 08123456789"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc]"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-bold">Total Amount:</span>
            <span className="font-mono font-bold text-sm text-[#0047cc] dark:text-blue-400">
              ₦{totalCost.toLocaleString()}
            </span>
          </div>

          <WalletImpactPill currentBalance={userBalance} cost={totalCost} />

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleBuy}
            disabled={isProcessing || isPinModalOpen}
            className="w-full bg-[#0047cc] hover:bg-[#003eb8] text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <FintechButtonLoader text="Issuing Exam PIN..." subtext="Querying official examination gateway" />
            ) : (
              <>
                <GraduationCap size={16} />
                <span>Buy {examType.toUpperCase()} PIN (₦{totalCost.toLocaleString()})</span>
              </>
            )}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>Generated {generatedPins.length} {examType.toUpperCase()} Token(s)</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {generatedPins.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-2xs space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0047cc] dark:text-blue-400 uppercase">
                    {item.exam} Scratch PIN
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SN: {item.serial}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="font-mono font-black text-base tracking-widest text-slate-900 dark:text-white">
                    {item.pin}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingle(item.pin, idx)}
                    className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPinIdx === idx ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                  {getExamInstructions(examType)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print PINs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGeneratedPins(null);
                onClose();
              }}
              className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] text-white py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title={`Authorize ${examType.toUpperCase()} PIN Purchase`}
        serviceName={`${quantity}x ${examType.toUpperCase()} Result Checker Token`}
        recipient={candidatePhone}
        amount={totalCost}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </ModalWrapper>
  );
};

// 8. MORE SERVICES HUB (Categorized, Goal-Centered Dispatcher)
interface MoreServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService?: (serviceName: string) => void;
  onOpenCableTv?: () => void;
  onOpenElectricity?: () => void;
  onOpenExamPin?: () => void;
  onOpenRechargePin?: () => void;
  onOpenDataCard?: () => void;
  onUtilityPaymentSuccess?: (tx: Transaction) => void;
  userBalance?: number;
  userPin?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const MoreServicesModal: React.FC<MoreServicesModalProps> = ({
  isOpen,
  onClose,
  onSelectService,
  onOpenCableTv,
  onOpenElectricity,
  onOpenExamPin,
  onOpenRechargePin,
  onOpenDataCard,
  isLightMode,
}) => {
  const serviceCategories = [
    {
      category: 'Bill Payments',
      items: [
        {
          name: 'Electricity Bills',
          desc: 'Instant prepaid token generation & postpaid bills (IKEDC, EKEDC, AEDC, KEDCO)',
          icon: Zap,
          badge: 'Automated Token',
          action: () => {
            onClose();
            if (onOpenElectricity) onOpenElectricity();
          },
        },
        {
          name: 'Cable TV Subscriptions',
          desc: 'Instant decoder renewal for DSTV, GOtv, StarTimes & Showmax',
          icon: Tv,
          badge: 'Instant Activation',
          action: () => {
            onClose();
            if (onOpenCableTv) onOpenCableTv();
          },
        },
      ],
    },
    {
      category: 'Education & Examination',
      items: [
        {
          name: 'Exam Scratch Cards & Tokens',
          desc: 'Official result checker PINs for WAEC, NECO, NABTEB & JAMB',
          icon: GraduationCap,
          badge: 'Direct Gateway',
          action: () => {
            onClose();
            if (onOpenExamPin) onOpenExamPin();
          },
        },
      ],
    },
    {
      category: 'Wholesale & Retail Printing',
      items: [
        {
          name: 'Recharge PIN (e-PIN) Printing',
          desc: 'Print airtime vouchers with serial numbers at 2% merchant discount',
          icon: CreditCard,
          badge: '2% Discount',
          action: () => {
            onClose();
            if (onOpenRechargePin) onOpenRechargePin();
          },
        },
        {
          name: 'Data Card Printing',
          desc: 'Generate offline data recharge vouchers for MTN, Airtel, Glo & 9mobile',
          icon: Phone,
          badge: 'Offline Voucher',
          action: () => {
            onClose();
            if (onOpenDataCard) onOpenDataCard();
          },
        },
      ],
    },
    {
      category: 'Specialized Telecom Utilities',
      items: [
        {
          name: 'Airtime to Cash Converter',
          desc: 'Convert excess airtime balance on your SIM directly to wallet cash',
          icon: Phone,
          badge: 'Live Agent',
          action: () => {
            window.open('https://wa.me/2348000000000?text=Hello%20Alamin%20Jagora%2C%20I%20want%20to%20convert%20airtime%20to%20cash', '_blank');
          },
        },
        {
          name: 'Bulk SMS Messaging',
          desc: 'Send customized sender ID SMS messages to contacts and customer lists',
          icon: MessageCircle,
          badge: '99% Delivery',
          action: () => {
            if (onSelectService) onSelectService('Bulk SMS');
            onClose();
          },
        },
      ],
    },
  ];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="All Utilities & Services" isLightMode={isLightMode}>
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Select any service below to open its direct, goal-centered payment window.
        </p>

        {serviceCategories.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {group.category}
            </h5>

            <div className="space-y-2">
              {group.items.map((svc, sIdx) => {
                const Icon = svc.icon;
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      triggerHaptic('light');
                      svc.action();
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] ${
                      isLightMode
                        ? 'bg-white border-slate-200/90 hover:border-blue-300'
                        : 'bg-slate-800/80 border-slate-700/80 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        svc.name.includes('Electricity')
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs'
                          : svc.name.includes('Cable')
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs'
                          : svc.name.includes('Exam')
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs'
                          : svc.name.includes('Recharge')
                          ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs'
                          : svc.name.includes('Data Card')
                          ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-xs'
                          : svc.name.includes('Airtime')
                          ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs'
                          : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-xs'
                      }`}>
                        <Icon size={19} className="stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h6 className="font-sans text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {svc.name}
                          </h6>
                          {svc.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-300 shrink-0">
                              {svc.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {svc.desc}
                        </p>
                      </div>
                    </div>

                    <ArrowRight size={15} className="text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

// 6. TRANSACTION RECEIPT MODAL
interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  isLightMode?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  isLightMode,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      triggerConfetti();
      playSuccessChime();
    }
  }, [isOpen, transaction]);

  if (!transaction) return null;

  const txIdStr = String(transaction.id || transaction.reference || 'AJD-TX').toUpperCase();

  const handleCopyRef = () => {
    navigator.clipboard.writeText(txIdStr);
    playTapSound();
    triggerHaptic('light');
    setCopiedRef(true);
    setActionFeedback(`Reference ID (${txIdStr}) copied for Support!`);
    setTimeout(() => {
      setCopiedRef(false);
      setActionFeedback(null);
    }, 2800);
  };

  const handleCopyToken = (tok: string) => {
    navigator.clipboard.writeText(tok);
    playTapSound();
    triggerHaptic('light');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDownloadImage = async () => {
    try {
      setIsExporting(true);
      playTapSound();
      const { dataUrl } = await captureReceiptAsImage(receiptRef.current, transaction);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `AJD-Receipt-${txIdStr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      playSuccessChime();
      triggerHaptic('medium');
      setActionFeedback('Receipt image saved to Downloads (.PNG)');
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      console.error('Download image error:', err);
      setActionFeedback('Failed to generate image');
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareImage = async () => {
    try {
      setIsSharing(true);
      playTapSound();
      const { dataUrl, blob } = await captureReceiptAsImage(receiptRef.current, transaction);
      const filename = `AJD-Receipt-${txIdStr}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Check if Web Share API with image file is supported (e.g. mobile Safari, Chrome Android)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Al'amin Jagora Data Official Receipt",
          text: `Official transaction receipt for ${transaction.title} (₦${transaction.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}) - Ref: ${txIdStr}`,
        });
        setActionFeedback('Receipt image shared!');
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        // Fallback for browsers or sandboxes without direct file sharing:
        // Automatically download the PNG image and copy to clipboard
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ 'image/png': blob }),
            ]);
            setActionFeedback('Image copied to clipboard & saved as PNG!');
          } catch {
            setActionFeedback('Receipt image saved as PNG to Downloads!');
          }
        } else {
          setActionFeedback('Receipt image saved as PNG to Downloads!');
        }
        setTimeout(() => setActionFeedback(null), 4000);
      }
      playSuccessChime();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share image error:', err);
        handleDownloadImage();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Transaction Receipt" isLightMode={isLightMode}>
      <div className="space-y-3.5">
        {/* Official Receipt Details Slip (Target for image capture) */}
        <div
          ref={receiptRef}
          id="official-receipt-slip"
          className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-md relative overflow-hidden font-sans select-none"
        >
          {/* Top Royal Blue Gradient Accent Line */}
          <div className="h-2 w-full bg-gradient-to-r from-[#003bb3] via-[#0047cc] to-[#1e60ff]" />

          {/* Header Brand Section */}
          <div className="p-4 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0047cc] text-white flex items-center justify-center font-black text-sm shadow-xs border border-blue-400/30">
                AJ
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-[13px] tracking-tight block uppercase leading-tight font-sans">
                  Al'amin Jagora Data
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Telecom & Utility VTU Services
                </span>
                <span className="text-[9.5px] text-blue-600 font-semibold font-mono block">
                  www.jagora.ng
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold tracking-wide">
                <Check size={10} className="stroke-[3]" />
                <span>SUCCESSFUL</span>
              </span>
              <span className="text-[9px] text-slate-400 block font-mono mt-1">
                Official e-Receipt
              </span>
            </div>
          </div>

          {/* Amount & Status Centerpiece */}
          <div className="bg-slate-50/90 border-y border-slate-100 py-3.5 px-4 text-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
              TOTAL AMOUNT PAID
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {transaction.isCredit ? '+' : '-'}₦{transaction.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs font-semibold text-[#0047cc] mt-0.5">
              {transaction.title}
            </p>
          </div>

          {/* Ticket Perforation with Notch Cutouts */}
          <div className="relative py-1 flex items-center justify-center overflow-hidden">
            {/* Left Notch */}
            <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 shadow-inner" />
            {/* Perforation dashed line */}
            <div className="w-full border-t-2 border-dashed border-slate-200 mx-4" />
            {/* Right Notch */}
            <div className="absolute -right-2.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 shadow-inner" />
          </div>

          {/* Structured Transaction Ledger */}
          <div className="px-4 py-2 space-y-2.5 text-xs">
            {/* Transaction Ref with Tap-to-Copy for Support */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-0.5">
              <div>
                <span className="text-slate-500 font-medium block">Transaction Ref</span>
                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                  Tap to copy for Support
                </span>
              </div>
              <button
                type="button"
                id="receipt-copy-ref-btn"
                onClick={handleCopyRef}
                className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-between sm:justify-start gap-2.5 transition-all cursor-pointer select-none active:scale-[0.98] ${
                  copiedRef
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                    : 'bg-blue-50/90 hover:bg-blue-100 active:bg-blue-200 border-blue-200 text-blue-950 shadow-2xs'
                }`}
                title="Tap to copy transaction reference ID for support"
                aria-label={`Copy transaction reference ${txIdStr}`}
              >
                <span className="font-mono font-bold text-xs tracking-tight">
                  {txIdStr}
                </span>
                <span className="flex items-center gap-1 pl-2 border-l border-blue-200/80 text-[10.5px] font-bold uppercase tracking-wider">
                  {copiedRef ? (
                    <>
                      <Check size={13} className="text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-blue-600" />
                      <span className="text-blue-700">Copy</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Date & Time</span>
              <span className="font-mono font-medium text-slate-800 text-xs">
                {transaction.date}
              </span>
            </div>

            {transaction.recipient && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Recipient / Beneficiary</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {transaction.recipient}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Service Category</span>
              <span className="capitalize font-bold text-slate-800 text-xs">
                {transaction.category}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Payment Method</span>
              <span className="font-semibold text-slate-800 text-xs">
                AJD Virtual Wallet
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Delivery Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 text-xs">
                <CheckCircle size={12} className="text-emerald-600" />
                <span>Delivered & Verified</span>
              </span>
            </div>
          </div>

          {/* Token / PIN Highlight Box (if present) */}
          {transaction.token && (
            <div className="mx-4 my-2 p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                  Recharge Token / PIN
                </span>
                <span className="font-mono text-base font-black text-emerald-700 tracking-wider">
                  {transaction.token}
                </span>
              </div>
              <button
                data-hide-on-capture="true"
                onClick={() => handleCopyToken(transaction.token!)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
              >
                {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Barcode & Digital Security Stamp */}
          <div className="mt-2 mx-4 pt-2.5 pb-3 border-t border-dashed border-slate-200 flex items-center justify-between">
            <div>
              {/* Simulated Barcode Lines */}
              <div className="flex items-center gap-[2px] h-5">
                {[3, 1, 2, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 3, 1, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4].map(
                  (width, index) => (
                    <div
                      key={index}
                      className="bg-slate-800 rounded-[0.5px]"
                      style={{ width: `${width}px`, height: '100%' }}
                    />
                  )
                )}
              </div>
              <span className="text-[8.5px] font-mono font-medium text-slate-500 tracking-wider block mt-1">
                DIGITALLY CERTIFIED RECEIPT
              </span>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold font-mono">
                <ShieldCheck size={12} />
                <span>AJD VERIFIED</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block font-medium mt-0.5">
                support@jagora.ng
              </span>
            </div>
          </div>

          {/* Legal / Authenticity Footer Strip */}
          <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 text-center">
            <span className="text-[9px] text-slate-400 font-medium">
              Official digital proof of transaction • Al'amin Jagora Data Switch
            </span>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-2 transition-all">
            <CheckCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Actions Bar (Image Sharing & Image Downloading) */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {/* Share as Image Button */}
            <button
              id="receipt-share-image-btn"
              onClick={handleShareImage}
              disabled={isSharing || isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-sans text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSharing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  <span>Share Image</span>
                </>
              )}
            </button>

            {/* Download as Image Button */}
            <button
              id="receipt-download-image-btn"
              onClick={handleDownloadImage}
              disabled={isSharing || isExporting}
              className="bg-[#0047cc] hover:bg-blue-700 active:scale-[0.98] text-white font-sans text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download Image</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
