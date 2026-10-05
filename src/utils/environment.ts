/**
 * ==============================================================================
 * ENVIRONMENT & SIMULATION ENFORCEMENT CONFIGURATION
 * ==============================================================================
 * Directs the application to:
 * 1. Allow simulation in development/preview testing ("here").
 * 2. STRICTLY PROHIBIT any simulation fallback or mock data when deployed.
 */

// Memory cache for runtime server environment response
import { resolveApiUrl } from '../services/apiClient';

let serverModeCache: { isProduction: boolean; allowSimulation: boolean; vtuLive: boolean } | null = null;

/**
 * Checks if the current client environment is running in production.
 */
export function isProductionEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // Check Vite build flag
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv?.PROD) return true;

  // Check hostname patterns:
  // - localhost, 127.0.0.1, or AI Studio development preview URLs ('ais-dev-') allow testing
  const hostname = window.location.hostname || '';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('ais-dev')) {
    return false;
  }

  // Deployed / shared / production URL
  return true;
}

/**
 * Checks if simulation is permitted.
 * Returns false as soon as the app is deployed to production.
 */
export function isSimulationAllowed(): boolean {
  if (serverModeCache) {
    return serverModeCache.allowSimulation;
  }
  return !isProductionEnvironment();
}

/**
 * Proactively queries the backend to determine live deployment mode.
 */
export async function syncServerEnvironment(): Promise<{ isProduction: boolean; allowSimulation: boolean }> {
  try {
    const res = await fetch(resolveApiUrl('/api/system/mode'), { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      serverModeCache = {
        isProduction: Boolean(data.isProduction),
        allowSimulation: Boolean(data.allowSimulation),
        vtuLive: Boolean(data.vtuLive),
      };
      return serverModeCache;
    }
  } catch {}

  const isProd = isProductionEnvironment();
  serverModeCache = {
    isProduction: isProd,
    allowSimulation: !isProd,
    vtuLive: false,
  };
  return serverModeCache;
}
