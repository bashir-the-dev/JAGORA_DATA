<?php
/**
 * ============================================================================
 * VTU SCRIPT - TRANSACTION HISTORY & RECEIPT GENERATOR (dashboard/transactions.php)
 * ============================================================================
 */

require_once __DIR__ . '/../includes/auth_guard.php';

$pageTitle = "Transaction History & Receipts";
$filterType = $_GET['type'] ?? '';

$transactions = [];
if ($pdo) {
    try {
        if (!empty($filterType)) {
            $stmt = $pdo->prepare("SELECT * FROM transactions WHERE user_id = :uid AND service_type = :st ORDER BY id DESC");
            $stmt->execute([':uid' => $currentUser['id'], ':st' => $filterType]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM transactions WHERE user_id = :uid ORDER BY id DESC");
            $stmt->execute([':uid' => $currentUser['id']]);
        }
        $rawList = $stmt->fetchAll();
        $seen = [];
        $transactions = [];
        foreach ($rawList as $row) {
            $key = !empty($row['reference']) ? $row['reference'] : ('id_' . $row['id']);
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $transactions[] = $row;
            }
        }
    } catch (Exception $e) {
        error_log("Failed to load txs: " . $e->getMessage());
    }
}

require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
    <?php require_once __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-black text-white">Transaction Logs</h1>
                <p class="text-xs text-slate-400 mt-1">Review your vending history and download official receipts</p>
            </div>

            <!-- Filter tabs -->
            <div class="flex flex-wrap gap-2 text-xs">
                <a href="transactions.php" class="px-3 py-1.5 rounded-lg <?= empty($filterType) ? 'bg-blue-600 text-white font-bold' : 'bg-[#071838] text-slate-400 hover:text-white' ?>">
                    All
                </a>
                <a href="?type=data" class="px-3 py-1.5 rounded-lg <?= $filterType === 'data' ? 'bg-blue-600 text-white font-bold' : 'bg-[#071838] text-slate-400 hover:text-white' ?>">
                    Data
                </a>
                <a href="?type=airtime" class="px-3 py-1.5 rounded-lg <?= $filterType === 'airtime' ? 'bg-blue-600 text-white font-bold' : 'bg-[#071838] text-slate-400 hover:text-white' ?>">
                    Airtime
                </a>
                <a href="?type=wallet_fund" class="px-3 py-1.5 rounded-lg <?= $filterType === 'wallet_fund' ? 'bg-blue-600 text-white font-bold' : 'bg-[#071838] text-slate-400 hover:text-white' ?>">
                    Wallet Funds
                </a>
            </div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl overflow-hidden">
            <?php if (empty($transactions)): ?>
                <div class="py-12 text-center text-slate-400 text-xs">
                    No transactions found for this filter.
                </div>
            <?php else: ?>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                                <th class="pb-3 font-semibold">Reference</th>
                                <th class="pb-3 font-semibold">Service</th>
                                <th class="pb-3 font-semibold">Recipient / Details</th>
                                <th class="pb-3 font-semibold">Amount</th>
                                <th class="pb-3 font-semibold">Status</th>
                                <th class="pb-3 font-semibold">Date</th>
                                <th class="pb-3 font-semibold text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            <?php foreach ($transactions as $tx): 
                                $statusBadge = [
                                    'SUCCESS' => 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                                    'FAILED'  => 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                                    'PENDING' => 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                                ][$tx['status']] ?? 'bg-slate-700 text-slate-300';
                            ?>
                                <tr class="hover:bg-slate-800/30">
                                    <td class="py-3 font-mono text-[11px] text-blue-400 font-bold"><?= htmlspecialchars($tx['reference']) ?></td>
                                    <td class="py-3 font-bold text-white uppercase"><?= htmlspecialchars($tx['service_type']) ?></td>
                                    <td class="py-3 text-slate-300 max-w-xs truncate"><?= htmlspecialchars($tx['description'] ?? $tx['recipient']) ?></td>
                                    <td class="py-3 font-black text-white"><?= CURRENCY_SYMBOL ?><?= number_format($tx['amount'], 2) ?></td>
                                    <td class="py-3">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase <?= $statusBadge ?>">
                                            <?= htmlspecialchars($tx['status']) ?>
                                        </span>
                                    </td>
                                    <td class="py-3 text-slate-400 text-[11px]"><?= date('M j, Y h:i A', strtotime($tx['created_at'])) ?></td>
                                    <td class="py-3 text-right">
                                        <button onclick="showReceipt(<?= htmlspecialchars(json_encode($tx)) ?>)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition">
                                            Print
                                        </button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Printable Receipt Modal -->
<div id="receiptModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="text-center pb-3 border-b border-slate-200">
            <h3 class="font-black text-xl text-blue-900"><?= htmlspecialchars(APP_NAME) ?></h3>
            <p class="text-xs text-slate-500"><?= htmlspecialchars(OFFICE_ADDRESS) ?> &bull; <?= htmlspecialchars(SUPPORT_PHONE) ?></p>
            <span class="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Official Transaction Receipt
            </span>
        </div>

        <div class="space-y-2 text-xs divide-y divide-slate-100">
            <div class="flex justify-between pt-1">
                <span class="text-slate-500">Reference:</span>
                <span class="font-mono font-bold" id="recRef"></span>
            </div>
            <div class="flex justify-between pt-2">
                <span class="text-slate-500">Service:</span>
                <span class="font-bold uppercase" id="recService"></span>
            </div>
            <div class="flex justify-between pt-2">
                <span class="text-slate-500">Recipient / Details:</span>
                <span class="font-medium" id="recRecipient"></span>
            </div>
            <div class="flex justify-between pt-2">
                <span class="text-slate-500">Amount Paid:</span>
                <span class="font-black text-base text-blue-900" id="recAmount"></span>
            </div>
            <div class="flex justify-between pt-2">
                <span class="text-slate-500">Status:</span>
                <span class="font-bold uppercase text-emerald-700" id="recStatus"></span>
            </div>
            <div class="flex justify-between pt-2">
                <span class="text-slate-500">Date & Time:</span>
                <span class="font-medium" id="recDate"></span>
            </div>
        </div>

        <div class="pt-4 flex gap-2">
            <button onclick="window.print()" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition">
                🖨️ Print Receipt
            </button>
            <button onclick="closeReceipt()" class="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition">
                Close
            </button>
        </div>
    </div>
</div>

<script>
function showReceipt(tx) {
    document.getElementById('recRef').innerText = tx.reference;
    document.getElementById('recService').innerText = tx.service_type;
    document.getElementById('recRecipient').innerText = tx.description || tx.recipient;
    document.getElementById('recAmount').innerText = '₦' + parseFloat(tx.amount).toFixed(2);
    document.getElementById('recStatus').innerText = tx.status;
    document.getElementById('recDate').innerText = tx.created_at;

    document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceipt() {
    document.getElementById('receiptModal').classList.add('hidden');
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
