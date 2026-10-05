import React, { useState, useEffect, useRef } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { apiForgotPassword, apiResendPasswordOtp, apiResetPassword, ForgotPasswordResponse } from '../../services/apiClient';
import { playSuccessChime, playErrorTone, playTapSound } from '../../utils/soundEffects';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect?: (email: string) => void;
  isLightMode?: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect,
  isLightMode = true,
}) => {
  // Steps: 'email' -> 'verify_and_new_password' -> 'success'
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  
  // Step 1: Email Form State
  const [email, setEmail] = useState('');
  
  // Step 2: Verification & Reset Form State
  const [challengeData, setChallengeData] = useState<ForgotPasswordResponse | null>(null);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Timing & Cooldowns
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(600);
  
  // Status flags
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail('');
      setChallengeData(null);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setStatusMessage('');
      setIsLoading(false);
      setIsResending(false);
      setResendCooldown(0);

      // Auto-focus email input
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Countdown timer for resend cooldown and OTP expiry
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== 'verify' || expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, expiresIn]);

  if (!isOpen) return null;

  // Format seconds into mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ----------------------------------------------------------------------------
  // STEP 1: SUBMIT EMAIL FOR RESET CHALLENGE
  // ----------------------------------------------------------------------------
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid registered email address.');
      playErrorTone();
      return;
    }

    setIsLoading(true);
    playTapSound();

    try {
      const res = await apiForgotPassword(cleanEmail);
      if (res.status === 'success' && res.data) {
        setChallengeData(res.data);
        setStep('verify');
        setResendCooldown(res.data.resendCooldown || 60);
        setExpiresIn(res.data.expiresInSeconds || 600);
        setStatusMessage(res.message || `Verification code sent to ${res.data.maskedEmail}.`);
        playSuccessChime();

        // Auto focus OTP
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 200);
      } else {
        setError(res.message || 'Unable to request password reset. Please verify your email.');
        playErrorTone();
      }
    } catch (err: any) {
      setError(err?.message || 'Network connection failed. Please try again.');
      playErrorTone();
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------------------
  // STEP 2: RESEND CODE
  // ----------------------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending || !challengeData?.challengeId) return;

    setError('');
    setStatusMessage('');
    setIsResending(true);
    playTapSound();

    try {
      const res = await apiResendPasswordOtp(challengeData.challengeId);
      if (res.status === 'success' && res.data) {
        setChallengeData(res.data);
        setResendCooldown(res.data.resendCooldown || 60);
        setExpiresIn(res.data.expiresInSeconds || 600);
        setStatusMessage('A fresh verification code has been dispatched to your email.');
        playSuccessChime();
      } else {
        setError(res.message || 'Failed to resend verification code. Please try again.');
        playErrorTone();
      }
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.');
      playErrorTone();
    } finally {
      setIsResending(false);
    }
  };

  // ----------------------------------------------------------------------------
  // STEP 2: SUBMIT OTP & NEW PASSWORD
  // ----------------------------------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!challengeData?.challengeId) {
      setError('Session expired. Please start over.');
      playErrorTone();
      return;
    }

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit numeric verification code from your email.');
      playErrorTone();
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      playErrorTone();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      playErrorTone();
      return;
    }

    setIsLoading(true);
    playTapSound();

    try {
      const res = await apiResetPassword({
        challengeId: challengeData.challengeId,
        otp: cleanOtp,
        newPassword,
      });

      if (res.status === 'success') {
        playSuccessChime();
        setStep('success');
      } else {
        setError(res.message || 'Password reset failed. Please verify your code and try again.');
        playErrorTone();
      }
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.');
      playErrorTone();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    playTapSound();
    onClose();
    if (onSuccessRedirect) {
      onSuccessRedirect(email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 id="forgot-password-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {step === 'success' ? 'Password Reset Complete' : 'Reset Account Password'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {step === 'email' && 'Email Verification & Recovery'}
                  {step === 'verify' && 'Enter 6-digit Code & New Password'}
                  {step === 'success' && 'Ready to Sign In'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start space-x-3 text-rose-700 dark:text-rose-300 text-xs leading-relaxed animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Status / Success Message Banner */}
          {statusMessage && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-start space-x-2.5 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed animate-in fade-in">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* STEP 1: EMAIL ADDRESS INPUT */}
          {/* ------------------------------------------------------------------ */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your registered email address. We will send an automated single-use 6-digit verification code to confirm your identity.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    required
                    disabled={isLoading}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-xs disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 text-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>Verifying & Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Code</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onClose();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Remember your password? <span className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* STEP 2: VERIFICATION OTP & NEW PASSWORD */}
          {/* ------------------------------------------------------------------ */}
          {step === 'verify' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStep('email');
                    setError('');
                  }}
                  className="flex items-center space-x-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
                >
                  <ArrowLeft size={14} />
                  <span>Change Email</span>
                </button>
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  Expires in: <strong className={expiresIn < 120 ? 'text-amber-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>{formatTimer(expiresIn)}</strong>
                </div>
              </div>

              {/* 6-Digit Code Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Sent via Email</span>
                </div>
                <div className="relative flex items-center">
                  <KeyRound size={18} className="absolute left-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    required
                    disabled={isLoading}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 font-mono text-center tracking-[0.4em] font-bold text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={17} className="absolute left-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    disabled={isLoading}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-xs disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={17} className="absolute left-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    disabled={isLoading}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-xs disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Resend Code Link */}
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400">Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isResending}
                  onClick={handleResendOtp}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {isResending ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <span>Resend Code</span>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6 || !newPassword || !confirmPassword}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 text-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* STEP 3: SUCCESSFUL RESET CONFIRMATION */}
          {/* ------------------------------------------------------------------ */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-800/80 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-600/10 animate-in zoom-in-90 duration-300">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Your new password is now active. All active sessions have been safely terminated. You can now sign in to your account.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center space-x-2"
                >
                  <span>Sign In to Account</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
