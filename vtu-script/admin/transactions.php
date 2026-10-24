<?php
/**
 * ============================================================================
 * VTU SCRIPT - ADMIN TRANSACTION MONITOR (admin/transactions.php)
 * ============================================================================
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

$pdo = get_db_connection();
$message = '';

// Re-query or refund action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $txId   = (int)$_POST['tx_id'];

    if ($action === 'refund' && $pdo) {
        $txStmt = $pdo->prepare("SELECT * FROM transactions WHERE id = :id");
        $txStmt->execute([':id' => $txId]);
        $tx = $txStmt->fetch();

        if ($tx && $tx['status'] !== 'REFUNDED') {
            $amt = (float)$tx['amount'];
            $uid = (int)$tx['user_id'];

            $pdo->prepare("UPDATE users SET balance = balance + :a WHERE id = :uid")->execute([':a' => $amt, ':uid' => $uid]);
            $pdo->prepare("UPDATE transactions SET status = 'REFUNDED', description = CONCAT(description, ' [REFUNDED BY ADMIN]') WHERE id = :id")->execute([':id' => $txId]);

            $message = "Transaction #{$txId} has been refunded (₦" . number_format($amt, 2) . " returned to user #{$uid}).";
        }
    }
}

$statusFilter = $_GET['status'] ?? '';
$search       = trim($_GET['q'] ?? '');

$txs = [];
if ($pdo) {
    try {
        $query = "SELECT t.*, u.name as user_name, u.phone as user_phone FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1";
        $params = [];

        if (!empty($statusFilter)) {
            $query .= " AND t.status = :stat";
            $params[':stat'] = $statusFilter;
        }

        if (!empty($search)) {
            $query .= " AND (t.reference LIKE :q OR t.recipient LIKE :q OR u.phone LIKE :q)";
            $params[':q'] = "%{$search}%";
        }

        $query .= " ORDER BY t.id DESC LIMIT 100";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $txs = $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Transactions query error: " . $e->getMessage());
    }
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#071838] text-slate-100 antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Monitor | <?= htmlspecialchars(APP_NAME) ?> Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full flex flex-col bg-[#071838]">

<header class="bg-[#050f24] border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-xs uppercase tracking-wider">Admin</span>
            <span class="font-bold text-white text-base">API Transaction Logs</span>
        </div>
        <nav class="flex items-center gap-4 text-xs font-semibold">
            <a href="index.php" class="text-slate-300 hover:text-white">&larr; Back to Overview</a>
            <a href="users.php" class="text-slate-300 hover:text-white">Users</a>
            <a href="settings.php" class="text-slate-300 hover:text-white">Settings</a>
        </nav>
    </div>
</header>

<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-black text-white">System Orders & API Logs</h1>
            <p class="text-xs text-slate-400 mt-1">Track API response payloads, detect stuck orders, and trigger instant refunds</p>
        </div>

        <form action="transactions.php" method="GET" class="flex flex-wrap items-center gap-2">
            <select name="status" class="px-3 py-2 rounded-xl bg-[#0a192f] border border-slate-700 text-white text-xs font-semibold">
                <option value="">All Statuses</option>
                <option value="SUCCESS" <?= $statusFilter === 'SUCCESS' ? 'selected' : '' ?>>SUCCESS</option>
                <option value="PENDING" <?= $statusFilter === 'PENDING' ? 'selected' : '' ?>>PENDING</option>
                <option value="FAILED"  <?= $statusFilter === 'FAILED' ? 'selected' : '' ?>>FAILED</option>
                <option value="REFUNDED"<?= $statusFilter === 'REFUNDED' ? 'selected' : '' ?>>REFUNDED</option>
            </select>
            <input type="text" name="q" value="<?= htmlspecialchars($search) ?>" placeholder="Ref or phone..." class="px-3 py-2 rounded-xl bg-[#0a192f] border border-slate-700 text-white text-xs">
            <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Filter</button>
        </form>
    </div>

    <?php if (!empty($message)): ?>
        <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th class="pb-3">Ref</th>
                        <th class="pb-3">User</th>
                        <th class="pb-3">Service</th>
                        <th class="pb-3">Details / Recipient</th>
                        <th class="pb-3">Amount</th>
                        <th class="pb-3">Status</th>
                        <th class="pb-3">Date</th>
                        <th class="pb-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    <?php foreach ($txs as $t): 
                        $badge = [
                            'SUCCESS'  => 'bg-emerald-500/10 text-emerald-400',
                            'FAILED'   => 'bg-rose-500/10 text-rose-400',
                            'PENDING'  => 'bg-amber-500/10 text-amber-400',
                            'REFUNDED' => 'bg-purple-500/10 text-purple-400',
                        ][$t['status']] ?? 'bg-slate-700 text-slate-300';
                    ?>
                        <tr class="hover:bg-slate-800/40">
                            <td class="py-3 font-mono text-blue-400 font-bold"><?= htmlspecialchars($t['reference']) ?></td>
                            <td class="py-3">
                                <span class="font-bold text-white block"><?= htmlspecialchars($t['user_name'] ?? ('#' . $t['user_id'])) ?></span>
                                <span class="text-[10px] text-slate-400 font-mono"><?= htmlspecialchars($t['user_phone'] ?? '') ?></span>
                            </td>
                            <td class="py-3 uppercase font-semibold text-slate-200"><?= htmlspecialchars($t['service_type']) ?></td>
                            <td class="py-3 text-slate-300 max-w-xs truncate"><?= htmlspecialchars($t['description'] ?? $t['recipient']) ?></td>
                            <td class="py-3 font-black text-white"><?= CURRENCY_SYMBOL ?><?= number_format($t['amount'], 2) ?></td>
                            <td class="py-3">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase <?= $badge ?>">
                                    <?= htmlspecialchars($t['status']) ?>
                                </span>
                            </td>
                            <td class="py-3 text-slate-400 text-[11px]"><?= date('Y-m-d H:i', strtotime($t['created_at'])) ?></td>
                            <td class="py-3 text-right">
                                <?php if ($t['status'] === 'FAILED' || $t['status'] === 'PENDING'): ?>
                                    <form action="transactions.php" method="POST" class="inline" onsubmit="return confirm('Refund this transaction to the user wallet?')">
                                        <input type="hidden" name="action" value="refund">
                                        <input type="hidden" name="tx_id" value="<?= $t['id'] ?>">
                                        <button type="submit" class="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[10px] font-bold">
                                            Refund ↩
                                        </button>
                                    </form>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

</body>
</html>
