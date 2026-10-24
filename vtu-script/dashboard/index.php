<?php
/**
 * ============================================================================
 * VTU SCRIPT - CUSTOMER DASHBOARD OVERVIEW (dashboard/index.php)
 * ============================================================================
 */

require_once __DIR__ . '/../includes/auth_guard.php';
require_once __DIR__ . '/../core/PaymentGateway.php';

$pageTitle = "My Wallet & Services";
$paymentGateway = new PaymentGateway($pdo);
$virtualAccounts = $paymentGateway->getUserVirtualAccounts($currentUser['id']);

// Fetch recent 5 transactions
$recentTxs = [];
if ($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE user_id = :uid ORDER BY id DESC LIMIT 5");
        $stmt->execute([':uid' => $currentUser['id']]);
        $recentTxs = $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Failed to load recent txs: " . $e->getMessage());
    }
}

require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
    <!-- Sidebar -->
    <?php require_once __DIR__ . '/../includes/sidebar.php'; ?>

    <!-- Main Content -->
    <div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
        <!-- Top Greeting Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl sm:text-3xl font-black text-white">
                    Hello, <?= htmlspecialchars(explode(' ', $currentUser['name'])[0]) ?> 👋
                </h1>
                <p class="text-xs text-slate-400 mt-1">
                    Welcome to your <?= htmlspecialchars(APP_NAME) ?> portal.
                </p>
            </div>
            <div class="flex items-center gap-3">
                <a href="<?= BASE_URL ?>/dashboard/fund-wallet.php" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-2">
                    <span>💳</span>
                    <span>Fund Wallet</span>
                </a>
            </div>
        </div>

        <!-- Wallets & Virtual Accounts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Balance Card -->
            <div class="p-6 rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 border border-blue-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div class="space-y-1">
                    <span class="text-xs font-bold text-blue-300 uppercase tracking-wider">Available Wallet Balance</span>
                    <div class="text-3xl sm:text-4xl font-black text-white mt-1">
                        <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['balance'], 2) ?>
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t border-blue-800/40 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] text-blue-300 uppercase">Referral Bonus</span>
                        <div class="text-sm font-bold text-amber-400">
                            <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['bonus_balance'], 2) ?>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                        <?= htmlspecialchars($currentUser['tier']) ?>
                    </span>
                </div>
            </div>

            <!-- Virtual Dedicated Bank Accounts for Instant Auto-Funding -->
            <div class="lg:col-span-2 p-6 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h2 class="text-sm font-bold text-white uppercase tracking-wider">Automated Bank Transfer Funding</h2>
                    </div>
                    <span class="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        Instant 24/7 Credit
                    </span>
                </div>
                <p class="text-xs text-slate-400">
                    Transfer any amount to these dedicated account numbers. Your wallet will be credited within 5 seconds automatically.
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <?php foreach ($virtualAccounts as $acc): ?>
                        <div class="p-3.5 rounded-2xl bg-[#071838] border border-slate-700/80 flex items-center justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-blue-400 uppercase"><?= htmlspecialchars($acc['bank_name']) ?></span>
                                <div class="text-base font-black text-white tracking-widest mt-0.5" id="acc_<?= $acc['bank_name'] ?>">
                                    <?= htmlspecialchars($acc['account_number']) ?>
                                </div>
                                <span class="text-[10px] text-slate-400 block truncate"><?= htmlspecialchars($acc['account_name']) ?></span>
                            </div>
                            <button onclick="copyToClipboard('<?= htmlspecialchars($acc['account_number']) ?>')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition">
                                Copy
                            </button>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Quick Services Grid -->
        <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Vending Services</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <a href="<?= BASE_URL ?>/dashboard/buy-data.php" class="p-5 rounded-2xl bg-[#0a192f] border border-slate-800 hover:border-blue-500/40 transition group flex flex-col items-center text-center space-y-2">
                    <div class="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 group-hover:scale-110 transition flex items-center justify-center text-2xl">
                        📶
                    </div>
                    <span class="text-sm font-bold text-white">Buy Data</span>
                    <span class="text-[10px] text-slate-400">SME / CG Bundles</span>
                </a>

                <a href="<?= BASE_URL ?>/dashboard/buy-airtime.php" class="p-5 rounded-2xl bg-[#0a192f] border border-slate-800 hover:border-blue-500/40 transition group flex flex-col items-center text-center space-y-2">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 group-hover:scale-110 transition flex items-center justify-center text-2xl">
                        📱
                    </div>
                    <span class="text-sm font-bold text-white">Buy Airtime</span>
                    <span class="text-[10px] text-emerald-400">Up to 4.5% Off</span>
                </a>

                <a href="<?= BASE_URL ?>/dashboard/bills.php" class="p-5 rounded-2xl bg-[#0a192f] border border-slate-800 hover:border-blue-500/40 transition group flex flex-col items-center text-center space-y-2">
                    <div class="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 group-hover:scale-110 transition flex items-center justify-center text-2xl">
                        ⚡
                    </div>
                    <span class="text-sm font-bold text-white">Electricity Bill</span>
                    <span class="text-[10px] text-slate-400">Instant NEPA Token</span>
                </a>

                <a href="<?= BASE_URL ?>/dashboard/bills.php?tab=cable" class="p-5 rounded-2xl bg-[#0a192f] border border-slate-800 hover:border-blue-500/40 transition group flex flex-col items-center text-center space-y-2">
                    <div class="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 group-hover:scale-110 transition flex items-center justify-center text-2xl">
                        📺
                    </div>
                    <span class="text-sm font-bold text-white">Cable TV</span>
                    <span class="text-[10px] text-slate-400">DSTV / GOTV</span>
                </a>
            </div>
        </div>

        <!-- Recent Transactions -->
        <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-white uppercase tracking-wider">Recent Orders & Transactions</h2>
                <a href="<?= BASE_URL ?>/dashboard/transactions.php" class="text-xs text-blue-400 hover:underline">
                    View All &rarr;
                </a>
            </div>

            <?php if (empty($recentTxs)): ?>
                <div class="py-10 text-center text-slate-400 text-xs">
                    No transactions yet. Start by purchasing data or airtime above!
                </div>
            <?php else: ?>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400">
                                <th class="pb-3 font-semibold">Service</th>
                                <th class="pb-3 font-semibold">Recipient / Details</th>
                                <th class="pb-3 font-semibold">Amount</th>
                                <th class="pb-3 font-semibold">Status</th>
                                <th class="pb-3 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            <?php foreach ($recentTxs as $tx): 
                                $statusBadge = [
                                    'SUCCESS' => 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                                    'FAILED'  => 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                                    'PENDING' => 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                                ][$tx['status']] ?? 'bg-slate-700 text-slate-300';
                            ?>
                                <tr class="hover:bg-slate-800/30">
                                    <td class="py-3 font-bold text-white uppercase"><?= htmlspecialchars($tx['service_type']) ?></td>
                                    <td class="py-3 text-slate-300"><?= htmlspecialchars($tx['description'] ?? $tx['recipient']) ?></td>
                                    <td class="py-3 font-black text-white"><?= CURRENCY_SYMBOL ?><?= number_format($tx['amount'], 2) ?></td>
                                    <td class="py-3">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase <?= $statusBadge ?>">
                                            <?= htmlspecialchars($tx['status']) ?>
                                        </span>
                                    </td>
                                    <td class="py-3 text-slate-400"><?= date('M j, Y h:i A', strtotime($tx['created_at'])) ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        alert('Account number ' + text + ' copied to clipboard!');
    }, function() {
        prompt('Copy account number:', text);
    });
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
