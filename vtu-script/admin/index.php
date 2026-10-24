<?php
/**
 * ============================================================================
 * VTU SCRIPT - ADMIN DASHBOARD & OVERVIEW (admin/index.php)
 * ============================================================================
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pdo = get_db_connection();

// Compute stats
$totalUsers = 0;
$totalWalletFloat = 0;
$totalSales = 0;
$recentOrders = [];

if ($pdo) {
    try {
        $uStmt = $pdo->query("SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as float_balance FROM users");
        $uRes = $uStmt->fetch();
        $totalUsers = (int)($uRes['count'] ?? 0);
        $totalWalletFloat = (float)($uRes['float_balance'] ?? 0);

        $sStmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'SUCCESS' AND service_type != 'wallet_fund'");
        $totalSales = (float)($sStmt->fetch()['total'] ?? 0);

        $oStmt = $pdo->query("SELECT * FROM transactions ORDER BY id DESC LIMIT 10");
        $recentOrders = $oStmt->fetchAll();
    } catch (Exception $e) {
        error_log("Admin stats query error: " . $e->getMessage());
    }
}

$pageTitle = "Admin Control Panel";
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#071838] text-slate-100 antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?> | <?= htmlspecialchars(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full flex flex-col bg-[#071838]">

<!-- Top Admin Bar -->
<header class="bg-[#050f24] border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-xs uppercase tracking-wider">
                Admin Panel
            </span>
            <span class="font-bold text-white text-base"><?= htmlspecialchars(APP_NAME) ?></span>
        </div>

        <nav class="flex items-center gap-4 text-xs font-semibold">
            <a href="index.php" class="text-blue-400">Overview</a>
            <a href="users.php" class="text-slate-300 hover:text-white">Users</a>
            <a href="transactions.php" class="text-slate-300 hover:text-white">Transactions</a>
            <a href="settings.php" class="text-slate-300 hover:text-white">API Settings</a>
            <a href="<?= BASE_URL ?>/index.php" class="text-amber-400 hover:underline">View Website &rarr;</a>
        </nav>
    </div>
</header>

<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Users</span>
            <div class="text-3xl font-black text-white"><?= number_format($totalUsers) ?></div>
            <a href="users.php" class="text-[11px] text-blue-400 hover:underline inline-block mt-2">Manage Users &rarr;</a>
        </div>

        <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total User Wallet Balances</span>
            <div class="text-3xl font-black text-emerald-400">
                <?= CURRENCY_SYMBOL ?><?= number_format($totalWalletFloat, 2) ?>
            </div>
            <span class="text-[11px] text-slate-500">Total liability in user wallets</span>
        </div>

        <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Completed Sales</span>
            <div class="text-3xl font-black text-amber-400">
                <?= CURRENCY_SYMBOL ?><?= number_format($totalSales, 2) ?>
            </div>
            <a href="transactions.php" class="text-[11px] text-amber-400 hover:underline inline-block mt-2">View Sales Log &rarr;</a>
        </div>
    </div>

    <!-- Quick Admin Actions -->
    <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider">Quick Admin Management</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <a href="users.php?action=credit" class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 hover:border-emerald-500 transition text-center space-y-1">
                <span class="text-xl">💰</span>
                <span class="block font-bold text-white">Credit User Wallet</span>
            </a>
            <a href="settings.php" class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 hover:border-blue-500 transition text-center space-y-1">
                <span class="text-xl">⚙️</span>
                <span class="block font-bold text-white">Configure Peyflex API</span>
            </a>
            <a href="transactions.php?status=FAILED" class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 hover:border-rose-500 transition text-center space-y-1">
                <span class="text-xl">🔍</span>
                <span class="block font-bold text-white">Inspect Failed Orders</span>
            </a>
            <a href="settings.php#margins" class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 hover:border-amber-500 transition text-center space-y-1">
                <span class="text-xl">📈</span>
                <span class="block font-bold text-white">Adjust Profit Margins</span>
            </a>
        </div>
    </div>

    <!-- Recent Transactions Table -->
    <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider">Live System Transactions</h2>
            <a href="transactions.php" class="text-xs text-blue-400 hover:underline">Full Log &rarr;</a>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th class="pb-3">Ref</th>
                        <th class="pb-3">User ID</th>
                        <th class="pb-3">Service</th>
                        <th class="pb-3">Recipient</th>
                        <th class="pb-3">Amount</th>
                        <th class="pb-3">Status</th>
                        <th class="pb-3">Date</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    <?php foreach ($recentOrders as $o): ?>
                        <tr class="hover:bg-slate-800/40">
                            <td class="py-3 font-mono text-blue-400"><?= htmlspecialchars($o['reference']) ?></td>
                            <td class="py-3 font-bold text-white">#<?= (int)$o['user_id'] ?></td>
                            <td class="py-3 uppercase"><?= htmlspecialchars($o['service_type']) ?></td>
                            <td class="py-3 text-slate-300"><?= htmlspecialchars($o['recipient'] ?? $o['description']) ?></td>
                            <td class="py-3 font-black text-white"><?= CURRENCY_SYMBOL ?><?= number_format($o['amount'], 2) ?></td>
                            <td class="py-3">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase <?= $o['status'] === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400' ?>">
                                    <?= htmlspecialchars($o['status']) ?>
                                </span>
                            </td>
                            <td class="py-3 text-slate-400"><?= date('Y-m-d H:i', strtotime($o['created_at'])) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

</body>
</html>
