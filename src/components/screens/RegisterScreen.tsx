import React, { useState } from 'react';
import {
  User,
  AtSign,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Server,
  Sun,
  Moon,
  Gift,
} from 'lucide-react';
import { apiRegister } from '../../services/apiClient';
import { LegalModal } from '../modals/LegalModal';
import { isSimulationAllowed } from '../../utils/environment';
import { playSuccessChime, playErrorTone, triggerHaptic, playTapSound } from '../../utils/soundEffects';
import { humanizeVtuError } from '../../utils/errorParser';

interface RegisterScreenProps {
  onRegisterSuccess: (user: { name: string; username?: string; email: string; phone: string; serverData?: any }) => void;
  onNavigateLogin: () => void;
  onNavigateLanding?: () => void;
  onOpenApiSettings?: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  isReferralsHidden?: boolean;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onNavigateLanding,
  onOpenApiSettings,
  isLightMode = true,
  onToggleTheme,
  isReferralsHidden = false,
}) => {
  // Determine if referrals are hidden via prop or platform settings storage
  const isHideReferrals = Boolean(
    isReferralsHidden || (() => {
      try {
        const raw =
          localStorage.getItem('jagora_storage_platform_settings') ||
          localStorage.getItem('jagora_platform_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.referralSettings?.hideFromUsers) return true;
        }
      } catch {}
      return false;
    })()
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        const refParam = searchParams.get('ref') || searchParams.get('referral');
        if (refParam) {
          const cleanRef = refParam.trim().toUpperCase();
          localStorage.setItem('jagora_referral_code', cleanRef);
          return cleanRef;
        }
      }
      return localStorage.getItem('jagora_referral_code') || '';
    } catch {
      return '';
    }
  });
  const [agreed, setAgreed] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      playErrorTone();
      triggerHaptic('warning');
      setError('Please agree to the Terms of Service & Privacy Policy to create your account.');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email || !phone || !password) {
      playErrorTone();
      triggerHaptic('warning');
      setError('Please fill in your First Name, Last Name, Phone, Email, and Password.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (username.trim() && cleanUsername.length < 3) {
      playErrorTone();
      triggerHaptic('warning');
      setError('Username must be at least 3 characters (letters, numbers, underscores only).');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      playErrorTone();
      triggerHaptic('warning');
      setError('Transaction PIN must be exactly 4 digits.');
      return;
    }

    setIsLoading(true);
    playTapSound();
    triggerHaptic('light');

    try {
      const cleanPin = pin.trim() || '1234';
      const res = await apiRegister({
        name: fullName.trim(),
        username: cleanUsername || undefined,
        email: email.trim(),
        phone: phone.trim(),
        password,
        pin: cleanPin,
        referralCode: isHideReferrals ? undefined : (referralCode.trim() || undefined),
      });

      if (res.status === 'success') {
        setIsLoading(false);
        playSuccessChime();
        triggerHaptic('success');
        onRegisterSuccess({
          name: fullName,
          username: cleanUsername || undefined,
          email,
          phone,
          serverData: res.data,
        });
        return;
      }

      if (res.message) {
        playErrorTone();
        triggerHaptic('warning');
        setError(humanizeVtuError(res.message, 'account'));
        setIsLoading(false);
        return;
      }
    } catch (catchErr: any) {
      if (!isSimulationAllowed()) {
        playErrorTone();
        setError(humanizeVtuError(catchErr, 'account'));
        setIsLoading(false);
        return;
      }
    }

    if (!isSimulationAllowed()) {
      playErrorTone();
      setError('Registration could not be completed. Please try again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    playSuccessChime();
    onRegisterSuccess({
      name: fullName,
      username: cleanUsername || undefined,
      email,
      phone,
    });
  };

  return (
    <div
      id="screen-register"
      className={`min-h-screen flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden transition-colors duration-200 ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Navbar Bar: Compact, clean & functional */}
      <header className="w-full max-w-lg mx-auto pt-6 px-4 flex items-center justify-between z-20">
        {onNavigateLanding ? (
          <button
            type="button"
            id="register-back-to-landing-btn"
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
              id="register-theme-toggle-btn"
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

      {/* Main Register Card */}
      <main className="w-full max-w-lg mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {/* Brand Header */}
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
            Create Account
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Instant airtime, data & bills with zero delays
          </p>
        </div>

        {/* Form Container Card */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-all ${
            isLightMode
              ? 'bg-white border-slate-200/90 shadow-slate-200/50'
              : 'bg-slate-900 border-slate-800 shadow-black/60'
          }`}
        >
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Names row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  First Name
                </label>
                <div className="relative flex items-center">
                  <User size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Bashir"
                    className={`w-full min-h-[46px] rounded-xl pl-10 pr-3.5 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                      isLightMode
                        ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Abubakar"
                  className={`w-full min-h-[46px] rounded-xl px-3.5 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                    isLightMode
                      ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Phone & Username row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <Phone size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="08012345678"
                    className={`w-full min-h-[46px] rounded-xl pl-10 pr-3.5 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                      isLightMode
                        ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Username <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative flex items-center">
                  <AtSign size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. bashir650"
                    className={`w-full min-h-[46px] rounded-xl pl-10 pr-3.5 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                      isLightMode
                        ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full min-h-[46px] rounded-xl pl-10 pr-3.5 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                    isLightMode
                      ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Password & PIN row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className={`w-full min-h-[46px] rounded-xl pl-10 pr-10 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                      isLightMode
                        ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  4-Digit PIN
                </label>
                <div className="relative flex items-center">
                  <KeyRound size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 1234"
                    className={`w-full min-h-[46px] rounded-xl pl-10 pr-3.5 text-sm font-medium border tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                      isLightMode
                        ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Optional Referral Code - only if referrals are enabled */}
            {!isHideReferrals && (
              <div>
                {!showReferralInput && !referralCode ? (
                  <button
                    type="button"
                    onClick={() => setShowReferralInput(true)}
                    className="text-xs font-bold text-[#0047cc] hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <Gift size={14} />
                    <span>Have a referral code? (Optional)</span>
                  </button>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Referral Code <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <div className="relative flex items-center">
                      <Gift size={17} className="absolute left-3.5 text-amber-500 pointer-events-none" />
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g. AJD12345"
                        className={`w-full min-h-[46px] rounded-xl pl-10 pr-3.5 text-sm font-bold uppercase tracking-wider border transition-all focus:outline-none focus:ring-2 focus:ring-[#0047cc]/25 focus:border-[#0047cc] ${
                          isLightMode
                            ? 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
                            : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Terms & Privacy checkbox */}
            <div className="pt-1 flex items-start gap-2.5">
              <input
                id="register-terms-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0047cc] focus:ring-[#0047cc] cursor-pointer"
              />
              <label
                htmlFor="register-terms-checkbox"
                className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed select-none"
              >
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('terms');
                    setLegalModalOpen(true);
                  }}
                  className="text-[#0047cc] hover:underline font-bold dark:text-blue-400 cursor-pointer"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setLegalModalOpen(true);
                  }}
                  className="text-[#0047cc] hover:underline font-bold dark:text-blue-400 cursor-pointer"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Create Account Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] rounded-xl bg-[#0047cc] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                id="switch-to-login-btn"
                onClick={onNavigateLogin}
                className="text-[#0047cc] hover:text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Terms & Privacy Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
        isLightMode={isLightMode}
      />
    </div>
  );
};
