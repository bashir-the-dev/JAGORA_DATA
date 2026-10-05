import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  User,
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  HelpCircle,
  FileText,
  ShieldAlert,
  Info,
  LogOut,
  CheckCircle2,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Star,
  Moon,
  Sun,
  Copy,
  Check,
  Sparkles,
  Crown,
  ArrowRight,
  Gift,
} from 'lucide-react';
import { playTapSound, playSuccessChime, playErrorTone, triggerHaptic } from '../../utils/soundEffects';
import { RateUsModal } from '../modals/RateUsModal';
import {
  apiChangePin,
  apiResetPin,
} from '../../services/apiClient';
import {
  checkBiometricSupport,
  registerDeviceBiometrics,
  removeDeviceBiometrics,
  BiometricAvailability,
} from '../../utils/webAuthn';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenRateUs?: () => void;
  onNavigate?: (screen: any) => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  isReferralsHidden?: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onOpenHelp,
  onOpenRateUs,
  onNavigate,
  isLightMode = true,
  onToggleTheme,
  isReferralsHidden = false,
}) => {
  const [biometric, setBiometric] = useState(user.biometricEnabled);
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState(false);
  const [biometricStatusMsg, setBiometricStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [biometricInfo, setBiometricInfo] = useState<BiometricAvailability | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isLocalRateModalOpen, setIsLocalRateModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isForgotPinMode, setIsForgotPinMode] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  // Generate initials for the automatic placeholder avatar
  const getInitials = (name: string): string => {
    if (!name) return 'AJ';
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AJ';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const customerId = `AJ-${(user.phone || '8001234567').replace(/\D/g, '').slice(-6) || '849204'}`;
  const userEmail = user.email || 'Email not linked';

  const isAdminUser = Boolean(
    user.role === 'admin' ||
    user.role === 'support_agent' ||
    user.role === 'finance_agent' ||
    user.email === 'bashirabubakar650@gmail.com' ||
    localStorage.getItem('jagora_admin_authenticated') === 'true'
  );

  const handleOpenRateUs = () => {
    if (onOpenRateUs) {
      onOpenRateUs();
    } else {
      setIsLocalRateModalOpen(true);
    }
  };
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Detect hardware biometric capabilities upon screen mount
  React.useEffect(() => {
    checkBiometricSupport().then((info) => {
      setBiometricInfo(info);
    });
  }, []);

  // Synchronize internal toggle state when user prop updates
  React.useEffect(() => {
    setBiometric(user.biometricEnabled);
  }, [user.biometricEnabled]);

  const handleToggleBiometric = async () => {
    playTapSound();
    triggerHaptic('light');
    setBiometricStatusMsg(null);

    // If currently enabled, user is turning it OFF
    if (biometric) {
      removeDeviceBiometrics();
      setBiometric(false);
      onUpdateUser({ biometricEnabled: false });
      setBiometricStatusMsg({
        type: 'info',
        text: 'Biometric authorization disabled. 4-digit PIN will be required for all transactions.',
      });
      setTimeout(() => setBiometricStatusMsg(null), 4500);
      return;
    }

    // User is turning it ON -> leverage browser Web Authentication API
    setIsEnrollingBiometrics(true);
    try {
      // Check if Web Authentication is available
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Web Authentication API is not supported on this browser. Please use Chrome, Safari, or Edge.');
      }

      const result = await registerDeviceBiometrics({
        phone: user.phone,
        name: user.name,
      });

      if (result.success) {
        setBiometric(true);
        onUpdateUser({ biometricEnabled: true });
        playSuccessChime();
        triggerHaptic('success');
        setBiometricStatusMsg({
          type: 'success',
          text: 'Biometrics enrolled successfully! You can now authenticate transactions and unlock sessions with your fingerprint or face.',
        });
      } else {
        playErrorTone();
        triggerHaptic('warning');
        setBiometricStatusMsg({
          type: 'error',
          text: result.error || 'Biometric enrollment could not be completed.',
        });
      }
    } catch (err: any) {
      playErrorTone();
      triggerHaptic('warning');
      setBiometricStatusMsg({
        type: 'error',
        text: err?.message || 'Biometric enrollment failed. Please verify your device screen lock settings.',
      });
    } finally {
      setIsEnrollingBiometrics(false);
      setTimeout(() => setBiometricStatusMsg(null), 6000);
    }
  };

  const handleOpenChangePin = (mode: 'change' | 'forgot' = 'change') => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setAccountPassword('');
    setIsForgotPinMode(mode === 'forgot');
    setPinError('');
    setPinSuccess('');
    setIsSubmittingPin(false);
    setIsChangePinOpen(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (isForgotPinMode) {
      if (!accountPassword) {
        setPinError('Please enter your account login password to verify your identity.');
        return;
      }
    } else if (currentPin && !/^\d{4}$/.test(currentPin)) {
      setPinError('Current PIN must be 4 numeric digits.');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setPinError('New PIN must be exactly 4 numeric digits (0-9).');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsSubmittingPin(true);
    try {
      if (isForgotPinMode) {
        const res = await apiResetPin({ password: accountPassword, new_pin: newPin });
        if (res.status === 'success' || (res as any).success) {
          onUpdateUser({ hasPin: true });
          setPinSuccess('Your transaction PIN has been successfully reset!');
          setTimeout(() => {
            setIsChangePinOpen(false);
            setIsForgotPinMode(false);
          }, 1200);
        } else {
          setPinError(res.message || 'Incorrect account password. Please try again.');
        }
      } else {
        const res = await apiChangePin({ old_pin: currentPin, new_pin: newPin });
        if (res.status === 'success' || (res as any).success) {
          onUpdateUser({ hasPin: true });
          setPinSuccess('Transaction PIN updated successfully!');
          setTimeout(() => {
            setIsChangePinOpen(false);
          }, 1200);
        } else {
          setPinError(res.message || 'Current PIN is incorrect. If you forgot it, click "Forgot PIN" below.');
        }
      }
    } catch (err: any) {
      setPinError(err?.message || 'Failed to update transaction PIN. Please try again.');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  return (
    <div id="screen-profile" className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
      {/* USER HEADER WITH AUTOMATIC PLACEHOLDER AVATAR */}
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="relative">
          {/* Automatic Placeholder Avatar with Brand Gradient & Initials */}
          <div
            id="profile-automatic-avatar"
            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#003da5] via-[#0047cc] to-[#0ea5e9] p-1 shadow-lg shadow-blue-700/25 flex items-center justify-center border-2 border-white/30 dark:border-slate-800"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#003bb3] to-[#0055e8] flex items-center justify-center relative overflow-hidden">
              {/* Subtle radial sheen */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)]" />
              <span className="relative z-10 font-heading text-2xl sm:text-3xl font-black text-white tracking-widest select-none">
                {getInitials(user.name)}
              </span>
            </div>
          </div>

          {/* Verification Badge */}
          {user.isVerified && (
            <div
              className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1.5 shadow-md border-2 border-white dark:border-slate-900"
              title="Identity & KYC Verified"
            >
              <CheckCircle2 size={15} className="stroke-[2.8]" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
            {user.name}
          </h2>
          <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">{user.phone}</p>
          <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <Lock size={11} className="text-slate-500 dark:text-slate-400" />
            <span>Verified Profile • Read-Only</span>
          </div>
        </div>
      </div>

      {/* 👑 EXECUTIVE ADMIN CONSOLE ACCESS (Only visible to verified Administrators) */}
      {isAdminUser && (
        <section className="p-4 rounded-2xl bg-gradient-to-r from-[#0038a8] via-[#0047cc] to-[#0a1128] text-white border border-blue-600/40 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-amber-300 border border-white/10 shrink-0">
              <Crown size={20} className="fill-amber-300 stroke-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 inline-block mb-0.5">
                Executive Portal
              </span>
              <h4 className="font-heading text-sm font-bold truncate text-white">
                VTU Admin Dashboard
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('admin');
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-mono text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Console</span>
            <ArrowRight size={13} />
          </button>
        </section>
      )}

      {/* READ-ONLY PROFILE DATA DOSSIER */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Lock size={12} className="text-slate-500 dark:text-slate-400" />
            <span>Profile Data (Read-Only)</span>
          </h3>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 size={11} className="stroke-[2.5]" />
            <span>Verified Record</span>
          </span>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-xs space-y-3.5 ${
            isLightMode ? 'bg-white border-slate-200/80' : 'bg-slate-800/90 border-slate-700'
          }`}
        >
          {/* Full Name */}
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Full Legal Name
              </span>
              <span className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                {user.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-800">
              <Lock size={11} />
              <span>Locked</span>
            </div>
          </div>

          {/* Username */}
          {user.username && (
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-700/60">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Username
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  @{user.username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(user.username || '', 'username')}
                className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                title="Copy username"
              >
                {copiedField === 'username' ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                <span>{copiedField === 'username' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Registered Phone */}
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Registered Phone Line
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                {user.phone}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(user.phone, 'phone')}
              className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              title="Copy phone number"
            >
              {copiedField === 'phone' ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
              <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Email Address */}
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-700/60">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Email Address
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                {userEmail}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(userEmail, 'email')}
              className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0"
              title="Copy email address"
            >
              {copiedField === 'email' ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
              <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Customer / Wallet ID */}
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Customer Reference ID
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                {customerId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(customerId, 'customerId')}
              className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              title="Copy customer ID"
            >
              {copiedField === 'customerId' ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
              <span>{copiedField === 'customerId' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Regulatory Immutable Notice */}
          <div className="pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                To protect against telecom identity fraud, profile information is permanent and read-only. For legal name or phone updates, please reach out via Help Center.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. ACCOUNT SETTINGS SECTION */}
      <section className="space-y-2">
        <h3 className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
          Account Settings
        </h3>
        <div
          className={`rounded-2xl overflow-hidden border divide-y shadow-xs ${
            isLightMode
              ? 'bg-white border-slate-100 divide-slate-100'
              : 'bg-slate-800/90 border-slate-700 divide-slate-700/60'
          }`}
        >
          {/* Personal Info */}
          <button
            onClick={() => setIsPersonalInfoOpen(true)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  Personal Information
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                  Verified name, phone & customer credentials (read-only)
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
          </button>

          {/* Refer & Earn (₦50 Commission) */}
          {!isReferralsHidden && (
            <button
              id="profile-referral-btn"
              onClick={() => {
                playTapSound();
                if (onNavigate) onNavigate('referrals');
              }}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                  <Gift size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Refer & Earn
                    </span>
                    <span className="px-1.5 py-0.2 rounded-xs bg-amber-400 text-blue-950 text-[9px] font-black uppercase">
                      ₦50 Bonus
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    {user.referralCode ? `Your Code: ${user.referralCode} • ` : ''}Earn cash commission on friend's 1st purchase
                  </span>
                </div>
              </div>
              <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
            </button>
          )}
        </div>
      </section>

      {/* 2. SECURITY SETTINGS */}
      <section className="space-y-2">
        <h3 className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
          Security & Access
        </h3>
        <div
          className={`rounded-2xl overflow-hidden border divide-y shadow-xs ${
            isLightMode
              ? 'bg-white border-slate-100 divide-slate-100'
              : 'bg-slate-800/90 border-slate-700 divide-slate-700/60'
          }`}
        >
          {/* Change PIN */}
          <button
            id="profile-change-pin-btn"
            onClick={() => handleOpenChangePin('change')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                <KeyRound size={18} />
              </div>
              <div>
                <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  Change Transaction PIN
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-mono font-medium">
                  Update your active 4-digit security PIN
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
          </button>

          {/* Reset Forgotten PIN */}
          <button
            id="profile-reset-pin-btn"
            onClick={() => handleOpenChangePin('forgot')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center border border-amber-200/50 dark:border-amber-900/50">
                <ShieldAlert size={18} />
              </div>
              <div>
                <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  Reset Forgotten PIN
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">
                  Forgot PIN? Reset with account password
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800">
                Reset
              </span>
              <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
            </div>
          </button>

          {/* Biometrics (WebAuthn Platform Authenticator) */}
          <div className="w-full p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Use Biometrics
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[9px] font-bold uppercase tracking-wider">
                      WebAuthn
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Authenticate transactions with fingerprint or facial recognition
                  </span>
                </div>
              </div>
              <button
                id="profile-biometrics-toggle-btn"
                type="button"
                onClick={handleToggleBiometric}
                disabled={isEnrollingBiometrics}
                aria-label="Toggle Biometric Authentication"
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer disabled:opacity-60 shrink-0 ${
                  biometric ? 'bg-[#0047cc]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center ${
                    biometric ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {isEnrollingBiometrics && (
                    <div className="w-2.5 h-2.5 border-2 border-[#0047cc] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </button>
            </div>

            {/* Live WebAuthn Status and Feedback Alerts */}
            {biometricStatusMsg && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200 ${
                  biometricStatusMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : biometricStatusMsg.type === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300'
                }`}
              >
                {biometricStatusMsg.type === 'success' ? (
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                )}
                <div className="leading-tight">{biometricStatusMsg.text}</div>
              </div>
            )}
          </div>

          {/* Dark Mode / Theme Toggle */}
          {onToggleTheme && (
            <div className="w-full flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                  {!isLightMode ? <Moon size={18} /> : <Sun size={18} className="text-amber-500" />}
                </div>
                <div>
                  <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    Dark Mode
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    {!isLightMode ? 'High-contrast dark theme enabled' : 'Clean daytime light theme'}
                  </span>
                </div>
              </div>
              <button
                id="profile-theme-toggle-btn"
                onClick={onToggleTheme}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  !isLightMode ? 'bg-[#0047cc]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !isLightMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. SUPPORT & LOGOUT */}
      <section className="space-y-2">
        <h3 className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
          Support & Legal
        </h3>
        <div
          className={`rounded-2xl overflow-hidden border divide-y shadow-xs ${
            isLightMode
              ? 'bg-white border-slate-100 divide-slate-100'
              : 'bg-slate-800/90 border-slate-700 divide-slate-700/60'
          }`}
        >
          <button
            onClick={onOpenHelp}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0047cc] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                <HelpCircle size={18} />
              </div>
              <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Help Center & WhatsApp Support
              </span>
            </div>
            <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
          </button>

          <button
            id="profile-rate-us-btn"
            onClick={handleOpenRateUs}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/70 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-900/60">
                <Star size={18} className="fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  Rate Us & Feedback
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Leave a star rating & share suggestions
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span>Rate</span>
              </span>
              <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
            </div>
          </button>

          <button
            id="profile-legal-btn"
            onClick={() => onNavigate && onNavigate('terms')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0047cc] dark:bg-blue-950/70 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60">
                <FileText size={18} />
              </div>
              <div>
                <span className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  Terms of Service & Privacy Policy
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Legal agreements, NDPA 2023 & CAC compliance
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="text-slate-500 dark:text-slate-400" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                <LogOut size={18} />
              </div>
              <span className="font-heading text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                Sign Out
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* READ-ONLY PERSONAL INFORMATION MODAL */}
      {isPersonalInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Personal Information
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Lock size={9} />
                    <span>Verified & Locked Record</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPersonalInfoOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Name</span>
                  <span className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{user.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  <CheckCircle2 size={10} />
                  <span>Matched</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Line</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{user.phone}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(user.phone, 'modal-phone')}
                  className="text-[11px] font-mono text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded cursor-pointer font-bold"
                >
                  {copiedField === 'modal-phone' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">{userEmail}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(userEmail, 'modal-email')}
                  className="text-[11px] font-mono text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded cursor-pointer font-bold shrink-0"
                >
                  {copiedField === 'modal-email' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer ID</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{customerId}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(customerId, 'modal-id')}
                  className="text-[11px] font-mono text-[#0047cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded cursor-pointer font-bold"
                >
                  {copiedField === 'modal-id' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Lock size={13} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="leading-relaxed">
                  Profile records cannot be edited directly. To request corrections to your legal name or phone, contact Customer Support with regulatory documents.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPersonalInfoOpen(false)}
              className="w-full bg-[#0047cc] hover:bg-[#003bb3] text-white py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* General Detail Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Account Detail</h4>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{activeModal}</p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-[#0047cc] hover:bg-[#003bb3] text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Change / Reset Transaction PIN Dialog */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    {isForgotPinMode ? 'Reset Forgotten PIN' : 'Change Transaction PIN'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isForgotPinMode ? 'Verify with your account password' : '4-digit authorization security PIN'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangePinOpen(false);
                  setIsForgotPinMode(false);
                }}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5">
              {isForgotPinMode ? (
                /* Forgot PIN Mode: Verify identity with Account Login Password */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account Login Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPinMode(false);
                        setPinError('');
                      }}
                      className="text-[11px] font-semibold text-[#0047cc] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      I remember my PIN
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder="Enter your login password"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Confirms you are the verified owner of this account.
                  </p>
                </div>
              ) : (
                /* Standard Mode: Change PIN using Current PIN */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Current PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPinMode(true);
                        setPinError('');
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Forgot PIN?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter current 4-digit PIN"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 4 digits"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Confirm New PIN
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter new 4 digits"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#0047cc]"
                  required
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900/40 animate-in fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900/40 animate-in fade-in">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinOpen(false);
                    setIsForgotPinMode(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPin}
                  className="flex-1 bg-[#0047cc] hover:bg-[#003eb8] active:scale-[0.99] text-white py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmittingPin ? (
                    <span>Processing...</span>
                  ) : (
                    <span>{isForgotPinMode ? 'Reset PIN' : 'Update PIN'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Us & Feedback Modal */}
      <RateUsModal
        isOpen={isLocalRateModalOpen}
        onClose={() => setIsLocalRateModalOpen(false)}
        user={user}
        isLightMode={isLightMode}
      />
    </div>
  );
};

