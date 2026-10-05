import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, Lock, Fingerprint, Delete, AlertCircle, CheckCircle2, X, KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { playTapSound, playErrorTone, playSuccessChime, triggerHaptic } from '../../utils/soundEffects';
import { apiResetPin } from '../../services/apiClient';
import { authenticateDeviceBiometrics } from '../../utils/webAuthn';

export interface PinVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (enteredPin: string) => void | Promise<void>;
  title?: string;
  serviceName: string;
  recipient?: string;
  amount: number;
  userPin?: string; // Kept for backwards prop compatibility, but no longer used for client-side comparison
  biometricEnabled?: boolean;
  isLightMode?: boolean;
}

export const PinVerificationModal: React.FC<PinVerificationProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verify Transaction PIN',
  serviceName,
  recipient,
  amount,
  biometricEnabled = true,
  isLightMode = true,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // In-modal Reset Forgotten PIN states
  const [isResetMode, setIsResetMode] = useState<boolean>(false);
  const [accountPassword, setAccountPassword] = useState<string>('');
  const [resetNewPin, setResetNewPin] = useState<string>('');
  const [resetConfirmPin, setResetConfirmPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string>('');
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Synchronous double-tap and race-condition lockout ref
  const isLockedRef = useRef<boolean>(false);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsShaking(false);
      setIsVerifying(false);
      setIsBiometricScanning(false);
      setIsSuccess(false);
      setIsResetMode(false);
      setAccountPassword('');
      setResetNewPin('');
      setResetConfirmPin('');
      setResetError('');
      setResetSuccess('');
      setIsSubmittingReset(false);
      isLockedRef.current = false;
    } else {
      isLockedRef.current = false;
    }
  }, [isOpen]);

  const handleVerify = useCallback(
    async (pinToTest: string) => {
      if (isLockedRef.current) return;
      isLockedRef.current = true;
      setIsVerifying(true);
      setError('');

      try {
        setIsSuccess(true);
        playSuccessChime();
        setTimeout(async () => {
          try {
            await Promise.resolve(onSuccess(pinToTest));
            setIsVerifying(false);
          } catch (err: any) {
            setIsSuccess(false);
            setIsShaking(true);
            playErrorTone();
            setError(err?.message || 'Incorrect transaction PIN. Please try again.');
            setIsVerifying(false);
            isLockedRef.current = false;
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 600);
          }
        }, 300);
      } catch (err: any) {
        setIsSuccess(false);
        setIsShaking(true);
        playErrorTone();
        setError(err?.message || 'Incorrect transaction PIN. Please try again.');
        setIsVerifying(false);
        isLockedRef.current = false;
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 600);
      }
    },
    [onSuccess]
  );

  const handleNumberPress = useCallback(
    (num: string) => {
      if (pin.length < 4 && !isVerifying && !isSuccess && !isLockedRef.current) {
        playTapSound();
        const nextPin = pin + num;
        setPin(nextPin);
        setError('');
        if (nextPin.length === 4) {
          handleVerify(nextPin);
        }
      }
    },
    [pin, isVerifying, isSuccess, handleVerify]
  );

  const handleDelete = useCallback(() => {
    if (pin.length > 0 && !isVerifying && !isSuccess && !isLockedRef.current) {
      playTapSound();
      setPin((prev) => prev.slice(0, -1));
      setError('');
    }
  }, [pin, isVerifying, isSuccess]);

  const handleBiometricAuth = async () => {
    if (isLockedRef.current || isVerifying || isSuccess) return;
    playTapSound();
    triggerHaptic('light');
    setIsBiometricScanning(true);
    setError('');

    try {
      const bioRes = await authenticateDeviceBiometrics();
      if (bioRes.success) {
        setIsBiometricScanning(false);
        setIsSuccess(true);
        playSuccessChime();
        triggerHaptic('success');
        // Authorize with biometric signature
        setTimeout(async () => {
          try {
            await Promise.resolve(onSuccess('BIOMETRIC_AUTH'));
            setIsVerifying(false);
          } catch (err: any) {
            setIsSuccess(false);
            setIsShaking(true);
            playErrorTone();
            setError(err?.message || 'Biometric authorization failed. Enter PIN instead.');
            isLockedRef.current = false;
          }
        }, 350);
      } else {
        setIsBiometricScanning(false);
        playErrorTone();
        triggerHaptic('warning');
        setError(bioRes.error || 'Biometric verification cancelled. Enter PIN manually.');
      }
    } catch {
      setIsBiometricScanning(false);
      playErrorTone();
      setError('Biometric sensor unavailable. Please enter your 4-digit PIN.');
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!accountPassword) {
      setResetError('Please enter your account login password to verify your identity.');
      return;
    }

    if (!/^\d{4}$/.test(resetNewPin)) {
      setResetError('New PIN must be exactly 4 numeric digits (0-9).');
      return;
    }

    if (resetNewPin !== resetConfirmPin) {
      setResetError('The two PINs do not match. Please verify and try again.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await apiResetPin({ password: accountPassword, new_pin: resetNewPin });
      if (res.status === 'success' || (res as any).success) {
        setResetSuccess('PIN reset successfully! Proceeding with transaction...');
        playSuccessChime();
        setTimeout(() => {
          setIsResetMode(false);
          setPin(resetNewPin);
          handleVerify(resetNewPin);
        }, 1100);
      } else {
        playErrorTone();
        setResetError(res.message || 'Incorrect account password. Please try again.');
      }
    } catch (err: any) {
      playErrorTone();
      setResetError(err?.message || 'Failed to reset PIN. Please try again.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Keyboard handler for desktop / physical keyboard support
  useEffect(() => {
    if (!isOpen || isResetMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isResetMode, handleNumberPress, handleDelete, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="pin-verification-overlay"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        id="pin-verification-modal"
        className={`w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl border-t sm:border transition-all duration-300 relative pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 ${
          isLightMode
            ? 'bg-white border-slate-100 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Mobile Sheet Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Security authorization</p>
            </div>
          </div>
          <button
            id="close-pin-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Details Summary */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Amount
            </span>
            <div className="font-sans text-2xl font-black text-[#0047cc] dark:text-blue-400 tracking-tight">
              ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span>{serviceName}</span>
              {recipient && <span className="text-slate-600 dark:text-slate-400 font-medium">• {recipient}</span>}
            </div>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="py-4 flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Lock size={13} className="text-[#0047cc] dark:text-blue-400" />
            <span>Enter 4-Digit Transaction PIN</span>
          </div>

          <div
            id="pin-dots-container"
            className={`flex items-center justify-center gap-4 py-2 ${
              isShaking ? 'animate-pin-shake' : ''
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                    isSuccess
                      ? 'bg-emerald-500 border-emerald-500 scale-110'
                      : isFilled
                      ? 'bg-[#0047cc] border-[#0047cc] dark:bg-blue-500 dark:border-blue-500 scale-110 shadow-xs'
                      : isLightMode
                      ? 'border-slate-300 bg-slate-100'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Feedback message */}
          {error ? (
            <div className="flex flex-col items-center gap-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(true);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 mt-1"
              >
                <KeyRound size={12} />
                <span>Forgot PIN? Reset with password</span>
              </button>
            </div>
          ) : isSuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 size={14} />
              <span>PIN Verified! Processing...</span>
            </div>
          ) : isBiometricScanning ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0047cc] dark:text-blue-400 animate-pulse">
              <Fingerprint size={14} />
              <span>Scanning Biometric (Touch/Face ID)...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Encrypted end-to-end PIN verification
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(true);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:underline cursor-pointer"
              >
                Forgot your PIN?
              </button>
            </div>
          )}
        </div>

        {/* View Mode: Reset PIN Form vs Numeric Keypad */}
        {isResetMode ? (
          <form onSubmit={handleResetPinSubmit} className="px-5 pb-5 pt-1 space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-medium flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0 text-amber-500" />
              <span>Verify your login password to set a new 4-digit PIN immediately.</span>
            </div>

            {/* Account Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Account Login Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New 4-Digit PIN */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                New 4-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={resetNewPin}
                onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-center text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
              />
            </div>

            {/* Confirm New 4-Digit PIN */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Confirm New PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={resetConfirmPin}
                onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-center text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
              />
            </div>

            {resetError && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900/40">
                <AlertCircle size={14} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900/40">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Back to PIN
              </button>
              <button
                type="submit"
                disabled={isSubmittingReset}
                className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSubmittingReset ? (
                  <span>Resetting...</span>
                ) : (
                  <span>Reset & Continue</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* On-Screen Numeric Keypad */
          <div className="px-5 pb-5 pt-1">
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`pin-key-${num}`}
                  type="button"
                  onClick={() => handleNumberPress(num)}
                  disabled={isVerifying || isSuccess}
                  className={`h-12 rounded-2xl font-mono text-lg font-bold transition-all active:scale-90 flex items-center justify-center border shadow-2xs ${
                    isLightMode
                      ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-800 active:bg-blue-50 active:text-[#0047cc]'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-100 active:bg-blue-950/60 active:text-blue-300'
                  }`}
                >
                  {num}
                </button>
              ))}

              {/* Biometric Scan or Clear */}
              {biometricEnabled ? (
                <button
                  id="pin-key-biometric"
                  type="button"
                  onClick={handleBiometricAuth}
                  title="Use Biometrics"
                  disabled={isVerifying || isSuccess}
                  className={`h-12 rounded-2xl transition-all active:scale-90 flex flex-col items-center justify-center border shadow-2xs ${
                    isLightMode
                      ? 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200/80 text-[#0047cc]'
                      : 'bg-blue-950/50 hover:bg-blue-900/60 border-blue-800/50 text-blue-400'
                  }`}
                >
                  <Fingerprint size={20} />
                  <span className="text-[9px] font-bold mt-0.5">Touch ID</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPin('')}
                  disabled={isVerifying || isSuccess || pin.length === 0}
                  className="h-12 rounded-2xl font-sans text-xs font-bold text-slate-400 hover:text-slate-600 transition-all active:scale-90 flex items-center justify-center"
                >
                  Clear
                </button>
              )}

              {/* Zero Key */}
              <button
                id="pin-key-0"
                type="button"
                onClick={() => handleNumberPress('0')}
                disabled={isVerifying || isSuccess}
                className={`h-12 rounded-2xl font-mono text-lg font-bold transition-all active:scale-90 flex items-center justify-center border shadow-2xs ${
                  isLightMode
                    ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-800 active:bg-blue-50 active:text-[#0047cc]'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-100 active:bg-blue-950/60 active:text-blue-300'
                }`}
              >
                0
              </button>

              {/* Backspace Key */}
              <button
                id="pin-key-delete"
                type="button"
                onClick={handleDelete}
                title="Delete"
                disabled={isVerifying || isSuccess}
                className={`h-12 rounded-2xl transition-all active:scale-90 flex items-center justify-center border shadow-2xs ${
                  isLightMode
                    ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-600 active:bg-rose-50 active:text-rose-600'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-300 active:bg-rose-950/60 active:text-rose-400'
                }`}
              >
                <Delete size={20} />
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                id="cancel-pin-btn"
                onClick={onClose}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
