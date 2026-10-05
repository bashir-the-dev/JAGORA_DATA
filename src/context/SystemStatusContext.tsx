import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { resolveApiUrl } from '../services/apiClient';

export interface ServerHealthInfo {
  status: 'online' | 'degraded' | 'offline';
  vtuSwitchActive: boolean;
  paymentActive: boolean;
  idempotencyActive: boolean;
  environment: string;
  latencyMs: number;
  lastChecked: Date;
}

export interface TransactionProgressState {
  isOpen: boolean;
  title: string;
  recipient?: string;
  amount?: number;
  step: number; // 0, 1, 2, 3
  statusText?: string;
}

interface SystemStatusContextType {
  isOnline: boolean;
  latencyMs: number | null;
  serverHealth: ServerHealthInfo | null;
  syncState: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedTime: Date | null;
  isStatusModalOpen: boolean;
  setIsStatusModalOpen: (open: boolean) => void;
  triggerSync: (customAction?: () => Promise<void> | void) => Promise<void>;
  checkServerHealth: () => Promise<void>;
  transactionProgress: TransactionProgressState | null;
  startTransactionProgress: (title: string, recipient?: string, amount?: number) => void;
  setTransactionStep: (step: number, statusText?: string) => void;
  finishTransactionProgress: () => void;
}

const SystemStatusContext = createContext<SystemStatusContextType | null>(null);

export const SystemStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [serverHealth, setServerHealth] = useState<ServerHealthInfo | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [transactionProgress, setTransactionProgress] = useState<TransactionProgressState | null>(null);

  // Measure health and ping latency
  const checkServerHealth = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setServerHealth(null);
      setLatencyMs(null);
      return;
    }

    const startTime = performance.now();
    try {
      const res = await fetch(resolveApiUrl('/api/health'), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);

      if (res.ok) {
        const data = await res.json();
        setIsOnline(true);
        setServerHealth({
          status: data.status === 'online' ? 'online' : 'degraded',
          vtuSwitchActive: Boolean(data.providers?.clubkonnect?.active || data.security?.authoritativePricing),
          paymentActive: Boolean(data.providers?.monnify?.active || data.providers?.payvessel?.active || true),
          idempotencyActive: Boolean(data.security?.idempotencyEngine === 'active'),
          environment: data.environment || 'production',
          latencyMs: duration,
          lastChecked: new Date(),
        });
      } else {
        setServerHealth((prev) =>
          prev
            ? { ...prev, status: 'degraded', latencyMs: duration, lastChecked: new Date() }
            : null
        );
      }
    } catch {
      // Endpoint error or network glitch
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
      }
      setLatencyMs(null);
    }
  }, []);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkServerHealth();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setLatencyMs(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkServerHealth();

    // Periodic heartbeat check every 30 seconds
    const interval = setInterval(() => {
      checkServerHealth();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkServerHealth]);

  // Synchronize state trigger with feedback
  const triggerSync = async (customAction?: () => Promise<void> | void) => {
    setSyncState('syncing');
    try {
      if (customAction) {
        await customAction();
      }
      await checkServerHealth();
      setSyncState('synced');
      setLastSyncedTime(new Date());
      setTimeout(() => setSyncState('idle'), 2500);
    } catch {
      setSyncState('error');
      setTimeout(() => setSyncState('idle'), 3000);
    }
  };

  // Transaction Stage Progression
  const startTransactionProgress = (title: string, recipient?: string, amount?: number) => {
    setTransactionProgress({
      isOpen: true,
      title,
      recipient,
      amount,
      step: 0,
      statusText: 'Validating recipient details & telecom carrier...',
    });
  };

  const setTransactionStep = (step: number, statusText?: string) => {
    setTransactionProgress((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        step,
        statusText: statusText || prev.statusText,
      };
    });
  };

  const finishTransactionProgress = () => {
    setTransactionProgress(null);
  };

  return (
    <SystemStatusContext.Provider
      value={{
        isOnline,
        latencyMs,
        serverHealth,
        syncState,
        lastSyncedTime,
        isStatusModalOpen,
        setIsStatusModalOpen,
        triggerSync,
        checkServerHealth,
        transactionProgress,
        startTransactionProgress,
        setTransactionStep,
        finishTransactionProgress,
      }}
    >
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => {
  const context = useContext(SystemStatusContext);
  if (!context) {
    throw new Error('useSystemStatus must be used within a SystemStatusProvider');
  }
  return context;
};
