import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { NetworkId, Transaction, UserProfile } from '../../types';
import {
  Printer,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { PinVerificationModal } from '../modals/PinVerificationModal';
import { OrderConfirmationModal } from '../modals/OrderConfirmationModal';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { apiGenerateRechargePin } from '../../services/vtuService';
import { humanizeVtuError } from '../../utils/errorParser';
import {
  playTapSound,
  playErrorTone,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

interface RechargePinScreenProps {
  user: UserProfile;
  onGenerateSuccess: (tx: Transaction) => void;
  onNavigateBack: () => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

export const RechargePinScreen: React.FC<RechargePinScreenProps> = ({
  user,
  onGenerateSuccess,
  isLightMode,
  isMaintenanceMode,
}) => {
  const [network, setNetwork] = useState<NetworkId>('mtn');
  const [denomination, setDenomination] = useState<number>(500);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [generatedPins, setGeneratedPins] = useState<Array<{ pin: string; serial: string; denomination: number }> | null>(null);
  const [copiedPinIdx, setCopiedPinIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const isSubmittingRef = useRef<boolean>(false);

  const faceValue = denomination * quantity;
  const discountRate = 0.02; // 2% wholesale reseller discount
  const discountAmount = Math.round(faceValue * discountRate);
  const totalCost = faceValue - discountAmount;

  const handleGenerate = () => {
    if (isProcessing || isPinModalOpen || isConfirmModalOpen || isSubmittingRef.current) return;
    playTapSound();
    if (isMaintenanceMode) {
      setError('System maintenance is currently in progress. Recharge PIN generation is temporarily paused.');
      return;
    }
    if (totalCost > user.balance) {
      setError(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          totalCost - user.balance
        ).toFixed(2)}.`
      );
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

    try {
      const res = await apiGenerateRechargePin(network, denomination, quantity, enteredPin);
      setIsProcessing(false);
      isSubmittingRef.current = false;

      if (res.success && res.data && res.data.length > 0) {
        setGeneratedPins(res.data);
        playSuccessChime();
        triggerConfetti();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tx: Transaction = {
          id: res.reference || `RP-${Date.now()}`,
          title: `Recharge PIN - ${network.toUpperCase()} ₦${denomination} (x${quantity})`,
          subtitle: `${quantity} voucher(s) printed`,
          date: `Today, ${timeStr}`,
          group: 'Today',
          amount: totalCost,
          isCredit: false,
          status: 'SUCCESS',
          category: 'pin',
          iconType: 'pin',
          token: res.data.map((p) => p.pin).join(', '),
        };
        onGenerateSuccess(tx);
      } else {
        playErrorTone();
        setError(humanizeVtuError(res.message, 'recharge PIN generation'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      playErrorTone();
      setError(humanizeVtuError(err, 'recharge PIN generation'));
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
    <div id="screen-recharge-pin" className="px-3.5 sm:px-5 py-4 space-y-5 pb-28 max-w-lg mx-auto w-full">
      {/* Maintenance Mode Warning */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-slate-900 dark:text-white block text-sm">
              Recharge PIN Generation Temporarily Paused
            </strong>
            <p className="leading-relaxed">
              System maintenance is currently in progress. Recharge PIN voucher generation has been temporarily paused by administration to protect user transactions. Please check back shortly.
            </p>
          </div>
        </div>
      )}

      {!generatedPins ? (
        <div className="space-y-4">
          {/* Reseller Discount Banner */}
          <section className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-[#0047cc] to-blue-900 text-white shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Printer size={18} className="text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-heading font-bold tracking-tight">Offline Voucher Printing</h2>
                <p className="text-[11px] text-blue-100/90 font-medium">Authentic Telecom Serials & PINs</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-1 rounded-full">
              2% Wholesale
            </span>
          </section>

          {/* Network Selector */}
          <section className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
              Select Network Provider
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
                  className={`py-2.5 px-1 rounded-2xl text-xs font-bold uppercase border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                    network === net
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-2 ring-[#0047cc]/30'
                      : isLightMode
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      : 'border-slate-800 bg-[#0c1322] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <TelecomLogo network={net} size="xs" />
                  <span className="text-[11px] font-heading font-bold">{net}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Denomination */}
          <section className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
              Denomination (Face Value)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setDenomination(val);
                  }}
                  className={`py-3 text-xs font-mono font-bold rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                    denomination === val
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-2 ring-[#0047cc]/30'
                      : isLightMode
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      : 'border-slate-800 bg-[#0c1322] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  ₦{val}
                </button>
              ))}
            </div>
          </section>

          {/* Quantity */}
          <section className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
              Quantity (Vouchers)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setQuantity(q);
                  }}
                  className={`py-2.5 text-xs font-mono font-bold rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                    quantity === q
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-2 ring-[#0047cc]/30'
                      : isLightMode
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      : 'border-slate-800 bg-[#0c1322] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {q} {q === 1 ? 'voucher' : 'vouchers'}
                </button>
              ))}
            </div>
          </section>

          {/* Cost Breakdown */}
          <section className="p-4 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-2 text-xs shadow-2xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Face Value ({quantity}x ₦{denomination})</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₦{faceValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Reseller Discount (2%)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">-₦{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              <span className="text-sm">Total Payable</span>
              <span className="font-mono text-base text-[#0047cc] dark:text-blue-400">₦{totalCost.toLocaleString()}</span>
            </div>
          </section>

          <WalletImpactPill currentBalance={user.balance} cost={totalCost} />

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isProcessing || isPinModalOpen || isMaintenanceMode}
            className={`w-full font-heading font-bold text-sm py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md ${
              isMaintenanceMode
                ? 'bg-amber-600/80 text-white cursor-not-allowed shadow-none'
                : 'bg-[#0047cc] hover:bg-[#003eb8] text-white shadow-blue-700/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <FintechButtonLoader text="Generating e-PINs..." subtext="Printing offline vouchers" />
            ) : isMaintenanceMode ? (
              <>
                <AlertCircle size={18} />
                <span>Services Paused (Maintenance Mode)</span>
              </>
            ) : (
              <>
                <Printer size={18} />
                <span>Generate {quantity} Voucher(s) • ₦{totalCost.toLocaleString()}</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      ) : (
        /* Results Screen */
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            <span>Successfully Generated {generatedPins.length} {network.toUpperCase()} PIN(s)</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {generatedPins.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xs space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-heading font-bold text-[#0047cc] dark:text-blue-400 uppercase">
                    {network} ₦{item.denomination} Voucher
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SN: {item.serial}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="font-mono font-black text-lg tracking-widest text-slate-900 dark:text-white">
                    {item.pin}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingle(item.pin, idx)}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-100"
                    title="Copy PIN"
                  >
                    {copiedPinIdx === idx ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                  Load Code: Dial <strong className="font-mono text-slate-700 dark:text-slate-300">{getDialCode(network)}</strong>
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex-1 py-3 px-4 rounded-xl border border-[#0047cc] text-[#0047cc] dark:text-blue-400 dark:border-blue-500 font-heading text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              {copiedAll ? <Check size={16} className="stroke-[3]" /> : <Copy size={16} />}
              <span>{copiedAll ? 'All Vouchers Copied!' : 'Copy All Vouchers'}</span>
            </button>

            <button
              type="button"
              onClick={() => setGeneratedPins(null)}
              className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-heading text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Generate More
            </button>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          setIsPinModalOpen(true);
        }}
        details={{
          serviceType: 'RECHARGE_PIN',
          title: `${network.toUpperCase()} Airtime PIN Generation`,
          subtitle: `${quantity} voucher(s) of ₦${denomination}`,
          network: network,
          recipient: user.phone,
          recipientLabel: 'Account Phone',
          amount: faceValue,
          discount: discountAmount,
          userBalance: user.balance,
          additionalInfo: [
            { label: 'Unit Face Value', value: `₦${denomination}` },
            { label: 'Quantity', value: `${quantity} Card(s)` },
            { label: 'Reseller Discount', value: '2% Wholesale Margin' },
          ],
          warningNote: 'Vouchers are generated immediately upon authorization with active airtime PINs and are non-refundable.',
        }}
        isLightMode={isLightMode}
      />

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        serviceName={`${network.toUpperCase()} Recharge PIN`}
        amount={totalCost}
        title="Authorize Voucher Generation"
        isLightMode={isLightMode}
        biometricEnabled={user.biometricEnabled}
      />
    </div>
  );
};
