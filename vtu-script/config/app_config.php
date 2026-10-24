<?php
/**
 * ============================================================================
 * VTU SCRIPT - CENTRAL APPLICATION CONFIGURATION
 * Single Source of Truth for AJDATASUB
 * ============================================================================
 * EDIT THIS FILE TO CHANGE BRANDING, CONTACTS, CITIES, OR API CREDENTIALS.
 * All changes made here automatically update your entire website, footers,
 * landing page, login page, dashboard, and invoices.
 */

// 1. COMPANY & CONTACT DETAILS (Quick Editing in cPanel)
define('APP_NAME',          "AJDATASUB");
define('APP_TAGLINE',       "Fast, Reliable & Cheap VTU Services in Nigeria");
define('APP_DESCRIPTION',   "Instant automated SME/CG data bundles, discounted airtime, electricity meter tokens & cable TV subscriptions.");
define('SUPPORT_PHONE',     "+2347048609646");
define('SUPPORT_EMAIL',     "support@ajdatasub.com.ng");
define('OFFICE_ADDRESS',    "Katsina, Nigeria"); // 👈 EDIT THIS LINE to change Kano to Katsina or any state
define('OFFICE_STATE',      "Katsina State");
define('COUNTRY',           "Nigeria");
define('CURRENCY_SYMBOL',   "₦");

// 2. WHATSAPP LIVE AGENT CHAT
define('WHATSAPP_NUMBER',   "2347048609646"); // 234 followed by 10 digits without + or spaces
define('WHATSAPP_MESSAGE',  "Hello AJDATASUB support, I need assistance with my account.");

// 3. BASE URLS & PATHS
if (!defined('BASE_URL')) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $scriptDir = dirname(isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '');
    // If running in a subfolder like /vtu-script, include it; if at root, empty
    define('BASE_URL', rtrim($protocol . $host . $scriptDir, '/\\'));
}

// 4. TELECOM AIRTIME DISCOUNT MARGINS (Percentages given to users/resellers)
$AIRTIME_DISCOUNTS = [
    'MTN'     => 2.5, // 2.5% discount
    'AIRTEL'  => 3.0, // 3.0% discount
    'GLO'     => 4.0, // 4.0% discount
    '9MOBILE' => 4.5  // 4.5% discount
];

// 5. UPSTREAM TELECOM VENDING GATEWAY (Payflex / Peyflex / Clubkonnect)
define('VTU_GATEWAY',           'PAYFLEX'); // Options: PAYFLEX, SIMULATION
define('PAYFLEX_BASE_URL',      'https://client.peyflex.com.ng/api');
define('PAYFLEX_API_KEY',       '42e5cd304b2a6f1b3de3e52a20eb0d812f8d5b31');

// 6. AUTOMATED PAYMENT GATEWAYS (Monnify / Payvessel)
define('MONNIFY_API_KEY',       '');
define('MONNIFY_SECRET_KEY',    '');
define('MONNIFY_CONTRACT_CODE', '');
define('PAYVESSEL_API_KEY',     '');
define('PAYVESSEL_SECRET',      '');

// 7. SESSION TIMEOUT & SECURITY
define('SESSION_LIFETIME', 86400 * 7); // 7 days
define('PASSWORD_MIN_LENGTH', 6);
define('PIN_LENGTH', 4);

// Helper function to safely output config values
function app_config($key, $default = '') {
    if (defined($key)) {
        return constant($key);
    }
    return $default;
}
