<?php
/**
 * ==============================================================================
 * AUTH - USER REFERRALS & COMMISSION STATS
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
ensureUserColumns($pdo);

$userId = (int)$user['id'];
$userPhone = $user['phone'];
$userCode = $user['referral_code'] ?? '';

// If referral code is missing, generate and persist one
if (empty($userCode)) {
    $userCode = !empty($user['username']) && strlen($user['username']) <= 8
        ? strtoupper($user['username'])
        : 'AJD' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

    $up = $pdo->prepare("UPDATE users SET referral_code = ? WHERE id = ?");
    $up->execute([$userCode, $userId]);
}

// Fetch all referred friends
$stmt = $pdo->prepare("
    SELECT id, name, phone, referral_rewarded, created_at
    FROM users
    WHERE referred_by = ? OR referred_by = ?
    ORDER BY id DESC
");
$stmt->execute([$userCode, $userPhone]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$completedCount = 0;
$pendingCount = 0;
$COMMISSION_AMOUNT = 50.00;

$referralsList = [];
foreach ($rows as $row) {
    $isRewardPaid = !empty($row['referral_rewarded']);
    if ($isRewardPaid) {
        $completedCount++;
    } else {
        $pendingCount++;
    }

    // Mask name: "Ibrahim S."
    $nameParts = preg_split('/\s+/', trim($row['name'] ?: 'Friend'));
    $maskedName = count($nameParts) > 1
        ? $nameParts[0] . ' ' . strtoupper(substr(end($nameParts), 0, 1)) . '.'
        : $nameParts[0];

    // Mask phone: "0803***123"
    $cleanP = preg_replace('/[^0-9]/', '', $row['phone']);
    $maskedPhone = strlen($cleanP) >= 7
        ? substr($cleanP, 0, 4) . '***' . substr($cleanP, -3)
        : $cleanP;

    $referralsList[] = [
        'id'          => (string)$row['id'],
        'name'        => $maskedName,
        'phone'       => $maskedPhone,
        'date'        => $row['created_at'],
        'status'      => $isRewardPaid ? 'COMPLETED' : 'PENDING',
        'bonusEarned' => $isRewardPaid ? $COMMISSION_AMOUNT : 0
    ];
}

$domain = defined('APP_DOMAIN') ? APP_DOMAIN : ($_SERVER['HTTP_HOST'] ?? 'alaminjagora.ng');
$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$referralLink = "{$proto}://{$domain}/register?ref={$userCode}";

$bonusBalance = (float)($user['bonus_balance'] ?? 0.00);

jsonResponse([
    'status'  => 'success',
    'message' => 'Referrals data loaded successfully',
    'data'    => [
        'referralCode' => $userCode,
        'referralLink' => $referralLink,
        'stats'        => [
            'totalReferrals'        => count($rows),
            'completedReferrals'    => $completedCount,
            'pendingReferrals'      => $pendingCount,
            'bonusEarned'           => (float)($completedCount * $COMMISSION_AMOUNT),
            'bonusBalance'          => $bonusBalance,
            'commissionPerReferral' => $COMMISSION_AMOUNT
        ],
        'referrals'    => $referralsList
    ]
]);
