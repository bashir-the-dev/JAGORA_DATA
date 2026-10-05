import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { useSystemStatus } from '../../context/SystemStatusContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, checkServerHealth } = useSystemStatus();
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestoredNotice(false);
    } else if (wasOffline) {
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <div className="w-full z-40">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            key="offline-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md overflow-hidden"
          >
            <div className="flex items-center gap-2 max-w-lg mx-auto w-full">
              <WifiOff size={15} className="shrink-0 animate-bounce" />
              <div className="flex-1 min-w-0">
                <span className="font-bold">Offline Mode:</span> Internet disconnected. Vending and wallet debits are paused until reconnected.
              </div>
              <button
                onClick={() => checkServerHealth()}
                className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={10} />
                <span>Retry</span>
              </button>
            </div>
          </motion.div>
        )}

        {isOnline && showRestoredNotice && (
          <motion.div
            key="restored-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md overflow-hidden"
          >
            <div className="flex items-center gap-2 max-w-lg mx-auto w-full justify-center">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-200" />
              <span>Internet connection restored. Live telecommunication switch is operational.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
