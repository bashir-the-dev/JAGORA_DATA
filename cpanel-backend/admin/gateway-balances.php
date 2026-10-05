<?php
/**
 * ==============================================================================
 * ADMIN - LIVE UPSTREAM GATEWAY FLOAT BALANCES
 * Queries Payflex, ClubKonnect, etc. directly via their official REST APIs
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminUser($pdo);

$results = [];

// 1. PAYFLEX (PEYFLEX) - Primary Wholesale Telecom Gateway
$pfStart = microtime(true);
$payflexKey = defined('PAYFLEX_API_KEY') ? PAYFLEX_API_KEY : '';
$payflexBase = defined('PAYFLEX_BASE_URL') ? PAYFLEX_BASE_URL : 'https://client.peyflex.com.ng/api';

if (!empty($payflexKey) && !str_starts_with($payflexKey, 'YOUR_')) {
    $pfRes = callPayflex('wallet/balance/', [], 'GET');
    $pfLatency = (int)((microtime(true) - $pfStart) * 1000);
    
    // Payflex returns: {"user_id":14282,"email":"...","wallet_credit":"204.00"}
    $numericBal = (float)($pfRes['wallet_credit'] ?? $pfRes['balance'] ?? $pfRes['wallet'] ?? 0);
    $isDegraded = !empty($pfRes['error']) || (($pfRes['http_code'] ?? 200) >= 400);

    $results[] = [
        'id' => 'payflex',
        'name' => 'Payflex (Peyflex) Wholesale Gateway',
        'badge' => 'PF',
        'balance' => $numericBal,
        'currency' => 'NGN',
        'status' => $isDegraded ? 'degraded' : 'active',
        'rawResponse' => $pfRes,
        'endpointUrl' => $payflexBase,
        'maskedKey' => substr($payflexKey, 0, 8) . '••••••••' . substr($payflexKey, -4),
        'lastChecked' => date('h:i:s A'),
        'latencyMs' => $pfLatency,
        'fundingAccount' => [
            'bankName' => 'Wema Bank / Sterling Bank',
            'accountNumber' => 'Available on Peyflex Portal',
            'accountName' => 'Peyflex / Jagora Telecom',
            'portalUrl' => 'https://client.peyflex.com.ng/',
            'instructions' => 'Log in to your Peyflex wholesale merchant portal to top up your dedicated automated virtual funding account.'
        ]
    ];
} else {
    $results[] = [
        'id' => 'payflex',
        'name' => 'Payflex (Peyflex) Wholesale Gateway',
        'badge' => 'PF',
        'balance' => 0.0,
        'currency' => 'NGN',
        'status' => 'unconfigured',
        'endpointUrl' => $payflexBase,
        'maskedKey' => 'Unconfigured API Key',
        'lastChecked' => 'Never',
        'latencyMs' => 0,
        'fundingAccount' => [
            'bankName' => 'Wema Bank / Sterling Bank',
            'accountNumber' => 'Available on Peyflex Portal',
            'accountName' => 'Peyflex / Jagora Telecom',
            'portalUrl' => 'https://client.peyflex.com.ng/',
            'instructions' => 'Configure PAYFLEX_API_KEY in config.php.'
        ]
    ];
}

// 2. CLUBKONNECT - Secondary Backup Gateway
$ckStart = microtime(true);
$ckKey = defined('CLUBKONNECT_API_KEY') ? CLUBKONNECT_API_KEY : '';
$ckUser = defined('CLUBKONNECT_USER_ID') ? CLUBKONNECT_USER_ID : '';
$ckBase = defined('CLUBKONNECT_BASE_URL') ? CLUBKONNECT_BASE_URL : 'https://www.clubkonnect.com/API';

if (!empty($ckKey) && !str_starts_with($ckKey, 'YOUR_') && !empty($ckUser)) {
    $ckRes = callClubKonnect('Balance.asp', []);
    $ckLatency = (int)((microtime(true) - $ckStart) * 1000);
    $numericBal = (float)($ckRes['balance'] ?? $ckRes['wallet'] ?? 0);

    $results[] = [
        'id' => 'clubkonnect',
        'name' => 'ClubKonnect Gateway',
        'badge' => 'CK',
        'balance' => $numericBal,
        'currency' => 'NGN',
        'status' => empty($ckRes['error']) ? 'active' : 'offline',
        'rawResponse' => $ckRes,
        'endpointUrl' => $ckBase,
        'maskedKey' => substr($ckKey, 0, 4) . '••••••••',
        'lastChecked' => date('h:i:s A'),
        'latencyMs' => $ckLatency,
        'fundingAccount' => [
            'bankName' => 'Providus / Moniepoint',
            'accountNumber' => 'Available on ClubKonnect Portal',
            'accountName' => 'ClubKonnect Wallet',
            'portalUrl' => 'https://www.clubkonnect.com/',
            'instructions' => 'Fund wallet via dedicated wallet bank transfer.'
        ]
    ];
} else {
    $results[] = [
        'id' => 'clubkonnect',
        'name' => 'ClubKonnect Gateway',
        'badge' => 'CK',
        'balance' => 0.0,
        'currency' => 'NGN',
        'status' => 'unconfigured',
        'endpointUrl' => $ckBase,
        'maskedKey' => 'Standby / Unconfigured',
        'lastChecked' => 'Standby',
        'latencyMs' => 0,
        'fundingAccount' => [
            'bankName' => 'Providus / Moniepoint',
            'accountNumber' => 'Available on ClubKonnect Portal',
            'accountName' => 'ClubKonnect Wallet',
            'portalUrl' => 'https://www.clubkonnect.com/',
            'instructions' => 'Add CLUBKONNECT_API_KEY and CLUBKONNECT_USER_ID in config.php.'
        ]
    ];
}

// 3. HUSMODATA - Standby Gateway
$results[] = [
    'id' => 'husmodata',
    'name' => 'HusmoData API',
    'badge' => 'HD',
    'balance' => 0.0,
    'currency' => 'NGN',
    'status' => 'unconfigured',
    'endpointUrl' => 'https://api.husmodata.com/v1',
    'maskedKey' => 'Standby / Secondary Backup',
    'lastChecked' => 'Standby',
    'latencyMs' => 0,
    'fundingAccount' => [
        'bankName' => 'Wema Bank',
        'accountNumber' => 'Available on HusmoData Portal',
        'accountName' => 'HusmoData Vendor',
        'portalUrl' => 'https://husmodata.com/',
        'instructions' => 'Deposit into your assigned HusmoData reserve account.'
    ]
];

// 4. VTPASS - Standby Direct Bills Gateway
$results[] = [
    'id' => 'vtpass',
    'name' => 'VTPass Direct Backup',
    'badge' => 'VP',
    'balance' => 0.0,
    'currency' => 'NGN',
    'status' => 'unconfigured',
    'endpointUrl' => 'https://api-service.vtpass.com/api',
    'maskedKey' => 'Standby / Direct Bills Fallback',
    'lastChecked' => 'Standby',
    'latencyMs' => 0,
    'fundingAccount' => [
        'bankName' => 'Stanbic IBTC / Providus',
        'accountNumber' => 'Available on VTPass Portal',
        'accountName' => 'VTPass Wallet',
        'portalUrl' => 'https://vtpass.com/',
        'instructions' => 'Transfer funds to your VTPass corporate wallet.'
    ]
];

$totalLiveFloat = 0.0;
foreach ($results as $gw) {
    $totalLiveFloat += (float)($gw['balance'] ?? 0);
}

jsonResponse([
    'status' => 'success',
    'success' => true,
    'data' => [
        'gateways' => $results,
        'totalLiveFloat' => $totalLiveFloat,
        'queriedAt' => date('c')
    ]
]);
