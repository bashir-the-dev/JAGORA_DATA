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
  Wifi,
  Zap,
  Tv,
  Layers,
  ShieldCheck,
  Headphones,
  Gift,
  Sparkles,
} from 'lucide-react';
import { apiRegister } from '../../services/apiClient';
import { LegalModal } from '../modals/LegalModal';
import { isSimulationAllowed } from '../../utils/environment';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
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
      setError('You must agree to the Terms of Service and Privacy Policy to proceed');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email || !phone || !password) {
      setError('Please fill in all required fields including First Name and Surname');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (username.trim() && cleanUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, and underscores only)');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('Transaction PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRegister({
        name: fullName.trim(),
        username: cleanUsername || undefined,
        email: email.trim(),
        phone: phone.trim(),
        password,
        pin,
        referralCode: referralCode.trim() || undefined,
      });

      if (res.status === 'success') {
        setIsLoading(false);
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
      // API server offline; proceed smoothly with demo registration in development
    }

    if (!isSimulationAllowed()) {
      setError('Registration could not be completed. Please try again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
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
      className={`min-h-screen flex flex-col justify-between selection:bg-[#F5B014] selection:text-slate-950 overflow-x-hidden transition-colors duration-200 ${
        isLightMode ? 'bg-[#edf2f7] text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP NAVY HEADER WITH WATERMARK & GOLD CURVE */}
      {/* ========================================================================= */}
      <div className="relative bg-gradient-to-b from-[#061838] via-[#081a3e] to-[#0a214d] text-white pt-8 pb-14 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Top-left Kano Geometric Motif Watermark */}
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

        {/* Top Bar Controls */}
        <div className="relative max-w-md mx-auto flex items-center justify-between mb-4 z-20">
          {onNavigateLanding ? (
            <button
              type="button"
              id="register-back-to-landing-btn"
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
                id="register-theme-toggle-btn"
                onClick={onToggleTheme}
                title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
              >
                {isLightMode ? <Moon size={14} /> : <Sun size={14} className="text-amber-400" />}
              </button>
            )}
          </div>
        </div>

        {/* Center Brand Identity */}
        <div className="relative max-w-md mx-auto flex flex-col items-center text-center z-10">
          {/* Exact AJD App Badge */}
          <div
            title="Al'amin Jagora Data"
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 shadow-2xl flex items-center justify-center cursor-pointer select-none mb-3.5 hover:scale-105 transition-transform"
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

          {/* Quick Services Strip */}
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
            <path
              d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"
              fill="#F5B014"
              opacity="0.95"
            />
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
          {/* Eyebrow & Title */}
          <div className="mb-5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0052cc] dark:text-blue-400 block">
              GET STARTED
            </span>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight mt-1 ${
                isLightMode ? 'text-[#061838]' : 'text-white'
              }`}
            >
              Create your account
            </h2>
            <p className={`text-xs sm:text-sm font-normal leading-relaxed mt-1 ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Join 50,000+ happy Nigerians enjoying fast, discounted VTU & utility bill payments.
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* First Name & Surname (Separated fields) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                    isLightMode ? 'text-slate-800' : 'text-slate-200'
                  }`}
                >
                  FIRST NAME
                </label>
                <div className="relative flex items-center">
                  <User size={17} className={`absolute left-4 pointer-events-none ${
                    isLightMode ? 'text-slate-700' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ibrahim"
                    className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                      isLightMode
                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                    isLightMode ? 'text-slate-800' : 'text-slate-200'
                  }`}
                >
                  SURNAME
                </label>
                <div className="relative flex items-center">
                  <User size={17} className={`absolute left-4 pointer-events-none ${
                    isLightMode ? 'text-slate-700' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Al-Hassan"
                    className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                      isLightMode
                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                USERNAME
              </label>
              <div className="relative flex items-center">
                <AtSign size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. ibrahim99"
                  className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
              <p className={`text-[10px] mt-0.5 pl-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Letters, numbers, and underscores only
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                EMAIL ADDRESS
              </label>
              <div className="relative flex items-center">
                <Mail size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                PHONE NUMBER
              </label>
              <div className="relative flex items-center">
                <Phone size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08199998888"
                  className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full border rounded-2xl py-3 pl-11 pr-11 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
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

            {/* Transaction PIN (4 digits) */}
            <div>
              <label
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                4-DIGIT TRANSACTION PIN
              </label>
              <div className="relative flex items-center">
                <KeyRound size={17} className={`absolute left-4 pointer-events-none ${
                  isLightMode ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs tracking-widest ${
                    isLightMode
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Referral Code (Optional, with auto-fill badge) */}
            {!isReferralsHidden && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isLightMode ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    REFERRAL CODE (OPTIONAL)
                  </label>
                  {referralCode && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <Sparkles size={10} />
                      <span>Referral Applied</span>
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Gift size={17} className={`absolute left-4 pointer-events-none ${
                    referralCode ? 'text-amber-500' : (isLightMode ? 'text-slate-700' : 'text-slate-400')
                  }`} />
                  <input
                    type="text"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="e.g. AJD8K9X"
                    className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm font-mono font-semibold focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all shadow-xs ${
                      referralCode
                        ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/80 text-slate-900 dark:text-amber-200'
                        : isLightMode
                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
                <p className={`text-[10.5px] mt-1 pl-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {referralCode ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✨ Your inviter will receive a ₦50 bonus on your first completed purchase!
                    </span>
                  ) : (
                    'Have an invite code from a friend? Paste or enter it above.'
                  )}
                </p>
              </div>
            )}

            {/* Terms checkbox */}
            <div
              className={`flex items-start gap-3 p-3 rounded-2xl transition-all border ${
                !agreed && (error.toLowerCase().includes('terms') || error.toLowerCase().includes('agree'))
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200'
                  : isLightMode
                  ? 'bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/70'
                  : 'bg-slate-950/80 border-slate-800 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-center min-w-[28px] min-h-[28px] pt-0.5">
                <input
                  id="register-terms-checkbox"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (error.toLowerCase().includes('terms') || error.toLowerCase().includes('agree')) {
                      setError('');
                    }
                  }}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-[#0052cc] focus:ring-[#0052cc] cursor-pointer accent-[#0052cc]"
                />
              </div>
              <label htmlFor="register-terms-checkbox" className={`text-xs font-medium leading-relaxed cursor-pointer select-none ${
                isLightMode ? 'text-slate-700' : 'text-slate-300'
              }`}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLegalModalTab('terms');
                    setLegalModalOpen(true);
                  }}
                  className="text-[#0052cc] dark:text-blue-400 font-bold underline hover:text-[#003d99] dark:hover:text-blue-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLegalModalTab('privacy');
                    setLegalModalOpen(true);
                  }}
                  className="text-[#0052cc] dark:text-blue-400 font-bold underline hover:text-[#003d99] dark:hover:text-blue-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                >
                  Privacy Policy
                </button>
                .
              </label>
            </div>

            {/* Error message */}
            {error && (
              <div className={`p-3 rounded-xl border text-xs font-medium space-y-1 ${
                isLightMode ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                <p>{error}</p>
                {isSimulationAllowed() && (
                  <button
                    type="button"
                    onClick={() => onRegisterSuccess({ name: fullName, username: username || undefined, email, phone })}
                    className="text-[11px] underline text-slate-400 hover:text-slate-200 block cursor-pointer"
                  >
                    Or continue in Demo Mode
                  </button>
                )}
              </div>
            )}

            {/* Solid Royal Blue Submit Button - Disabled until terms agreed */}
            <div className="space-y-1.5 mt-2">
              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading || !agreed}
                className={`w-full py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                  !agreed
                    ? isLightMode
                      ? 'bg-slate-200 text-slate-400 border border-slate-300/80 cursor-not-allowed shadow-none'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                    : 'bg-[#0052cc] hover:bg-[#0047b3] active:bg-[#003d99] text-white shadow-lg shadow-blue-600/25 active:scale-[0.98] cursor-pointer'
                } disabled:opacity-75`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : !agreed ? (
                  <>
                    <Lock size={16} className={isLightMode ? 'text-slate-400' : 'text-slate-500'} />
                    <span>Agree to Terms to Continue</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              {!agreed && (
                <p className={`text-[11px] text-center font-medium ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Please check the agreement box above to activate registration.
                </p>
              )}
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-5 text-center">
            <p className={`text-xs font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Already have an account?{' '}
              <button
                type="button"
                id="switch-to-login-btn"
                onClick={onNavigateLogin}
                className="text-[#0052cc] hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-bold cursor-pointer ml-1"
              >
                Sign In
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
        <div className="mt-5 text-center flex items-center justify-center gap-3">
          <div className={`w-8 h-[1px] ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${
            isLightMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            FAST • SECURE • CONVENIENT
          </span>
          <div className={`w-8 h-[1px] ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
        </div>
      </main>

      {/* Interactive Terms & Privacy Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
        isLightMode={isLightMode}
        onAccept={() => {
          setAgreed(true);
          setLegalModalOpen(false);
          if (error.toLowerCase().includes('terms') || error.toLowerCase().includes('agree')) {
            setError('');
          }
        }}
      />
    </div>
  );
};
