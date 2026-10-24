<?php
/**
 * ============================================================================
 * VTU SCRIPT - ADMIN USER MANAGEMENT (admin/users.php)
 * ============================================================================
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

$pdo = get_db_connection();
$message = '';
$error = '';

// Handle manual credit/debit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $userId = (int)$_POST['user_id'];

    if ($action === 'fund') {
        $amount = (float)$_POST['amount'];
        $type   = $_POST['fund_type'] ?? 'credit'; // 'credit' or 'debit'

        if ($amount > 0 && $pdo) {
            try {
                $userStmt = $pdo->prepare("SELECT balance FROM users WHERE id = :id");
                $userStmt->execute([':id' => $userId]);
                $u = $userStmt->fetch();

                if ($u) {
                    $bb = (float)$u['balance'];
                    $ba = ($type === 'credit') ? ($bb + $amount) : ($bb - $amount);
                    if ($ba < 0) $ba = 0;

                    $pdo->prepare("UPDATE users SET balance = :b WHERE id = :id")->execute([':b' => $ba, ':id' => $userId]);

                    // Record
                    $ref = 'ADM_' . date('YmdHis') . '_' . rand(100, 999);
                    $pdo->prepare("
                        INSERT INTO transactions (user_id, reference, service_type, amount, balance_before, balance_after, status, description)
                        VALUES (:uid, :ref, 'wallet_fund', :amt, :bb, :ba, 'SUCCESS', :desc)
                    ")->execute([
                        ':uid'  => $userId,
                        ':ref'  => $ref,
                        ':amt'  => $amount,
                        ':bb'   => $bb,
                        ':ba'   => $ba,
                        ':desc' => "Admin Manual {$type} of ₦{$amount}"
                    ]);

                    $message = "User #{$userId} successfully " . ($type === 'credit' ? 'credited' : 'debited') . " with ₦" . number_format($amount, 2);
                }
            } catch (Exception $e) {
                $error = "Action failed: " . $e->getMessage();
            }
        }
    } elseif ($action === 'tier') {
        $tier = $_POST['tier'] ?? 'smart';
        if ($pdo) {
            $pdo->prepare("UPDATE users SET tier = :t WHERE id = :id")->execute([':t' => $tier, ':id' => $userId]);
            $message = "User tier changed to {$tier}.";
        }
    } elseif ($action === 'status') {
        $status = $_POST['status'] ?? 'active';
        if ($pdo) {
            $pdo->prepare("UPDATE users SET status = :s WHERE id = :id")->execute([':s' => $status, ':id' => $userId]);
            $message = "User status set to {$status}.";
        }
    }
}

// Search
$search = trim($_GET['q'] ?? '');
$users = [];

if ($pdo) {
    try {
        if (!empty($search)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE name LIKE :q OR phone LIKE :q OR email LIKE :q ORDER BY id DESC LIMIT 50");
            $stmt->execute([':q' => "%{$search}%"]);
        } else {
            $stmt = $pdo->query("SELECT * FROM users ORDER BY id DESC LIMIT 50");
        }
        $users = $stmt->fetchAll();
    } catch (Exception $e) {
        $error = "Failed to query users: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#071838] text-slate-100 antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Users | <?= htmlspecialchars(APP_NAME) ?> Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full flex flex-col bg-[#071838]">

<header class="bg-[#050f24] border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-xs uppercase tracking-wider">Admin</span>
            <span class="font-bold text-white text-base">User & Reseller Accounts</span>
        </div>
        <nav class="flex items-center gap-4 text-xs font-semibold">
            <a href="index.php" class="text-slate-300 hover:text-white">&larr; Back to Overview</a>
            <a href="transactions.php" class="text-slate-300 hover:text-white">Transactions</a>
            <a href="settings.php" class="text-slate-300 hover:text-white">Settings</a>
        </nav>
    </div>
</header>

<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-black text-white">Registered Users & Resellers</h1>
            <p class="text-xs text-slate-400 mt-1">Search, credit/debit balances, upgrade reseller tiers, or suspend accounts</p>
        </div>

        <!-- Search input -->
        <form action="users.php" method="GET" class="flex items-center gap-2">
            <input type="text" name="q" value="<?= htmlspecialchars($search) ?>" placeholder="Search phone, name, email..." class="px-4 py-2 rounded-xl bg-[#0a192f] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500">
            <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Search</button>
        </form>
    </div>

    <?php if (!empty($message)): ?>
        <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <?php if (!empty($error)): ?>
        <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th class="pb-3">ID</th>
                        <th class="pb-3">User Details</th>
                        <th class="pb-3">Phone</th>
                        <th class="pb-3">Wallet Balance</th>
                        <th class="pb-3">Tier</th>
                        <th class="pb-3">Status</th>
                        <th class="pb-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    <?php foreach ($users as $u): ?>
                        <tr class="hover:bg-slate-800/40">
                            <td class="py-3 font-mono text-slate-400">#<?= $u['id'] ?></td>
                            <td class="py-3">
                                <span class="font-bold text-white block"><?= htmlspecialchars($u['name']) ?></span>
                                <span class="text-[10px] text-slate-400"><?= htmlspecialchars($u['email']) ?></span>
                            </td>
                            <td class="py-3 font-mono text-slate-300"><?= htmlspecialchars($u['phone']) ?></td>
                            <td class="py-3 font-black text-emerald-400">
                                <?= CURRENCY_SYMBOL ?><?= number_format($u['balance'], 2) ?>
                            </td>
                            <td class="py-3">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                    <?= htmlspecialchars($u['tier']) ?>
                                </span>
                            </td>
                            <td class="py-3">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase <?= $u['status'] === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400' ?>">
                                    <?= htmlspecialchars($u['status']) ?>
                                </span>
                            </td>
                            <td class="py-3 text-right">
                                <div class="inline-flex gap-2">
                                    <!-- Fund Trigger -->
                                    <button onclick="openFundModal(<?= $u['id'] ?>, '<?= htmlspecialchars($u['name']) ?>', <?= (float)$u['balance'] ?>)" class="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold">
                                        ± Fund
                                    </button>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<!-- Fund Modal -->
<div id="fundModal" class="fixed inset-0 z-50 bg-black/80 hidden flex items-center justify-center p-4">
    <div class="max-w-sm w-full bg-[#0a192f] border border-slate-700 rounded-3xl p-6 space-y-4">
        <h3 class="text-base font-bold text-white">Manual Wallet Adjustment</h3>
        <p class="text-xs text-slate-400" id="fundTarget"></p>

        <form action="users.php" method="POST" class="space-y-4">
            <input type="hidden" name="action" value="fund">
            <input type="hidden" name="user_id" id="fundUserId">

            <div>
                <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Adjustment Type</label>
                <select name="fund_type" class="w-full px-3 py-2 rounded-xl bg-[#071838] border border-slate-700 text-white text-xs font-bold">
                    <option value="credit">Credit Balance (+)</option>
                    <option value="debit">Debit Balance (-)</option>
                </select>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Amount (₦)</label>
                <input type="number" name="amount" min="1" step="10" required placeholder="e.g. 5000" class="w-full px-3 py-2 rounded-xl bg-[#071838] border border-slate-700 text-white font-bold text-sm">
            </div>

            <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                    Apply Adjustment
                </button>
                <button type="button" onclick="closeFundModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">
                    Cancel
                </button>
            </div>
        </form>
    </div>
</div>

<script>
function openFundModal(id, name, bal) {
    document.getElementById('fundUserId').value = id;
    document.getElementById('fundTarget').innerText = name + ' (Current Balance: ₦' + bal.toFixed(2) + ')';
    document.getElementById('fundModal').classList.remove('hidden');
}
function closeFundModal() {
    document.getElementById('fundModal').classList.add('hidden');
}
</script>

</body>
</html>
