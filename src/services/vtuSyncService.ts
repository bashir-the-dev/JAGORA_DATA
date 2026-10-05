import { VtuPlanModel, VtuNetwork, VtuSyncResult } from '../types';
import { upsertVtuPlansBatch, getVtuPlans } from '../serverStore';

/**
 * ==============================================================================
 * VTU GATEWAY SYNCHRONIZATION SERVICE
 * ==============================================================================
 * Connects to live wholesale telecom gateway (Peyflex/Payflex or standard aggregator),
 * parses raw vendor catalog payloads, normalizes telecom identifiers, and
 * atomically upserts plans into the local hybrid cached database.
 */

export interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
  providerId: string;
  defaultMarkupPercent: number;
  syncIntervalMinutes: number;
  plansEndpoint: string;
}

export function getGatewayConfig(): GatewayConfig {
  return {
    baseUrl: (process.env.VTU_GATEWAY_URL || process.env.PAYFLEX_BASE_URL || 'https://client.peyflex.com.ng/api').replace(/\/+$/, ''),
    apiKey: (process.env.VTU_GATEWAY_TOKEN || process.env.PAYFLEX_API_KEY || '42e5cd304b2a6f1b3de3e52a20eb0d812f8d5b31').trim(),
    providerId: (process.env.VTU_PROVIDER_ID || 'payflex').trim().toLowerCase(),
    defaultMarkupPercent: Number(process.env.VTU_DEFAULT_MARKUP_PERCENT || '6'),
    syncIntervalMinutes: Math.max(5, Number(process.env.VTU_SYNC_INTERVAL_MINUTES || '30')),
    plansEndpoint: (process.env.VTU_PLANS_ENDPOINT || 'data/plans').replace(/^\/+/, '').replace(/\/+$/, '')
  };
}

/**
 * Standardize vendor telecom networks to standard VTU enum
 */
export function normalizeNetwork(rawNet: any): VtuNetwork | null {
  if (rawNet === null || rawNet === undefined) return null;
  const s = String(rawNet).trim().toLowerCase();

  if (s === '1' || s.includes('mtn')) return 'MTN';
  if (s === '2' || s.includes('glo')) return 'GLO';
  if (s === '3' || s.includes('9mobile') || s.includes('etisalat') || s.includes('9mob')) return '9MOBILE';
  if (s === '4' || s.includes('airtel') || s.includes('airt')) return 'AIRTEL';

  return null;
}

/**
 * Extracts bundle data size (e.g. "1GB", "500MB") from name or code
 */
function extractSizeFromName(name: string, fallbackCode: string): string {
  const match = (name || fallbackCode).match(/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i);
  return match ? match[1].toUpperCase().replace(/\s+/, '') : '1GB';
}

/**
 * Extracts bundle validity (e.g. "7 Days", "30 Days") from label or description
 */
function extractValidityFromLabel(label: string): string {
  const match = label.match(/(\d+\s*(?:Days?|Weeks?|Months?))/i);
  if (match) {
    const clean = match[1].trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  if (/night/i.test(label)) return '1 Night';
  if (/daily|1\s*day/i.test(label)) return '1 Day';
  return '30 Days';
}

/**
 * Network query parameter definitions for gateways requiring per-carrier queries (e.g. Peyflex)
 */
const CARRIER_TARGETS: Array<{ networkKey: string; networkEnum: VtuNetwork; defaultCategory: string }> = [
  { networkKey: 'mtn_data_share', networkEnum: 'MTN', defaultCategory: 'Data Share' },
  { networkKey: 'mtn_gifting_data', networkEnum: 'MTN', defaultCategory: 'Gifting Data' },
  { networkKey: 'glo_data', networkEnum: 'GLO', defaultCategory: 'Corporate Gifting' },
  { networkKey: 'airtel_data', networkEnum: 'AIRTEL', defaultCategory: 'Corporate Gifting' },
  { networkKey: '9mobile_data', networkEnum: '9MOBILE', defaultCategory: 'SME Bundle' }
];

/**
 * Synchronize live plans from the wholesale gateway into local database
 */
export async function syncVtuPlansFromGateway(): Promise<VtuSyncResult> {
  const config = getGatewayConfig();
  const startTime = new Date().toISOString();

  // Guard against missing credentials while keeping local cache intact
  if (!config.apiKey) {
    console.warn('[VTU Sync] No VTU gateway API token provided. Utilizing authoritative local database cache.');
    const cached = getVtuPlans({ status: 'active' });
    return {
      success: true,
      count: cached.length,
      inserted: 0,
      updated: 0,
      provider: config.providerId,
      timestamp: startTime,
      message: 'Gateway token unconfigured. Active database cache retained.'
    };
  }

  const headers: Record<string, string> = {
    'Authorization': `Token ${config.apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'JagoraDataVTU/SyncEngine-1.0'
  };

  const normalizedPlans: Array<Partial<VtuPlanModel> & { provider_id: string; network: VtuNetwork; api_plan_id: string }> = [];

  try {
    // 1. Fetch live plans across telecom carriers
    // Peyflex and several Nigerian telecom gateways require ?network= query parameters per carrier
    console.log(`[VTU Sync] Fetching live telecom catalogs from ${config.baseUrl}/${config.plansEndpoint}/ across carriers...`);

    const carrierFetchPromises = CARRIER_TARGETS.map(async (target) => {
      // Trailing slash with query parameter is required by Django REST gateways
      const targetUrl = `${config.baseUrl}/${config.plansEndpoint}/?network=${target.networkKey}`;

      // Try up to 2 attempts with timeout
      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.warn(`[VTU Sync] Carrier ${target.networkKey} returned HTTP ${response.status}: ${errText.slice(0, 100)}`);
            if (attempt === 1) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
            }
            return null;
          }

          const data = await response.json();
          return { target, data };
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (attempt === 1) {
            // Wait 1s and retry once before falling back
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          console.warn(`[VTU Sync] Notice: Carrier ${target.networkKey} sync deferred (${err.message || 'fetch failed'}). Retaining cached catalog.`);
          return null;
        }
      }
      return null;
    });

    const carrierResults = await Promise.all(carrierFetchPromises);

    for (const res of carrierResults) {
      if (!res || !res.data) continue;

      const { target, data } = res;
      const plansList = Array.isArray(data.plans) ? data.plans : (Array.isArray(data) ? data : []);

      for (const item of plansList) {
        const apiPlanId = String(item.plan_code || item.plan_id || item.id || item.code || '').trim();
        if (!apiPlanId) continue;

        const label = String(item.label || item.plan_name || item.name || '').trim();
        const wholesalePrice = Number(item.amount ?? item.wholesale_price ?? item.price ?? 0);
        if (wholesalePrice <= 0) continue;

        const size = extractSizeFromName(label, apiPlanId);
        const validity = extractValidityFromLabel(label);

        // Determine category: SME, Corporate Gifting, or Data Share
        let category = target.defaultCategory;
        if (/sme/i.test(label) || /sme/i.test(apiPlanId)) {
          category = 'SME';
        } else if (/cg|corporate/i.test(label) || /cg/i.test(apiPlanId)) {
          category = 'Corporate Gifting';
        } else if (/share/i.test(label) || /share/i.test(target.networkKey)) {
          category = 'Data Share';
        }

        const planName = `${target.networkEnum} ${category} ${size} (${validity})`;

        // Calculate custom retail price: wholesale + markup (default 6%, minimum ₦15 profit margin)
        const markup = Math.max(15, Math.ceil(wholesalePrice * (config.defaultMarkupPercent / 100)));
        const customRetailPrice = wholesalePrice + markup;

        normalizedPlans.push({
          provider_id: config.providerId,
          network: target.networkEnum,
          plan_name: planName,
          original_wholesale_price: wholesalePrice,
          custom_retail_price: customRetailPrice,
          api_plan_id: apiPlanId,
          status: 'active',
          category,
          size,
          validity
        });
      }
    }

    // 2. If carrier queries did not return plans, try standard generic catalog endpoint as failover
    if (normalizedPlans.length === 0) {
      console.log(`[VTU Sync] Per-carrier fetch returned 0 plans. Attempting generic catalog fetch at ${config.baseUrl}/${config.plansEndpoint}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const genericResponse = await fetch(`${config.baseUrl}/${config.plansEndpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (genericResponse.ok) {
        const payload = await genericResponse.json();
        const rawList = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);

        for (const item of rawList) {
          const network = normalizeNetwork(item.network || item.service_id);
          const apiPlanId = String(item.plan_code || item.plan_id || item.id || '').trim();
          const wholesalePrice = Number(item.wholesale_price ?? item.price ?? item.amount ?? 0);
          if (!network || !apiPlanId || wholesalePrice <= 0) continue;

          const planName = String(item.plan_name || item.name || `${network} Data Plan`).trim();
          const size = extractSizeFromName(planName, apiPlanId);
          const markup = Math.max(15, Math.ceil(wholesalePrice * (config.defaultMarkupPercent / 100)));

          normalizedPlans.push({
            provider_id: config.providerId,
            network,
            plan_name: planName,
            original_wholesale_price: wholesalePrice,
            custom_retail_price: wholesalePrice + markup,
            api_plan_id: apiPlanId,
            status: 'active',
            category: 'SME',
            size,
            validity: '30 Days'
          });
        }
      }
    }

    if (normalizedPlans.length === 0) {
      console.warn('[VTU Sync] Could not parse live plans from gateway. Preserving existing local database catalog.');
      const cached = getVtuPlans();
      return {
        success: true,
        count: cached.length,
        inserted: 0,
        updated: 0,
        provider: config.providerId,
        timestamp: startTime,
        message: 'Gateway responded with 0 active plans. Active local catalog retained.'
      };
    }

    // 3. Atomically upsert fetched plans into local database
    const upsertStats = upsertVtuPlansBatch(normalizedPlans);
    console.log(`[VTU Sync] Successfully synchronized ${upsertStats.total} live telecom plans (${upsertStats.inserted} new, ${upsertStats.updated} updated) from ${config.providerId}.`);

    return {
      success: true,
      count: upsertStats.total,
      inserted: upsertStats.inserted,
      updated: upsertStats.updated,
      provider: config.providerId,
      timestamp: new Date().toISOString(),
      message: `Successfully synchronized ${upsertStats.total} live plans.`
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || (err.message && err.message.includes('abort'));
    const errMsg = isTimeout
      ? `Connection timeout while reaching wholesale gateway (${config.baseUrl}).`
      : (err.message || String(err));

    console.error('[VTU Sync] Live sync issue:', errMsg);
    const cachedPlans = getVtuPlans();
    return {
      success: false,
      count: cachedPlans.length,
      inserted: 0,
      updated: 0,
      provider: config.providerId,
      timestamp: startTime,
      message: `${errMsg} Active local catalog of ${cachedPlans.length} plans retained.`
    };
  }
}

/**
 * Starts automated recurring background synchronization cron task
 */
let cronTimer: NodeJS.Timeout | null = null;

export function startVtuSyncScheduler(): void {
  const config = getGatewayConfig();
  const intervalMs = config.syncIntervalMinutes * 60 * 1000;

  if (cronTimer) {
    clearInterval(cronTimer);
  }

  console.log(`[VTU Sync] Initializing background sync scheduler (every ${config.syncIntervalMinutes} minutes).`);

  // Initial synchronization 4 seconds after boot so server starts instantly
  setTimeout(() => {
    syncVtuPlansFromGateway().catch((err) => {
      console.warn('[VTU Sync] Initial startup sync error:', err.message);
    });
  }, 4000);

  // Recurring background interval
  cronTimer = setInterval(() => {
    console.log('[VTU Sync] Scheduled cron job: Refreshing wholesale VTU plans...');
    syncVtuPlansFromGateway().catch((err) => {
      console.error('[VTU Sync] Scheduled sync error:', err.message);
    });
  }, intervalMs);
}
