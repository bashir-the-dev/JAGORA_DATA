import React, { useState } from 'react';
import {
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Server,
  RefreshCw,
  Sun,
  Moon,
  CheckCircle2,
  Wifi,
  Zap,
  Tv,
  Layers,
  ShieldCheck,
  Headphones,
  Fingerprint,
} from 'lucide-react';
import { apiLogin } from '../../services/apiClient';
import { ForgotPasswordModal } from '../modals/ForgotPasswordModal';
import { isSimulationAllowed } from '../../utils/environment';
import { authenticateDeviceBiometrics } from '../../utils/webAuthn';
import { playSuccessChime, playErrorTone, triggerHaptic, playTapSound } from '../../utils/soundEffects';

interface LoginScreenProps {
  onLoginSuccess: (phone: string, serverData?: any) => void;
  onNavigateRegister: () => void;
  onNavigateLanding?: () => void;
  onAdminLogin?: () => void;
  onOpenApiSettings?: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  sessionExpiredNotice?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateLanding,
  onAdminLogin,
  onOpenApiSettings,
  onNavigateTerms,
  onNavigatePrivacy,
  isLightMode = true,
  onToggleTheme,
  sessionExpiredNotice,
}) => {
  const [loginIdentifier, setLoginIdentifier] = useState(() => (isSimulationAllowed() ? '08199998888' : ''));
  const [password, setPassword] = useState(() => (isSimulationAllowed() ? 'Password123#' : ''));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');
  const [hasStoredBiometrics, setHasStoredBiometrics] = useState(false);
  const [isBiometricLoggingIn, setIsBiometricLoggingIn] = useState(false);

  React.useEffect(() => {
    try {
      const cred = localStorage.getItem('jagora_webauthn_credential_id');
      const token = localStorage.getItem('jagora_token') || localStorage.getItem('jagora_auth_token');
      const userRaw = localStorage.getItem('jagora_user_profile');
      if (cred && token && userRaw) {
        setHasStoredBiometrics(true);
      }
    } catch {}
  }, []);

  const handleBiometricLogin = async () => {
    playTapSound();
    triggerHaptic('light');
    setError('');
    setIsBiometricLoggingIn(true);

    try {
      const authRes = await authenticateDeviceBiometrics();
      if (authRes.success) {
        playSuccessChime();
        triggerHaptic('success');
        const userRaw = localStorage.getItem('jagora_user_profile');
        const parsed = userRaw ? JSON.parse(userRaw) : null;
        const phoneToUse = parsed?.phone || loginIdentifier || '08199998888';
        onLoginSuccess(phoneToUse, { user: parsed });
      } else {
        playErrorTone();
        triggerHaptic('warning');
        setError(authRes.error || 'Biometric authentication was cancelled.');
      }
    } catch {
      playErrorTone();
      setError('Biometric authentication failed. Please sign in with your password.');
    } finally {
      setIsBiometricLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedInput = loginIdentifier.trim();
    if (!trimmedInput) {
      setError('Please enter your username, phone number, or email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiLogin({ username: trimmedInput, password });

      if (res.status === 'success' && res.data) {
        setIsLoading(false);
        const resolvedPhone = res.data.user?.phone || trimmedInput;
        onLoginSuccess(resolvedPhone, res.data);
        return;
      }

      if (res.message) {
        setError(res.message);
        setIsLoading(false);
        return;
      }
    } catch {
      if (!isSimulationAllowed()) {
        setError('Unable to reach server. Please check your internet connection and try again.');
        setIsLoading(false);
        return;
      }
      // Server offline in development/preview mode; proceed with testing profile
    }

    if (!isSimulationAllowed()) {
      setError('Login failed. Please verify your credentials and password.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onLoginSuccess(trimmedInput);
  };

  return (
    <div
      id="screen-login"
      className={`min-h-screen flex flex-col justify-between selection:bg-[#F5B014] selection:text-slate-950 overflow-x-hidden transition-colors duration-200 ${
        isLightMode ? 'bg-[#edf2f7] text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP NAVY HEADER WITH WATERMARK & GOLD CURVE */}
      {/* ========================================================================= */}
      <div className="relative bg-gradient-to-b from-[#061838] via-[#081a3e] to-[#0a214d] text-white pt-8 pb-14 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Top-left Kano Islamic Geometric Watermark */}
        <div className="absolute top-0 left-0 w-44 h-44 opacity-15 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full text-amber-300">
            <polygon points="50,5 63,38 95,38 69,57 79,90 50,70 21,90 31,57 5,38 37,38" strokeWidth="1" />
            <polygon points="50,15 60,40 85,40 65,55 72,80 50,65 28,80 35,55 15,40 40,40" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="35" strokeWidth="0.7" />
          </svg>
        </div>

        {/* Top-right Kano Grand Arch / Minaret Silhouette */}
        <div className="absolute top-0 right-0 w-52 h-44 opacity-15 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 200 160" fill="currentColor" className="w-full h-full text-blue-200">
            <rect x="130" y="20" width="22" height="140" rx="3" />
            <path d="M130,20 Q141,-5 152,20 Z" />
            <rect x="70" y="50" width="45" height="110" rx="4" />
            <path d="M70,50 Q92.5,20 115,50 Z" />
            <path d="M80,160 L80,100 Q92.5,80 105,100 L105,160 Z" fill="#081a3e" />
          </svg>
        </div>

        {/* Top bar controls: Home & Theme toggle */}
        <div className="relative max-w-md mx-auto flex items-center justify-between mb-4 z-20">
          {onNavigateLanding ? (
            <button
              type="button"
              id="login-back-to-landing-btn"
              onClick={onNavigateLanding}
              title="Back to Landing Page"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {isSimulationAllowed() && onOpenApiSettings && (
              <button
                type="button"
                onClick={onOpenApiSettings}
                title="Backend API Settings"
                className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-sm"
              >
                <Server size={12} className="text-[#F5B014]" />
                <span className="hidden sm:inline text-[11px]">API</span>
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                id="login-theme-toggle-btn"
                onClick={onToggleTheme}
                title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
              >
                {isLightMode ? <Moon size={14} /> : <Sun size={14} className="text-amber-400" />}
              </button>
            )}
          </div>
        </div>

        {/* Center Brand Identity (Emblem Logo & Titles) */}
        <div className="relative max-w-md mx-auto flex flex-col items-center text-center z-10">
          {/* Exact AJD App Badge */}
          <div
            title="Al'amin Jagora Data"
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 shadow-2xl flex items-center justify-center select-none mb-3.5 transition-transform hover:scale-105"
          >
            <div className="w-full h-full rounded-[14px] bg-[#0055ff] overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src="/logo.png"
                alt="Al'amin Jagora Data"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-white font-heading">
            Al'amin Jagora Data
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/90 font-medium mt-0.5">
            Nigeria's No. 1 VTU & Data Hub
          </p>

          {/* Quick Services Strip matching mockup */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 mt-4 text-[11px] font-semibold text-slate-200 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-[#F5B014]" />
              <span>Airtime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi size={13} className="text-[#F5B014]" />
              <span>Data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-[#F5B014] fill-[#F5B014]" />
              <span>Electricity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tv size={13} className="text-[#F5B014]" />
              <span>TV Subscription</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-[#F5B014]" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Swooping Gold Curved Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-10 sm:h-12"
          >
            {/* Soft gold accent border curve */}
            <path
              d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"
              fill="#F5B014"
              opacity="0.95"
            />
            {/* Base curve matching background */}
            <path
              d="M0,10 C300,95 900,95 1200,10 L1200,120 L0,120 Z"
              fill={isLightMode ? '#edf2f7' : '#020617'}
            />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING CARD CONTAINER */}
      {/* ========================================================================= */}
      <main className="relative z-20 max-w-md w-full mx-auto px-4 -mt-4 sm:-mt-6 mb-8 flex-1 flex flex-col justify-center">
        <div
          className={`rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl border transition-colors duration-200 ${
            isLightMode
              ? 'bg-white border-slate-200/80 shadow-slate-200/60'
              : 'bg-slate-900 border-slate-800 shadow-black/80'
          }`}
        >
          {/* Welcome Eyebrow & Title */}
          <div className="mb-6">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0052cc] dark:text-blue-400 block">
              WELCOME BACK
            </span>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight mt-1 ${
                isLightMode ? 'text-[#061838]' : 'text-white'
              }`}
            >
              Sign in to your account
            </h2>
            <p className={`text-xs sm:text-sm font-normal leading-relaxed mt-1 ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Access your VTU wallet and enjoy fast, secure and reliable services.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username / Phone / Email Field */}
            <div>
              <label
                htmlFor="login-identifier-input"
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                USERNAME, PHONE NUMBER, OR EMAIL
              </label>
              <div className="relative flex items-center">
                <User size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  id="login-identifier-input"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 08199998888 or bashir650"
                  className={`w-full border rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password-input"
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isLightMode ? 'text-slate-800' : 'text-slate-200'
                  }`}
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setResetSuccessNotice('');
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-xs font-bold text-[#0052cc] hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full border rounded-2xl py-3.5 pl-11 pr-11 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 transition-colors cursor-pointer p-1 ${
                    isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Reset Success Notice */}
            {resetSuccessNotice && (
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}>
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <span>{resetSuccessNotice}</span>
              </div>
            )}

            {/* Session Expired Notice */}
            {sessionExpiredNotice && !error && (
              <div className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start gap-2.5 ${
                isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800 text-amber-200'
              }`}>
                <ShieldCheck size={18} className="shrink-0 text-amber-500 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Security Notice: </span>
                  {sessionExpiredNotice}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-xl border text-xs font-medium space-y-1 ${
                isLightMode ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                <p>{error}</p>
                {isSimulationAllowed() && (
                  <button
                    type="button"
                    onClick={() => onLoginSuccess(loginIdentifier)}
                    className="text-[11px] underline text-slate-400 hover:text-slate-200 block cursor-pointer"
                  >
                    Or enter in Demo Mode
                  </button>
                )}
              </div>
            )}

            {/* Solid Royal Blue Action Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading || isBiometricLoggingIn}
              className="w-full py-4 rounded-2xl bg-[#0052cc] hover:bg-[#0047b3] active:bg-[#003d99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] cursor-pointer min-h-[48px] mt-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Quick Biometric Sign In button (when device enrolled) */}
            {hasStoredBiometrics && (
              <button
                type="button"
                id="login-biometrics-btn"
                onClick={handleBiometricLogin}
                disabled={isLoading || isBiometricLoggingIn}
                className={`w-full py-3.5 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer min-h-[44px] disabled:opacity-60 ${
                  isLightMode
                    ? 'border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-700'
                    : 'border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300'
                }`}
              >
                {isBiometricLoggingIn ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Verifying Biometrics...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={19} className="text-purple-600 dark:text-purple-400" />
                    <span>Sign In with Biometrics (Touch ID / Face ID)</span>
                  </>
                )}
              </button>
            )}
          </form>

          {/* Switch to Register */}
          <div className="mt-5 text-center">
            <p className={`text-xs font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Don't have an account?{' '}
              <button
                type="button"
                id="switch-to-register-btn"
                onClick={onNavigateRegister}
                className="text-[#0052cc] hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-bold cursor-pointer ml-1"
              >
                Sign Up
              </button>
            </p>
          </div>

          {/* 4 Trust & Feature Badges Bar */}
          <div className={`mt-6 pt-5 border-t ${isLightMode ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className={`rounded-2xl p-3 sm:p-3.5 border grid grid-cols-4 gap-1.5 text-center ${
              isLightMode ? 'bg-slate-50/90 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              {/* Badge 1: Secure & Reliable */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                  isLightMode ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-950/80 text-emerald-400'
                }`}>
                  <ShieldCheck size={15} />
                </div>
                <span className={`text-[9.5px] sm:text-[10px] font-bold leading-tight ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Secure & Reliable
                </span>
              </div>

              {/* Badge 2: Instant Delivery */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                  isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-950/80 text-blue-400'
                }`}>
                  <Zap size={15} className={isLightMode ? 'fill-blue-700' : 'fill-blue-400'} />
                </div>
                <span className={`text-[9.5px] sm:text-[10px] font-bold leading-tight ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Instant Delivery
                </span>
              </div>

              {/* Badge 3: 24/7 Support */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                  isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-950/80 text-purple-400'
                }`}>
                  <Headphones size={15} />
                </div>
                <span className={`text-[9.5px] sm:text-[10px] font-bold leading-tight ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  24/7 Support
                </span>
              </div>

              {/* Badge 4: Proudly Nigerian */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                  isLightMode ? 'bg-slate-100' : 'bg-slate-800'
                }`}>
                  <div className="w-4 h-4 rounded-full overflow-hidden flex border border-slate-300 shadow-2xs">
                    <div className="w-1/3 h-full bg-[#008751]" />
                    <div className="w-1/3 h-full bg-white" />
                    <div className="w-1/3 h-full bg-[#008751]" />
                  </div>
                </div>
                <span className={`text-[9.5px] sm:text-[10px] font-bold leading-tight ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Proudly Nigerian
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline Footer Outside Card matching mockup */}
        <div className="mt-5 text-center flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3">
            <div className={`w-8 h-[1px] ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              FAST • SECURE • CONVENIENT
            </span>
            <div className={`w-8 h-[1px] ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
          </div>
          {(onNavigateTerms || onNavigatePrivacy) && (
            <div className={`flex items-center gap-3 text-[11px] font-medium ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {onNavigateTerms && (
                <button
                  type="button"
                  onClick={onNavigateTerms}
                  className="hover:text-[#0052cc] dark:hover:text-blue-400 underline cursor-pointer"
                >
                  Terms of Service
                </button>
              )}
              {onNavigateTerms && onNavigatePrivacy && <span>•</span>}
              {onNavigatePrivacy && (
                <button
                  type="button"
                  onClick={onNavigatePrivacy}
                  className="hover:text-[#0052cc] dark:hover:text-blue-400 underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Automated Email OTP Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        isLightMode={isLightMode}
        onSuccessRedirect={() => {
          setIsForgotPasswordOpen(false);
          setResetSuccessNotice('Password reset successful! Please sign in with your new password.');
          setPassword('');
        }}
      />
    </div>
  );
};
