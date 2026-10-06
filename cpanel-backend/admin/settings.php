<?php
/**
 * ==============================================================================
 * ADMIN - PLATFORM SETTINGS & BROADCASTS
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();

// GET: public settings read (used by frontend to display announcements)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $settingsPayload = Cache::remember('system_settings_public', 60, function() use ($pdo) {
        $rows = $pdo->query('SELECT setting_key, setting_value FROM system_settings')->fetchAll();
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r['setting_key']] = $r['setting_value'];
        }

        $outSettings = [
            'maintenanceMode' => ($settings['maintenance_mode'] ?? '0') === '1',
            'broadcastAnnouncement' => [
                'text'   => $settings['broadcast_text'] ?? '',
                'active' => ($settings['broadcast_active'] ?? '0') === '1',
                'type'   => $settings['broadcast_type'] ?? 'info',
            ],
            'discounts' => [
                'mtn'     => (float)($settings['airtime_discount_mtn'] ?? 2.5),
                'airtel'  => (float)($settings['airtime_discount_airtel'] ?? 2.0),
                'glo'     => (float)($settings['airtime_discount_glo'] ?? 3.0),
                '9mobile' => (float)($settings['airtime_discount_9mobile'] ?? 3.0),
            ],
            'referralSettings' => [
                'enabled'              => ($settings['referral_enabled'] ?? '1') === '1',
                'bonusAmount'          => (float)($settings['referral_bonus_amount'] ?? 50.00),
                'eligibilityDays'      => (int)($settings['referral_eligibility_days'] ?? 30),
                'minPurchaseAmount'    => (float)($settings['referral_min_purchase_amount'] ?? 100.00),
                'allowBonusWithdrawal' => ($settings['referral_allow_withdrawal'] ?? '1') === '1',
                'welcomeBonusEnabled'  => ($settings['referral_welcome_bonus_enabled'] ?? '0') === '1',
                'welcomeBonusAmount'   => (float)($settings['referral_welcome_bonus_amount'] ?? 0.00),
                'termsNotice'          => $settings['referral_terms_notice'] ?? 'Earn instant referral bonus when your referred friend completes their first qualifying purchase within 30 days.'
            ],
            'gatewaySwitches' => [
                'xixapay'     => ($settings['gateway_xixapay_active'] ?? '1') === '1',
                'payflex'     => ($settings['gateway_payflex_active'] ?? '1') === '1',
                'clubkonnect' => ($settings['gateway_clubkonnect_active'] ?? '1') === '1',
                'payvessel'   => ($settings['gateway_payvessel_active'] ?? '1') === '1',
                'monnify'     => ($settings['gateway_monnify_active'] ?? '1') === '1',
                'husmodata'   => ($settings['gateway_husmodata_active'] ?? '1') === '1',
            ],
            'serviceSwitches' => [
                'data'         => ($settings['service_data_active'] ?? '1') === '1',
                'airtime'      => ($settings['service_airtime_active'] ?? '1') === '1',
                'cable'        => ($settings['service_cable_active'] ?? '1') === '1',
                'electricity'  => ($settings['service_electricity_active'] ?? '1') === '1',
                'exam'         => ($settings['service_exam_active'] ?? '1') === '1',
                'recharge_pin' => ($settings['service_recharge_pin_active'] ?? '1') === '1',
                'data_card'    => ($settings['service_data_card_active'] ?? '1') === '1',
            ]
        ];

        return [
            'status'   => 'success',
            'success'  => true,
            'settings' => $outSettings,
            'data'     => $outSettings
        ];
    });

    jsonResponse($settingsPayload);
}

// POST: update settings (Admin only)
$admin = requireAdminUser($pdo);

$body = getRequestBody();

$upStmt = $pdo->prepare('
    INSERT INTO system_settings (setting_key, setting_value) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
');

// Handle Emergency Gateway Kill Switches (supports both bulk gatewaySwitches and single toggle)
if (isset($body['gateway'])) {
    $cleanGw = strtolower(preg_replace('/[^a-z0-9_]/', '', (string)$body['gateway']));
    if (!empty($cleanGw)) {
        $isActive = !empty($body['active']);
        $upStmt->execute(["gateway_{$cleanGw}_active", $isActive ? '1' : '0']);
    }
}
if (isset($body['gatewaySwitches']) && is_array($body['gatewaySwitches'])) {
    foreach ($body['gatewaySwitches'] as $gw => $isActive) {
        $cleanGw = strtolower(preg_replace('/[^a-z0-9_]/', '', (string)$gw));
        if (!empty($cleanGw)) {
            $upStmt->execute(["gateway_{$cleanGw}_active", $isActive ? '1' : '0']);
        }
    }
}

// Handle Service Delivery Kill Switches (supports both bulk serviceSwitches and single toggle)
if (isset($body['service'])) {
    $cleanSvc = strtolower(preg_replace('/[^a-z0-9_]/', '', (string)$body['service']));
    if (!empty($cleanSvc)) {
        $isActive = isset($body['serviceActive']) ? !empty($body['serviceActive']) : !empty($body['active']);
        $upStmt->execute(["service_{$cleanSvc}_active", $isActive ? '1' : '0']);
    }
}
if (isset($body['serviceSwitches']) && is_array($body['serviceSwitches'])) {
    foreach ($body['serviceSwitches'] as $svc => $isActive) {
        $cleanSvc = strtolower(preg_replace('/[^a-z0-9_]/', '', (string)$svc));
        if (!empty($cleanSvc)) {
            $upStmt->execute(["service_{$cleanSvc}_active", $isActive ? '1' : '0']);
        }
    }
}

// Handle Telecom Airtime Discounts
if (isset($body['discounts']) && is_array($body['discounts'])) {
    foreach ($body['discounts'] as $net => $discVal) {
        $cleanNet = strtolower(preg_replace('/[^a-z0-9_]/', '', (string)$net));
        if (!empty($cleanNet)) {
            $upStmt->execute(["airtime_discount_{$cleanNet}", (string)max(0, (float)$discVal)]);
        }
    }
}
if (isset($body['airtimeDiscounts']) && is_array($body['airtimeDiscounts'])) {
    foreach ($body['airtimeDiscounts'] as $net => $discVal) {
        $cleanNet = strtolower(preg_replace('/[^a-z0-9_]/', '', (string)$net));
        if (!empty($cleanNet)) {
            $upStmt->execute(["airtime_discount_{$cleanNet}", (string)max(0, (float)$discVal)]);
        }
    }
}

if (isset($body['maintenanceMode'])) {
    $upStmt->execute(['maintenance_mode', $body['maintenanceMode'] ? '1' : '0']);
}

if (isset($body['broadcastText'])) {
    $upStmt->execute(['broadcast_text', trim($body['broadcastText'])]);
}

if (isset($body['broadcastActive'])) {
    $upStmt->execute(['broadcast_active', $body['broadcastActive'] ? '1' : '0']);
}

if (isset($body['broadcastType'])) {
    $upStmt->execute(['broadcast_type', trim($body['broadcastType'])]);
}

// Handle referral program configuration
if (isset($body['referralSettings']) && is_array($body['referralSettings'])) {
    $r = $body['referralSettings'];
    if (isset($r['enabled'])) {
        $upStmt->execute(['referral_enabled', $r['enabled'] ? '1' : '0']);
    }
    if (isset($r['bonusAmount'])) {
        $upStmt->execute(['referral_bonus_amount', number_format(max(0, (float)$r['bonusAmount']), 2, '.', '')]);
    }
    if (isset($r['eligibilityDays'])) {
        $upStmt->execute(['referral_eligibility_days', (string)max(0, (int)$r['eligibilityDays'])]);
    }
    if (isset($r['minPurchaseAmount'])) {
        $upStmt->execute(['referral_min_purchase_amount', number_format(max(0, (float)$r['minPurchaseAmount']), 2, '.', '')]);
    }
    if (isset($r['allowBonusWithdrawal'])) {
        $upStmt->execute(['referral_allow_withdrawal', $r['allowBonusWithdrawal'] ? '1' : '0']);
    }
    if (isset($r['welcomeBonusEnabled'])) {
        $upStmt->execute(['referral_welcome_bonus_enabled', $r['welcomeBonusEnabled'] ? '1' : '0']);
    }
    if (isset($r['welcomeBonusAmount'])) {
        $upStmt->execute(['referral_welcome_bonus_amount', number_format(max(0, (float)$r['welcomeBonusAmount']), 2, '.', '')]);
    }
    if (isset($r['termsNotice'])) {
        $upStmt->execute(['referral_terms_notice', trim($r['termsNotice'])]);
    }
}

// Sync to settings table platform_info for unified multi-client visibility
try {
    $pRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'platform_info' LIMIT 1")->fetch();
    $pInfo = $pRow ? json_decode($pRow['value_json'], true) : [];
    if (isset($body['maintenanceMode'])) $pInfo['maintenanceMode'] = !empty($body['maintenanceMode']);
    if (isset($body['broadcastText'])) {
        if (!isset($pInfo['broadcastAnnouncement'])) $pInfo['broadcastAnnouncement'] = [];
        $pInfo['broadcastAnnouncement']['text'] = trim($body['broadcastText']);
    }
    if (isset($body['broadcastActive'])) {
        if (!isset($pInfo['broadcastAnnouncement'])) $pInfo['broadcastAnnouncement'] = [];
        $pInfo['broadcastAnnouncement']['active'] = !empty($body['broadcastActive']);
    }
    if (isset($body['broadcastType'])) {
        if (!isset($pInfo['broadcastAnnouncement'])) $pInfo['broadcastAnnouncement'] = [];
        $pInfo['broadcastAnnouncement']['type'] = trim($body['broadcastType']);
    }
    $pJson = json_encode($pInfo);
    $syncPStmt = $pdo->prepare("INSERT INTO settings (key_name, value_json) VALUES ('platform_info', ?) ON DUPLICATE KEY UPDATE value_json = ?");
    $syncPStmt->execute([$pJson, $pJson]);
} catch (\Throwable $t) {}

// Invalidate settings and plan caches upon administrative changes
Cache::forget('system_settings_public');
Cache::forget('platform_settings');
Cache::forget('pricing_settings');
Cache::flush('vtu_plans');

jsonResponse([
    'status'  => 'success',
    'message' => 'Platform settings updated successfully.'
]);
