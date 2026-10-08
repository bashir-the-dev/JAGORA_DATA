import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { NetworkId, UserProfile } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Tag,
  Zap,
  ArrowRight,
  BookUser,
  ShieldCheck,
  PhoneCall,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { PinVerificationModal } from '../modals/PinVerificationModal';
import { OrderConfirmationModal } from '../modals/OrderConfirmationModal';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import { humanizeVtuError } from '../../utils/errorParser';
import { apiGetPricingSettings } from '../../services/apiClient';
import {
  playTapSound,
  playErrorTone,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

interface BuyAirtimeScreenProps {
  user: UserProfile;
  onAirtimeSuccess: (network: string, phone: string, amount: number, pin?: string) => Promise<boolean> | boolean;
  onNavigateBack: () => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

export const BuyAirtimeScreen: React.FC<BuyAirtimeScreenProps> = ({
  user,
  onAirtimeSuccess,
  isLightMode,
  isMaintenanceMode,
}) => {
  const userPhoneNorm = user?.phone ? normalizeNigerianPhone(user.phone) : null;
  const initialNet = (userPhoneNorm?.detectedNetwork || 'mtn') as NetworkId;
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(initialNet);
  const [phone, setPhone] = useState(user?.phone || '');
  const [isManualNetworkOverride, setIsManualNetworkOverride] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isSubmittingRef = useRef<boolean>(false);

  // Dynamic wholesale discounts configured in admin panel
  const [networkDiscounts, setNetworkDiscounts] = useState<Record<string, number>>({
    mtn: 2.5,
    airtel: 3.0,
    glo: 4.0,
    '9mobile': 4.5,
  });

  useEffect(() => {
    // Fetch live dynamic discounts
    apiGetPricingSettings()
      .then((res) => {
        if (res.status === 'success' && res.data?.airtimeDiscounts) {
          setNetworkDiscounts(res.data.airtimeDiscounts);
        }
      })
      .catch(() => {});
  }, []);

  const networks = [
    { id: 'mtn' as NetworkId, name: 'MTN', color: '#ffdb3c', discount: '2.5% OFF' },
    { id: 'airtel' as NetworkId, name: 'Airtel', color: '#ff5252', discount: '3.0% OFF' },
    { id: 'glo' as NetworkId, name: 'Glo', color: '#00c853', discount: '4.0% OFF' },
    { id: '9mobile' as NetworkId, name: '9mobile', color: '#4caf50', discount: '4.5% OFF' },
  ];

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

  const quickBeneficiaries = user?.phone ? [
    { name: 'My Line', phone: user.phone, network: initialNet }
  ] : [];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setErrorMessage('');
    setSuccessMessage('');
    const norm = normalizeNigerianPhone(val);
    // When the phone number is changed or typed, dynamically switch to the detected carrier
    if (norm.detectedNetwork) {
      if (norm.detectedNetwork !== selectedNetwork) {
        setSelectedNetwork(norm.detectedNetwork);
        setIsManualNetworkOverride(false);
      }
    } else {
      setIsManualNetworkOverride(false);
    }
  };

  const handleSelectBeneficiary = (b: typeof quickBeneficiaries[0]) => {
    playTapSound();
    triggerHaptic('light');
    setPhone(b.phone);
    setSelectedNetwork(b.network);
    setIsManualNetworkOverride(false);
    setErrorMessage('');
    setSuccessMessage('');
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
  const discountVal = Math.round((amount - payVal) * 100) / 100;

  const handleBuy = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;
    playTapSound();
    setSuccessMessage('');
    setErrorMessage('');

    if (isMaintenanceMode) {
      playErrorTone();
      setErrorMessage('System maintenance is currently in progress. Airtime top-up is temporarily paused.');
      return;
    }

    // Strict positive integer validation: reject <= 0, decimals, or non-integers
    if (!amount || isNaN(amount) || !Number.isInteger(amount) || amount < 50 || amount > 50000) {
      setErrorMessage('Recharge amount must be a positive integer between ₦50 and ₦50,000 (decimals are not permitted).');
      return;
    }

    if (payVal > user.balance) {
      setErrorMessage(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          payVal - user.balance
        ).toFixed(2)}.`
      );
      return;
    }

    const norm = normalizeNigerianPhone(phone);
    if (!norm.isValid) {
      setErrorMessage(norm.error || 'Please enter a valid 11-digit Nigerian phone number.');
      return;
    }

    setErrorMessage('');
    setIsConfirmModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsPinModalOpen(false);
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    const norm = normalizeNigerianPhone(phone);
    const cleanPhone = norm.cleaned;

    try {
      const result = await onAirtimeSuccess(selectedNetwork.toUpperCase(), cleanPhone, amount, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (result !== false) {
        playSuccessChime();
        triggerConfetti();
        setSuccessMessage(`Successfully recharged ₦${amount.toLocaleString()} ${selectedNetwork.toUpperCase()} Airtime to ${cleanPhone}!`);
      } else {
        playErrorTone();
        setErrorMessage('Airtime transaction could not be completed. Your wallet balance was not charged.');
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      playErrorTone();
      setErrorMessage(humanizeVtuError(err, 'airtime purchase'));
    }
  };

  const phoneValidation = normalizeNigerianPhone(phone);

  return (
    <div id="screen-buy-airtime" className="px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
      {/* Maintenance Mode Warning */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-slate-900 dark:text-white block text-sm">
              Airtime Recharge Temporarily Paused
            </strong>
            <p className="leading-relaxed">
              System maintenance is currently in progress. Airtime recharge has been temporarily paused by administration to protect user transactions. Please check back shortly.
            </p>
          </div>
        </div>
      )}

      {/* 1. SELECT NETWORK PROVIDER */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Select Network Provider
          </h2>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Instant Top-Up
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {networks.map((item) => {
            const isSelected = selectedNetwork === item.id;
            const discount = networkDiscounts[item.id] ?? 2.5;

            return (
              <button
                key={item.id}
                type="button"
                id={`airtime-network-select-${item.id}`}
                onClick={() => {
                  playTapSound();
                  setSelectedNetwork(item.id);
                  setIsManualNetworkOverride(true);
                }}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2.5 shadow-2xs relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : isLightMode
                    ? 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700'
                    : 'bg-[#0c1322] border-slate-800/90 hover:border-slate-700 text-slate-300'
                }`}
              >
                <TelecomLogo
                  network={item.id}
                  size="sm"
                  className="rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-heading font-bold truncate ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    {discount}% OFF
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. RECIPIENT PHONE NUMBER */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="airtime-recipient-phone"
            className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase"
          >
            Recipient Phone Number
          </label>
          {phoneValidation.cleaned && (
            <span
              className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${
                phoneValidation.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
              }`}
            >
              {phoneValidation.isValid ? (
                <>
                  <Check size={12} className="stroke-[3]" />
                  Valid ({phoneValidation.detectedNetwork?.toUpperCase() || selectedNetwork.toUpperCase()})
                </>
              ) : (
                phoneValidation.cleaned.length < 11
                  ? `${11 - phoneValidation.cleaned.length} digits left`
                  : 'Invalid Format'
              )}
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Smartphone size={18} className="text-slate-400 dark:text-slate-500" />
          </div>

          <input
            id="airtime-recipient-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="0801 234 5678"
            maxLength={14}
            className="w-full pl-10 pr-24 py-3.5 rounded-2xl border text-sm font-mono font-semibold tracking-wide transition-all bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
          />

          <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
            {user?.phone && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setPhone(user.phone);
                  const norm = normalizeNigerianPhone(user.phone);
                  if (norm.detectedNetwork) {
                    setSelectedNetwork(norm.detectedNetwork);
                    setIsManualNetworkOverride(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-heading font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                My SIM
              </button>
            )}
          </div>
        </div>

        {/* Real-time Carrier Mismatch Warning Banner */}
        {phoneValidation.detectedNetwork && phoneValidation.detectedNetwork !== selectedNetwork && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-amber-900 dark:text-amber-200">
                <span className="font-bold">Carrier Mismatch Detected: </span>
                <span>This number is an <strong className="uppercase font-mono">{phoneValidation.detectedNetwork}</strong> line, but you have <strong className="uppercase font-mono">{selectedNetwork}</strong> selected.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                triggerHaptic('medium');
                setSelectedNetwork(phoneValidation.detectedNetwork!);
                setIsManualNetworkOverride(false);
              }}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <TelecomLogo network={phoneValidation.detectedNetwork} size="xs" />
              <span>Switch to {phoneValidation.detectedNetwork.toUpperCase()}</span>
            </button>
          </div>
        )}

        {/* Quick Beneficiary Chips */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Recent:</span>
            {quickBeneficiaries.map((b, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectBeneficiary(b)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{b.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({b.network.slice(0, 3).toUpperCase()})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. RECHARGE AMOUNT */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Recharge Amount (₦)
          </label>
          <span className="text-[11px] font-mono text-slate-500">Min ₦50 - Max ₦50,000</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickAmounts.map((amt) => {
            const isSelected = amount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  playTapSound();
                  setAmount(amt);
                }}
                className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
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
          min={50}
          max={50000}
          value={amount || ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setAmount(raw ? parseInt(raw, 10) : 0);
            setErrorMessage('');
          }}
          placeholder="Custom Amount (e.g. 1500)"
          className="w-full px-4 py-3 rounded-2xl border text-base font-mono font-bold bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
        />
      </section>

      {/* 4. PRICING BREAKDOWN & DISCOUNT CARD */}
      <section className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xs space-y-2 text-xs">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Airtime Face Value</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₦{amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Wholesale Discount ({safeDiscountPct}%)</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-₦{discountVal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
          <span className="text-sm">Total Payable</span>
          <span className="font-mono text-base text-[#0047cc] dark:text-blue-400">₦{payVal.toLocaleString()}</span>
        </div>
      </section>

      {/* Wallet balance impact pill */}
      <WalletImpactPill currentBalance={user.balance} cost={payVal} />

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        id="airtime-recharge-submit-btn"
        onClick={handleBuy}
        disabled={isProcessing || isPinModalOpen || isConfirmModalOpen || amount <= 0 || isMaintenanceMode}
        className={`w-full font-heading font-bold text-sm py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md ${
          isMaintenanceMode
            ? 'bg-amber-600/80 text-white cursor-not-allowed shadow-none'
            : 'bg-[#0047cc] hover:bg-[#003eb8] text-white shadow-blue-700/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <FintechButtonLoader text="Recharging Airtime..." subtext="Connecting telecom switch" />
        ) : isMaintenanceMode ? (
          <>
            <AlertCircle size={18} />
            <span>Services Paused (Maintenance Mode)</span>
          </>
        ) : (
          <>
            <PhoneCall size={18} />
            <span>Recharge ₦{amount.toLocaleString()} ({selectedNetwork.toUpperCase()}) • Pay ₦{payVal.toLocaleString()}</span>
            <ArrowRight size={16} />
          </>
        )}
      </motion.button>

      {/* Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          setIsPinModalOpen(true);
        }}
        details={{
          serviceType: 'AIRTIME',
          title: `${selectedNetwork.toUpperCase()} Airtime Top-Up`,
          network: selectedNetwork,
          recipient: phone,
          recipientLabel: 'Recipient Phone',
          amount: payVal,
          discount: discountVal,
          userBalance: user.balance,
          additionalInfo: [
            { label: 'Airtime Face Value', value: `₦${amount.toLocaleString()}` },
            { label: 'Reseller Discount', value: `${safeDiscountPct}% (-₦${discountVal.toLocaleString()})` },
            { label: 'Amount Payable', value: `₦${payVal.toLocaleString()}` },
            { label: 'Delivery Time', value: 'Instant (~2 seconds)' },
          ],
        }}
        isLightMode={isLightMode}
      />

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        serviceName={`${selectedNetwork.toUpperCase()} Airtime`}
        recipient={phone}
        amount={payVal}
        title="Authorize Airtime Top-Up"
        isLightMode={isLightMode}
        biometricEnabled={user.biometricEnabled}
      />
    </div>
  );
};
