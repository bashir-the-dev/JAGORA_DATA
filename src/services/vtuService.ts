/**
 * ============================================================================
 * AL'AMIN JAGORA DATA - CORE VTU SERVICES & LIVE API INTEGRATION LAYER
 * ============================================================================
 * Dispatches Virtual Top-Up (VTU) transactions across Nigerian
 * telecommunications networks (MTN, Airtel, Glo, 9mobile) and billers
 * (IKEDC, EKEDC, DSTV, GOTV, Startimes, WAEC, NECO) to the live backend server.
 */

import { NetworkId, DataPlan } from '../types';
import { normalizeNigerianPhone, detectNigerianNetwork, NIGERIAN_NETWORK_PREFIXES } from '../utils/phoneUtils';
import { humanizeVtuError } from '../utils/errorParser';
import { resolveApiUrl } from './apiClient';

export interface VtuApiResponse<T = unknown> {
  success: boolean;
  message: string;
  reference?: string;
  data?: T;
  balanceAfter?: number;
  upstreamData?: any;
}

export const VTU_CONFIG = {
  // Live API connected directly to server.ts backend
  USE_LIVE_API: true,
  
  BASE_URL: '/api/vtu',
  
  NETWORK_PREFIXES: NIGERIAN_NETWORK_PREFIXES,
};

/**
 * Automatically detects Nigerian network provider from a phone number prefix
 */
export function detectNetwork(phone: string): NetworkId | null {
  return detectNigerianNetwork(phone);
}

export const detectNetworkFromPhone = detectNetwork;

/**
 * Format Nigerian Naira currency
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Clean phone number to 11-digit Nigerian format (e.g. 08012345678)
 */
export function formatNigerianPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    return '0' + digits.slice(3);
  }
  return digits;
}

function getAuthHeaders(): Record<string, string> {
  let token = '';
  try {
    token = localStorage.getItem('jagora_auth_token') || '';
  } catch {
    // Storage fallback
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'Idempotency-Key': `AJD-VTU-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
}

/**
 * LIVE PURCHASE DATA BUNDLE
 * Dispatches request to the server ClubKonnect API endpoint
 */
export async function apiPurchaseData(
  plan: DataPlan,
  phone: string,
  pin?: string,
  bypassValidator: boolean = false
): Promise<VtuApiResponse<{ plan: string; recipient: string; network: string }>> {
  const norm = normalizeNigerianPhone(phone);
  if (!bypassValidator && !norm.isValid) {
    return {
      success: false,
      message: norm.error || 'Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678).'
    };
  }

  const cleanPhone = norm.cleaned || phone.replace(/\D/g, '');

  try {
    const res = await fetch(resolveApiUrl('/api/vtu/buy-data'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        network: plan.network,
        planId: plan.id,
        size: plan.size,
        phone: cleanPhone,
        amount: plan.price,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again to continue.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `${plan.network.toUpperCase()} ${plan.size} Data Bundle delivered successfully to ${cleanPhone}.`,
        reference: data.reference || data.data?.reference || data.orderRef,
        upstreamData: data.upstreamData || data.data,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
        data: {
          plan: `${plan.network.toUpperCase()} ${plan.size} (${plan.type})`,
          recipient: cleanPhone,
          network: plan.network,
        },
      };
    } else {
      return {
        success: false,
        message: humanizeVtuError(data.message, 'data purchase'),
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: humanizeVtuError(err, 'data purchase'),
    };
  }
}

/**
 * LIVE PURCHASE AIRTIME
 * Dispatches request to the server ClubKonnect Airtime API endpoint
 */
export async function apiPurchaseAirtime(
  network: NetworkId,
  phone: string,
  amount: number,
  pin?: string
): Promise<VtuApiResponse<{ network: string; recipient: string; amount: number }>> {
  const norm = normalizeNigerianPhone(phone);
  if (!norm.isValid) {
    return {
      success: false,
      message: norm.error || 'Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678).'
    };
  }

  if (amount < 50) {
    return { success: false, message: 'Minimum airtime recharge is ₦50.' };
  }

  const cleanPhone = norm.cleaned;

  try {
    const res = await fetch(resolveApiUrl('/api/vtu/buy-airtime'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        network,
        phone: cleanPhone,
        amount,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again to continue.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `₦${amount} ${network.toUpperCase()} Airtime credited successfully to ${cleanPhone}.`,
        reference: data.reference || data.data?.reference || data.orderRef,
        upstreamData: data.upstreamData || data.data,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
        data: {
          network,
          recipient: cleanPhone,
          amount,
        },
      };
    } else {
      return {
        success: false,
        message: humanizeVtuError(data.message, 'airtime recharge'),
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: humanizeVtuError(err, 'airtime recharge'),
    };
  }
}

/**
 * LIVE GENERATE RECHARGE PIN (EPIN printing for offline sales)
 */
export async function apiGenerateRechargePin(
  network: NetworkId,
  denomination: number,
  quantity: number = 1,
  pin?: string
): Promise<VtuApiResponse<Array<{ pin: string; serial: string; denomination: number }>>> {
  try {
    const res = await fetch(resolveApiUrl('/api/vtu/recharge-pin'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        network,
        denomination,
        quantity,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `Successfully generated ${quantity} ${network.toUpperCase()} ₦${denomination} Recharge PIN(s).`,
        reference: data.reference || data.data?.reference || data.orderRef,
        data: data.pins || data.cards || data.data?.pins || data.data,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
      };
    } else {
      return { success: false, message: humanizeVtuError(data.message, 'recharge voucher generation') };
    }
  } catch (err: any) {
    return { success: false, message: humanizeVtuError(err, 'recharge voucher generation') };
  }
}

/**
 * LIVE GENERATE DATA CARD (Offline Data PINs)
 */
export async function apiGenerateDataCard(
  network: NetworkId,
  dataSize: string,
  quantity: number = 1,
  pin?: string
): Promise<VtuApiResponse<Array<{ pin: string; serial: string; dataSize: string }>>> {
  try {
    const res = await fetch(resolveApiUrl('/api/vtu/data-card'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        network,
        dataSize,
        quantity,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `Successfully generated ${quantity} ${network.toUpperCase()} ${dataSize} Data Card PIN(s).`,
        reference: data.reference || data.data?.reference || data.orderRef,
        data: data.cards || data.data?.cards || data.data,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
      };
    } else {
      return { success: false, message: humanizeVtuError(data.message, 'data card generation') };
    }
  } catch (err: any) {
    return { success: false, message: humanizeVtuError(err, 'data card generation') };
  }
}

/**
 * LIVE PAY ELECTRICITY BILL (IKEDC, EKEDC, AEDC, IBEDC, etc.)
 */
export async function apiPayElectricity(
  disco: string,
  meterNumber: string,
  amount: number,
  meterType: 'prepaid' | 'postpaid' = 'prepaid',
  pin?: string
): Promise<VtuApiResponse<{ token?: string; units?: string; meterNumber: string }>> {
  try {
    const res = await fetch(resolveApiUrl('/api/vtu/electricity'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        disco,
        meterNumber,
        amount,
        meterType,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `Electricity payment of ₦${amount} for Meter ${meterNumber} (${disco}) was successful.`,
        reference: data.reference || data.data?.reference || data.orderRef,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
        data: {
          token: data.token || data.data?.token,
          units: data.units || data.data?.units,
          meterNumber: data.meterNumber || data.data?.meterNumber || meterNumber,
        },
      };
    } else {
      return { success: false, message: humanizeVtuError(data.message, 'electricity payment') };
    }
  } catch (err: any) {
    return { success: false, message: humanizeVtuError(err, 'electricity payment') };
  }
}

/**
 * LIVE SUBSCRIBE CABLE TV (DSTV, GOTV, Startimes)
 */
export async function apiSubscribeCable(
  provider: 'dstv' | 'gotv' | 'startimes',
  smartcardNumber: string,
  packageTitle: string,
  amount: number,
  pin?: string
): Promise<VtuApiResponse<{ provider: string; smartcardNumber: string; packageTitle: string }>> {
  try {
    const res = await fetch(resolveApiUrl('/api/vtu/cable-tv'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        provider,
        iuc: smartcardNumber,
        planName: packageTitle,
        amount,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `${provider.toUpperCase()} (${packageTitle}) renewed successfully for IUC: ${smartcardNumber}.`,
        reference: data.reference || data.data?.reference || data.orderRef,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
        data: {
          provider,
          smartcardNumber,
          packageTitle,
        },
      };
    } else {
      return { success: false, message: humanizeVtuError(data.message, 'cable TV subscription') };
    }
  } catch (err: any) {
    return { success: false, message: humanizeVtuError(err, 'cable TV subscription') };
  }
}

/**
 * LIVE PURCHASE EXAM PINs (WAEC, NECO, NABTEB, JAMB)
 */
export async function apiBuyExamPin(
  examType: 'waec' | 'neco' | 'nabteb' | 'jamb',
  quantity: number = 1,
  candidatePhone?: string,
  pin?: string
): Promise<VtuApiResponse<Array<{ pin: string; serial: string; exam: string; amount: number }>>> {
  const normPhone = candidatePhone ? normalizeNigerianPhone(candidatePhone).cleaned : undefined;
  try {
    const res = await fetch(resolveApiUrl('/api/vtu/exam-pin'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        examType,
        quantity,
        phone: normPhone,
        pin: pin || undefined,
      }),
    });

    if (res.status === 401) {
      try { localStorage.removeItem('jagora_auth_token'); } catch {}
      return { success: false, message: 'Your session has expired. Please log in again.' };
    }

    const data = await res.json();
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return {
        success: true,
        message: data.message || `Generated ${quantity} ${examType.toUpperCase()} Exam PIN(s) successfully.`,
        reference: data.reference || data.data?.reference || data.orderRef,
        balanceAfter: data.newBalance ?? data.balanceAfter ?? data.data?.newBalance,
        data: data.cards || data.pins || data.data?.cards || data.data?.pins || data.data,
      };
    } else {
      return { success: false, message: humanizeVtuError(data.message, 'exam pin generation') };
    }
  } catch (err: any) {
    return { success: false, message: humanizeVtuError(err, 'exam pin generation') };
  }
}

/**
 * LIVE VERIFY BILLER (Smartcard / Electricity Meter)
 */
export async function apiVerifyBiller(
  serviceType: 'electricity' | 'cable',
  identifier: string,
  provider: string
): Promise<{ success: boolean; customerName?: string; message?: string }> {
  try {
    const token = localStorage.getItem('jagora_auth_token');
    const res = await fetch(resolveApiUrl('/api/vtu/verify-biller'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ serviceType, identifier, provider }),
    });
    const data = await res.json();
    return {
      success: data.success === true || data.status === 'success' || data.verified === true,
      customerName: data.customerName || data.data?.customerName || data.name,
      message: data.message,
    };
  } catch {
    return { success: false, message: 'Could not verify biller at this time.' };
  }
}

