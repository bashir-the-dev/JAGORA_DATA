<?php
/**
 * ==============================================================================
 * VTU - VERIFY BILLER (NEPA Meter Number & Cable IUC)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
authenticateUser($pdo); // Require login to prevent API scraping

$body = getRequestBody();
$serviceType = trim($_GET['service'] ?? $_GET['type'] ?? $body['serviceType'] ?? $body['service'] ?? $body['type'] ?? 'meter'); // 'meter' or 'cable'
$provider    = trim($_GET['provider'] ?? $_GET['disco'] ?? $body['provider'] ?? $body['disco'] ?? 'IKEDC');
$rawIdentifier = $_GET['number'] ?? $_GET['iuc'] ?? $body['identifier'] ?? $body['number'] ?? $body['iuc'] ?? '';
$identifier  = preg_replace('/[^0-9]/', '', (string)$rawIdentifier);

if (empty($identifier)) {
    jsonResponse([
        'status'  => 'error',
        'success' => false,
        'message' => 'Please provide meter number or smartcard / IUC number.'
    ], 400);
}

// Check Payflex live verification if API key is configured
$isCable = (strtolower($serviceType) === 'cable') || in_array(strtolower($provider), ['gotv', 'dstv', 'startimes', 'showmax'], true);
$payflexKey = defined('PAYFLEX_API_KEY') ? PAYFLEX_API_KEY : '';

if (!empty($payflexKey) && !str_starts_with($payflexKey, 'YOUR_')) {
    if ($isCable) {
        $normProv = strtolower($provider);
        $pfProv = ($normProv === 'showmax') ? 'dstv' : (($normProv === 'startimes') ? 'startimes' : (($normProv === 'gotv') ? 'gotv' : 'dstv'));
        $pfRes = callPayflex('cable/verify', [
            'iuc'        => $identifier,
            'identifier' => $pfProv
        ]);
        if (!empty($pfRes['customer_name'])) {
            $cName = ($pfRes['customer_name'] !== 'UNKNOWN') ? $pfRes['customer_name'] : ("Valid " . strtoupper($pfProv) . " Smartcard ({$identifier})");
            jsonResponse([
                'status'       => 'success',
                'success'      => true,
                'customerName' => $cName,
                'identifier'   => $identifier,
                'provider'     => strtoupper($pfProv),
                'verified'     => true,
                'data'         => $pfRes
            ]);
        }
    } else {
        $discoMap = [
            'ikedc' => 'ikeja-electric', 'ekedc' => 'eko-electric', 'aedc' => 'abuja-electric',
            'ibedc' => 'ibadan-electric', 'kedco' => 'kano-electric', 'kaedco' => 'kaduna-electric',
            'eedc' => 'enugu-electric', 'phed' => 'portharcourt-electric', 'jed' => 'jos-electric',
            'bedc' => 'benin-electric', 'yedc' => 'yola-electric', 'aba' => 'aba-electric'
        ];
        $pfPlan = $discoMap[strtolower($provider)] ?? 'kano-electric';
        $meterType = strtolower($body['meterType'] ?? $body['meter_type'] ?? $_GET['meterType'] ?? 'prepaid');
        $pfRes = callPayflex('electricity/verify', [
            'identifier' => 'electricity',
            'meter'      => $identifier,
            'plan'       => $pfPlan,
            'type'       => $meterType
        ], 'GET');
        if (!empty($pfRes['customer_name'])) {
            $cName = (strtolower($pfRes['customer_name']) !== 'unknown') ? $pfRes['customer_name'] : ("Verified Active Meter ({$identifier})");
            jsonResponse([
                'status'       => 'success',
                'success'      => true,
                'customerName' => $cName,
                'identifier'   => $identifier,
                'provider'     => strtoupper($provider),
                'verified'     => true,
                'data'         => $pfRes
            ]);
        }
    }
}

// Check upstream verification if API token is configured
if (VTU_API_TOKEN !== 'YOUR_WHOLESALE_API_TOKEN_HERE' && !empty(VTU_API_TOKEN)) {
    $endpoint = ($serviceType === 'cable') ? 'cable/validate/' : 'bill/validate/';
    $verifyPayload = [
        'service'    => $provider,
        'account_id' => $identifier
    ];
    $upstream = dispatchToUpstreamVtu($endpoint, $verifyPayload);
    if ($upstream['success'] && !empty($upstream['data']['customer_name'])) {
        jsonResponse([
            'status'       => 'success',
            'success'      => true,
            'customerName' => $upstream['data']['customer_name'],
            'identifier'   => $identifier,
            'provider'     => $provider,
            'verified'     => true
        ]);
    }
}

// If real-world verification fails, return clear unverified status (never fabricate fake customer names)
jsonResponse([
    'status'   => 'error',
    'success'  => false,
    'verified' => false,
    'message'  => 'Customer identifier could not be verified by the utility operator. Please confirm your smartcard or meter number and try again.'
], 404);
