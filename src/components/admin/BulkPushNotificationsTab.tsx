import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Bell,
  Send,
  Users,
  Sparkles,
  Gift,
  Wallet,
  ShieldAlert,
  Wifi,
  Clock,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Smartphone,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import {
  sendAdminBroadcastNotification,
  loadAdminBroadcastHistory,
  deleteAdminBroadcastNotification,
  subscribeToPlatformSettings,
  updatePlatformSettingsInDb,
  removeAnnouncementFromDb,
} from '../../services/dbService';
import { NotificationItem } from '../../types';

interface BulkPushNotificationsTabProps {
  isLightMode?: boolean;
  showToast: (msg: string) => void;
}

export const BulkPushNotificationsTab: React.FC<BulkPushNotificationsTabProps> = ({
  isLightMode,
  showToast,
}) => {
  // Broadcast Compose State - Persisted to prevent any unexpected auto-deletion
  const [notifTitle, setNotifTitle] = useState(() => {
    try {
      return sessionStorage.getItem('ajd_draft_push_title') || '';
    } catch {
      return '';
    }
  });
  const [notifMessage, setNotifMessage] = useState(() => {
    try {
      return sessionStorage.getItem('ajd_draft_push_msg') || '';
    } catch {
      return '';
    }
  });
  const [notifType, setNotifType] = useState<NotificationItem['type']>('system');
  const [targetAudience, setTargetAudience] = useState<'all' | 'kyc_verified' | 'agents' | 'active_users'>('all');
  const [enableSound, setEnableSound] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Broadcast History State
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Announcement Banner Quick Controls
  const [showBannerControls, setShowBannerControls] = useState(false);
  const [announcementText, setAnnouncementText] = useState(() => {
    try {
      return sessionStorage.getItem('ajd_draft_ticker_text') || '';
    } catch {
      return '';
    }
  });
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'urgent'>('warning');
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Keep draft in sessionStorage to protect against unmounts or tab switches
  const handleTitleChange = (val: string) => {
    setNotifTitle(val);
    try {
      sessionStorage.setItem('ajd_draft_push_title', val);
    } catch {}
  };

  const handleMessageChange = (val: string) => {
    setNotifMessage(val);
    try {
      sessionStorage.setItem('ajd_draft_push_msg', val);
    } catch {}
  };

  const handleAnnouncementChange = (val: string) => {
    isEditingAnnouncementRef.current = true;
    setAnnouncementText(val);
    try {
      sessionStorage.setItem('ajd_draft_ticker_text', val);
    } catch {}
  };

  // Fetch History
  const fetchBroadcastHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await loadAdminBroadcastHistory();
      setBroadcastHistory(Array.isArray(history) ? history : []);
    } catch {
      // Fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBroadcastHistory();
  }, [historyRefreshKey]);

  // Refs to prevent any background subscription from wiping user text input
  const isEditingAnnouncementRef = React.useRef(false);
  const hasInitializedAnnouncementRef = React.useRef(false);

  // Subscribe to platform announcement settings without wiping admin input
  useEffect(() => {
    const unsub = subscribeToPlatformSettings((settings) => {
      if (settings?.broadcastAnnouncement) {
        setIsAnnouncementActive(Boolean(settings.broadcastAnnouncement.active));
        setAnnouncementType(settings.broadcastAnnouncement.type || 'info');
        // Protect user typing: Never overwrite if admin has focused, edited, or modified the field
        if (!isEditingAnnouncementRef.current && !hasInitializedAnnouncementRef.current) {
          const remoteText = settings.broadcastAnnouncement.text || '';
          // Only populate if local draft is completely empty
          if (!announcementText.trim() && remoteText) {
            setAnnouncementText(remoteText);
          }
          hasInitializedAnnouncementRef.current = true;
        }
      }
    });
    return () => unsub();
  }, []);

  // Quick 1-Click Templates
  const NOTIF_TEMPLATES = [
    {
      label: '🎉 Weekend Promo',
      title: '🚀 Weekend Price Splash: MTN & Airtel Data at ₦260/GB!',
      message: 'Unbeatable rates on all SME and Corporate Gifting bundles this weekend only. Recharge now before allocation expires!',
      type: 'promo' as const,
      target: 'all' as const,
    },
    {
      label: '⚡ Gateways 100% Up',
      title: '⚡ System Gateways All Online & Instant',
      message: 'All telecommunication networks (MTN, Airtel, Glo, 9mobile) and Electricity Discos are running at 100% optimum speed with instant zero-delay delivery.',
      type: 'system' as const,
      target: 'all' as const,
    },
    {
      label: '🎁 Cashback Credited',
      title: '🎁 Cashback & Referral Bonus Credited to Wallets',
      message: 'Monthly automated cashback rewards have been settled to eligible agent accounts. Check your transaction history and wallet float.',
      type: 'wallet' as const,
      target: 'all' as const,
    },
    {
      label: '⚠️ Security Alert',
      title: '🛡️ Security Advisory: Never Share Your Transaction PIN',
      message: 'Al\'amin AJDATASUB staff will NEVER ask for your transaction PIN, password, or OTP. Protect your funds and enable biometrics in security settings.',
      type: 'security' as const,
      target: 'all' as const,
    },
    {
      label: '📶 5G Plans Added',
      title: '📶 High-Speed 5G SME Data Bundles Now Active',
      message: 'Browse and stream with zero buffering! New ultra-fast 5G data bundles are now available across all carriers with 30-day validity.',
      type: 'data' as const,
      target: 'all' as const,
    },
  ];

  const handleApplyTemplate = (tpl: typeof NOTIF_TEMPLATES[0]) => {
    setNotifTitle(tpl.title);
    setNotifMessage(tpl.message);
    setNotifType(tpl.type);
    setTargetAudience(tpl.target);
    showToast(`Template "${tpl.label}" loaded into push composer.`);
  };

  const handleSendBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim()) {
      showToast('⚠️ Please enter a notification title / headline.');
      return;
    }
    if (!notifMessage.trim()) {
      showToast('⚠️ Please enter the notification body message.');
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await sendAdminBroadcastNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        target: targetAudience,
      });

      if (res && res.success !== false) {
        showToast(`🎉 ${res.message || 'Bulk push notification dispatched to all users successfully!'}`);
        handleTitleChange('');
        handleMessageChange('');
        try {
          sessionStorage.removeItem('ajd_draft_push_title');
          sessionStorage.removeItem('ajd_draft_push_msg');
        } catch {}
        setHistoryRefreshKey((prev) => prev + 1);
      } else {
        showToast(`❌ ${res?.message || 'Failed to dispatch broadcast notification.'}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err.message || 'Network error while broadcasting'}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    const ok = await deleteAdminBroadcastNotification(id);
    if (ok) {
      showToast('🗑️ Broadcast notification removed from database.');
      setHistoryRefreshKey((prev) => prev + 1);
    } else {
      showToast('❌ Failed to delete notification.');
    }
  };

  const handleSaveBanner = async () => {
    if (!announcementText.trim()) {
      showToast('⚠️ Please enter announcement text.');
      return;
    }
    setIsSavingBanner(true);
    try {
      await updatePlatformSettingsInDb({
        broadcastAnnouncement: {
          text: announcementText.trim(),
          active: true,
          type: announcementType,
        },
      });
      setIsAnnouncementActive(true);
      showToast('✅ Live announcement banner updated and visible on user dashboards.');
    } catch (err: any) {
      showToast(`❌ Failed to update banner: ${err.message}`);
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      await removeAnnouncementFromDb();
      setIsAnnouncementActive(false);
      setAnnouncementText('');
      showToast('Take down successful. Banner removed.');
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div id="admin-bulk-push-notifications-tab" className="space-y-6 pb-20">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0047cc]/10 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-900/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0047cc] text-white flex items-center justify-center shrink-0 shadow-md">
              <Megaphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bulk Push Notifications
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#0047cc] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Radio size={12} className="animate-pulse text-emerald-500" />
                  Live Broadcast
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Send customized instant push notifications directly into every user&apos;s device notifications drawer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowBannerControls((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sliders size={14} />
            <span>{showBannerControls ? 'Hide Ticker Controls' : 'Ticker Banner Settings'}</span>
          </button>
        </div>
      </div>

      {/* OPTIONAL TOGGLEABLE: Dashboard Ticker Banner Controls */}
      {showBannerControls && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Dashboard Ticker Announcement Banner
              </h3>
            </div>
            {isAnnouncementActive && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ● Visible on User Dashboards
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Banner Style:
              </label>
              {(['info', 'warning', 'urgent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAnnouncementType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    announcementType === type
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={announcementText}
              onFocus={() => {
                isEditingAnnouncementRef.current = true;
              }}
              onChange={(e) => handleAnnouncementChange(e.target.value)}
              placeholder="E.g., Notice: MTN SME Data server maintenance scheduled from 1:00 AM - 2:00 AM..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc]"
            />

            <div className="flex items-center justify-end gap-2">
              {isAnnouncementActive && (
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Take Down Banner
                </button>
              )}
              <button
                type="button"
                disabled={isSavingBanner}
                onClick={handleSaveBanner}
                className="px-4 py-2 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSavingBanner ? 'Publishing...' : 'Update & Publish Ticker'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BROADCAST COMPOSER & PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Broadcast Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] flex items-center justify-center font-bold">
                  <Bell size={16} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Compose Broadcast Push
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                Endpoint: /api/admin/notifications/broadcast
              </span>
            </div>

            {/* Quick 1-Click Templates */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase font-mono text-slate-600 dark:text-slate-400">
                  ⚡ 1-Click Fast Templates:
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Click to fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NOTIF_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendBroadcastNotification} className="space-y-4 pt-1">
              {/* Target Audience Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
                  Target Recipient Group
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all' as const, label: 'All Users (100%)', desc: 'Every registered account' },
                    { id: 'kyc_verified' as const, label: 'KYC Verified', desc: 'Tier 1 & 2 accounts' },
                    { id: 'agents' as const, label: 'Top Agents', desc: 'Wholesale resellers' },
                    { id: 'active_users' as const, label: 'Active Users', desc: 'Transacted in 7 days' },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        targetAudience === aud.id
                          ? 'border-[#0047cc] bg-blue-50/70 text-[#0047cc] dark:bg-blue-950/70 dark:border-blue-600 dark:text-blue-300 ring-1 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">{aud.label}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-500 truncate mt-0.5">{aud.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Category & Icon */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
                  Category &amp; Accent
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { type: 'system' as const, label: 'System Alert', icon: Sparkles, color: 'text-[#0047cc]' },
                    { type: 'promo' as const, label: 'Promotions', icon: Gift, color: 'text-amber-600' },
                    { type: 'wallet' as const, label: 'Wallet Bonus', icon: Wallet, color: 'text-emerald-600' },
                    { type: 'security' as const, label: 'Security Alert', icon: ShieldAlert, color: 'text-rose-600' },
                    { type: 'data' as const, label: 'Telecom / Data', icon: Wifi, color: 'text-blue-600' },
                  ].map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = notifType === cat.type;
                    return (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => setNotifType(cat.type)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#0047cc] bg-blue-50/70 text-[#0047cc] dark:bg-blue-950/60 dark:border-blue-600 dark:text-blue-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <IconComp size={14} className={cat.color} />
                        <span className="text-[11px] truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Title / Headline */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
                    Headline / Title *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {notifTitle.length}/80
                  </span>
                </div>
                <input
                  id="bulk-notif-title-input"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="E.g., 🚀 Flash Weekend Promo: MTN 1GB @ ₦260!"
                  value={notifTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc]"
                />
              </div>

              {/* Notification Message Body */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
                    Notification Message Body *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {notifMessage.length} characters
                  </span>
                </div>
                <textarea
                  id="bulk-notif-message-input"
                  required
                  rows={3}
                  placeholder="Enter full notification message content that users will read in their notifications drawer..."
                  value={notifMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc] leading-relaxed"
                />
              </div>

              {/* Preferences Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Audio Chime &amp; Haptic Vibration on Delivery
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableSound((prev) => !prev)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    enableSound ? 'bg-[#0047cc]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      enableSound ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Users size={13} className="text-blue-500" />
                  <span>Target: {targetAudience === 'all' ? '100% of All Registered Users' : targetAudience}</span>
                </div>

                <button
                  id="bulk-push-send-btn"
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isBroadcasting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Broadcasting to Users...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Dispatch Bulk Push Notification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Live User Device Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-[#0047cc] dark:text-blue-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                  Live Device Push Preview
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> Real-Time Sync
              </span>
            </div>

            {/* Mobile Phone Mockup Frame */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 space-y-3">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <Wifi size={10} />
                  <span>4G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Lockscreen / Heads-up Notification Card */}
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/80 shadow-md space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-[#0047cc] flex items-center justify-center p-0.5">
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-slate-200">Al&apos;amin AJDATASUB</span>
                  </div>
                  <span className="text-[10px]">Just now</span>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-white leading-snug">
                    {notifTitle || '🚀 Weekend Price Splash: 1GB at ₦260!'}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    {notifMessage || 'Unbeatable rates on all SME and Corporate Gifting bundles this weekend only. Tap to open and top up!'}
                  </p>
                </div>
              </div>

              {/* In-App NotificationsScreen Item View */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Inside User NotificationsScreen:
                </span>

                <div
                  className={`relative flex gap-3 p-3 rounded-xl overflow-hidden border shadow-xs ${
                    isLightMode ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-slate-100 border-slate-800'
                  }`}
                >
                  {/* Left Accent Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0047cc]" />

                  {/* Icon */}
                  <div
                    className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${
                      notifType === 'wallet'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                        : notifType === 'security'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                        : notifType === 'promo'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-[#0047cc]'
                    }`}
                  >
                    {notifType === 'wallet' && <Wallet size={16} />}
                    {notifType === 'security' && <ShieldAlert size={16} />}
                    {notifType === 'promo' && <Gift size={16} />}
                    {notifType === 'data' && <Wifi size={16} />}
                    {notifType === 'system' && <Sparkles size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold truncate">
                        {notifTitle || 'Headline Preview'}
                      </span>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">Just now</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {notifMessage || 'Notification message body preview inside the user drawer.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info size={13} />
                <span>Instant Delivery Guarantee:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Dispatched messages immediately update the recipient&apos;s notification badge icon and appear across mobile web and Android app clients.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BROADCAST DELIVERY HISTORY & LOGS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-slate-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Dispatched Broadcast Notifications History ({broadcastHistory.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Audited history of push campaigns delivered across the platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchBroadcastHistory}
            disabled={isLoadingHistory}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw size={13} className={isLoadingHistory ? 'animate-spin' : ''} />
            <span>Refresh History Log</span>
          </button>
        </div>

        {broadcastHistory.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Megaphone size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No broadcast notifications sent yet.
            </p>
            <p className="text-[11px] text-slate-500">
              Use the composer above to deliver your first mass push notification to your user community.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {broadcastHistory.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                      item.type === 'wallet'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : item.type === 'security'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                        : item.type === 'promo'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                    }`}
                  >
                    {item.type || 'system'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {item.time || (item.created_at ? new Date(item.created_at).toLocaleDateString() : '')}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate mt-0.5">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Delivered to {item.totalUsers || item.recipients_count || 'All'} users
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteBroadcast(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Delete broadcast notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
