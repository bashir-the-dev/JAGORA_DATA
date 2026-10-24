<?php
/**
 * ==============================================================================
 * AJDATASUB - CENTRAL VTU TRANSACTION WIZARD DISPATCHER
 * ==============================================================================
 * Authoritative PHP router and processor for all Virtual Top-Up (VTU) services:
 * - Data Bundles (SME, CG, Direct)
 * - Airtime VTU & Share 'N Sell
 * - Cable TV Subscriptions (DStv, GOtv, StarTimes, Showmax)
 * - Electricity Recharges & STS Prepaid Tokens (IKEDC, EKEDC, AEDC, KEDCO, etc.)
 * - Examination Result Tokens (WAEC, NECO, NABTEB, JAMB)
 * - Recharge PIN (e-PIN) Wholesale Printing
 * - Data Card Scratch Voucher Printing
 *
 * Guarantees each VTU service progresses through its dedicated wizard flow to completion.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();

// Handle GET requests: Return service wizard configuration, active statuses, and step metadata
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $requestedService = strtolower(trim($_GET['service'] ?? $_GET['serviceType'] ?? $_GET['type'] ?? ''));

    $serviceCatalog = [
        'data' => [
            'id' => 'data',
            'title' => 'Buy Data',
            'category' => 'Telecom',
            'active' => isServiceEnabled('data', $pdo),
            'networks' => [
                ['name' => 'MTN (Gifting)', 'identifier' => 'mtn_gifting_data', 'carrier' => 'mtn'],
                ['name' => 'GLO DATA (CG)', 'identifier' => 'glo_data', 'carrier' => 'glo'],
                ['name' => '9MOBILE (CG)', 'identifier' => '9mobile_data', 'carrier' => '9mobile'],
                ['name' => 'AIRTEL (GIFTING)', 'identifier' => 'airtel_data', 'carrier' => 'airtel'],
                ['name' => 'MTN (Data Share)', 'identifier' => 'mtn_data_share', 'carrier' => 'mtn']
            ],
            'steps' => [
                1 => ['key' => 'network', 'title' => 'Select Data Network', 'options' => ['mtn_gifting_data', 'glo_data', '9mobile_data', 'airtel_data', 'mtn_data_share']],
                2 => ['key' => 'plans', 'title' => 'Select Data Plan', 'endpoint' => '/api/vtu/plans'],
                3 => ['key' => 'recipient', 'title' => 'Recipient Phone Number', 'type' => 'phone'],
                4 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ],
        'airtime' => [
            'id' => 'airtime',
            'title' => 'Buy Airtime',
            'category' => 'Telecom',
            'active' => isServiceEnabled('airtime', $pdo),
            'discount' => 2.5,
            'steps' => [
                1 => ['key' => 'network', 'title' => 'Select Telecom Network', 'options' => ['mtn', 'airtel', 'glo', '9mobile']],
                2 => ['key' => 'airtime_type', 'title' => 'Select Airtime Protocol', 'options' => ['VTU', 'SNS']],
                3 => ['key' => 'amount', 'title' => 'Enter Amount (₦50 - ₦50,000)', 'min' => 50, 'max' => 50000],
                4 => ['key' => 'recipient', 'title' => 'Recipient Phone Number', 'type' => 'phone'],
                5 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ],
        'cable' => [
            'id' => 'cable',
            'title' => 'Cable TV Subscription',
            'category' => 'Bills',
            'active' => isServiceEnabled('cable', $pdo),
            'providers' => ['dstv', 'gotv', 'startimes', 'showmax'],
            'steps' => [
                1 => ['key' => 'provider', 'title' => 'Select Cable TV Provider', 'options' => ['gotv', 'dstv', 'startimes', 'showmax']],
                2 => ['key' => 'duration', 'title' => 'Select Subscription Duration', 'options' => ['monthly', 'quarterly', 'annual']],
                3 => ['key' => 'bouquet', 'title' => 'Select Bouquet Package', 'type' => 'bouquet_catalog'],
                4 => ['key' => 'smartcard', 'title' => 'Smartcard / IUC Number', 'type' => 'smartcard', 'verify_endpoint' => '/api/vtu/verify-biller'],
                5 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ],
        'electricity' => [
            'id' => 'electricity',
            'title' => 'Electricity Bill Payment',
            'category' => 'Bills',
            'active' => isServiceEnabled('electricity', $pdo),
            'discos' => ['kedco', 'aedc', 'ikedc', 'ekedc', 'ibedc', 'phed', 'eedc', 'kaedco', 'jed', 'bedc'],
            'steps' => [
                1 => ['key' => 'disco', 'title' => 'Select Electricity Distribution Co.', 'options' => ['kedco', 'aedc', 'ikedc', 'ekedc', 'ibedc', 'phed', 'eedc', 'kaedco', 'jed', 'bedc']],
                2 => ['key' => 'meter_type', 'title' => 'Select Meter Type', 'options' => ['prepaid', 'postpaid']],
                3 => ['key' => 'amount', 'title' => 'Enter Recharge Amount', 'min' => 500, 'max' => 100000],
                4 => ['key' => 'meter_number', 'title' => 'Meter / Account Number', 'type' => 'meter', 'verify_endpoint' => '/api/vtu/verify-biller'],
                5 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ],
        'exam' => [
            'id' => 'exam',
            'title' => 'Exam Scratch Cards & PINs',
            'category' => 'Education',
            'active' => isServiceEnabled('exam', $pdo),
            'exam_types' => ['waec', 'neco', 'nabteb', 'jamb'],
            'steps' => [
                1 => ['key' => 'exam_type', 'title' => 'Select Examination Board', 'options' => ['waec', 'neco', 'nabteb', 'jamb']],
                2 => ['key' => 'pin_type', 'title' => 'Select Purpose', 'options' => ['result_checker', 'registration']],
                3 => ['key' => 'quantity', 'title' => 'Select Number of Tokens', 'min' => 1, 'max' => 10],
                4 => ['key' => 'candidate_phone', 'title' => 'Candidate Phone Number (SMS Delivery)', 'type' => 'phone'],
                5 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ],
        'recharge-pin' => [
            'id' => 'recharge-pin',
            'title' => 'Recharge PIN Printing',
            'category' => 'Printing',
            'active' => isServiceEnabled('recharge_pin', $pdo),
            'discount' => 2.0,
            'steps' => [
                1 => ['key' => 'network', 'title' => 'Select Telecom Network', 'options' => ['mtn', 'airtel', 'glo', '9mobile']],
                2 => ['key' => 'voucher_type', 'title' => 'Select Voucher Format', 'options' => ['standard', 'custom_card']],
                3 => ['key' => 'denomination', 'title' => 'Denomination & Quantity', 'denominations' => [100, 200, 500, 1000]],
                4 => ['key' => 'business_name', 'title' => 'Merchant Business Name on Cards', 'type' => 'text'],
                5 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ],
        'data-card' => [
            'id' => 'data-card',
            'title' => 'Data Card Printing',
            'category' => 'Printing',
            'active' => isServiceEnabled('data_card', $pdo),
            'steps' => [
                1 => ['key' => 'network', 'title' => 'Select Telecom Network', 'options' => ['mtn', 'airtel', 'glo', '9mobile']],
                2 => ['key' => 'card_format', 'title' => 'Select Card Profile', 'options' => ['standard', 'premium']],
                3 => ['key' => 'data_size', 'title' => 'Select Data Bundle Size', 'sizes' => ['1.5GB', '2.0GB', '5.0GB']],
                4 => ['key' => 'business_name', 'title' => 'Business Header on Vouchers', 'type' => 'text'],
                5 => ['key' => 'confirm', 'title' => 'Review & Confirm Order', 'type' => 'confirm']
            ]
        ]
    ];

    if ($requestedService && isset($serviceCatalog[$requestedService])) {
        jsonResponse([
            'status' => 'success',
            'data' => $serviceCatalog[$requestedService]
        ]);
    }

    $sysMaint = false;
    try {
        $sysMaint = (bool)($pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'")->fetchColumn() === '1');
    } catch (\Throwable $t) {}

    jsonResponse([
        'status' => 'success',
        'data' => [
            'services' => $serviceCatalog,
            'systemMaintenance' => $sysMaint
        ]
    ]);
    exit;
}

// POST: Execute the specific VTU transaction based on serviceType
$body = getRequestBody();
$serviceType = strtolower(trim(
    $body['serviceType'] 
    ?? $body['service'] 
    ?? $body['type'] 
    ?? $body['category'] 
    ?? 'data'
));

// Normalize aliases
$serviceType = str_replace('_', '-', $serviceType);
if (in_array($serviceType, ['cable-tv', 'tv', 'cabletv'], true)) {
    $serviceType = 'cable';
} elseif (in_array($serviceType, ['meter', 'power', 'electric', 'nepa'], true)) {
    $serviceType = 'electricity';
} elseif (in_array($serviceType, ['exam-pin', 'scratch-card', 'waec', 'neco', 'jamb'], true)) {
    $serviceType = 'exam';
} elseif (in_array($serviceType, ['epin', 'recharge-cards', 'print-recharge'], true)) {
    $serviceType = 'recharge-pin';
} elseif (in_array($serviceType, ['datacard', 'print-data'], true)) {
    $serviceType = 'data-card';
}

// Dispatch to the authoritative, dedicated PHP service processor
switch ($serviceType) {
    case 'airtime':
        require __DIR__ . '/buy_airtime.php';
        break;

    case 'cable':
        require __DIR__ . '/buy_cable.php';
        break;

    case 'electricity':
        require __DIR__ . '/buy_electricity.php';
        break;

    case 'exam':
        require __DIR__ . '/buy_exam.php';
        break;

    case 'recharge-pin':
        require __DIR__ . '/recharge_pin.php';
        break;

    case 'data-card':
        require __DIR__ . '/data_card.php';
        break;

    case 'data':
    default:
        require __DIR__ . '/buy_data.php';
        break;
}
