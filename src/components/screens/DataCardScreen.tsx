import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { NetworkId, Transaction, UserProfile } from '../../types';
import {
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { TelecomLogo } from '../common/TelecomLogo';
import { PinVerificationModal } from '../modals/PinVerificationModal';
import { OrderConfirmationModal } from '../modals/OrderConfirmationModal';
import { FintechButtonLoader } from '../common/ProfessionalLoader';
import { WalletImpactPill } from '../common/WalletImpactPill';
import { apiGenerateDataCard } from '../../services/vtuService';
import { humanizeVtuError } from '../../utils/errorParser';
import {
  playTapSound,
  playErrorTone,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

interface DataCardScreenProps {
  user: UserProfile;
  onGenerateSuccess: (tx: Transaction) => void;
  onNavigateBack: () => void;
  isLightMode?: boolean;
  isMaintenanceMode?: boolean;
}

export const DataCardScreen: React.FC<DataCardScreenProps> = ({
  user,
  onGenerateSuccess,
  isLightMode,
  isMaintenanceMode,
}) => {
  const [network, setNetwork] = useState<NetworkId>('mtn');
  const [dataSize, setDataSize] = useState<string>('1.5GB');
  const [price, setPrice] = useState<number>(450);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [generatedCard, setGeneratedCard] = useState<{ pin: string; serial: string; dataSize: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const isSubmittingRef = useRef<boolean>(false);

  const bundles = [
    { size: '500MB', cost: 160 },
    { size: '1.0GB', cost: 290 },
    { size: '1.5GB', cost: 450 },
    { size: '2.0GB', cost: 580 },
    { size: '2.5GB', cost: 700 },
    { size: '5.0GB', cost: 1350 },
  ];

  const handleGenerate = () => {
    if (isProcessing || isPinModalOpen || isConfirmModalOpen || isSubmittingRef.current) return;
    playTapSound();
    if (isMaintenanceMode) {
      setError('System maintenance is currently in progress. Data card generation is temporarily paused.');
      return;
    }
    if (price > user.balance) {
      setError(
        `Insufficient balance (₦${user.balance.toFixed(2)}). Fund your wallet with at least ₦${(
          price - user.balance
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
        playErrorTone();
        setError(humanizeVtuError(res.message, 'data card generation'));
      }
    } catch (err) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      playErrorTone();
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
    <div id="screen-data-card" className="px-3.5 sm:px-5 py-4 space-y-5 pb-28 max-w-lg mx-auto w-full">
      {/* Maintenance Mode Warning */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-slate-900 dark:text-white block text-sm">
              Data Card Generation Temporarily Paused
            </strong>
            <p className="leading-relaxed">
              System maintenance is currently in progress. Offline data PIN printing has been temporarily paused by administration to protect user transactions. Please check back shortly.
            </p>
          </div>
        </div>
      )}

      {!generatedCard ? (
        <div className="space-y-4">
          {/* Top Banner */}
          <section className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-[#0047cc] to-blue-900 text-white shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-heading font-bold tracking-tight">Data Card Voucher Printing</h2>
                <p className="text-[11px] text-blue-100/90 font-medium">Load Offline Data via USSD</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-1 rounded-full">
              Automated
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

          {/* Data Bundle Size */}
          <section className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
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
                  className={`p-3 rounded-2xl text-center border transition-all cursor-pointer shadow-2xs ${
                    dataSize === item.size
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-2 ring-[#0047cc]/30'
                      : isLightMode
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      : 'border-slate-800 bg-[#0c1322] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-heading font-bold">{item.size}</p>
                  <p className="text-[11px] text-[#0047cc] dark:text-blue-400 font-mono font-bold mt-0.5">₦{item.cost}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Pricing Breakdown */}
          <section className="p-4 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-2 text-xs shadow-2xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Card Bundle</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{network.toUpperCase()} {dataSize}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              <span className="text-sm">Total Payable</span>
              <span className="font-mono text-base text-[#0047cc] dark:text-blue-400">₦{price.toLocaleString()}</span>
            </div>
          </section>

          <WalletImpactPill currentBalance={user.balance} cost={price} />

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
              <FintechButtonLoader text="Generating Voucher..." subtext="Securing offline bundle allocation" />
            ) : isMaintenanceMode ? (
              <>
                <AlertCircle size={18} />
                <span>Services Paused (Maintenance Mode)</span>
              </>
            ) : (
              <>
                <Printer size={18} />
                <span>Generate Data Card (₦{price})</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            <span>Successfully Generated {network.toUpperCase()} {dataSize} Data Card</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xs space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-heading font-bold text-[#0047cc] dark:text-blue-400 uppercase">
                {network} {dataSize} Data PIN
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SN: {generatedCard.serial}</span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="font-mono font-black text-lg tracking-widest text-slate-900 dark:text-white">
                {generatedCard.pin}
              </span>
              <button
                type="button"
                onClick={() => handleCopyPin(generatedCard.pin)}
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-100"
                title="Copy PIN"
              >
                {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
              Load Code: Dial <strong className="font-mono text-slate-700 dark:text-slate-300">*460*PIN#</strong> or carrier reload code
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGeneratedCard(null)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0047cc] text-white font-heading text-xs font-bold hover:bg-[#003eb8] transition-colors cursor-pointer"
          >
            Generate Another Card
          </button>
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
          serviceType: 'DATA_CARD',
          title: `${network.toUpperCase()} Data Card Voucher`,
          subtitle: `Bundle Size: ${dataSize}`,
          network: network,
          recipient: user.phone,
          recipientLabel: 'Account Phone',
          amount: price,
          userBalance: user.balance,
          additionalInfo: [
            { label: 'Validity', value: '30 Days' },
            { label: 'Recharge Type', value: 'Offline USSD Voucher' },
          ],
          warningNote: 'Vouchers are generated instantly with an active scratch PIN and cannot be recalled or refunded.',
        }}
        isLightMode={isLightMode}
      />

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        serviceName={`${network.toUpperCase()} ${dataSize} Data Card`}
        amount={price}
        title="Authorize Data Card"
        isLightMode={isLightMode}
        biometricEnabled={user.biometricEnabled}
      />
    </div>
  );
};
