import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  AlertOctagon,
  Check,
  ShieldAlert,
  Building2,
  Save,
  Send,
  ToggleLeft,
  ToggleRight,
  Info,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Headphones,
  Bell,
  Sparkles,
  Gift,
  Wallet,
  Wifi,
  Users,
  Clock,
} from 'lucide-react';
import {
  updatePlatformSettingsInDb,
  subscribeToPlatformSettings,
  removeAnnouncementFromDb,
  sendAdminBroadcastNotification,
  loadAdminBroadcastHistory,
  deleteAdminBroadcastNotification,
} from '../../services/dbService';
import { NotificationItem } from '../../types';

interface PlatformSettingsTabProps {
  isLightMode?: boolean;
  showToast: (msg: string) => void;
  onResetStatistics?: (resetBalances: boolean) => Promise<void>;
}

export const PlatformSettingsTab: React.FC<PlatformSettingsTabProps> = ({ isLightMode, showToast, onResetStatistics }) => {
  // Fresh Start / Reset Stats Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetBalancesOption, setResetBalancesOption] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleExecuteReset = async () => {
    if (!onResetStatistics) return;
    setIsResetting(true);
    try {
      await onResetStatistics(resetBalancesOption);
      setIsResetModalOpen(false);
    } catch {
      // Handled by parent toast
    } finally {
      setIsResetting(false);
    }
  };
  // Broadcast Announcement State
  const [announcementText, setAnnouncementText] = useState('');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'urgent'>('warning');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Customized Broadcast Notification to All Users State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationItem['type']>('system');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const fetchBroadcastHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await loadAdminBroadcastHistory();
      setBroadcastHistory(history);
    } catch {
      // Fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBroadcastHistory();
  }, [historyRefreshKey]);

  // Live Support Contacts State
  const [supportPhone, setSupportPhone] = useState('+234 814 838 8844');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+234 814 838 8844');
  const [supportEmail, setSupportEmail] = useState('support@alaminjagora.ng');
  const [supportGroup, setSupportGroup] = useState('https://chat.whatsapp.com/JagoraOfficialGroup');
  const [isSavingContacts, setIsSavingContacts] = useState(false);

  // Maintenance Mode
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Virtual Automated Accounts info
  const [virtualAccounts, setVirtualAccounts] = useState({
    wemaEnabled: true,
    monnifyApiKey: 'MNFY_LIVE_9029••••••••••••4122',
    payvesselKey: 'PV_SEC_7891••••••••••••3310',
    minFundingAmount: 100,
    stampDutyThreshold: 10000,
  });

  useEffect(() => {
    const unsub = subscribeToPlatformSettings((settings) => {
      if (settings.broadcastAnnouncement) {
        const b = settings.broadcastAnnouncement;
        setAnnouncementText(b.text || '');
        setIsAnnouncementActive(Boolean(b.active && b.text?.trim()));
        setAnnouncementType(b.type || 'info');
      } else {
        setAnnouncementText('');
        setIsAnnouncementActive(false);
      }
      setIsMaintenanceMode(!!settings.maintenanceMode);

      if (settings.supportContacts) {
        if (settings.supportContacts.phone) setSupportPhone(settings.supportContacts.phone);
        if (settings.supportContacts.whatsapp) setSupportWhatsapp(settings.supportContacts.whatsapp);
        if (settings.supportContacts.email) setSupportEmail(settings.supportContacts.email);
        if (settings.supportContacts.whatsappGroup) setSupportGroup(settings.supportContacts.whatsappGroup);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveAnnouncement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!announcementText.trim()) {
      showToast('⚠️ Please enter announcement text before publishing, or click Remove.');
      return;
    }

    setIsSaving(true);
    const success = await updatePlatformSettingsInDb({
      broadcastAnnouncement: {
        text: announcementText.trim(),
        active: true,
        type: announcementType,
      },
    });
    setIsSaving(false);

    if (success) {
      setIsAnnouncementActive(true);
      showToast('✅ Announcement published live to all user dashboards.');
    } else {
      showToast('❌ Failed to publish announcement. Check network connection.');
    }
  };

  const handleToggleAnnouncementActive = async () => {
    const nextState = !isAnnouncementActive;
    if (nextState && !announcementText.trim()) {
      showToast('⚠️ Enter announcement text before publishing.');
      return;
    }

    setIsAnnouncementActive(nextState);
    const success = await updatePlatformSettingsInDb({
      broadcastAnnouncement: {
        text: announcementText.trim(),
        active: nextState,
        type: announcementType,
      },
    });

    if (success) {
      showToast(nextState ? '✅ Announcement is now LIVE on user dashboards.' : '🔒 Announcement is now HIDDEN from user dashboards.');
    } else {
      showToast('❌ Failed to update status in database.');
    }
  };

  const handleRemoveAnnouncement = async () => {
    setIsRemoving(true);
    const success = await removeAnnouncementFromDb();
    setIsRemoving(false);

    if (success) {
      setIsAnnouncementActive(false);
      setAnnouncementText('');
      showToast('🗑️ Announcement removed completely from all user dashboards.');
    } else {
      showToast('❌ Failed to remove announcement from database.');
    }
  };

  const handleToggleMaintenance = async () => {
    const next = !isMaintenanceMode;
    setIsMaintenanceMode(next);
    await updatePlatformSettingsInDb({
      maintenanceMode: next,
    });
    if (next) {
      showToast('⚠️ Platform Maintenance Mode ACTIVATED. User orders paused.');
    } else {
      showToast('✅ Platform Maintenance Mode DEACTIVATED. System operational.');
    }
  };

  const handleSaveSupportContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContacts(true);
    const success = await updatePlatformSettingsInDb({
      supportContacts: {
        phone: supportPhone.trim(),
        whatsapp: supportWhatsapp.trim(),
        email: supportEmail.trim(),
        whatsappGroup: supportGroup.trim(),
      },
    });
    setIsSavingContacts(false);
    if (success) {
      showToast('✅ Customer support contacts updated live across the mobile app.');
    } else {
      showToast('❌ Failed to update support contacts. Check network connection.');
    }
  };

  const NOTIF_TEMPLATES = [
    {
      label: 'Weekend Promo',
      title: 'Weekend SME Data Price Slash! 🚀',
      message: 'All MTN & Airtel SME and Corporate Gifting bundles are discounted this weekend! Get 1GB for only ₦270.',
      type: 'promo' as const,
    },
    {
      label: 'Instant Funding',
      title: 'Automated Instant Wallet Funding Active ⚡',
      message: 'Your dedicated virtual bank accounts (Wema & PalmPay) now credit your wallet in under 10 seconds 24/7!',
      type: 'wallet' as const,
    },
    {
      label: 'Node Upgrade',
      title: 'System Telco Node Upgrade Completed 🌐',
      message: 'Our upstream VTU gateways have been successfully upgraded. Instant data and airtime delivery is active on all networks.',
      type: 'system' as const,
    },
    {
      label: 'Security Alert',
      title: 'Security Advisory: Never Share Your PIN 🛡️',
      message: 'Please remember: Al\'amin Jagora staff will NEVER call or text asking for your 4-digit transaction PIN or password.',
      type: 'security' as const,
    },
    {
      label: '5G Data',
      title: 'New High-Speed 5G Data Plans Added 📶',
      message: 'Enjoy new GLO and 9mobile corporate data plans with 30-day validity at unbeatable wholesale rates.',
      type: 'data' as const,
    },
  ];

  const handleApplyTemplate = (tpl: typeof NOTIF_TEMPLATES[0]) => {
    setNotifTitle(tpl.title);
    setNotifMessage(tpl.message);
    setNotifType(tpl.type);
    showToast(`Template "${tpl.label}" loaded into composer.`);
  };

  const handleSendBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim()) {
      showToast('⚠️ Please enter a notification title.');
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
      });

      if (res.success) {
        showToast(`🎉 ${res.message || 'Custom notification successfully delivered to all users!'}`);
        setNotifTitle('');
        setNotifMessage('');
        setHistoryRefreshKey((prev) => prev + 1);
      } else {
        showToast(`❌ ${res.message || 'Failed to dispatch notification.'}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err.message || 'Network error'}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    const ok = await deleteAdminBroadcastNotification(id);
    if (ok) {
      showToast('🗑️ Notification deleted successfully.');
      setHistoryRefreshKey((prev) => prev + 1);
    } else {
      showToast('❌ Failed to delete notification.');
    }
  };

  return (
    <div id="admin-platform-settings-tab" className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone size={20} className="text-[#0047cc] dark:text-blue-400" />
          <span>Platform Broadcast & System Controls</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
          Broadcast alerts to user dashboards, manage maintenance mode & gateway virtual funding
        </p>
      </div>

      {/* Emergency Maintenance Mode Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
          isMaintenanceMode
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isMaintenanceMode
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <AlertOctagon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Platform Maintenance Mode
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  isMaintenanceMode
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isMaintenanceMode ? 'Active / Halted' : 'Normal / Running'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Freezes new user transactions and displays a maintenance notice. Used when switching primary API keys.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleMaintenance}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer ${
            isMaintenanceMode
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {isMaintenanceMode ? 'Resume Platform Traffic' : 'Activate Maintenance Mode'}
        </button>
      </div>

      {/* In-App Broadcast Notice Composer */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Megaphone size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  In-App Dashboard Broadcast Banner
                </h3>
                {isAnnouncementActive && announcementText.trim() ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Hidden / Removed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pushes instant banners to all user dashboards via direct custom backend sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-toggle-announcement-btn"
              onClick={handleToggleAnnouncementActive}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isAnnouncementActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isAnnouncementActive ? (
                <>
                  <Eye size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Banner: Published</span>
                </>
              ) : (
                <>
                  <EyeOff size={14} />
                  <span>Banner: Hidden</span>
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveAnnouncement} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
                Notice Text (Visible to all users on Home Dashboard)
              </label>
              {announcementText.trim() && (
                <button
                  type="button"
                  onClick={() => setAnnouncementText('')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Clear text</span>
                </button>
              )}
            </div>
            <textarea
              id="admin-announcement-textarea"
              rows={3}
              placeholder="E.g., ⚠️ Telco Advisory: MTN SME network node is undergoing maintenance. Delivery may take 2-4 minutes..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc] leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Severity:</span>
              {(['info', 'warning', 'urgent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAnnouncementType(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    announcementType === type
                      ? type === 'urgent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : type === 'warning'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* REMOVE ANNOUNCEMENT BUTTON */}
              <button
                type="button"
                id="admin-remove-announcement-btn"
                onClick={handleRemoveAnnouncement}
                disabled={isRemoving}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                title="Completely remove announcement from all user dashboards"
              >
                <Trash2 size={14} className="text-rose-600 dark:text-rose-400" />
                <span>{isRemoving ? 'Removing...' : 'Remove Announcement'}</span>
              </button>

              {/* SAVE & PUBLISH / UPDATE BUTTON */}
              <button
                type="submit"
                id="admin-publish-announcement-btn"
                disabled={isSaving}
                className="px-4 py-2 bg-[#0047cc] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Update & Publish'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Preview of the Notice */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              User Dashboard Live Preview:
            </span>
            {isAnnouncementActive && announcementText.trim() && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ● Currently visible to all active users
              </span>
            )}
          </div>

          {isAnnouncementActive && announcementText.trim() ? (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-start justify-between gap-3 shadow-xs ${
                announcementType === 'urgent'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                  : announcementType === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1">
                <Megaphone size={16} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{announcementText}</p>
              </div>

              <button
                type="button"
                onClick={handleRemoveAnnouncement}
                className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Remove now"
              >
                Take Down
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                📢 No announcement is active.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500">
                User dashboards are clean without this banner. To display one, enter text above and click &quot;Update &amp; Publish&quot;.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ENTERPRISE BROADCAST NOTIFICATION TO ALL USERS' NOTIFICATION PANEL     */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Send Customized Notification to All Users
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0047cc] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Users size={11} />
                  All User Panels
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instantly delivers customized in-app notification alerts directly into every user&apos;s notification drawer with badge updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Recipient Target: 100% of User Accounts
            </span>
          </div>
        </div>

        {/* 1-Click Fast Templates */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
            ⚡ Quick Compose Templates (Click to Auto-Fill):
          </label>
          <div className="flex flex-wrap gap-2">
            {NOTIF_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendBroadcastNotification} className="space-y-4">
          {/* Notification Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
              Notification Headline / Title *
            </label>
            <input
              id="admin-broadcast-notif-title"
              type="text"
              required
              placeholder="E.g., 🚀 Massive Weekend Data Price Drop: 1GB at ₦270!"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc]"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
              Notification Category &amp; Icon:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: 'system' as const, label: 'System Alert', icon: Sparkles, color: 'text-[#0047cc]' },
                { type: 'promo' as const, label: 'Promotions', icon: Gift, color: 'text-amber-600' },
                { type: 'wallet' as const, label: 'Wallet & Bonus', icon: Wallet, color: 'text-emerald-600' },
                { type: 'security' as const, label: 'Security & PIN', icon: ShieldAlert, color: 'text-rose-600' },
                { type: 'data' as const, label: 'Telecom / Data', icon: Wifi, color: 'text-blue-600' },
              ].map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = notifType === cat.type;
                return (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => setNotifType(cat.type)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-[#0047cc] bg-blue-50/70 text-[#0047cc] dark:bg-blue-950/60 dark:border-blue-600 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent size={15} className={cat.color} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Message Body */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase font-mono text-slate-600 dark:text-slate-400 block">
                Notification Message Body *
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {notifMessage.length} characters
              </span>
            </div>
            <textarea
              id="admin-broadcast-notif-message"
              required
              rows={3}
              placeholder="Enter detailed notification content that will appear when users open their notifications drawer..."
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc] leading-relaxed"
            />
          </div>

          {/* Live User Panel Mockup Preview */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Live User Notification Panel Preview:
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> Real-Time Rendering
              </span>
            </div>

            {/* Mock Notification Item */}
            <div
              className={`relative flex gap-3.5 p-3.5 rounded-2xl overflow-hidden border shadow-xs ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-slate-800/90 border-slate-700 text-slate-100'
              }`}
            >
              {/* Left accent bar for unread notifications */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0047cc]" />

              {/* Icon Container */}
              <div
                className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${
                  notifType === 'wallet'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                    : notifType === 'security'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                    : notifType === 'promo'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                    : notifType === 'data'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0047cc]'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-[#0047cc]'
                }`}
              >
                {notifType === 'wallet' && <Wallet size={18} />}
                {notifType === 'security' && <ShieldAlert size={18} />}
                {notifType === 'promo' && <Gift size={18} />}
                {notifType === 'data' && <Wifi size={18} />}
                {notifType === 'system' && <Sparkles size={18} />}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-sans text-xs sm:text-sm font-bold truncate">
                    {notifTitle || 'Notification Headline Preview'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                    Just now
                  </span>
                </div>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                  {notifMessage || 'Notification message body will appear here exactly as your users see it in their notification tab.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-medium">
              Ruthlessly triggers immediate alert badge on all active user devices.
            </span>
            <button
              id="admin-send-broadcast-notif-btn"
              type="submit"
              disabled={isBroadcasting}
              className="px-5 py-2.5 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isBroadcasting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Delivering to All Users...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Push Notification to All Users Now</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Broadcast Delivery History Log */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Recently Broadcasted Notifications ({broadcastHistory.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={fetchBroadcastHistory}
              disabled={isLoadingHistory}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={11} className={isLoadingHistory ? 'animate-spin' : ''} />
              <span>Refresh Log</span>
            </button>
          </div>

          {broadcastHistory.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No custom broadcast notifications sent yet. Use the composer above to broadcast your first alert!
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {broadcastHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
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
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
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

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Delivered to {item.totalUsers || 1} users
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBroadcast(item.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete broadcast notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Automated Funding & Virtual Accounts Config */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[#0047cc] dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Automated Virtual Bank Funding Integrations
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
              Monnify Live API Key
            </span>
            <input
              type="text"
              readOnly
              value={virtualAccounts.monnifyApiKey}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300"
            />
            <span className="text-[11px] text-slate-500 block">Routes: Wema Bank, Sterling Bank</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
              Payvessel Live Secret Key
            </span>
            <input
              type="text"
              readOnly
              value={virtualAccounts.payvesselKey}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300"
            />
            <span className="text-[11px] text-slate-500 block">Routes: PalmPay, 9Payment Service Bank</span>
          </div>
        </div>
      </div>

      {/* Live Customer Support Contacts Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Live Customer Support Contacts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contact information displayed to customers in the mobile app Support &amp; Help Desk
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSupportContacts} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Support Phone Line
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+234 814 838 8844"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                WhatsApp Support Line
              </label>
              <input
                type="text"
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                placeholder="+234 814 838 8844"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Customer Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@alaminjagora.ng"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Official WhatsApp Community Link
              </label>
              <input
                type="url"
                value={supportGroup}
                onChange={(e) => setSupportGroup(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingContacts}
              className="px-4 py-2 rounded-xl bg-[#0047cc] hover:bg-[#003bb3] text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isSavingContacts ? 'Saving Contacts...' : 'Save Support Contacts'}
            </button>
          </div>
        </form>
      </div>

      {/* Production .env & Credentials Setup PDF Guide */}
      <div className="p-5 rounded-2xl bg-linear-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0047cc] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <FileText size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 font-heading">
              Production .env &amp; Credentials Setup Guide
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0047cc] dark:text-blue-300 font-bold">
                PDF
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Step-by-step instructions for filling ClubKonnect VTU, Monnify, PayVessel, and cPanel MySQL credentials.
            </p>
          </div>
        </div>

        <a
          href="/Alamin_Jagora_ENV_Setup_Guide.pdf"
          download="Alamin_Jagora_ENV_Setup_Guide.pdf"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0047cc] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Download size={15} />
          <span>Download PDF Guide</span>
        </a>
      </div>

      {/* Fresh Start & Statistics Reset Tool */}
      <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              Platform Analytics &amp; Statistics Reset (Fresh Start)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bold">
                Admin Tool
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Zero out lifetime turnover, today's sales volume, profit, order counts and clear test transaction logs for a brand new live launch.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <RotateCcw size={15} />
          <span>Reset Statistics to Zeros</span>
        </button>
      </div>

      {/* FRESH START MODAL */}
      {isResetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <button
                onClick={() => !isResetting && setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                Confirm Platform Reset (Fresh Start)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This will wipe recorded test transactions and reset sales volume, lifetime turnover, daily profit, and transaction counts back to zero.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-300">
                ⚠️ Metrics to be zeroed out:
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300/90 text-[11px] font-medium">
                <li><strong>Lifetime Turnover:</strong> ₦0.00</li>
                <li><strong>Today's Sales Volume:</strong> ₦0.00</li>
                <li><strong>Today's Gross Profit:</strong> ₦0.00</li>
                <li><strong>Today's Orders / Tx Count:</strong> 0 orders</li>
                <li><strong>Transaction Logs:</strong> Cleared completely</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <input
                id="ps-reset-customer-wallets"
                type="checkbox"
                checked={resetBalancesOption}
                onChange={(e) => setResetBalancesOption(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="ps-reset-customer-wallets" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <strong>Also reset customer wallet balances to ₦0.00</strong>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Resets Customer Liabilities to zero. (Admin accounts are preserved).
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleExecuteReset}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all shadow-md shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resetting to Zeros...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Reset to Zeros</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
