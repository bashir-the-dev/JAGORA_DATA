<?php
/**
 * ============================================================================
 * VTU SCRIPT - ADMIN SETTINGS & API CONFIGURATION (admin/settings.php)
 * ============================================================================
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

$pdo = get_db_connection();
$message = '';

// Test Upstream Connection
$apiCheckStatus = null;
if (isset($_GET['test_api'])) {
    $ch = curl_init(PAYFLEX_BASE_URL . '/user/');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Token ' . PAYFLEX_API_KEY]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $apiCheckStatus = [
        'code' => $code,
        'response' => json_decode($res, true) ?: $res
    ];
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#071838] text-slate-100 antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API & Gateway Settings | <?= htmlspecialchars(APP_NAME) ?> Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full flex flex-col bg-[#071838]">

<header class="bg-[#050f24] border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-xs uppercase tracking-wider">Admin</span>
            <span class="font-bold text-white text-base">API Keys & Global Settings</span>
        </div>
        <nav class="flex items-center gap-4 text-xs font-semibold">
            <a href="index.php" class="text-slate-300 hover:text-white">&larr; Back to Overview</a>
            <a href="users.php" class="text-slate-300 hover:text-white">Users</a>
            <a href="transactions.php" class="text-slate-300 hover:text-white">Transactions</a>
        </nav>
    </div>
</header>

<main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
    <div>
        <h1 class="text-2xl font-black text-white">System & API Configuration</h1>
        <p class="text-xs text-slate-400 mt-1">
            Review active upstream credentials, test live connectivity, and adjust retail discounts
        </p>
    </div>

    <!-- Live cPanel Edit Guide Card -->
    <div class="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/30 text-blue-200 space-y-2">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>💡</span>
            <span>Direct cPanel File Manager Configuration</span>
        </h3>
        <p class="text-xs leading-relaxed text-blue-300">
            For maximum security and instant updates on your shared hosting server, core variables are managed directly in:
            <code class="bg-blue-900/60 px-2 py-0.5 rounded text-amber-300 font-mono">config/app_config.php</code>.
            Open this file in cPanel File Manager to edit company name, support phone, WhatsApp, location (Katsina / Kano), and live API keys.
        </p>
    </div>

    <!-- 1. Telecom Upstream API (Peyflex / Payflex) -->
    <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-base font-bold text-white uppercase tracking-wider">1. Upstream VTU Gateway (Peyflex)</h2>
                <span class="text-xs text-slate-400">Endpoint: <?= htmlspecialchars(PAYFLEX_BASE_URL) ?></span>
            </div>
            <a href="?test_api=1" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition">
                ⚡ Test API Connection
            </a>
        </div>

        <?php if ($apiCheckStatus): ?>
            <div class="p-4 rounded-2xl bg-[#071838] border <?= $apiCheckStatus['code'] === 200 ? 'border-emerald-500/30 text-emerald-300' : 'border-amber-500/30 text-amber-300' ?> text-xs space-y-2">
                <span class="font-bold">HTTP Status: <?= $apiCheckStatus['code'] ?></span>
                <pre class="overflow-x-auto text-[11px] p-2 bg-slate-900/80 rounded-lg text-slate-200"><?= htmlspecialchars(print_r($apiCheckStatus['response'], true)) ?></pre>
            </div>
        <?php endif; ?>

        <div class="space-y-3 text-xs">
            <div>
                <span class="text-[10px] text-slate-400 uppercase block mb-1">Active Authorization Token</span>
                <input type="text" readonly value="<?= htmlspecialchars(PAYFLEX_API_KEY) ?>" class="w-full px-4 py-2.5 rounded-xl bg-[#071838] border border-slate-700 text-amber-300 font-mono text-xs">
            </div>
            <div>
                <span class="text-[10px] text-slate-400 uppercase block mb-1">Gateway Mode</span>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <?= htmlspecialchars(VTU_GATEWAY) ?>
                </span>
            </div>
        </div>
    </div>

    <!-- 2. Active Airtime Discount Margins -->
    <div id="margins" class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-4">
        <h2 class="text-base font-bold text-white uppercase tracking-wider">2. Airtime Customer Cashback Margins</h2>
        <p class="text-xs text-slate-400">Current percentage discounts deducted on checkout:</p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <?php foreach ($AIRTIME_DISCOUNTS as $net => $disc): ?>
                <div class="p-4 rounded-2xl bg-[#071838] border border-slate-700 text-center space-y-1">
                    <span class="font-bold text-white text-sm block"><?= $net ?></span>
                    <span class="text-xl font-black text-emerald-400"><?= $disc ?>%</span>
                    <span class="text-[10px] text-slate-500 block">Instant Discount</span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- 3. Company & Location Info -->
    <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-4">
        <h2 class="text-base font-bold text-white uppercase tracking-wider">3. Brand & Contact Information (Current Values)</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-[#071838] border border-slate-700/80">
                <span class="text-[10px] text-slate-400 block uppercase">Site / App Name</span>
                <strong class="text-white"><?= htmlspecialchars(APP_NAME) ?></strong>
            </div>
            <div class="p-3.5 rounded-xl bg-[#071838] border border-slate-700/80">
                <span class="text-[10px] text-slate-400 block uppercase">Support Phone</span>
                <strong class="text-white"><?= htmlspecialchars(SUPPORT_PHONE) ?></strong>
            </div>
            <div class="p-3.5 rounded-xl bg-[#071838] border border-slate-700/80">
                <span class="text-[10px] text-slate-400 block uppercase">Office Location</span>
                <strong class="text-amber-400"><?= htmlspecialchars(OFFICE_ADDRESS) ?></strong>
            </div>
            <div class="p-3.5 rounded-xl bg-[#071838] border border-slate-700/80">
                <span class="text-[10px] text-slate-400 block uppercase">WhatsApp Line</span>
                <strong class="text-emerald-400">+<?= htmlspecialchars(WHATSAPP_NUMBER) ?></strong>
            </div>
        </div>
    </div>
</main>

</body>
</html>
