import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { NetworkId, DataPlan, UserProfile } from '../../types';
import { networkProviders, dataPlans } from '../../data/mockData';
import {
  Smartphone,
  BookUser,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Check,
  ShieldCheck,
  Tag,
  ArrowRight,
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

interface BuyDataScreenProps {
  user: UserProfile;
  onBuyData: (plan: DataPlan, phone: string, pin?: string) => boolean | Promise<boolean>;
  onNavigateBack: () => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

export const BuyDataScreen: React.FC<BuyDataScreenProps> = ({
  user,
  onBuyData,
  isLightMode,
  isMaintenanceMode,
}) => {
  const [plans, setPlans] = useState<DataPlan[]>(dataPlans);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('mtn');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isManualNetworkOverride, setIsManualNetworkOverride] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('mtn-1gb');
  const [planCategoryFilter, setPlanCategoryFilter] = useState<'ALL' | 'SME' | 'CG' | 'DIRECT'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Lockout ref against rapid double-clicks
  const isSubmittingRef = useRef<boolean>(false);

  // Sync custom pricing set by administrator
  useEffect(() => {
    apiGetPricingSettings()
      .then((res) => {
        if (res.status === 'success' && res.data?.customPricing) {
          const custom = res.data.customPricing;
          setPlans(
            dataPlans
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
      })
      .catch(() => {});
  }, []);

  const quickBeneficiaries = user?.phone ? [
    { name: 'My Line', phone: user.phone, network: (normalizeNigerianPhone(user.phone).detectedNetwork || 'mtn') as NetworkId },
  ] : [];

  // Auto-detect network from phone only if user has NOT manually chosen an override
  useEffect(() => {
    if (isManualNetworkOverride) return;

    const norm = normalizeNigerianPhone(phone);
    if (norm.detectedNetwork && norm.detectedNetwork !== selectedNetwork) {
      setSelectedNetwork(norm.detectedNetwork);
      const matchPlan = plans.find((p) => p.network === norm.detectedNetwork);
      if (matchPlan) setSelectedPlanId(matchPlan.id);
    }
  }, [phone, isManualNetworkOverride, selectedNetwork, plans]);

  // Handle phone input change with dynamic carrier prefix detection
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setErrorMessage('');
    const norm = normalizeNigerianPhone(val);
    if (norm.detectedNetwork && norm.detectedNetwork !== selectedNetwork) {
      setSelectedNetwork(norm.detectedNetwork);
      setIsManualNetworkOverride(false);
      const matchPlan = plans.find((p) => p.network === norm.detectedNetwork);
      if (matchPlan) setSelectedPlanId(matchPlan.id);
    }
  };

  // Filter plans by selected network and category
  const availablePlans = plans.filter((p) => {
    if (p.network !== selectedNetwork) return false;
    if (planCategoryFilter === 'ALL') return true;
    const typeUpper = (p.type || '').toUpperCase();
    if (planCategoryFilter === 'SME') return typeUpper.includes('SME');
    if (planCategoryFilter === 'CG') return typeUpper.includes('CG') || typeUpper.includes('CORPORATE');
    if (planCategoryFilter === 'DIRECT') return typeUpper.includes('DIRECT') || typeUpper.includes('GIFTING');
    return true;
  });

  const activePlan = plans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  const handleNetworkChange = (netId: NetworkId) => {
    playTapSound();
    triggerHaptic('light');
    setIsManualNetworkOverride(true);
    setSelectedNetwork(netId);
    const firstPlan = plans.find((p) => p.network === netId);
    if (firstPlan) setSelectedPlanId(firstPlan.id);
  };

  const handleResetToAutoDetect = () => {
    playTapSound();
    setIsManualNetworkOverride(false);
    const norm = normalizeNigerianPhone(phone);
    if (norm.detectedNetwork) {
      setSelectedNetwork(norm.detectedNetwork);
      const matchPlan = dataPlans.find((p) => p.network === norm.detectedNetwork);
      if (matchPlan) setSelectedPlanId(matchPlan.id);
    }
  };

  const handleSelectBeneficiary = (b: typeof quickBeneficiaries[0]) => {
    playTapSound();
    triggerHaptic('light');
    setPhone(b.phone);
    setSelectedNetwork(b.network);
    setIsManualNetworkOverride(true);
    const matchPlan = dataPlans.find((p) => p.network === b.network);
    if (matchPlan) setSelectedPlanId(matchPlan.id);
    setErrorMessage('');
  };

  const handlePurchase = () => {
    if (isProcessing || isPinModalOpen || isSubmittingRef.current) return;

    setSuccessMessage('');
    setErrorMessage('');
    playTapSound();

    if (isMaintenanceMode) {
      playErrorTone();
      setErrorMessage('System maintenance is currently in progress. Data vending is temporarily paused.');
      return;
    }

    const norm = normalizeNigerianPhone(phone);
    if (!norm.isValid) {
      playErrorTone();
      setErrorMessage(norm.error || 'Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678).');
      return;
    }

    if (!activePlan) {
      playErrorTone();
      setErrorMessage('Please select a data bundle plan.');
      return;
    }

    if (user.balance < activePlan.price) {
      playErrorTone();
      setErrorMessage(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          activePlan.price - user.balance
        ).toFixed(2)} to continue.`
      );
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsPinModalOpen(false);
    const norm = normalizeNigerianPhone(phone);
    const cleanPhone = norm.cleaned;

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const success = await onBuyData(activePlan, cleanPhone, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (success) {
        playSuccessChime();
        triggerConfetti();
        setSuccessMessage(`Successfully delivered ${activePlan.size} ${selectedNetwork.toUpperCase()} to ${cleanPhone}!`);
      } else {
        playErrorTone();
        setErrorMessage('Data purchase could not be completed. Your wallet balance has not been deducted.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      playErrorTone();
      setErrorMessage(humanizeVtuError(err, 'data purchase'));
    }
  };

  const handlePickContact = async () => {
    playTapSound();
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts[0]?.tel && contacts[0].tel.length > 0) {
          const raw = contacts[0].tel[0];
          setPhone(normalizeNigerianPhone(raw).cleaned || raw);
          setIsManualNetworkOverride(false);
          return;
        }
      }
    } catch {}
    if (user?.phone) {
      setPhone(user.phone);
      setIsManualNetworkOverride(false);
    }
  };

  // Real-time phone analysis for instant feedback
  const phoneValidation = normalizeNigerianPhone(phone);

  // Network visual chip styling metadata
  const networkMetadata: Record<NetworkId, { subtitle: string; borderAccent: string; activeBadge: string }> = {
    mtn: {
      subtitle: 'SME & Direct',
      borderAccent: 'hover:border-amber-400',
      activeBadge: 'bg-amber-400/20 text-amber-800 dark:text-amber-300 border-amber-400/40',
    },
    airtel: {
      subtitle: 'Corporate Gifting',
      borderAccent: 'hover:border-red-400',
      activeBadge: 'bg-red-400/20 text-red-800 dark:text-red-300 border-red-400/40',
    },
    glo: {
      subtitle: 'Special Bundles',
      borderAccent: 'hover:border-emerald-400',
      activeBadge: 'bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 border-emerald-400/40',
    },
    '9mobile': {
      subtitle: 'Corporate Data',
      borderAccent: 'hover:border-teal-400',
      activeBadge: 'bg-teal-400/20 text-teal-800 dark:text-teal-300 border-teal-400/40',
    },
  };

  return (
    <div id="screen-buy-data" className="px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-5xl mx-auto w-full">
      {/* Maintenance Mode Warning */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-slate-900 dark:text-white block text-sm">
              Data Purchases Temporarily Paused
            </strong>
            <p className="leading-relaxed">
              System maintenance is currently in progress. Data bundle vending has been temporarily paused by administration to protect user transactions. Please check back shortly.
            </p>
          </div>
        </div>
      )}

      {/* 1. PROVIDER LOGO CHIPS (Tactile, Dynamic, High Contrast) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Select Network Provider
          </h2>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            All 4 Switches Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {networkProviders.map((provider) => {
            const isSelected = selectedNetwork === provider.id;
            const meta = networkMetadata[provider.id];

            return (
              <button
                key={provider.id}
                type="button"
                id={`network-select-${provider.id}`}
                onClick={() => handleNetworkChange(provider.id)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2.5 shadow-2xs relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : isLightMode
                    ? `bg-white border-slate-200/90 ${meta.borderAccent} text-slate-700 hover:border-slate-300`
                    : `bg-[#0c1322] border-slate-800/90 ${meta.borderAccent} text-slate-300 hover:border-slate-700`
                }`}
              >
                <TelecomLogo
                  network={provider.id}
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
                      {provider.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                    {meta.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Manual Network Override Notice */}
        {isManualNetworkOverride && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-mono">
            <span>Manual lock: {selectedNetwork.toUpperCase()}</span>
            <button
              type="button"
              onClick={handleResetToAutoDetect}
              className="flex items-center gap-1 font-bold underline hover:no-underline cursor-pointer text-[11px]"
            >
              <RefreshCw size={11} />
              <span>Auto-detect</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. RECIPIENT PHONE WITH INSTANT INLINE VALIDATION FEEDBACK */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
            Recipient Mobile Line
          </label>
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            Balance: <strong className="text-blue-600 dark:text-blue-400">₦{user.balance.toFixed(2)}</strong>
          </span>
        </div>

        {/* Fast Beneficiary 1-Tap Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickBeneficiaries.map((b, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectBeneficiary(b)}
              className={`shrink-0 min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                phone === b.phone
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold uppercase">
                {b.name[0]}
              </span>
              <span>{b.name}</span>
            </button>
          ))}
        </div>

        {/* Smart Input Container */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Smartphone size={18} />
          </div>

          <input
            id="phone-number-input"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="080 1234 5678"
            className={`w-full rounded-2xl py-3.5 pl-10 pr-24 font-mono text-base sm:text-sm tracking-wide border transition-all focus:outline-none shadow-2xs ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                : 'bg-[#0c1322] border-slate-800 text-slate-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
            }`}
          />

          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
            <button
              type="button"
              onClick={handlePickContact}
              title="Pick a Contact"
              className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <BookUser size={18} />
            </button>
          </div>
        </div>

        {/* Instant Micro-Feedback State for Phone */}
        <div className="flex items-center justify-between text-[11px] font-mono px-1">
          {phoneValidation.isValid ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Check size={12} className="stroke-[3]" />
              <span>Valid 11-digit line ({phoneValidation.detectedNetwork?.toUpperCase() || 'Verified'})</span>
            </span>
          ) : phone.trim().length > 0 ? (
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              {phoneValidation.cleaned.length}/11 digits • {phoneValidation.error || 'Enter 11 digits'}
            </span>
          ) : (
            <span className="text-slate-400">Enter recipient 11-digit phone number</span>
          )}

          {phoneValidation.detectedNetwork && (
            <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">
              Switch: {phoneValidation.detectedNetwork}
            </span>
          )}
        </div>
      </section>

      {/* 3. SELECT DATA PLAN */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Select Bundle ({selectedNetwork.toUpperCase()})
          </h2>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {availablePlans.length} packages
          </span>
        </div>

        {/* Plan Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          {(['ALL', 'SME', 'CG', 'DIRECT'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                playTapSound();
                setPlanCategoryFilter(tab);
              }}
              className={`flex-1 min-h-[44px] flex items-center justify-center py-2 px-1 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                planCategoryFilter === tab
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Plans' : tab}
            </button>
          ))}
        </div>

        {/* Plan List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {availablePlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const canAfford = user.balance >= plan.price;

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                onClick={() => {
                  playTapSound();
                  triggerHaptic('light');
                  setSelectedPlanId(plan.id);
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-2xs card-interactive ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : isLightMode
                    ? 'border-slate-200/90 bg-white hover:border-slate-300'
                    : 'border-slate-800/90 bg-[#0c1322] hover:border-slate-700'
                }`}
              >
                {/* Left: Radio + Data Volume + Validity */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                        {plan.size}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        • {plan.validity}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-mono font-semibold text-blue-600 dark:text-blue-400 block truncate">
                      {plan.type}
                    </span>
                  </div>
                </div>

                {/* Right: Tabular Price */}
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100 block">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-mono block ${
                      canAfford ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-500 font-semibold'
                    }`}
                  >
                    {canAfford ? 'Affordable' : 'Low Balance'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Affordability Ledger Preview (NN/g Heuristic #1) */}
      {activePlan && (
        <WalletImpactPill
          currentBalance={user.balance}
          cost={activePlan.price}
        />
      )}

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 text-xs font-mono">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-xs font-mono">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4. CHECKOUT TRIGGER BUTTON */}
      <section className="pt-1">
        <button
          id="buy-data-submit-btn"
          type="button"
          onClick={handlePurchase}
          disabled={isProcessing || isPinModalOpen || isMaintenanceMode}
          className={`w-full font-mono text-sm font-bold py-3.5 rounded-xl shadow-2xs transition-all flex justify-center items-center gap-2 border active:scale-[0.99] ${
            isMaintenanceMode
              ? 'bg-amber-600/80 text-white cursor-not-allowed border-amber-500/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer border-blue-400/30 disabled:opacity-60 disabled:cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <FintechButtonLoader text="Dispensing Bundle..." subtext="Routing via Jagora Switch" />
          ) : isMaintenanceMode ? (
            <>
              <AlertCircle size={16} />
              <span>Services Paused (Maintenance Mode)</span>
            </>
          ) : (
            <>
              <span>Authorize Purchase (₦{activePlan?.price.toLocaleString()})</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </section>

      {/* Pre-Transaction Order Confirmation Modal */}
      {activePlan && (
        <OrderConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={() => {
            setIsConfirmModalOpen(false);
            setIsPinModalOpen(true);
          }}
          details={{
            serviceType: 'DATA',
            title: 'Confirm Data Purchase',
            subtitle: `${selectedNetwork.toUpperCase()} ${activePlan.size} (${activePlan.type})`,
            network: selectedNetwork,
            recipient: phone,
            recipientLabel: 'Recipient Phone',
            amount: activePlan.price,
            discount: 0,
            userBalance: user.balance,
            additionalInfo: [{ label: 'Validity', value: activePlan.validity }],
          }}
          isLightMode={isLightMode}
        />
      )}

      {/* Numeric PIN Pad Verification Modal */}
      {activePlan && (
        <PinVerificationModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={handlePinVerified}
          title="Authorize Data Purchase"
          serviceName={`${activePlan.size} ${selectedNetwork.toUpperCase()} (${activePlan.type})`}
          recipient={phone}
          amount={activePlan.price}
          biometricEnabled={user.biometricEnabled}
          isLightMode={isLightMode}
        />
      )}
    </div>
  );
};

export default BuyDataScreen;
