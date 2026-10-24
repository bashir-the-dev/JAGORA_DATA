/**
 * ============================================================================
 * AJDATASUB - HUMAN-FRIENDLY ERROR TRANSLATION UTILITY
 * ============================================================================
 * Transforms cryptic system/API error messages, HTTP status codes, and provider
 * codes into helpful, respectful, localized messages that reassure the customer
 * regarding their funds.
 */

export function humanizeVtuError(
  rawError: unknown,
  fallbackContext: string = 'transaction'
): string {
  if (!rawError) {
    return fallbackContext === 'transaction' || fallbackContext === 'purchase'
      ? 'We could not complete this transaction right now. Your wallet balance is safe and has not been deducted. Please try again.'
      : 'An unexpected issue occurred. Please try again in a few moments.';
  }

  const errString = typeof rawError === 'string'
    ? rawError
    : (rawError as any)?.message || (rawError as any)?.error || JSON.stringify(rawError);

  const lower = errString.toLowerCase();
  const isFinancial = ['transaction', 'purchase', 'data', 'airtime', 'bills', 'electricity', 'cable'].includes(fallbackContext.toLowerCase());

  // Scheduled Maintenance Mode
  if (
    lower.includes('maintenance_mode') ||
    lower.includes('system maintenance') ||
    lower.includes('scheduled maintenance') ||
    lower.includes('services are temporarily paused') ||
    lower.includes('temporarily paused for scheduled maintenance') ||
    lower.includes('503')
  ) {
    return 'System maintenance is currently in progress. Recharge, bill payments, and financial transfers are temporarily paused. Your funds are 100% secure and services will resume shortly.';
  }

  // Network / Connection dropouts & Timeouts
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('network request failed') ||
    lower.includes('err_connection') ||
    lower.includes('err_internet_disconnected') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('signal aborted') ||
    lower.includes('aborted') ||
    lower.includes('aborterror') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('load failed') ||
    lower.includes('cors') ||
    lower.includes('access-control')
  ) {
    if (fallbackContext === 'admin' || fallbackContext === 'auth' || fallbackContext === 'login' || fallbackContext === 'account') {
      return 'Network request timed out or was interrupted. If your account was already created, you can try logging in, or check your internet connection and try again.';
    }
    return isFinancial
      ? 'Your network connection dropped while connecting to the provider. Your wallet has not been charged. Please check your connection and try again.'
      : 'Unable to connect to the server right now. Please check your internet connection and try again.';
  }

  // Rate Limiting
  if (
    lower.includes('429') ||
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('too many attempts')
  ) {
    return 'For your account security, too many attempts were made in a short time. Please wait a few moments before trying again.';
  }

  // Insufficient Balance
  if (
    lower.includes('insufficient') ||
    lower.includes('low balance') ||
    lower.includes('not enough funds') ||
    lower.includes('wallet balance is too low') ||
    lower.includes('fund your wallet')
  ) {
    return 'Your wallet balance is too low for this purchase. Please add funds to your wallet to continue.';
  }

  // PIN Errors & Reset
  if (
    lower.includes('invalid pin') ||
    lower.includes('incorrect pin') ||
    lower.includes('wrong pin') ||
    lower.includes('pin verification failed') ||
    lower.includes('current pin is incorrect') ||
    lower.includes('old pin is incorrect') ||
    lower.includes('pin mismatch')
  ) {
    return 'The transaction PIN you entered is incorrect. If you forgot your PIN, you can reset it with your login password.';
  }

  if (lower.includes('pin must be') || lower.includes('4 digits') || lower.includes('numeric digits')) {
    return 'Your transaction PIN must be exactly 4 numeric digits (e.g. 1234).';
  }

  // Password & Authentication
  if (
    lower.includes('incorrect account login password') ||
    lower.includes('incorrect password') ||
    lower.includes('wrong password') ||
    lower.includes('invalid password') ||
    lower.includes('password mismatch')
  ) {
    return 'The password you entered is incorrect. Please double-check your password and try again.';
  }

  if (
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('user not found') ||
    lower.includes('account not found') ||
    lower.includes('no user found')
  ) {
    return 'The login details entered do not match our records. Please verify your phone number/email and password.';
  }

  if (
    lower.includes('session expired') ||
    lower.includes('token expired') ||
    lower.includes('unauthorized') ||
    lower.includes('jwt expired') ||
    lower.includes('401')
  ) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  // Phone number errors
  if (
    lower.includes('invalid phone') ||
    lower.includes('invalid recipient') ||
    lower.includes('invalid mobile') ||
    lower.includes('phone number must') ||
    lower.includes('phone number is invalid')
  ) {
    return 'Please enter a valid 11-digit Nigerian mobile number (e.g. 08012345678).';
  }

  // Provider / Gateway Downtime
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('internal server error') ||
    lower.includes('bad gateway') ||
    lower.includes('gateway timeout') ||
    lower.includes('service unavailable') ||
    lower.includes('telecom switch down') ||
    lower.includes('upstream') ||
    lower.includes('provider timeout') ||
    lower.includes('server error')
  ) {
    return isFinancial
      ? 'The telecom network provider is experiencing temporary downtime. Your wallet is completely safe and was not charged. Please try again shortly.'
      : 'Our servers are experiencing a brief moment of maintenance. Please try again in a few moments.';
  }

  // Electricity / Cable verification
  if (
    lower.includes('meter') ||
    lower.includes('smartcard') ||
    lower.includes('iuc') ||
    lower.includes('biller')
  ) {
    return isFinancial
      ? 'We could not verify this account with the utility provider. Your wallet was not charged. Please double-check your meter or smartcard number.'
      : 'Could not verify the account number with the service provider. Please verify the digits.';
  }

  // Suspended or locked accounts
  if (lower.includes('suspended') || lower.includes('deactivated') || lower.includes('locked')) {
    return 'Your account access is currently restricted. Please reach out to our customer support team for prompt assistance.';
  }

  // Raw database or syntax error strings (sanitize technical garbage)
  if (
    lower.includes('sql') ||
    lower.includes('pdo') ||
    lower.includes('database') ||
    lower.includes('syntaxerror') ||
    lower.includes('typeerror') ||
    lower.includes('unexpected token') ||
    lower.includes('json.parse') ||
    lower.includes('cannot read properties') ||
    lower.includes('referenceerror') ||
    lower.includes('object object') ||
    lower.includes('undefined') ||
    lower.includes('null')
  ) {
    return isFinancial
      ? 'We could not complete your order due to a temporary system glitch. Your wallet has not been charged. Please try again.'
      : 'A temporary system issue occurred. Please refresh and try again shortly.';
  }

  // Clean, human-friendly messages returned by our API
  if (
    errString.length > 8 &&
    errString.length < 140 &&
    !errString.includes('{') &&
    !errString.includes('at ') &&
    !errString.includes('function(') &&
    !lower.includes('server error') &&
    !lower.includes('status code')
  ) {
    const isValidationError =
      lower.includes('please select') ||
      lower.includes('please enter') ||
      lower.includes('required') ||
      lower.includes('invalid') ||
      lower.includes('incorrect') ||
      lower.includes('between') ||
      lower.includes('must be') ||
      lower.includes('already exists') ||
      lower.includes('minimum');

    if (isFinancial && !isValidationError && !lower.includes('wallet') && !lower.includes('charged') && !lower.includes('success') && !lower.includes('balance') && !lower.includes('pin')) {
      return `${errString} (Your wallet was not charged).`;
    }
    return errString;
  }

  return isFinancial
    ? 'Unable to complete this transaction right now. Your wallet balance is safe and was not charged. Please try again.'
    : 'Unable to complete your request right now. Please try again in a moment.';
}
