/**
 * Web Authentication API (WebAuthn) Helper for Al'amin Jagora Data
 * Enables biometric transaction approval & quick-unlock using Device Fingerprint / Face ID / Touch ID / Windows Hello.
 */

export interface BiometricAvailability {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  credentialId?: string | null;
}

const CREDENTIAL_STORAGE_KEY = 'jagora_webauthn_credential_id';

/**
 * Checks if the browser and operating system support WebAuthn and Platform Authenticators (Fingerprint / TouchID / FaceID)
 */
export async function checkBiometricSupport(): Promise<BiometricAvailability> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      isSupported: false,
      hasPlatformAuthenticator: false,
      credentialId: null,
    };
  }

  let hasPlatformAuthenticator = false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      hasPlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    hasPlatformAuthenticator = false;
  }

  let credentialId: string | null = null;
  try {
    credentialId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
  } catch {}

  return {
    isSupported: true,
    hasPlatformAuthenticator,
    credentialId,
  };
}

/**
 * Registers / Enrolls the device platform authenticator (Touch ID, Face ID, Fingerprint scanner)
 */
export async function registerDeviceBiometrics(user: {
  phone: string;
  name: string;
}): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'Web Authentication API is not supported on this browser.' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(user.phone || 'jagora_user');

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Al'amin Jagora Data",
        id: window.location.hostname === 'localhost' ? 'localhost' : undefined,
      },
      user: {
        id: userIdBytes,
        name: user.phone || 'customer@jagoradata.com',
        displayName: user.name || 'Valued Customer',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in platform biometric sensor (Fingerprint/TouchID/FaceID)
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Biometric enrollment was cancelled or timed out.' };
    }

    const credId = credential.id;
    try {
      localStorage.setItem(CREDENTIAL_STORAGE_KEY, credId);
    } catch {}

    return { success: true, credentialId: credId };
  } catch (err: any) {
    // Handle standard WebAuthn errors with clean user-friendly messages
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Biometric authorization was declined or cancelled on your device.',
      };
    }
    if (err.name === 'NotSupportedError') {
      return {
        success: false,
        error: 'No biometric sensor or screen-lock authenticator was found on this device.',
      };
    }
    return {
      success: false,
      error: err.message || 'Unable to register device biometrics. Please try again.',
    };
  }
}

/**
 * Authenticates user transaction or session unlock using the enrolled WebAuthn credential
 */
export async function authenticateDeviceBiometrics(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'Web Authentication API is not supported on this device.' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credentialId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname === 'localhost' ? 'localhost' : undefined,
    };

    if (credentialId) {
      // Decode credential id if available
      try {
        const rawId = Uint8Array.from(atob(credentialId.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
          c.charCodeAt(0)
        );
        publicKeyCredentialRequestOptions.allowCredentials = [
          {
            id: rawId,
            type: 'public-key',
            transports: ['internal'],
          },
        ];
      } catch {
        // Fallback without explicit credential id filter
      }
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      return { success: false, error: 'Biometric authentication was cancelled.' };
    }

    return { success: true };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Biometric verification was cancelled or timed out.',
      };
    }
    return {
      success: false,
      error: err.message || 'Biometric verification failed.',
    };
  }
}

/**
 * Disables / clears device biometrics credential
 */
export function removeDeviceBiometrics(): void {
  try {
    localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  } catch {}
}
