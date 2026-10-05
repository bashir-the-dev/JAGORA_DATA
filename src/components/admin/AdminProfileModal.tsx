import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown,
  Headphones,
  DollarSign,
  Shield
} from 'lucide-react';
import { apiUpdateAdminProfile, setAuthToken } from '../../services/apiClient';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminProfile?: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    role?: string;
    adminRole?: 'super_admin' | 'support_agent' | 'finance_agent';
  };
  onProfileUpdated: (updatedUser: any) => void;
  showToast: (msg: string) => void;
  isLightMode?: boolean;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  adminProfile,
  onProfileUpdated,
  showToast,
  isLightMode,
}) => {
  if (!isOpen) return null;

  const currentRole = adminProfile?.adminRole || 'super_admin';
  const isCEO = currentRole === 'super_admin';

  // Form State
  const [name, setName] = useState(adminProfile?.name || 'Bashir Abubakar');
  const [username, setUsername] = useState((adminProfile as any)?.username || 'bashir');
  const [email, setEmail] = useState(adminProfile?.email || 'bashirabubakar650@gmail.com');
  const [phone, setPhone] = useState(adminProfile?.phone || '08123456789');

  // Security Credentials (Password)
  const [enablePasswordChange, setEnablePasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security Credentials (PIN)
  const [enablePinChange, setEnablePinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    // Password validation
    if (enablePasswordChange) {
      if (!currentPassword) {
        setErrorMessage('Current password is required to change your password.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }
    }

    // PIN validation
    if (enablePinChange) {
      if (!currentPin) {
        setErrorMessage('Current 4-digit PIN is required to change your PIN.');
        return;
      }
      if (!newPin || newPin.replace(/[^0-9]/g, '').length !== 4) {
        setErrorMessage('New PIN must be exactly 4 numeric digits.');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMessage('New PINs do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        phone: phone.trim(),
      };

      if (enablePasswordChange) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      if (enablePinChange) {
        payload.currentPin = currentPin;
        payload.newPin = newPin;
      }

      const res = await apiUpdateAdminProfile(payload);

      setIsLoading(false);

      if (res.status === 'success' && res.data?.user) {
        const freshToken = res.data?.token || (res as any).token;
        if (freshToken) {
          setAuthToken(freshToken);
        }
        onProfileUpdated(res.data.user);
        showToast('Your administrator details and security credentials have been updated.');
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to update administrator profile.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'A network error occurred while updating profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-xl my-8 rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${
          isLightMode ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-800/40 border-slate-800'
        }`}>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isCEO
                  ? 'bg-gradient-to-tr from-[#0047cc] to-blue-600 text-white'
                  : currentRole === 'support_agent'
                  ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white'
              }`}
            >
              {isCEO ? (
                <Crown size={24} className="text-amber-300" />
              ) : currentRole === 'support_agent' ? (
                <Headphones size={22} />
              ) : (
                <DollarSign size={22} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base sm:text-lg font-black tracking-tight">
                  Edit Admin Profile
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase border ${
                    isCEO
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                      : currentRole === 'support_agent'
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                  }`}
                >
                  {isCEO ? 'CEO (Master Admin)' : currentRole === 'support_agent' ? 'Support Agent' : 'Finance Agent'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your administrator identity, 2FA OTP recipient email, password, and security PIN.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Personal Contact Info */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User size={13} className="text-[#0047cc]" />
              <span>Personal Identification</span>
            </h4>

            <div className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bashir Abubakar"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 focus:border-[#0047cc] focus:bg-white text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:bg-slate-900 text-slate-100'
                    }`}
                  />
                </div>
              </div>

              {/* Admin Username / Login ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Admin Username / Login ID
                  </label>
                  <span className="text-[10px] text-blue-500 font-bold">Direct Console Login</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="e.g. bashir"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 focus:border-[#0047cc] focus:bg-white text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:bg-slate-900 text-slate-100'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  You can use this username, your email, or your phone number to sign into the administrative console.
                </p>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Admin Email Address
                  </label>
                  <span className="text-[10px] text-amber-500 font-bold">Used for 2FA OTPs</span>
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@jagora.ng"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 focus:border-[#0047cc] focus:bg-white text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:bg-slate-900 text-slate-100'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  6-digit login verification codes and critical platform security alerts will be sent here.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Nigerian Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 focus:border-[#0047cc] focus:bg-white text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:bg-slate-900 text-slate-100'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

          {/* Section 2: Change Password Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock size={13} className="text-[#0047cc]" />
                <span>Password Settings</span>
              </h4>
              <button
                type="button"
                onClick={() => setEnablePasswordChange(!enablePasswordChange)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  enablePasswordChange
                    ? 'bg-blue-500/10 text-[#0047cc] border-blue-500/30'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {enablePasswordChange ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>

            {enablePasswordChange && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLightMode ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'
              }`}>
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to authorize"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-none ${
                      isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      New Password (Min 6 chars)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-none ${
                        isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-none ${
                        isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

          {/* Section 3: Change 4-Digit PIN Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <KeyRound size={13} className="text-[#0047cc]" />
                <span>Security PIN Settings</span>
              </h4>
              <button
                type="button"
                onClick={() => setEnablePinChange(!enablePinChange)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  enablePinChange
                    ? 'bg-blue-500/10 text-[#0047cc] border-blue-500/30'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {enablePinChange ? 'Cancel PIN Change' : 'Change 4-Digit PIN'}
              </button>
            </div>

            {enablePinChange && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLightMode ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'
              }`}>
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Current 4-Digit Security PIN
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter current 4-digit PIN"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-widest border outline-none ${
                      isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      New 4-Digit PIN
                    </label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 7788"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-widest border outline-none ${
                        isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Confirm New 4-Digit PIN
                    </label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Repeat 4 digits"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-widest border outline-none ${
                        isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPin ? 'Hide PINs' : 'Show PINs'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                isLightMode
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-[#0047cc] hover:bg-blue-700 active:scale-98 transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Updating Records...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
