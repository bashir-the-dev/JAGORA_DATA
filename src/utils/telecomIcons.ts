/**
 * Static telecom logo resolution for project folder insertion.
 * Users drop or replace files in /public/telecom/{network}.(png|svg|webp|jpg)
 * before running npm run build and deploying to cPanel.
 */

export type TelecomNetworkId = 'mtn' | 'airtel' | 'glo' | '9mobile';

export const telecomNames: Record<TelecomNetworkId, string> = {
  mtn: 'MTN',
  airtel: 'Airtel',
  glo: 'Glo',
  '9mobile': '9mobile',
};

// Normalized network matcher (from title, string, or id)
export function normalizeNetworkId(val?: string): TelecomNetworkId | null {
  if (!val) return null;
  const s = val.toLowerCase();
  if (s.includes('mtn')) return 'mtn';
  if (s.includes('airtel')) return 'airtel';
  if (s.includes('glo')) return 'glo';
  if (s.includes('9mobile') || s.includes('etisalat') || s.includes('9mob')) return '9mobile';
  return null;
}

/**
 * Returns candidate static asset URLs from the /public/telecom/ folder.
 * Vite serves files in /public at the root URL (e.g. /telecom/mtn.png).
 */
export function getTelecomAssetCandidates(networkId: string): string[] {
  const norm = normalizeNetworkId(networkId) || (networkId.toLowerCase() as TelecomNetworkId);
  return [
    `/telecom/${norm}.png`,
    `/telecom/${norm}.svg`,
    `/telecom/${norm}.webp`,
    `/telecom/${norm}.jpg`,
  ];
}
