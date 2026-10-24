import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NetworkId, DataPlan, UserProfile, PeyflexDataNetwork, PeyflexNetworkIdentifier } from '../../types';
import { peyflexDataNetworks, dataPlans } from '../../data/mockData';
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
  ArrowLeft,
  AlertTriangle,
  Lock,
  Wallet,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { PinVerificationModal } from '../modals/PinVerificationModal';
import { OrderConfirmationModal } from '../modals/OrderConfirmationModal';
import { PurchaseSuccessModal, PurchaseSuccessData } from '../modals/PurchaseSuccessModal';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { normalizeNigerianPhone } from '../../utils/phoneUtils';
import { humanizeVtuError } from '../../utils/errorParser';
import { apiGetPricingSettings, apiGetVtuPlans, apiGetDataNetworks } from '../../services/apiClient';
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

type WizardStep = 1 | 2 | 3 | 4;

function carrierToDefaultPeyflexNet(carrier: NetworkId): PeyflexNetworkIdentifier {
  if (carrier === 'mtn') return 'mtn_gifting_data';
  if (carrier === 'glo') return 'glo_data';
  if (carrier === '9mobile') return '9mobile_data';
  return 'airtel_data';
}

export const BuyDataScreen: React.FC<BuyDataScreenProps> = ({
  user,
  onBuyData,
  onNavigateBack,
  isLightMode = false,
  isMaintenanceMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [dataNetworks, setDataNetworks] = useState<PeyflexDataNetwork[]>(peyflexDataNetworks);
  const [plans, setPlans] = useState<DataPlan[]>(dataPlans);
  const [selectedDataNet, setSelectedDataNet] = useState<PeyflexNetworkIdentifier>('mtn_gifting_data');
  const [selectedPlanTab, setSelectedPlanTab] = useState<string>('All');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isManualNetworkOverride, setIsManualNetworkOverride] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('mtn_gifting_data_m110mbs');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<PurchaseSuccessData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmittingRef = useRef<boolean>(false);

  const currentNetObj = dataNetworks.find((n) => n.identifier === selectedDataNet) || dataNetworks[0];
  const selectedNetwork: NetworkId =
    currentNetObj?.carrier ||
    (selectedDataNet.startsWith('mtn')
      ? 'mtn'
      : selectedDataNet.startsWith('glo')
      ? 'glo'
      : selectedDataNet.startsWith('9mobile')
      ? '9mobile'
      : 'airtel');

  // Helper to apply custom pricing map onto plan array
  const applyPricingMap = (planList: DataPlan[], custom: Record<string, any>): DataPlan[] => {
    return planList
      .map((p) => {
        const override = custom[p.id] || custom[(p as any).planCode] || custom[(p as any).api_plan_id];
        if (override) {
          const newPrice = Number(override.sellingPrice ?? override.price);
          return {
            ...p,
            name: override.name || p.name,
            size: p.size, // Strictly preserved: pricing updates only affect price, never plan data size
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

  // Sync plans and pricing
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

    apiGetVtuPlans()
      .then((res) => {
        if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          const serverPlans = res.data;
          setPlans(() => {
            const seenIds = new Set<string>();
            const mergedList: DataPlan[] = [];
            for (const sp of serverPlans) {
              const uKey = sp.id || (sp as any).plan_id || '';
              if (!uKey || !uKey.includes('_data')) continue;
              const netKey = ((sp as any).network_key || (sp as any).networkKey || (uKey.startsWith('mtn_data_share') ? 'mtn_data_share' : uKey.startsWith('mtn_gifting_data') ? 'mtn_gifting_data' : uKey.startsWith('airtel_data') ? 'airtel_data' : uKey.startsWith('glo_data') ? 'glo_data' : '9mobile_data')) as PeyflexNetworkIdentifier;
              const priceVal = typeof sp.price === 'number' && !isNaN(sp.price) ? sp.price : (Number((sp as any).custom_retail_price) || Number((sp as any).selling_price) || 0);
              const sizeVal = sp.size || '1GB';
              const validityVal = sp.validity || '30 Days';
              if (!seenIds.has(uKey)) {
                seenIds.add(uKey);
                mergedList.push({
                  id: uKey,
                  network: sp.network || 'mtn',
                  networkKey: netKey,
                  name: sp.name || `${sizeVal} ${validityVal}`,
                  size: sizeVal,
                  validity: validityVal,
                  price: priceVal,
                  type: (sp as any).category || (sp as any).planType || (sp as any).type || 'Gifting',
                });
              }
            }
            return mergedList.length > 0 ? mergedList : dataPlans;
          });
        }
      })
      .catch(() => {});

    apiGetPricingSettings()
      .then((res) => {
        if (res.status === 'success' && res.data?.customPricing) {
          const custom = res.data.customPricing;
          try {
            localStorage.setItem('jagora_custom_pricing', JSON.stringify(custom));
          } catch {}
          setPlans((prev) => applyPricingMap(prev, custom));
        }
      })
      .catch(() => {});
  }, []);

  const networkPlans = useMemo(() => {
    const parseSizeToMb = (sizeStr: string): number => {
      if (!sizeStr) return 0;
      const s = sizeStr.toUpperCase().trim();
      const num = parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
      if (s.includes('GB')) return num * 1024;
      if (s.includes('MB')) return num;
      if (s.includes('TB')) return num * 1024 * 1024;
      return num;
    };
    return plans
      .filter((p) => {
        const pKey = (p as any).networkKey || (p as any).network_key || p.network;
        return pKey === selectedDataNet || p.id.startsWith(selectedDataNet);
      })
      .sort((a, b) => {
        const sizeA = parseSizeToMb(a.size);
        const sizeB = parseSizeToMb(b.size);
        if (sizeA !== sizeB) return sizeA - sizeB;
        return Number(a.price) - Number(b.price);
      });
  }, [plans, selectedDataNet]);

  const filteredPlans = useMemo(() => {
    if (selectedPlanTab === 'All') return networkPlans;
    return networkPlans.filter((p) => {
      const cat = ((p as any).planType || (p as any).category || '').toLowerCase();
      const tab = selectedPlanTab.toLowerCase();
      return cat.includes(tab) || p.name.toLowerCase().includes(tab);
    });
  }, [networkPlans, selectedPlanTab]);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || networkPlans[0] || plans[0];

  const handleSelectNetwork = (carrier: NetworkId) => {
    playTapSound();
    triggerHaptic('light');
    setIsManualNetworkOverride(true);
    const nextDataNet = carrierToDefaultPeyflexNet(carrier);
    setSelectedDataNet(nextDataNet);
    const matchPlan = plans.find((p) => ((p as any).networkKey || p.network) === nextDataNet || p.id.startsWith(nextDataNet));
    if (matchPlan) setSelectedPlanId(matchPlan.id);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setErrorMessage('');
    const norm = normalizeNigerianPhone(val);
    if (norm.detectedNetwork) {
      if (norm.detectedNetwork !== selectedNetwork) {
        const nextDataNet = carrierToDefaultPeyflexNet(norm.detectedNetwork);
        setSelectedDataNet(nextDataNet);
        setIsManualNetworkOverride(false);
        const matchPlan = plans.find((p) => ((p as any).networkKey || p.network) === nextDataNet || p.id.startsWith(nextDataNet));
        if (matchPlan) setSelectedPlanId(matchPlan.id);
      }
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
          return;
        }
      }
    } catch {}
    if (user?.phone) {
      setPhone(user.phone);
    }
  };

  const executePurchase = async (enteredPin?: string) => {
    if (!activePlan || isProcessing || isSubmittingRef.current) return;
    const norm = normalizeNigerianPhone(phone);
    if (!norm.isValid) {
      playErrorTone();
      setErrorMessage(norm.error || 'Please enter a valid 11-digit phone number.');
      setCurrentStep(3);
      return;
    }

    setIsProcessing(true);
    isSubmittingRef.current = true;
    setErrorMessage('');

    try {
      const cleanPhone = norm.cleaned || phone.replace(/\D/g, '');
      const success = await onBuyData(activePlan, cleanPhone, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (success) {
        playSuccessChime();
        triggerConfetti();
        setIsPinModalOpen(false);
        setSuccessData({
          isOpen: true,
          network: selectedNetwork.toUpperCase(),
          planName: activePlan.size || activePlan.name,
          recipientPhone: cleanPhone,
          amount: activePlan.price,
          serviceType: 'Data',
        });
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

  const stepLabels = [
    { num: 1, label: 'Network' },
    { num: 2, label: 'Plan' },
    { num: 3, label: 'Phone' },
    { num: 4, label: 'Pay' },
  ];

  return (
    <div id="screen-buy-data" className="px-3.5 sm:px-6 lg:px-8 py-5 space-y-6 pb-28 md:pb-12 max-w-lg md:max-w-2xl mx-auto w-full">
      {/* 4-Step Stepper Header */}
      <div className="py-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
          {stepLabels.map((s) => {
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) {
                    playTapSound();
                    setCurrentStep(s.num as WizardStep);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 z-10 ${s.num <= currentStep ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCompleted
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-105'
                      : isLightMode
                      ? 'bg-slate-100 text-slate-400 border border-slate-200'
                      : 'bg-[#101b33] text-slate-400 border border-slate-700/80'
                  }`}
                >
                  {isCompleted ? <Check size={14} className="stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-heading font-medium tracking-tight ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <p className="leading-relaxed font-medium">
            System maintenance is in progress. Data vending is temporarily paused.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: SELECT NETWORK */}
      {currentStep === 1 && (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-5"
        >
          <div>
            <h2 className="text-lg font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Select Network
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose your preferred telecom service provider
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { id: 'mtn', name: 'MTN', bg: 'bg-[#ffcc00]', text: 'text-black', border: 'border-amber-300' },
              { id: 'airtel', name: 'Airtel', bg: 'bg-[#e50914]', text: 'text-white', border: 'border-red-500' },
              { id: 'glo', name: 'Glo', bg: 'bg-[#00843d]', text: 'text-white', border: 'border-emerald-500' },
              { id: '9mobile', name: '9mobile', bg: 'bg-[#00573d]', text: 'text-white', border: 'border-emerald-700' },
              { id: 'smile', name: 'Smile', bg: 'bg-[#ff0080]', text: 'text-white', border: 'border-pink-500' },
              { id: 'spectranet', name: 'Spectranet', bg: 'bg-[#003366]', text: 'text-white', border: 'border-blue-900' },
            ].map((carrier) => {
              const isSelected = selectedNetwork === carrier.id;
              return (
                <button
                  key={carrier.id}
                  type="button"
                  onClick={() => handleSelectNetwork(carrier.id as NetworkId)}
                  className={`p-3.5 sm:p-4 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 min-h-[96px] ${
                    isSelected
                      ? 'bg-blue-600/10 dark:bg-blue-600/20 border-2 border-blue-600 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : isLightMode
                      ? 'bg-white border border-slate-200/90 hover:border-blue-300 shadow-xs'
                      : 'bg-[#0c152a] border border-slate-800 hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full ${carrier.bg} ${carrier.text} flex items-center justify-center font-black text-xs shadow-xs ${carrier.border} border`}>
                    {carrier.name}
                  </div>
                  <span className={`text-xs font-bold font-heading ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {carrier.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Network Advice Note */}
          <div className="p-3.5 rounded-xl bg-orange-500/10 dark:bg-orange-950/30 border border-orange-500/20 text-orange-950 dark:text-orange-200 text-xs flex items-center gap-2.5">
            <Zap size={16} className="text-orange-500 shrink-0 stroke-[2.5]" />
            <span className="font-medium">
              {selectedNetwork.toUpperCase()} is the most popular choice with the fastest instant delivery.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              triggerHaptic('medium');
              setCurrentStep(2);
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      )}

      {/* STEP 2: SELECT PLAN */}
      {/* STEP 2: SCROLLABLE PLAN SELECTOR (Matching UI Prototype) */}
      {currentStep === 2 && (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {/* Selected Network Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-[#0047cc] to-blue-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs uppercase">
                {selectedNetwork}
              </div>
              <div>
                <h3 className="font-heading font-black text-sm uppercase tracking-tight">
                  {selectedNetwork.toUpperCase()} (Gifting)
                </h3>
                <p className="text-[11px] text-blue-100 font-medium">Data Plans</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Change</span>
            </button>
          </div>

          {/* Select Data Plan Header with Popular Badge */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Data Plan
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              🔥 Popular
            </span>
          </div>

          {/* Vertically Scrollable Plan Selector List */}
          <div className="space-y-3 max-h-[390px] overflow-y-auto pr-1">
            {filteredPlans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    playTapSound();
                    setSelectedPlanId(p.id);
                  }}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] shadow-2xs ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 shadow-md ring-2 ring-blue-500/25"
                      : isLightMode
                      ? "bg-white border-slate-200/90 hover:border-blue-300 text-slate-900"
                      : "bg-[#0c152a] border-slate-800/90 hover:border-slate-700 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    }`}>
                      <Tag size={20} className="stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading font-black text-base tracking-tight truncate">
                        {p.size || p.name}
                      </h4>
                      <p className={`text-xs font-mono font-bold mt-0.5 ${isSelected ? "text-blue-100" : "text-[#0047cc] dark:text-blue-400"}`}>
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-bold block ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                        {p.validity || "30 Days"}
                      </span>
                      <span className={`text-[10px] block ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                        Validity
                      </span>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-white bg-white text-blue-600"
                        : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prominent Continue CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                triggerHaptic("medium");
                setCurrentStep(3);
              }}
              className="w-full py-4 px-4 rounded-2xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-heading font-bold text-sm sm:text-base shadow-lg shadow-orange-950/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}


      {/* STEP 3: ENTER PHONE NUMBER */}
      {currentStep === 3 && (
        <motion.div
          key="step-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-5"
        >
          <div>
            <h2 className="text-lg font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Enter Phone Number
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter the recipient phone number to receive data
            </p>
          </div>

          {/* Selected Carrier Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-[#0c152a] border border-slate-200 dark:border-slate-800">
            <TelecomLogo network={selectedNetwork} size="md" className="rounded-full shadow-xs" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block">
                {selectedNetwork} • {activePlan?.size}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ₦{Number(activePlan?.price || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Input field with contact book button */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-heading text-slate-700 dark:text-slate-300">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0702 526 2786"
                className={`w-full px-4 py-3.5 pr-12 rounded-xl text-base font-mono outline-none transition-all ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-[#0c152a] border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={handlePickContact}
                title="Select Contact"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
              >
                <BookUser size={20} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Make sure the number is correct to avoid sending to the wrong line.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-heading hover:bg-slate-300 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!phone.trim()}
              onClick={() => {
                playTapSound();
                triggerHaptic('medium');
                setCurrentStep(4);
              }}
              className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: PAY & CONFIRM */}
      {currentStep === 4 && (
        <motion.div
          key="step-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-5"
        >
          <div>
            <h2 className="text-lg font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Confirm Payment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review order summary before authorizing wallet debit
            </p>
          </div>

          {/* Order Summary Slip */}
          <div className={`p-4 rounded-2xl border space-y-3 text-xs divide-y ${
            isLightMode ? 'bg-white border-slate-200 divide-slate-100' : 'bg-[#0c152a] border-slate-800 divide-slate-800'
          }`}>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 dark:text-slate-400">Network</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedNetwork}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Data Plan</span>
              <span className="font-bold text-slate-900 dark:text-white">{activePlan?.size} ({activePlan?.validity})</span>
            </div>
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Recipient Phone</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{phone}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Package Cost</span>
              <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                ₦{Number(activePlan?.price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Wallet Balance</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                ₦{Number(user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-heading hover:bg-slate-300 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isProcessing || user.balance < (activePlan?.price || 0)}
              onClick={() => setIsPinModalOpen(true)}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] disabled:opacity-50 text-white font-heading font-bold text-sm shadow-lg shadow-orange-950/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock size={15} />
              <span>Confirm</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={executePurchase}
        title="Authorize Data Purchase"
        serviceName={`${selectedNetwork.toUpperCase()} Data Bundle`}
        recipient={phone}
        amount={activePlan?.price || 0}
        isLightMode={isLightMode}
      />

      {/* Purchase Success Modal matching Screen 12 */}
      <PurchaseSuccessModal
        data={successData}
        onClose={() => {
          setSuccessData(null);
          setCurrentStep(1);
          onNavigateBack();
        }}
        onViewReceipt={() => {
          setSuccessData(null);
          onNavigateBack();
        }}
      />
    </div>
  );
};
