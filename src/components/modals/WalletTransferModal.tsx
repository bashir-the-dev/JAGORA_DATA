import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ModalWrapper } from './ActionModals';
import { PinVerificationModal } from './PinVerificationModal';
import { OrderConfirmationModal, OrderConfirmationDetails } from './OrderConfirmationModal';
import { normalizeNigerianPhone, cleanNigerianDigits } from '../../utils/phoneUtils';
import { apiTransferWallet } from '../../services/apiClient';
import { humanizeVtuError } from '../../utils/errorParser';
import {
  playTapSound,
  playCoinSound,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  userPhone?: string;
  onTransferSuccess: (recipient: string, amount: number, reference: string, newBalance: number) => void;
  isLightMode?: boolean;
  biometricEnabled?: boolean;
  isMaintenanceMode?: boolean;
}

export const WalletTransferModal: React.FC<WalletTransferModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  userPhone,
  onTransferSuccess,
  isLightMode = true,
  biometricEnabled = true,
  isMaintenanceMode,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number | ''>(1000);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsProcessing(false);
      setIsPinModalOpen(false);
      setIsConfirmModalOpen(false);
      isSubmittingRef.current = false;
    }
  }, [isOpen]);

  const numAmount = typeof amount === 'number' ? amount : 0;
  const cleanRecipient = cleanNigerianDigits(recipient);
  const cleanSender = userPhone ? cleanNigerianDigits(userPhone) : '';

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleInitiateTransfer = () => {
    setError('');
    playTapSound();
    triggerHaptic('light');

    if (isMaintenanceMode) {
      setError('System maintenance is currently in progress. Wallet transfers are temporarily paused.');
      return;
    }

    if (!recipient.trim()) {
      setError('Please enter recipient mobile phone number.');
      return;
    }

    const norm = normalizeNigerianPhone(recipient);
    if (!norm.isValid) {
      setError(norm.error || 'Please enter a valid 11-digit Nigerian phone number.');
      return;
    }

    if (cleanSender && cleanRecipient === cleanSender) {
      setError('Cannot transfer funds to your own wallet phone number.');
      return;
    }

    if (!amount || isNaN(numAmount) || !Number.isInteger(numAmount) || numAmount < 100) {
      setError('Transfer amount must be a positive integer of at least ₦100 (decimals are not permitted).');
      return;
    }

    if (numAmount > 500000) {
      setError('Maximum transfer amount is ₦500,000 per transaction.');
      return;
    }

    if (numAmount > currentBalance) {
      setError(`Insufficient wallet balance. You have ₦${currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}, but want to transfer ₦${numAmount.toLocaleString()}.`);
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handlePinVerified = async (enteredPin: string) => {
    if (isProcessing || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);
    setError('');

    try {
      const response = await apiTransferWallet({
        recipient: cleanRecipient,
        amount: numAmount,
        pin: enteredPin,
      });

      if (response.status === 'success' && response.data) {
        setIsPinModalOpen(false);
        setIsProcessing(false);
        isSubmittingRef.current = false;

        playSuccessChime();
        playCoinSound();
        triggerConfetti();

        onTransferSuccess(
          cleanRecipient,
          numAmount,
          response.data.reference || `AJD-TRF-${Date.now()}`,
          response.data.newBalance ?? (currentBalance - numAmount)
        );
        onClose();
      } else {
        throw new Error(response.message || 'Transfer failed. Please check your details and try again.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      isSubmittingRef.current = false;
      const parsed = humanizeVtuError(err);
      setError(parsed);
      throw new Error(parsed);
    }
  };

  return (
    <>
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Send Money" isLightMode={isLightMode}>
        <div className="space-y-4">
          {/* Header Banner: Free Instant Transfer */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-700 via-[#0047cc] to-blue-900 text-white shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Send size={16} className="text-blue-100 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-heading font-bold">Jagora Wallet Transfer</h4>
                <p className="text-[11px] text-blue-100/90 font-medium">Instant Peer-to-Peer Settlement</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-400/25 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
              0% Fee
            </span>
          </div>

          {/* Current Balance Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Available Balance</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              ₦{currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Maintenance Notice */}
          {isMaintenanceMode && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <span className="font-bold">Maintenance Notice:</span> Internal wallet transfers are temporarily paused while scheduled system maintenance is underway. Your balance is 100% secure.
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Recipient Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  if (error) setError('');
                }}
                placeholder="08012345678"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0047cc]"
              />
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              Enter the 11-digit mobile number linked to recipient's Jagora wallet.
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Transfer Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                ₦
              </span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                step="1"
                min={100}
                max={500000}
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(raw === '' ? '' : parseInt(raw, 10));
                  if (error) setError('');
                }}
                placeholder="1000"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0047cc]"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setAmount(q);
                    if (error) setError('');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    amount === q
                      ? 'border-[#0047cc] bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300 ring-1 ring-[#0047cc]/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ₦{q >= 1000 ? `${q / 1000}k` : q}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Payment Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Data payment / Lunch"
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0047cc]"
            />
          </div>

          {/* Action Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleInitiateTransfer}
            disabled={isProcessing || numAmount <= 0 || !!isMaintenanceMode}
            className="w-full bg-[#0047cc] hover:bg-[#003eb8] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-sans font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
          >
            <span>{isMaintenanceMode ? 'Transfers Paused (Maintenance)' : `Transfer ₦${numAmount.toLocaleString()}`}</span>
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </ModalWrapper>

      {/* Order Confirmation Modal with warning note */}
      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          setIsPinModalOpen(true);
        }}
        details={{
          serviceType: 'TRANSFER',
          title: 'P2P Wallet-to-Wallet Transfer',
          subtitle: note.trim() ? `Note: "${note.trim()}"` : 'Instant Internal Transfer',
          recipient: cleanRecipient,
          recipientLabel: 'Recipient Phone Number',
          amount: numAmount,
          userBalance: currentBalance,
          additionalInfo: [
            { label: 'Transfer Fee', value: '₦0.00 (Free)' },
            ...(note.trim() ? [{ label: 'Narration / Note', value: note.trim() }] : []),
          ],
          warningNote: 'Caution: Peer-to-peer wallet transfers are immediate and irreversible once authorized. Please verify the recipient mobile number carefully before proceeding.',
        }}
        isLightMode={isLightMode}
      />

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Authorize Wallet Transfer"
        serviceName={`Wallet Transfer to ${cleanRecipient}`}
        recipient={cleanRecipient}
        amount={numAmount}
        biometricEnabled={biometricEnabled}
        isLightMode={isLightMode}
      />
    </>
  );
};
