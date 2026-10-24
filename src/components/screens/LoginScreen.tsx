import React, { useState } from 'react';
import {
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
  ShieldCheck,
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
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jagora_remember_me');
      return saved !== 'false';
    } catch {
      return true;
    }
  });
  const [loginIdentifier, setLoginIdentifier] = useState(() => {
    try {
      const remembered = localStorage.getItem('jagora_remembered_identifier');
      if (remembered) return remembered;
    } catch {}
    return isSimulationAllowed() ? '08199998888' : '';
  });
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
    playTapSound();
    triggerHaptic('light');

    try {
      const res = await apiLogin({ username: trimmedInput, password });

      if (res.status === 'success' && res.data) {
        setIsLoading(false);
        playSuccessChime();
        triggerHaptic('success');
        if (rememberMe) {
          localStorage.setItem('jagora_remember_me', 'true');
          localStorage.setItem('jagora_remembered_identifier', trimmedInput);
        } else {
          localStorage.setItem('jagora_remember_me', 'false');
          localStorage.removeItem('jagora_remembered_identifier');
        }
        const resolvedPhone = res.data.user?.phone || trimmedInput;
        onLoginSuccess(resolvedPhone, res.data);
        return;
      }

      if (res.message) {
        playErrorTone();
        triggerHaptic('warning');
        setError(res.message);
        setIsLoading(false);
        return;
      }
    } catch {
      if (!isSimulationAllowed()) {
        playErrorTone();
        setError('Unable to reach server. Please check your internet connection.');
        setIsLoading(false);
        return;
      }
    }

    if (!isSimulationAllowed()) {
      playErrorTone();
      setError('Invalid credentials. Please verify your phone number and password.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    playSuccessChime();
    onLoginSuccess(trimmedInput);
  };

  return (
    <div
      id="screen-login"
      className={`min-h-screen flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden transition-colors duration-200 ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Navbar Bar: Compact, clean & functional */}
      <header className="w-full max-w-lg mx-auto pt-6 px-4 flex items-center justify-between z-20">
        {onNavigateLanding ? (
          <button
            type="button"
            id="login-back-to-landing-btn"
            onClick={onNavigateLanding}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          {isSimulationAllowed() && onOpenApiSettings && (
            <button
              type="button"
              onClick={onOpenApiSettings}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Server size={14} className="text-[#0047cc] dark:text-blue-400" />
              <span className="font-mono text-[11px]">API</span>
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              id="login-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isLightMode ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Login Card - Compact, fast, wow */}
      <main className="w-full max-w-md mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {/* Brand Seal */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl p-1 bg-gradient-to-tr from-[#0047cc] via-[#0055ff] to-blue-400 shadow-lg shadow-blue-500/20 mx-auto mb-3 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden p-1">
              <img
                src="/logo.png"
                alt="AJDATASUB"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-slate-900 dark:text-white">
            AJDATASUB
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Premier VTU & Bills Hub
          </p>
        </div>

        {/* Card Container */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-all ${
            isLightMode
              ? 'bg-white border-slate-200/90 shadow-slate-200/50'
              : 'bg-slate-900 border-slate-800 shadow-black/60'
          }`}
        >
          <div className="mb-5">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sign in to manage your wallet and transactions
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-identifier-input"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
              >
                Phone Number, Username, or Email
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="login-identifier-input"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 08123456789 or bashir"
                  className={`w-full min-h-[48px] rounded-xl pl-10 pr-4 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                    isLightMode
                      ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password-input"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
              </div>

              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full min-h-[48px] rounded-xl pl-10 pr-11 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                    isLightMode
                      ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Remember Me Checkbox & Forgot Password Link */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300 min-h-[44px]">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#0047cc] focus:ring-[#0047cc]/30 bg-slate-50 dark:bg-slate-900 cursor-pointer accent-[#0047cc]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setResetSuccessNotice('');
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-xs font-bold text-[#0047cc] hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer min-h-[44px] flex items-center"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Reset Success Notice */}
            {resetSuccessNotice && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{resetSuccessNotice}</span>
              </div>
            )}

            {/* Session Expired Notice */}
            {sessionExpiredNotice && !error && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{sessionExpiredNotice}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-medium space-y-1">
                <p>{error}</p>
                {isSimulationAllowed() && (
                  <button
                    type="button"
                    onClick={() => onLoginSuccess(loginIdentifier)}
                    className="text-[11px] underline text-rose-700 dark:text-rose-400 hover:text-rose-900 block cursor-pointer font-bold"
                  >
                    Enter in Demo Mode
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading || isBiometricLoggingIn}
              className="w-full min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* Biometrics 1-tap option */}
            {hasStoredBiometrics && (
              <button
                type="button"
                id="login-biometrics-btn"
                onClick={handleBiometricLogin}
                disabled={isLoading || isBiometricLoggingIn}
                className={`w-full min-h-[48px] rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
                  isLightMode
                    ? 'border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#0047cc]'
                    : 'border-blue-900/60 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300'
                }`}
              >
                {isBiometricLoggingIn ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Verifying Biometrics...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} className="text-[#0047cc] dark:text-blue-400" />
                    <span>Touch ID / Face ID Quick Sign In</span>
                  </>
                )}
              </button>
            )}
          </form>

          {/* Switch to Register link */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                id="switch-to-register-btn"
                onClick={onNavigateRegister}
                className="text-[#0047cc] hover:text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        {/* Footer Legal Links */}
        {(onNavigateTerms || onNavigatePrivacy) && (
          <div className="mt-6 text-center flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {onNavigateTerms && (
              <button
                type="button"
                onClick={onNavigateTerms}
                className="hover:text-[#0047cc] dark:hover:text-blue-400 underline cursor-pointer"
              >
                Terms of Service
              </button>
            )}
            {onNavigateTerms && onNavigatePrivacy && <span>•</span>}
            {onNavigatePrivacy && (
              <button
                type="button"
                onClick={onNavigatePrivacy}
                className="hover:text-[#0047cc] dark:hover:text-blue-400 underline cursor-pointer"
              >
                Privacy Policy
              </button>
            )}
          </div>
        )}
      </main>

      {/* Forgot Password Modal */}
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
