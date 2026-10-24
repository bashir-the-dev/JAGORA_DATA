<?php
/**
 * ============================================================================
 * VTU SCRIPT - HOMEPAGE & LANDING PAGE (index.php)
 * ============================================================================
 * Clean, modern multi-page PHP homepage with live rates & WhatsApp chat.
 * Edit any text or branding in config/app_config.php or right here in cPanel!
 */

require_once __DIR__ . '/config/app_config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/core/DataHandler.php';

$pageTitle = "Cheap Data & Airtime VTU Portal";
$dataHandler = new DataHandler();
$activePlans = $dataHandler->getActivePlans();

require_once __DIR__ . '/includes/header.php';
?>

<!-- Hero Section -->
<section class="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-[#071838] via-[#091f4a] to-[#071838] border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto space-y-6">
            <!-- Location Badge (Katsina / Kano editable in config/app_config.php) -->
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Serving Resellers & Users Across <?= htmlspecialchars(OFFICE_ADDRESS) ?></span>
            </div>

            <!-- Headline -->
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Nigeria's Most Reliable <br class="hidden sm:block">
                <span class="bg-gradient-to-r from-blue-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                    Automated VTU Portal
                </span>
            </h1>

            <p class="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                <?= htmlspecialchars(APP_TAGLINE) ?>. Get instant SME/Corporate data top-up, 
                discounted airtime, electricity meter tokens, and cable subscriptions in under 10 seconds.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <a href="<?= BASE_URL ?>/dashboard/buy-data.php" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5">
                    🚀 Buy Data Instantly
                </a>
                <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>?text=<?= urlencode(WHATSAPP_MESSAGE) ?>" target="_blank" class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-base transition flex items-center justify-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Chat with Live Agent</span>
                </a>
            </div>

            <!-- Telecom Network Badges -->
            <div class="pt-8 flex items-center justify-center gap-6 opacity-90">
                <div class="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-xl">
                    <span class="w-3 h-3 rounded-full bg-yellow-400 font-bold"></span>
                    <span class="text-xs font-bold text-yellow-300">MTN SME</span>
                </div>
                <div class="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-xl">
                    <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span class="text-xs font-bold text-rose-300">Airtel CG</span>
                </div>
                <div class="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span class="text-xs font-bold text-emerald-300">Glo CG</span>
                </div>
                <div class="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3.5 py-1.5 rounded-xl">
                    <span class="w-3 h-3 rounded-full bg-lime-400"></span>
                    <span class="text-xs font-bold text-lime-300">9mobile</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Live Pricing Catalog Section -->
<section id="pricing" class="py-16 bg-[#071838]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
            <h2 class="text-2xl sm:text-3xl font-black text-white">Live Data Bundle Prices</h2>
            <p class="text-sm text-slate-400 mt-2">
                Real-time wholesale & retail pricing directly from our database. Resellers get special wholesale rates.
            </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <?php foreach ($activePlans as $plan): 
                $netColor = [
                    'MTN'     => 'border-amber-400/30 bg-amber-500/5 text-amber-300',
                    'AIRTEL'  => 'border-rose-400/30 bg-rose-500/5 text-rose-300',
                    'GLO'     => 'border-emerald-400/30 bg-emerald-500/5 text-emerald-300',
                    '9MOBILE' => 'border-lime-400/30 bg-lime-500/5 text-lime-300',
                ][$plan['network']] ?? 'border-blue-400/30 bg-blue-500/5 text-blue-300';
            ?>
                <div class="p-5 rounded-2xl bg-[#0a192f] border border-slate-800 hover:border-blue-500/40 transition shadow-lg flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold px-2.5 py-1 rounded-lg border <?= $netColor ?>">
                                <?= htmlspecialchars($plan['network']) ?> <?= htmlspecialchars($plan['plan_type']) ?>
                            </span>
                            <span class="text-[11px] text-slate-400"><?= htmlspecialchars($plan['validity']) ?></span>
                        </div>

                        <h3 class="text-lg font-bold text-white mb-1">
                            <?= htmlspecialchars($plan['bundle_size']) ?>
                        </h3>
                        <p class="text-xs text-slate-400"><?= htmlspecialchars($plan['bundle_name']) ?></p>
                    </div>

                    <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-slate-400 block uppercase">Price</span>
                            <span class="text-xl font-black text-white">
                                <?= CURRENCY_SYMBOL ?><?= number_format($plan['selling_price'], 2) ?>
                            </span>
                        </div>
                        <a href="<?= BASE_URL ?>/dashboard/buy-data.php?plan_id=<?= $plan['id'] ?>" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition">
                            Buy Now
                        </a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Features Grid -->
<section class="py-16 bg-[#050f24] border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="p-6 rounded-2xl bg-[#071838] border border-slate-800 space-y-3">
                <div class="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl font-bold">
                    ⚡
                </div>
                <h3 class="text-lg font-bold text-white">Automated Instant Delivery</h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Our Peyflex/Payflex integration dispatches data bundles and airtime within 3 to 10 seconds with 99.9% success rate.
                </p>
            </div>

            <div class="p-6 rounded-2xl bg-[#071838] border border-slate-800 space-y-3">
                <div class="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-2xl font-bold">
                    🏦
                </div>
                <h3 class="text-lg font-bold text-white">Dedicated Virtual Accounts</h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Every user gets dedicated Wema and Moniepoint accounts. Transfer from any bank app and get credited instantly.
                </p>
            </div>

            <div class="p-6 rounded-2xl bg-[#071838] border border-slate-800 space-y-3">
                <div class="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-2xl font-bold">
                    💬
                </div>
                <h3 class="text-lg font-bold text-white">Dedicated Support in <?= htmlspecialchars(OFFICE_ADDRESS) ?></h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Have issues with an order? Our support team is online 24/7 on WhatsApp to attend to inquiries and resolve queries.
                </p>
            </div>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
