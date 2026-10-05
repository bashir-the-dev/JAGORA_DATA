/**
 * ==============================================================================
 * DIRECT CUSTOM BACKEND CONNECTION CLIENT
 * ==============================================================================
 * Connection to Google Cloud / Firebase servers has been completely severed.
 * This app connects directly to its custom-built Express backend (/api/*).
 */

import { resolveApiUrl } from '../services/apiClient';

export const isGoogleCloudConnected = false;
export const backendType = 'custom_express_backend';

export async function testBackendConnection(): Promise<boolean> {
  try {
    const res = await fetch(resolveApiUrl('/api/health'));
    return res.ok;
  } catch {
    return false;
  }
}

// Initial direct custom backend health verification
if (typeof window !== 'undefined') {
  testBackendConnection();
}

// Safe disconnected stubs to prevent runtime errors if any legacy component looks for them
export const app = null;
export const db = null;
export const auth = null;
export default null;
