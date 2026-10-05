/**
 * ============================================================================
 * AL'AMIN JAGORA DATA - PHONE NUMBER NORMALIZATION & VALIDATION
 * ============================================================================
 * Handles Nigerian phone number formats:
 * - Local: 08012345678, 080 1234 5678, 080-1234-5678
 * - International: +2348012345678, +234 801 234 5678, 2348012345678
 * - Missing leading zero: 8012345678
 */

import { NetworkId } from '../types';

export const NIGERIAN_NETWORK_PREFIXES: Record<NetworkId, string[]> = {
  mtn: [
    '0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814',
    '0903', '0906', '0913', '0916', '0704', '07025', '07026', '0707', '0702'
  ],
  airtel: [
    '0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904',
    '0907', '0911', '0912', '0917'
  ],
  glo: [
    '0805', '0807', '0705', '0815', '0811', '0905', '0915'
  ],
  '9mobile': [
    '0809', '0817', '0818', '0909', '0908'
  ],
};

export interface CleanPhoneResult {
  rawDigits: string;
  cleaned: string;
  formatted: string;
  isValid: boolean;
  detectedNetwork: NetworkId | null;
  error?: string;
}

/**
 * Strips all non-numeric characters except leading +
 */
export function stripPhoneNonDigits(phone: string): string {
  if (!phone) return '';
  return phone.trim().replace(/[^\d+]/g, '');
}

/**
 * Detects the Nigerian network provider from a phone number or prefix.
 * Supports partial inputs (as short as 3-4 digits).
 */
export function detectNigerianNetwork(input: string): NetworkId | null {
  if (!input) return null;
  const cleaned = cleanNigerianDigits(input);
  if (!cleaned || cleaned.length < 4) return null;

  // Check 5-digit prefixes first (e.g. 07025, 07026)
  if (cleaned.length >= 5) {
    const prefix5 = cleaned.slice(0, 5);
    for (const [net, prefixes] of Object.entries(NIGERIAN_NETWORK_PREFIXES)) {
      if (prefixes.includes(prefix5)) {
        return net as NetworkId;
      }
    }
  }

  // Check 4-digit prefixes (e.g. 0803, 0704, 0911, 0917, 0702)
  const prefix4 = cleaned.slice(0, 4);
  for (const [net, prefixes] of Object.entries(NIGERIAN_NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix4)) {
      return net as NetworkId;
    }
  }

  return null;
}

/**
 * Normalizes input string to clean local Nigerian mobile digits (e.g. 08031234567).
 * Handles +234, 234, missing leading zeroes (803...), European exit code 00234,
 * and removes spaces, dashes, dots, and parenthesized prefixes like (0).
 */
export function cleanNigerianDigits(input: string): string {
  if (!input) return '';

  let raw = input.trim();

  // Strip common prefixes and formatting noise
  raw = raw.replace(/[\s\-_()./]/g, '');

  // Handle European international exit prefix: 00234... -> +234...
  if (raw.startsWith('00234')) {
    raw = '+234' + raw.slice(5);
  }

  // Handle +234 or 234
  if (raw.startsWith('+234')) {
    raw = raw.slice(4);
    // If user wrote +23408031234567 or +234 (0) 803..., strip the extra zero
    if (raw.startsWith('0')) {
      raw = raw.slice(1);
    }
    raw = '0' + raw;
  } else if (raw.startsWith('234') && raw.length >= 5) {
    raw = raw.slice(3);
    if (raw.startsWith('0')) {
      raw = raw.slice(1);
    }
    raw = '0' + raw;
  } else if (raw.startsWith('7') || raw.startsWith('8') || raw.startsWith('9')) {
    // Missing leading zero (e.g. 8031234567 or while typing 803...)
    raw = '0' + raw;
  }

  // Clean out any leftover non-digits
  let cleaned = raw.replace(/\D/g, '');

  // Handle double zero: 0080... -> 080...
  if (cleaned.startsWith('00') && (cleaned[2] === '7' || cleaned[2] === '8' || cleaned[2] === '9')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Strictly normalizes any Nigerian phone number to standard 11-digit local format (e.g. 08012345678)
 * and performs real-time validation and carrier detection.
 */
export function normalizeNigerianPhone(input: string): CleanPhoneResult {
  if (!input || !input.trim()) {
    return {
      rawDigits: '',
      cleaned: '',
      formatted: '',
      isValid: false,
      detectedNetwork: null,
      error: 'Phone number is required.',
    };
  }

  const cleaned = cleanNigerianDigits(input);

  // Detect network provider from prefix
  const detectedNetwork = detectNigerianNetwork(cleaned);

  // Check valid Nigerian mobile format:
  // 11 digits starting with 070, 080, 081, 090, 091
  const isValidLength = cleaned.length === 11;
  const hasValidPrefixPattern = /^0[789][01]\d{8}$/.test(cleaned);
  const isValid = isValidLength && (hasValidPrefixPattern || Boolean(detectedNetwork));

  let error: string | undefined;
  if (cleaned.length === 0) {
    error = 'Phone number is required.';
  } else if (cleaned.length < 11) {
    error = `Phone number is too short (${cleaned.length}/11 digits).`;
  } else if (cleaned.length > 11) {
    error = `Phone number is too long (${cleaned.length}/11 digits).`;
  } else if (!isValid) {
    error = 'Invalid Nigerian phone prefix. Must start with 080, 081, 070, 090, 091, etc.';
  }

  // Format as readable: 0801 234 5678
  let formatted = cleaned;
  if (cleaned.length === 11) {
    formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return {
    rawDigits: cleaned,
    cleaned,
    formatted,
    isValid,
    detectedNetwork,
    error,
  };
}
