<?php
/**
 * ============================================================================
 * AJDATASUB - DEVELOPER EDITABLE LANDING PAGE
 * ============================================================================
 * INSTRUCTIONS FOR DEVELOPERS:
 * You can customize anything on this landing page by simply editing the
 * variables in Section 1 below. When you edit and save this file in cPanel
 * File Manager, changes will reflect IMMEDIATELY on your live website.
 *
 * Primary Features included:
 * - Hero banner with App Download & Sign In buttons
 * - Live Data Bundles & Airtime Pricing Table (synced from database)
 * - Services Grid (Data, Airtime, Cable TV, Electricity, Exam PINs)
 * - How It Works (Register -> Fund Wallet -> Buy)
 * - Mobile App Promotion with Direct APK & Play Store buttons
 * - Trust Metrics & Security Guarantees
 * - Developer & Reseller API Highlights
 * - Frequently Asked Questions (FAQ)
 * - Contact & WhatsApp Floating Support Button
 * ============================================================================
 */

// ============================================================================
// SECTION 1: DEVELOPER CUSTOMIZATION SETTINGS
// (Edit these values freely to update texts, links, and contact info)
// ============================================================================
$CONFIG = [
    'app_name'           => "AJDATASUB",
    'app_tagline'        => "Fast, Reliable & Cheap VTU Services in Nigeria",
    'hero_badge'         => "⚡ 24/7 Automated VTU Switch • 99.9% Uptime",
    'hero_headline'      => "Nigeria's Most Reliable & Affordable Data & VTU Platform",
    'hero_subtitle'      => "Buy cheap SME, Corporate Gifting & Direct data bundles for MTN, Airtel, Glo & 9mobile. Instant electricity meter tokens, cable TV subscriptions & exam tokens delivered in seconds.",
    
    // Contact & Support
    'whatsapp_number'    => "2347048609646", // Format: 234 followed by 10 digits without + or spaces
    'whatsapp_message'   => "Hello AJDATASUB support, I have an inquiry.",
    'support_phone'      => "+2347048609646",
    'support_email'      => "support@ajdatasub.com.ng",
    'office_address'     => "Katsina, Nigeria",
    
    // Links & Buttons
    'login_url'          => "/login",
    'register_url'       => "/register",
    'dashboard_url'      => "/home",
    'download_apk_url'   => "/download-app",
    'playstore_url'      => "#",
    
    // Trust Metrics
    'stat_active_users'  => "15,000+",
    'stat_transactions'  => "250,000+",
    'stat_delivery_speed'=> "Under 5 Secs",
    'stat_satisfaction'  => "99.8%",
    
    // Notice Banner (Set 'show' to false to hide)
    'announcement'       => [
        'show'    => true,
        'badge'   => "PROMO",
        'message' => "MTN SME Data prices reduced! Get 1GB for as low as ₦285. Resellers welcome!"
    ]
];

// Database Connection for Live Plan Pricing Preview
$dbPlans = [];
try {
    if (file_exists(__DIR__ . '/db.php')) {
        require_once __DIR__ . '/db.php';
        $pdo = Database::getConnection();
        if ($pdo) {
            $stmt = $pdo->query("
                SELECT network, category, size, validity, COALESCE(custom_retail_price, selling_price, price) as price 
                FROM vtu_plans 
                WHERE status = 'active' OR is_active = 1
                ORDER BY price ASC 
                LIMIT 24
            ");
            $dbPlans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
} catch (Exception $e) {
    // Graceful fallback to default offline plans
}

// Fallback plans if database is not seeded
if (empty($dbPlans)) {
    $dbPlans = [
        ['network' => 'mtn', 'category' => 'SME', 'size' => '500MB', 'validity' => '30 Days', 'price' => 150],
        ['network' => 'mtn', 'category' => 'SME', 'size' => '1GB', 'validity' => '30 Days', 'price' => 290],
        ['network' => 'mtn', 'category' => 'SME', 'size' => '2GB', 'validity' => '30 Days', 'price' => 580],
        ['network' => 'mtn', 'category' => 'SME', 'size' => '5GB', 'validity' => '30 Days', 'price' => 1450],
        ['network' => 'airtel', 'category' => 'Corporate Gifting', 'size' => '1GB', 'validity' => '30 Days', 'price' => 295],
        ['network' => 'airtel', 'category' => 'Corporate Gifting', 'size' => '2GB', 'validity' => '30 Days', 'price' => 590],
        ['network' => 'glo', 'category' => 'Corporate Gifting', 'size' => '1GB', 'validity' => '30 Days', 'price' => 285],
        ['network' => 'glo', 'category' => 'Corporate Gifting', 'size' => '2GB', 'validity' => '30 Days', 'price' => 570],
        ['network' => '9mobile', 'category' => 'SME', 'size' => '1GB', 'validity' => '30 Days', 'price' => 250],
        ['network' => '9mobile', 'category' => 'SME', 'size' => '2GB', 'validity' => '30 Days', 'price' => 500],
    ];
}

$waLink = "https://wa.me/" . preg_replace('/[^0-9]/', '', $CONFIG['whatsapp_number']) . "?text=" . urlencode($CONFIG['whatsapp_message']);
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title><?= htmlspecialchars($CONFIG['app_name']) ?> - <?= htmlspecialchars($CONFIG['app_tagline']) ?></title>
    <meta name="description" content="<?= htmlspecialchars($CONFIG['hero_subtitle']) ?>">
    <meta name="theme-color" content="#0b1329">
    <link rel="icon" type="image/png" href="/logo.png">
    
    <!-- Modern Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                    },
                    colors: {
                        brand: {
                            50: '#f0f7ff',
                            100: '#e0effe',
                            500: '#0284c7',
                            600: '#0052cc',
                            700: '#0041a8',
                            800: '#0a235c',
                            900: '#07163a',
                            950: '#040d24',
                        },
                        accent: {
                            orange: '#ff6b00',
                            gold: '#f59e0b',
                            emerald: '#10b981',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body { overflow-x: hidden; }
        .tap-target { min-height: 44px; min-width: 44px; }
        .hero-pattern {
            background-color: #050d20;
            background-image: radial-gradient(rgba(0, 82, 204, 0.25) 1px, transparent 0);
            background-size: 24px 24px;
        }
    </style>
</head>
<body class="bg-[#070e1e] text-slate-100 font-sans antialiased selection:bg-brand-600 selection:text-white">
    <!-- RETURNING CUSTOMER SMART DETECTOR -->
    <div id="returning-customer-banner" class="hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 shadow-md z-50 relative">
        <span>⚡ Welcome back! We detected an active session on this device.</span>
        <a href="/home" class="bg-white text-blue-900 px-3 py-1.5 rounded-full text-xs font-bold shadow hover:bg-slate-100 transition">Go to Dashboard →</a>
    </div>
    <script>
        try {
            if (localStorage.getItem("aj_token") || localStorage.getItem("vtu_user") || document.cookie.includes("aj_session")) {
                const banner = document.getElementById("returning-customer-banner");
                if (banner) banner.classList.remove("hidden");
            }
        } catch(e) {}
    </script>

    <!-- TOP ANNOUNCEMENT BANNER -->
    <?php if ($CONFIG['announcement']['show']): ?>
    <div class="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
        <span class="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"><?= htmlspecialchars($CONFIG['announcement']['badge']) ?></span>
        <span><?= htmlspecialchars($CONFIG['announcement']['message']) ?></span>
    </div>
    <?php endif; ?>

    <!-- NAVBAR -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-[#070e1e]/90 border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <a href="/" class="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" class="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 border border-white/15" onerror="this.src='/telecom/mtn.svg'; this.style.display='none';">
                <div>
                    <span class="text-lg sm:text-xl font-extrabold tracking-tight text-white block"><?= htmlspecialchars($CONFIG['app_name']) ?></span>
                    <span class="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block -mt-1">Automated VTU Switch</span>
                </div>
            </a>

            <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
                <a href="#services" class="hover:text-cyan-400 transition-colors">Services</a>
                <a href="#pricing" class="hover:text-cyan-400 transition-colors">Data Plans</a>
                <a href="#how-it-works" class="hover:text-cyan-400 transition-colors">How It Works</a>
                <a href="#app" class="hover:text-cyan-400 transition-colors">Download App</a>
                <a href="#faq" class="hover:text-cyan-400 transition-colors">FAQ</a>
            </nav>

            <div class="flex items-center gap-3">
                <a href="<?= htmlspecialchars($CONFIG['login_url']) ?>" class="tap-target px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition flex items-center justify-center">
                    Sign In
                </a>
                <a href="<?= htmlspecialchars($CONFIG['register_url']) ?>" class="tap-target px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5">
                    <span>Create Account</span>
                    <span>→</span>
                </a>
            </div>
        </div>
    </header>

    <!-- HERO SECTION -->
    <section class="relative hero-pattern pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden border-b border-slate-800/60">
        <!-- Ambient Glow Circles -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[650px] h-96 sm:h-[650px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/3 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center max-w-3xl mx-auto">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-sm">
                    <span><?= htmlspecialchars($CONFIG['hero_badge']) ?></span>
                </div>

                <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                    <?= htmlspecialchars($CONFIG['hero_headline']) ?>
                </h1>

                <p class="mt-6 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    <?= htmlspecialchars($CONFIG['hero_subtitle']) ?>
                </p>

                <!-- Action CTA Buttons -->
                <div class="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
                    <a href="<?= htmlspecialchars($CONFIG['register_url']) ?>" class="tap-target w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5">
                        <span>Get Started in 1 Minute</span>
                        <span>⚡</span>
                    </a>
                    <a href="<?= htmlspecialchars($CONFIG['download_apk_url']) ?>" class="tap-target w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition">
                        <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.551.4482-.9996.9993-.9996.5518 0 1.0007.4486 1.0007.9996 0 .5517-.4489 1.0003-1.0007 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.551.4482-.9996.9993-.9996.5518 0 1.0007.4486 1.0007.9996 0 .5517-.4489 1.0003-1.0007 1.0003m11.4045-6.02l1.996-3.4568a.4158.4158 0 00-.1523-.5676.416.416 0 00-.568.1523l-2.0223 3.503C15.5902 8.4116 13.8533 8.09 12 8.09c-1.8533 0-3.5902.3216-5.1349.8623L4.8428 5.4493a.4162.4162 0 00-.568-.1523.4157.4157 0 00-.1523.5676l1.996 3.4568C2.688 11.087.4118 14.7335 0 18.999h24c-.4118-4.2655-2.688-7.912-6.1185-9.6776"/>
                        </svg>
                        <span>Download Android APK</span>
                    </a>
                </div>

                <!-- Live Proof Metrics -->
                <div class="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div class="text-2xl sm:text-3xl font-black text-cyan-400 font-mono"><?= htmlspecialchars($CONFIG['stat_active_users']) ?></div>
                        <div class="text-xs text-slate-400 mt-1 font-medium">Registered Users</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div class="text-2xl sm:text-3xl font-black text-orange-400 font-mono"><?= htmlspecialchars($CONFIG['stat_transactions']) ?></div>
                        <div class="text-xs text-slate-400 mt-1 font-medium">Completed Orders</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono"><?= htmlspecialchars($CONFIG['stat_delivery_speed']) ?></div>
                        <div class="text-xs text-slate-400 mt-1 font-medium">Delivery Guarantee</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div class="text-2xl sm:text-3xl font-black text-indigo-400 font-mono"><?= htmlspecialchars($CONFIG['stat_satisfaction']) ?></div>
                        <div class="text-xs text-slate-400 mt-1 font-medium">Platform Uptime</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- LIVE PRICING TABLE SECTION -->
    <section id="pricing" class="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 bg-orange-950/60 border border-orange-500/20 px-3 py-1 rounded-full">Wholesale & Retail Prices</span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-3">Live Telecom Data Bundles</h2>
            <p class="text-slate-400 text-sm sm:text-base mt-2">Prices update live automatically. No hidden charges or extra transaction fees.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <?php 
            $networks = ['mtn', 'airtel', 'glo', '9mobile'];
            foreach ($networks as $net):
                $netPlans = array_filter($dbPlans, fn($p) => strtolower($p['network']) === $net);
                $netColor = [
                    'mtn' => 'from-amber-500/20 to-yellow-500/5 border-amber-500/30 text-amber-400',
                    'airtel' => 'from-red-500/20 to-rose-500/5 border-red-500/30 text-red-400',
                    'glo' => 'from-emerald-500/20 to-green-500/5 border-emerald-500/30 text-emerald-400',
                    '9mobile' => 'from-lime-500/20 to-emerald-500/5 border-lime-500/30 text-lime-400',
                ][$net];
            ?>
            <div class="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                    <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div>
                            <h3 class="text-xl font-black uppercase tracking-wider text-white"><?= strtoupper($net) ?></h3>
                            <span class="text-xs text-slate-400">SME & Corporate Gifting</span>
                        </div>
                        <span class="w-3 h-3 rounded-full <?= $net === 'mtn' ? 'bg-amber-400' : ($net === 'airtel' ? 'bg-red-500' : ($net === 'glo' ? 'bg-emerald-500' : 'bg-lime-400')) ?>"></span>
                    </div>

                    <div class="space-y-3 mt-4">
                        <?php 
                        $count = 0;
                        foreach ($netPlans as $plan):
                            if ($count++ >= 5) break;
                        ?>
                        <div class="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-800/40 border border-slate-800/80 text-sm">
                            <div>
                                <span class="font-bold text-white"><?= htmlspecialchars($plan['size']) ?></span>
                                <span class="text-[10px] text-slate-400 block font-mono"><?= htmlspecialchars($plan['validity'] ?? '30 Days') ?></span>
                            </div>
                            <div class="text-right">
                                <span class="font-mono font-black text-cyan-400">₦<?= number_format((float)$plan['price']) ?></span>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800 text-center">
                    <span class="text-[10px] text-slate-400 font-medium">⚡ Instant Automated Delivery</span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <div class="mt-8 text-center">
            <a href="<?= htmlspecialchars($CONFIG['register_url']) ?>" class="tap-target inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition">
                <span>Create Free Account to Buy Data</span>
                <span>&rarr;</span>
            </a>
        </div>
    </section>

    <!-- CORE SERVICES SHOWCASE -->
    <section id="services" class="py-16 sm:py-24 bg-slate-950/60 border-t border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-500/20 px-3 py-1 rounded-full">All-In-One Utility Suite</span>
                <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-3">Everything You Need In One Wallet</h2>
                <p class="text-slate-400 text-sm sm:text-base mt-2">Zero downtime, instant crediting, and instant resolution for all services.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Service 1: Data -->
                <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition">
                    <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl mb-4">📶</div>
                    <h3 class="text-lg font-bold text-white">Instant Data Bundles</h3>
                    <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">SME, Corporate Gifting, and Direct Gifting data for MTN, Airtel, Glo, and 9mobile. Valid for 30 days with rollover.</p>
                </div>

                <!-- Service 2: Airtime -->
                <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-orange-500/40 transition">
                    <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center text-2xl mb-4">📱</div>
                    <h3 class="text-lg font-bold text-white">Airtime VTU & Discounts</h3>
                    <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">Enjoy 2.5% to 4.5% instant discount on all airtime recharges. Never pay full face-value price again.</p>
                </div>

                <!-- Service 3: Electricity -->
                <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl mb-4">⚡</div>
                    <h3 class="text-lg font-bold text-white">Prepaid Electricity Tokens</h3>
                    <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">Instant STS token generation for KEDCO, AEDC, IKEDC, EKEDC, IBEDC, and other DISCOs across Nigeria.</p>
                </div>

                <!-- Service 4: Cable TV -->
                <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition">
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-2xl mb-4">📺</div>
                    <h3 class="text-lg font-bold text-white">Cable TV Subscriptions</h3>
                    <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">Instant renewal and account validation for DStv, GOtv, and StarTimes. Direct switch crediting.</p>
                </div>

                <!-- Service 5: Exam Tokens -->
                <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mb-4">🎓</div>
                    <h3 class="text-lg font-bold text-white">Exam Scratch PINs</h3>
                    <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">Official result checker PINs for WAEC, NECO, NABTEB, and JAMB profile creation codes.</p>
                </div>

                <!-- Service 6: Dedicated Virtual Accounts -->
                <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition">
                    <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-2xl mb-4">🏦</div>
                    <h3 class="text-lg font-bold text-white">Automated Wallet Funding</h3>
                    <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">Dedicated dynamic bank accounts (Monnify, Payvessel, Palmpay, OPay). Any bank transfer funds your wallet in seconds.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how-it-works" class="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full">Seamless Experience</span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-3">Three Simple Steps</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div class="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 relative">
                <span class="text-4xl font-black text-blue-500/30 font-mono block mb-2">01</span>
                <h3 class="text-lg font-bold text-white">Register Free</h3>
                <p class="text-xs sm:text-sm text-slate-400 mt-2">Sign up with your phone number and full name. Your account is activated instantly with a secure 4-digit PIN.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 relative">
                <span class="text-4xl font-black text-orange-500/30 font-mono block mb-2">02</span>
                <h3 class="text-lg font-bold text-white">Fund Your Wallet</h3>
                <p class="text-xs sm:text-sm text-slate-400 mt-2">Transfer money into your dedicated virtual account from any Nigerian bank app or USSD. It credits in real-time.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 relative">
                <span class="text-4xl font-black text-emerald-500/30 font-mono block mb-2">03</span>
                <h3 class="text-lg font-bold text-white">Transact In Seconds</h3>
                <p class="text-xs sm:text-sm text-slate-400 mt-2">Select your network or biller, enter the recipient phone/meter number, confirm order, and receive value instantly.</p>
            </div>
        </div>
    </section>

    <!-- MOBILE APP CTA BANNER -->
    <section id="app" class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 sm:p-12 border border-blue-700/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div class="max-w-xl text-center md:text-left">
                <span class="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider bg-blue-950/80 px-3 py-1 rounded-full border border-blue-400/30">Mobile First Experience</span>
                <h2 class="text-2xl sm:text-4xl font-black text-white mt-4 tracking-tight">Stay Connected On The Go</h2>
                <p class="text-slate-300 text-sm sm:text-base mt-3">Download our lightweight Android mobile app for faster one-tap vending, biometric fingerprint login, and transaction push notifications.</p>
                <div class="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                    <a href="<?= htmlspecialchars($CONFIG['download_apk_url']) ?>" class="tap-target px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 flex items-center gap-2">
                        <span>Direct APK Download</span>
                        <span>↓</span>
                    </a>
                    <a href="<?= htmlspecialchars($CONFIG['dashboard_url']) ?>" class="tap-target px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20">
                        Launch Web App
                    </a>
                </div>
            </div>

            <div class="w-full max-w-xs p-6 rounded-2xl bg-slate-950/70 border border-slate-700/80 backdrop-blur-md text-center">
                <div class="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">Android Compatible</div>
                <div class="text-lg font-bold text-white"><?= htmlspecialchars($CONFIG['app_name']) ?> Mobile</div>
                <div class="text-xs text-slate-400 mt-1">Requires Android 7.0 or higher</div>
                <div class="mt-4 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-mono font-semibold">
                    ✓ Verified Safe & Virus-Free
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ SECTION -->
    <section id="faq" class="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p class="text-slate-400 text-sm mt-2">Everything you need to know about our VTU services.</p>
        </div>

        <div class="space-y-4">
            <details class="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <summary class="font-bold text-white text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                    <span>How fast are data bundle and airtime deliveries?</span>
                    <span class="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p class="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    Our platform is connected directly to automated telecom switches. Transactions are processed and credited in under 5 seconds.
                </p>
            </details>

            <details class="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <summary class="font-bold text-white text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                    <span>How do I fund my wallet?</span>
                    <span class="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p class="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    Upon registration, you receive dedicated personalized virtual bank account numbers (e.g. Monnify, Payvessel, OPay, Palmpay). Any bank transfer to those account numbers credits your wallet automatically 24/7.
                </p>
            </details>

            <details class="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <summary class="font-bold text-white text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                    <span>What happens if my transaction fails?</span>
                    <span class="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p class="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    Our system has automatic atomic rollbacks. If the telecom provider fails to deliver your order, your wallet balance is refunded immediately without delay.
                </p>
            </details>

            <details class="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <summary class="font-bold text-white text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                    <span>Can I become an agent or reseller?</span>
                    <span class="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p class="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    Yes! You can purchase at wholesale prices and resell to friends, family, or customers. We also provide full REST API documentation for developers building their own VTU apps.
                </p>
            </details>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-xs text-slate-400">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-900">
            <div>
                <span class="text-base font-extrabold text-white block mb-2"><?= htmlspecialchars($CONFIG['app_name']) ?></span>
                <p class="text-slate-400 leading-relaxed"><?= htmlspecialchars($CONFIG['app_tagline']) ?></p>
                <div class="mt-4 text-[11px] text-slate-500">
                    Katsina • Lagos • Abuja • Nigeria
                </div>
            </div>

            <div>
                <span class="text-xs font-bold text-white uppercase tracking-wider block mb-3">Quick Navigation</span>
                <ul class="space-y-2">
                    <li><a href="#services" class="hover:text-cyan-400 transition">Our Services</a></li>
                    <li><a href="#pricing" class="hover:text-cyan-400 transition">Data Plans & Pricing</a></li>
                    <li><a href="<?= htmlspecialchars($CONFIG['login_url']) ?>" class="hover:text-cyan-400 transition">User Login</a></li>
                    <li><a href="<?= htmlspecialchars($CONFIG['register_url']) ?>" class="hover:text-cyan-400 transition">Create Account</a></li>
                </ul>
            </div>

            <div>
                <span class="text-xs font-bold text-white uppercase tracking-wider block mb-3">Legal & Security</span>
                <ul class="space-y-2">
                    <li><a href="/terms" class="hover:text-cyan-400 transition">Terms of Service</a></li>
                    <li><a href="/privacy" class="hover:text-cyan-400 transition">Privacy Policy</a></li>
                    <li><a href="/support" class="hover:text-cyan-400 transition">Help & Support Desk</a></li>
                </ul>
            </div>

            <div>
                <span class="text-xs font-bold text-white uppercase tracking-wider block mb-3">Company</span>
                <ul class="space-y-2">
                    <li>Phone: <a href="tel:<?= htmlspecialchars($CONFIG['support_phone']) ?>" class="text-white hover:text-cyan-400"><?= htmlspecialchars($CONFIG['support_phone']) ?></a></li>
                    <li>Email: <a href="mailto:<?= htmlspecialchars($CONFIG['support_email']) ?>" class="text-white hover:text-cyan-400"><?= htmlspecialchars($CONFIG['support_email']) ?></a></li>
                    <li>Location: <span class="text-slate-300"><?= htmlspecialchars($CONFIG['office_address']) ?></span></li>
                    <li>Live Agent: <a href="<?= htmlspecialchars($CONFIG['register_url']) ?>" class="text-emerald-400 hover:underline">Chat with Live Agent</a></li>
                </ul>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© <?= date('Y') ?> <?= htmlspecialchars($CONFIG['app_name']) ?>. All rights reserved.</p>
            <p class="font-mono text-[10px] text-slate-500">Built for speed, security & high reliability.</p>
        </div>
    </footer>

    <!-- FLOATING WHATSAPP BUTTON -->
    <a href="<?= htmlspecialchars($waLink) ?>" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 z-50 tap-target px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border border-emerald-400/30 transition transform hover:scale-105" aria-label="Chat on WhatsApp">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
        <span class="hidden sm:inline">WhatsApp Help</span>
    </a>

</body>
</html>
