<?php
/**
 * ==============================================================================
 * VTU - STRICT PEYFLEX DATA NETWORKS ENDPOINT
 * Directly mirrors curl 'https://client.peyflex.com.ng/api/data/networks/'
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

header('Content-Type: application/json; charset=utf-8');

$authoritativeNetworks = [
    [
        'name'        => 'MTN (Gifting)',
        'identifier'  => 'mtn_gifting_data',
        'carrier'     => 'mtn',
        'badge'       => 'M',
        'badgeColor'  => '#ffdb3c',
        'textColor'   => '#ffdb3c',
        'bgColor'     => 'rgba(255, 219, 60, 0.1)',
        'category'    => 'Gifting Data'
    ],
    [
        'name'        => 'GLO DATA (CG)',
        'identifier'  => 'glo_data',
        'carrier'     => 'glo',
        'badge'       => 'G',
        'badgeColor'  => '#34a853',
        'textColor'   => '#00c853',
        'bgColor'     => 'rgba(0, 200, 83, 0.1)',
        'category'    => 'Corporate Gifting'
    ],
    [
        'name'        => '9MOBILE (CG)',
        'identifier'  => '9mobile_data',
        'carrier'     => '9mobile',
        'badge'       => '9',
        'badgeColor'  => '#006400',
        'textColor'   => '#4caf50',
        'bgColor'     => 'rgba(76, 175, 80, 0.1)',
        'category'    => 'Corporate Gifting'
    ],
    [
        'name'        => 'AIRTEL (GIFTING)',
        'identifier'  => 'airtel_data',
        'carrier'     => 'airtel',
        'badge'       => 'A',
        'badgeColor'  => '#ffb4ab',
        'textColor'   => '#ff5252',
        'bgColor'     => 'rgba(255, 82, 82, 0.1)',
        'category'    => 'Gifting Data'
    ],
    [
        'name'        => 'MTN (Data Share)',
        'identifier'  => 'mtn_data_share',
        'carrier'     => 'mtn',
        'badge'       => 'M',
        'badgeColor'  => '#ffdb3c',
        'textColor'   => '#ffdb3c',
        'bgColor'     => 'rgba(255, 219, 60, 0.1)',
        'category'    => 'Data Share'
    ]
];

// Return JSON format strictly compatible with Peyflex curl and enriched for dashboard
echo json_encode([
    'status'   => 'success',
    'success'  => true,
    'networks' => $authoritativeNetworks,
    'data'     => $authoritativeNetworks
], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
exit;

