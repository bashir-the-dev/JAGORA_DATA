import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { apiAdminLogin, apiAdminVerifyOtp, apiAdminResendOtp, setAuthToken } from '../../services/apiClient';
import { isSimulationAllowed } from '../../utils/environment';

interface AdminLoginScreenProps {
  onLoginSuccess: (adminUser?: any) => void;
  onCancel: () => void;
  isLightMode?: boolean;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onLoginSuccess,
  onCancel,
  isLightMode,
}) => {
  // Step State: 'credentials' -> 'otp_challenge'
  const [step, setStep] = useState<'credentials' | 'otp_challenge'>('credentials');

  // Step 1: Primary Credentials - Clean empty state to stop browser highlighting suggested inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: 2FA Email OTP Challenge
  const [challengeId, setChallengeId] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('b***r650@gmail.com');
  const [otp, setOtp] = useState<string>('');
  const [previewOtp, setPreviewOtp] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [useBackupKey, setUseBackupKey] = useState<boolean>(false);
  const [backupKey, setBackupKey] = useState<string>('');
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Brute-force lockout and rate-limiting defense states
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // General States
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);

  // Countdown timer for brute-force security lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Countdown timer for OTP expiry and resend cooldown
  useEffect(() => {
    if (step !== 'otp_challenge') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Format seconds as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Submit Primary Credentials (initiates 2FA)
  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const res: any = await apiAdminLogin({
        username: email.trim(),
        password,
        pin: pin.trim(),
      });

      setIsLoading(false);

      // Check for server-side brute-force lockout (HTTP 429)
      if (res.locked || res.error_code === 'ADMIN_LOCKED_OUT') {
        const remaining = res.remaining_seconds || 900;
        setLockoutRemaining(remaining);
        setAttemptsRemaining(0);
        setError(res.message || `Security Lockout Active: Too many failed attempts. Try again in ${Math.ceil(remaining / 60)} minutes.`);
        return;
      }

      if (res.attempts_remaining !== undefined) {
        setAttemptsRemaining(res.attempts_remaining);
      }

      if (res.status === '2fa_required' && res.data?.challengeId) {
        setChallengeId(res.data.challengeId);
        setMaskedEmail(res.data.maskedEmail || 'b***r650@gmail.com');
        setPreviewOtp(res.data.previewOtp || '');
        setTimeLeft(res.data.expiresInSeconds || 600);
        setResendCooldown(res.data.resendCooldown || 60);
        setStep('otp_challenge');
        setAttemptsRemaining(null);
        setInfoMessage(`A 6-digit two-factor verification code has been dispatched to ${res.data.maskedEmail || 'your email'}.`);
      } else if (res.status === 'success' && res.data?.token) {
        // Direct authentication fallback
        setAttemptsRemaining(null);
        setAuthToken(res.data.token);
        try {
          localStorage.setItem('jagora_auth_token', res.data.token);
          localStorage.setItem('jagora_admin_token', res.data.token);
          localStorage.setItem('jagora_admin_authenticated', 'true');
        } catch {}
        onLoginSuccess(res.data?.user || { name: 'Bashir Abubakar', email, adminRole: 'super_admin' });
      } else {
        // Fallback check if credentials match authorized master credentials (simulation only)
        if (isSimulationAllowed()) {
          const cleanEmail = email.trim().toLowerCase();
          const isMaster =
            (cleanEmail === 'admin@jagoradata.com' ||
              cleanEmail === 'admin' ||
              cleanEmail === '08123456789' ||
              cleanEmail === 'bashirabubakar650@gmail.com') &&
            (password === 'admin123' || password === 'JagoraAdmin@2026') &&
            pin.trim() === '9988';

          if (isMaster) {
            const previewCode = Math.floor(100000 + Math.random() * 900000).toString();
            setChallengeId(`ch_adm_local_${Date.now()}`);
            setMaskedEmail('ba***650@gmail.com');
            setPreviewOtp(previewCode);
            setTimeLeft(600);
            setResendCooldown(60);
            setStep('otp_challenge');
            setAttemptsRemaining(null);
            setInfoMessage('A 6-digit verification code has been dispatched to bashirabubakar650@gmail.com.');
            return;
          }
        }

        setError(res.message || 'Invalid administrator authorization credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      if (err?.locked || err?.error_code === 'ADMIN_LOCKED_OUT') {
        const remaining = err.remaining_seconds || 900;
        setLockoutRemaining(remaining);
        setAttemptsRemaining(0);
        setError(err.message || `Brute-force security lockout active. Access blocked for ${Math.ceil(remaining / 60)} minutes.`);
        return;
      }
      if (err?.attempts_remaining !== undefined) {
        setAttemptsRemaining(err.attempts_remaining);
      }
      setError(err?.message || 'Authentication service error. Try again.');
    }
  };

  // Step 2: Submit 2FA OTP Code
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const res = await apiAdminVerifyOtp({
        challengeId,
        otp: otp.trim(),
        backupCode: useBackupKey ? backupKey.trim() : undefined,
      });

      setIsLoading(false);

      if (res.status === 'success' && res.data?.token) {
        setAuthToken(res.data.token);
        try {
          localStorage.setItem('jagora_auth_token', res.data.token);
          localStorage.setItem('jagora_admin_token', res.data.token);
          localStorage.setItem('jagora_admin_authenticated', 'true');
        } catch {}
        onLoginSuccess(res.data?.user || { name: 'Bashir Abubakar', email, adminRole: 'super_admin' });
      } else {
        const canSimulate = isSimulationAllowed();
        // Allow preview code match or backup recovery key only in simulation/dev mode
        if (canSimulate && (otp.trim() === previewOtp || (useBackupKey && backupKey.trim() === 'JAGORA-ROOT-2026'))) {
          const simToken = btoa('bashirabubakar650@gmail.com');
          setAuthToken(simToken);
          try {
            localStorage.setItem('jagora_auth_token', simToken);
            localStorage.setItem('jagora_admin_token', simToken);
            localStorage.setItem('jagora_admin_authenticated', 'true');
          } catch {}
          onLoginSuccess({ name: 'Bashir Abubakar', email, phone: '08123456789', role: 'admin', adminRole: 'super_admin', token: simToken });
        } else {
          setError(res.message || 'Invalid or expired 6-digit verification code.');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      const canSimulate = isSimulationAllowed();
      // Allow offline preview code match only in simulation/dev mode
      if (canSimulate && (otp.trim() === previewOtp || (useBackupKey && backupKey.trim() === 'JAGORA-ROOT-2026'))) {
        const simToken = btoa('bashirabubakar650@gmail.com');
        setAuthToken(simToken);
        try {
          localStorage.setItem('jagora_auth_token', simToken);
          localStorage.setItem('jagora_admin_token', simToken);
          localStorage.setItem('jagora_admin_authenticated', 'true');
        } catch {}
        onLoginSuccess({ name: 'Bashir Abubakar', email, phone: '08123456789', role: 'admin', adminRole: 'super_admin', token: simToken });
      } else {
        setError(err?.message || 'Invalid verification code. Please check your email or enter your valid OTP.');
      }
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setIsResending(true);

    try {
      const res = await apiAdminResendOtp({ challengeId });
      setIsResending(false);

      if (res.status === 'success') {
        setResendCooldown(res.data?.resendCooldown || 60);
        setTimeLeft(res.data?.expiresInSeconds || 600);
        if (res.data?.previewOtp) {
          setPreviewOtp(res.data.previewOtp);
        }
        setInfoMessage(res.message || 'A fresh 6-digit verification code has been sent to your email.');
      } else {
        setError(res.message || 'Failed to resend code. Please wait.');
      }
    } catch {
      setIsResending(false);
      // Sandbox fallback
      const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
      setPreviewOtp(freshCode);
      setResendCooldown(60);
      setTimeLeft(600);
      setInfoMessage(`A fresh 6-digit verification code has been dispatched to ${maskedEmail}.`);
    }
  };

  const handleCopyPreview = () => {
    if (!previewOtp) return;
    navigator.clipboard?.writeText(previewOtp);
    setOtp(previewOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div
      id="screen-admin-login"
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors ${
        isLightMode ? 'bg-slate-900 text-white' : 'bg-slate-950 text-white'
      }`}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top security accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-400" />

        {/* Back / Exit Button */}
        <button
          type="button"
          onClick={() => {
            if (step === 'otp_challenge') {
              setStep('credentials');
              setError(null);
              setInfoMessage(null);
            } else {
              onCancel();
            }
          }}
          className="absolute top-5 left-5 text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{step === 'otp_challenge' ? 'Change Login' : 'Exit'}</span>
        </button>

        {/* Header Icon & Branding */}
        <div className="flex flex-col items-center text-center mt-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-[#0047cc] border border-blue-500/30 flex items-center justify-center shadow-lg mb-3 relative">
            <ShieldCheck size={32} className="text-amber-300 stroke-[2.2]" />
            {step === 'otp_challenge' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 tracking-wider">
              {step === 'credentials' ? 'Step 1: Root Authorization' : 'Step 2: Email 2FA Challenge'}
            </span>
          </div>

          <h1 className="font-heading text-xl sm:text-2xl font-black text-white tracking-tight">
            {step === 'credentials' ? 'VTU Admin Control Center' : 'Two-Factor Authentication'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
            {step === 'credentials'
              ? "Al'amin Jagora Data platform management, multi-gateway switching & treasury portal"
              : `Enter the 6-digit authorization code sent to ${maskedEmail}`}
          </p>
        </div>

        {/* Brute-Force Lockout Card */}
        {lockoutRemaining > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 animate-in fade-in duration-200 shadow-xl">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
              <span>Brute-Force Lockout Engaged</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed mb-3">
              Too many failed administrative attempts detected from this IP. To safeguard this VTU platform against dictionary cracking, login is temporarily suspended.
            </p>
            <div className="flex items-center justify-between bg-black/50 px-3.5 py-2.5 rounded-xl border border-rose-500/30 text-xs font-mono">
              <span className="text-rose-300 font-medium">Lockout Time Remaining:</span>
              <span className="font-bold text-amber-300 text-sm tracking-wider">{formatTime(lockoutRemaining)}</span>
            </div>
          </div>
        )}

        {/* Failed Attempt Warning Banner */}
        {attemptsRemaining !== null && attemptsRemaining < 4 && lockoutRemaining === 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400 shrink-0" />
              <span>Failed Attempt Recorded</span>
            </span>
            <span className="font-mono font-bold bg-amber-400/20 px-2 py-0.5 rounded text-[11px]">
              {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
            </span>
          </div>
        )}

        {/* Error Notification */}
        {error && lockoutRemaining === 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle size={17} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Notification */}
        {infoMessage && !error && lockoutRemaining === 0 && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="shrink-0 text-blue-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: PRIMARY CREDENTIALS (Email, Password, Master PIN)
            ========================================================================= */}
        {step === 'credentials' ? (
          <form onSubmit={handlePrimarySubmit} autoComplete="off" className="space-y-4" role="presentation">
            {/* Hidden dummy fields to consume browser autofill engines without affecting visible UI */}
            <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input type="text" name="fake_username_remember" tabIndex={-1} autoComplete="off" />
              <input type="password" name="fake_password_remember" tabIndex={-1} autoComplete="new-password" />
            </div>

            {/* Scoped Anti-Autofill Styles to completely stop browser input highlighting */}
            <style>{`
              #admin-login-email:-webkit-autofill,
              #admin-login-email:-webkit-autofill:hover,
              #admin-login-email:-webkit-autofill:focus,
              #admin-login-email:-webkit-autofill:active,
              #admin-login-password:-webkit-autofill,
              #admin-login-password:-webkit-autofill:hover,
              #admin-login-password:-webkit-autofill:focus,
              #admin-login-password:-webkit-autofill:active,
              #admin-login-pin:-webkit-autofill,
              #admin-login-pin:-webkit-autofill:hover,
              #admin-login-pin:-webkit-autofill:focus,
              #admin-login-pin:-webkit-autofill:active,
              #admin-login-otp:-webkit-autofill,
              #admin-login-otp:-webkit-autofill:hover,
              #admin-login-otp:-webkit-autofill:focus,
              #admin-login-otp:-webkit-autofill:active,
              #admin-login-backup:-webkit-autofill,
              #admin-login-backup:-webkit-autofill:hover,
              #admin-login-backup:-webkit-autofill:focus,
              #admin-login-backup:-webkit-autofill:active,
              input:-webkit-autofill {
                -webkit-box-shadow: 0 0 0 1000px #020617 inset !important;
                -webkit-text-fill-color: #f8fafc !important;
                caret-color: #f8fafc !important;
                transition: background-color 999999s ease-in-out 0s !important;
              }
              input:-internal-autofill-selected {
                appearance: none !important;
                background-color: #020617 !important;
                color: #f8fafc !important;
              }
              input::-webkit-contacts-auto-fill-button,
              input::-webkit-credentials-auto-fill-button {
                visibility: hidden !important;
                display: none !important;
                pointer-events: none !important;
                position: absolute !important;
                right: 0 !important;
              }
            `}</style>

            {/* Admin Email / Staff ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300 block">
                Staff Admin ID / Email
              </label>
              <div className="relative flex items-center">
                <Mail size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="admin-login-email"
                  name="admin_login_auth_user"
                  type="text"
                  required
                  disabled={lockoutRemaining > 0}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jagoradata.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-11 pr-4 font-mono text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300 block">
                Admin Password
              </label>
              <div className="relative flex items-center">
                <Lock size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="admin-login-password"
                  name="admin_login_auth_pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockoutRemaining > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-11 pr-11 font-mono text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Master 4-Digit Security PIN */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
                  Master Security PIN (4-Digits)
                </label>
                <span className="text-[10px] text-amber-400 font-mono">Treasury Guard</span>
              </div>
              <div className="relative flex items-center">
                <KeyRound size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="admin-login-pin"
                  name="admin_login_auth_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                  maxLength={4}
                  required
                  disabled={lockoutRemaining > 0}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-11 pr-4 font-mono text-sm tracking-widest text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Authorized for master operations and gateway configuration.
              </p>
            </div>

            {/* Quick Demo Fill (for simulation environments without triggering browser autofill) */}
            {isSimulationAllowed() && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@jagoradata.com');
                    setPassword('admin123');
                    setPin('9988');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
                >
                  Fill Demo Credentials
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading || lockoutRemaining > 0}
              className="w-full mt-6 bg-[#0047cc] hover:bg-blue-700 active:scale-[0.98] text-white font-sans text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </span>
              ) : lockoutRemaining > 0 ? (
                <span className="flex items-center gap-2 text-rose-300">
                  <Lock size={16} />
                  <span>Security Locked ({formatTime(lockoutRemaining)})</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-300" />
                  <span>Verify & Send Email OTP</span>
                </span>
              )}
            </button>

            {/* Enterprise Security Shield Footer */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock size={12} className="text-emerald-400" />
                <span>Brute-Force Shield Active</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Max 4 Attempts • 15m Lock
              </span>
            </div>

            {/* Test Credentials Helper Box (Simulation/Dev Only) */}
            {isSimulationAllowed() && (
              <div className="mt-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                  <CheckCircle2 size={13} />
                  <span>Authorized Master Credentials:</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300">
                  <span>Email: <strong className="text-white">admin@jagoradata.com</strong></span>
                  <span>Pass: <strong className="text-white">admin123</strong></span>
                  <span>PIN: <strong className="text-amber-400">9988</strong></span>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* =========================================================================
              STEP 2: EMAIL 2FA OTP CHALLENGE SCREEN
              ========================================================================= */
          <form onSubmit={handleOtpSubmit} autoComplete="off" className="space-y-4">
            {/* Live Developer / Sandbox Preview OTP Callout */}
            {isSimulationAllowed() && previewOtp && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/40 border border-emerald-500/30 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">
                      Admin Email Dispatch Preview
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="flex items-center gap-1 text-[11px] font-mono text-emerald-300 hover:text-white px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    {copiedOtp ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedOtp ? 'Auto-filled' : 'Auto-fill'}</span>
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Authorized Code:</span>
                  <span className="font-mono text-base font-black tracking-widest text-emerald-300 bg-black/40 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {previewOtp}
                  </span>
                </div>
              </div>
            )}

            {!useBackupKey ? (
              /* Standard 6-Digit OTP Input */
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
                    6-Digit Verification Code
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                    <Clock size={12} />
                    <span>Expires in {formatTime(timeLeft)}</span>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <KeyRound size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="admin-login-otp"
                    name="admin_login_otp_field"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-11 pr-4 font-mono text-xl text-center tracking-[0.4em] font-black text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Please check your inbox or spam folder for the security code.
                </p>
              </div>
            ) : (
              /* Emergency Root Recovery Key Input */
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase font-mono tracking-wider text-amber-300">
                    Master Recovery Root Key
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Offline Fallback</span>
                </div>
                <div className="relative flex items-center">
                  <Key size={18} className="absolute left-3.5 text-amber-400 pointer-events-none" />
                  <input
                    id="admin-login-backup"
                    name="admin_login_backup_field"
                    type="password"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    required
                    autoFocus
                    value={backupKey}
                    onChange={(e) => setBackupKey(e.target.value)}
                    placeholder="e.g. ROOT-SEC-XXXX-XXXX"
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl py-3 pl-11 pr-4 font-mono text-xs sm:text-sm text-amber-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Use your secure cold-storage root recovery token if email is delayed.
                </p>
              </div>
            )}

            {/* Action Buttons: Submit & Resend */}
            <div className="space-y-3 pt-2">
              <button
                id="admin-verify-submit-btn"
                type="submit"
                disabled={isLoading || (!useBackupKey && otp.length < 6) || (useBackupKey && !backupKey)}
                className="w-full bg-gradient-to-r from-blue-600 to-[#0047cc] hover:from-blue-500 hover:to-blue-700 active:scale-[0.98] text-white font-sans text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-400/30 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Validating 2FA Token...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-amber-300" />
                    <span>Authorize & Unlock Admin Console</span>
                  </span>
                )}
              </button>

              {/* Resend OTP & Backup Key Toggle */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 disabled:text-slate-500 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUseBackupKey(!useBackupKey);
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-amber-300 transition-colors text-[11px] underline underline-offset-2 cursor-pointer"
                >
                  {useBackupKey ? 'Use 6-Digit Email OTP' : 'Emergency Root Key'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
