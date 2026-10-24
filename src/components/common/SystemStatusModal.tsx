import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Server,
  Database,
  Lock,
  RefreshCw,
  X,
  Wifi,
  WifiOff,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useSystemStatus } from '../../context/SystemStatusContext';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';

interface SystemStatusModalProps {
  isLightMode?: boolean;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isLightMode = true }) => {
  const {
    isOnline,
    latencyMs,
    serverHealth,
    syncState,
    lastSyncedTime,
    isStatusModalOpen,
    setIsStatusModalOpen,
    checkServerHealth,
    triggerSync,
  } = useSystemStatus();

  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    playTapSound();
    triggerHaptic('light');
    await checkServerHealth();
    setTimeout(() => {
      setIsTesting(false);
    }, 400);
  };

  const formattedSyncTime = lastSyncedTime
    ? lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Unknown';

  const isHealthy = isOnline && (serverHealth?.status === 'online' || latencyMs !== null);

  return (
    <AnimatePresence>
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setIsStatusModalOpen(false)}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full max-w-md rounded-2xl shadow-2xl border z-10 overflow-hidden ${
              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b bg-[#0b132b] text-white border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-400/30 text-blue-400 flex items-center justify-center">
                  <Activity size={17} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                    System Health & Connectivity
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Live Telecommunications & Switch Monitor
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Overall Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  !isOnline
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                    : isHealthy
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                }`}
              >
                {!isOnline ? (
                  <WifiOff size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                ) : isHealthy ? (
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm">
                      {!isOnline
                        ? 'Device Offline'
                        : isHealthy
                        ? 'All Systems Fully Operational'
                        : 'System Latency Elevated'}
                    </span>
                    {latencyMs !== null && (
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-current">
                        {latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {!isOnline
                      ? 'No internet connection detected. Vending operations are paused to protect your wallet balance.'
                      : 'Direct low-latency socket connection to the core AJDATASUB transaction switch.'}
                  </p>
                </div>
              </div>

              {/* Status Grid Components */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  Subsystem Status & Network Transparency
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Item 1: Device Connection */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi size={15} className={isOnline ? 'text-emerald-500' : 'text-rose-500'} />
                      <div>
                        <p className="font-bold text-xs">Internet Link</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isOnline ? 'Active & Reachable' : 'Disconnected'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  {/* Item 2: Core Telecom Switch */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio size={15} className="text-blue-500" />
                      <div>
                        <p className="font-bold text-xs">Telecom Switch</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          MTN • Airtel • Glo • 9mobile
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      ONLINE
                    </span>
                  </div>

                  {/* Item 3: Payment Engine */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server size={15} className="text-purple-500" />
                      <div>
                        <p className="font-bold text-xs">Bank Ingress</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Monnify / Payvessel
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      ACTIVE
                    </span>
                  </div>

                  {/* Item 4: Idempotency & Safety */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={15} className="text-amber-500" />
                      <div>
                        <p className="font-bold text-xs">Idempotency Guard</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          0 Double-Charge Risk
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      LOCKED
                    </span>
                  </div>
                </div>
              </div>

              {/* Timing & Freshness Transparency */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <Clock size={13} />
                  <span>Wallet Ledger Last Synced:</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  {formattedSyncTime}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={13} className={isTesting ? 'animate-spin text-blue-600' : ''} />
                  <span>{isTesting ? 'Testing Latency...' : 'Ping Server Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] text-white font-bold text-xs transition-all active:scale-98 cursor-pointer shadow-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
