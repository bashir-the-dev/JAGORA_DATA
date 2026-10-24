import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Delete,
  AlertCircle,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Clock,
  WifiOff,
} from 'lucide-react';
import { playTapSound, playErrorTone, playSuccessChime, triggerHaptic } from '../../utils/soundEffects';
import { apiVerifyPin } from '../../services/apiClient';
import { authenticateDeviceBiometrics } from '../../utils/webAuthn';

export interface SessionLockModalProps {
  isOpen: boolean;
  userName?: string;
  userPhone?: string;
  biometricEnabled?: boolean;
  isLightMode?: boolean;
  reason?: 'idle' | 'offline_prolonged' | 'manual';
  onUnlockSuccess: () => void;
  onFullLogout: () => void;
}

export const SessionLockModal: React.FC<SessionLockModalProps> = ({
  isOpen,
  userName = 'Customer',
  userPhone = '',
  biometricEnabled = true,
  isLightMode = true,
  reason = 'idle',
  onUnlockSuccess,
  onFullLogout,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isLockedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsShaking(false);
      setIsVerifying(false);
      setIsBiometricScanning(false);
      setIsSuccess(false);
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
        const res = await apiVerifyPin(pinToTest);
        if (res.status === 'success' || (res as any).success) {
          setIsSuccess(true);
          playSuccessChime();
          triggerHaptic('success');
          setTimeout(() => {
            setIsVerifying(false);
            onUnlockSuccess();
          }, 350);
        } else {
          throw new Error(res.message || 'Incorrect 4-digit PIN.');
        }
      } catch (err: any) {
        setIsSuccess(false);
        setIsShaking(true);
        playErrorTone();
        triggerHaptic('warning');
        setError(err?.message || 'Incorrect transaction PIN. Please try again.');
        setIsVerifying(false);
        isLockedRef.current = false;
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 600);
      }
    },
    [onUnlockSuccess]
  );

  const handleNumberPress = useCallback(
    (num: string) => {
      if (pin.length < 4 && !isVerifying && !isSuccess && !isLockedRef.current) {
        playTapSound();
        triggerHaptic('light');
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
      triggerHaptic('light');
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
        setTimeout(() => {
          onUnlockSuccess();
        }, 350);
      } else {
        setIsBiometricScanning(false);
        playErrorTone();
        triggerHaptic('warning');
        setError(bioRes.error || 'Biometric verification cancelled.');
      }
    } catch {
      setIsBiometricScanning(false);
      playErrorTone();
      setError('Biometric sensor unavailable. Please enter your PIN.');
    }
  };

  // Keyboard handler for physical keyboards
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNumberPress, handleDelete]);

  if (!isOpen) return null;

  return (
    <div
      id="session-lock-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        id="session-lock-modal"
        className={`w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all duration-300 p-6 flex flex-col items-center text-center ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900 shadow-blue-900/20'
            : 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/80'
        }`}
      >
        {/* App Logo & Lock Status Badge */}
        <div className="relative mb-3.5">
          <div className="w-16 h-16 rounded-2xl bg-[#0055ff] p-1 flex items-center justify-center shadow-xl border-2 border-amber-400/60 overflow-hidden">
            <img
              src="/logo.png"
              alt="AJDATASUB"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0047cc] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
            <Lock size={12} className="stroke-[2.5]" />
          </div>
        </div>

        {/* User Greeting & Title */}
        <h3 className="font-heading font-black text-lg tracking-tight">
          Session Locked
        </h3>
        <p className="text-xs font-semibold text-[#0047cc] dark:text-blue-400 mt-0.5">
          {userName} {userPhone ? `(${userPhone})` : ''}
        </p>

        {/* Reason banner */}
        <div className="mt-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-left w-full">
          {reason === 'offline_prolonged' ? (
            <>
              <WifiOff size={15} className="text-amber-500 shrink-0" />
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                Internet was offline for extended period. Enter your 4-digit PIN to re-secure your wallet session.
              </p>
            </>
          ) : (
            <>
              <Clock size={15} className="text-blue-500 shrink-0" />
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                App was idle to protect your wallet balance. Enter your 4-digit PIN to continue.
              </p>
            </>
          )}
        </div>

        {/* 4-Digit PIN Indicators */}
        <div className="py-4">
          <div
            className={`flex items-center justify-center gap-4 ${
              isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isSuccess
                      ? 'bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50'
                      : isFilled
                      ? 'bg-[#0047cc] dark:bg-blue-500 scale-110 shadow-sm'
                      : isLightMode
                      ? 'bg-slate-200 border border-slate-300'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Error / Verifying / Success State */}
          <div className="h-6 mt-2 flex items-center justify-center">
            {isVerifying ? (
              <span className="text-xs font-semibold text-[#0047cc] dark:text-blue-400 flex items-center gap-1.5">
                <RefreshCw size={13} className="animate-spin" />
                Verifying PIN...
              </span>
            ) : isBiometricScanning ? (
              <span className="text-xs font-semibold text-[#0047cc] dark:text-blue-400 flex items-center gap-1.5">
                <Fingerprint size={14} className="animate-pulse" />
                Scanning Biometrics...
              </span>
            ) : isSuccess ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={14} />
                Unlocked!
              </span>
            ) : error ? (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </span>
            ) : (
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Enter your 4-digit transaction PIN
              </span>
            )}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-2.5 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberPress(num)}
              disabled={isVerifying || isSuccess}
              className={`h-12 rounded-2xl font-sans text-xl font-bold transition-all duration-150 flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-50 select-none ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200/80 active:bg-blue-100 text-slate-800'
                  : 'bg-slate-800/90 hover:bg-slate-700/80 active:bg-blue-950 text-slate-100'
              }`}
            >
              {num}
            </button>
          ))}

          {/* Biometric Button */}
          {biometricEnabled ? (
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={isVerifying || isSuccess}
              title="Unlock with Biometrics"
              className={`h-12 rounded-2xl font-sans text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center active:scale-95 cursor-pointer disabled:opacity-50 select-none text-[#0047cc] dark:text-blue-400 ${
                isLightMode
                  ? 'bg-blue-50/80 hover:bg-blue-100/80 active:bg-blue-200'
                  : 'bg-blue-950/40 hover:bg-blue-900/50 active:bg-blue-900'
              }`}
            >
              <Fingerprint size={20} className="shrink-0" />
            </button>
          ) : (
            <div className="h-12" />
          )}

          {/* Zero Key */}
          <button
            type="button"
            onClick={() => handleNumberPress('0')}
            disabled={isVerifying || isSuccess}
            className={`h-12 rounded-2xl font-sans text-xl font-bold transition-all duration-150 flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-50 select-none ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200/80 active:bg-blue-100 text-slate-800'
                : 'bg-slate-800/90 hover:bg-slate-700/80 active:bg-blue-950 text-slate-100'
            }`}
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isVerifying || isSuccess || pin.length === 0}
            className={`h-12 rounded-2xl font-sans text-sm font-bold transition-all duration-150 flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-30 select-none ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200/80 active:bg-blue-100 text-slate-700'
                : 'bg-slate-800/90 hover:bg-slate-700/80 active:bg-blue-950 text-slate-200'
            }`}
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Footer: Switch Account or Sign Out Completely */}
        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onFullLogout}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 p-1 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out Completely</span>
          </button>

          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            CAC RC: 8153406
          </span>
        </div>
      </div>
    </div>
  );
};
