<?php
/**
 * ==============================================================================
 * AL'AMIN JAGORA DATA - API SERVER DASHBOARD & HEALTH MONITOR
 * ==============================================================================
 * Served when visiting http://localhost/jagora-api/ in the browser.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Test Database Connection
$dbStatus = 'UNKNOWN';
$dbMessage = '';
$tableCount = 0;
$userCount = 0;
$txCount = 0;

try {
    require_once __DIR__ . '/db.php';
    $db = Database::getConnection();
    if ($db) {
        $dbStatus = 'CONNECTED';
        
        // Query database statistics
        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $tableCount = count($tables);

        if (in_array('users', $tables)) {
            $userCount = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        }
        if (in_array('transactions', $tables)) {
            $txCount = (int)$db->query("SELECT COUNT(*) FROM transactions")->fetchColumn();
        }
    }
} catch (Exception $e) {
    $dbStatus = 'FAILED';
    $dbMessage = $e->getMessage();
}

// If index.html exists in public_html and user visits /index.php directly in a browser,
// redirect to the web app root '/' unless ?api_monitor=1 or ?json=1 is explicitly requested.
if (file_exists(__DIR__ . '/index.html') && !isset($_GET['api_monitor']) && !isset($_GET['json']) && (!isset($_SERVER['HTTP_ACCEPT']) || strpos($_SERVER['HTTP_ACCEPT'], 'application/json') === false)) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (basename($uriPath) === 'index.php') {
        header('Location: /');
        exit;
    }
}

// Return JSON if requested by client or header Accept: application/json
$wantsJson = (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false));
if ($wantsJson) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'service' => "Al'amin Jagora Data REST API",
        'version' => '1.0.0',
        'timestamp' => date('c'),
        'database' => [
            'status' => $dbStatus,
            'tables' => $tableCount,
            'users' => $userCount,
            'transactions' => $txCount,
            'error' => $dbMessage
        ],
        'endpoints' => [
            'auth_login' => '/auth/login.php',
            'auth_register' => '/auth/register.php',
            'auth_profile' => '/auth/profile.php',
            'vtu_plans' => '/vtu/plans.php',
            'vtu_buy_data' => '/vtu/buy-data.php',
            'vtu_buy_airtime' => '/vtu/buy-airtime.php',
            'admin_stats' => '/admin/stats.php',
            'webhook_xixapay' => '/webhook/xixapay.php',
            'webhook_payvessel' => '/webhook/payvessel.php'
        ]
    ]);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Al'amin Jagora Data - REST API Server</title>
    <style>
        :root {
            --primary: #0047cc;
            --primary-dark: #0036a0;
            --bg: #0b1120;
            --card-bg: #131d35;
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
            --border: #1e293b;
            --emerald: #10b981;
            --rose: #f43f5e;
            --amber: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text-main);
            min-height: 100vh;
            padding: 30px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 840px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 36px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
            padding-bottom: 24px;
            margin-bottom: 28px;
            flex-wrap: wrap;
            gap: 16px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .logo-icon {
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, #0047cc, #00d2ff);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 22px;
            color: #fff;
            box-shadow: 0 8px 20px rgba(0, 71, 204, 0.4);
        }
        .brand h1 {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .brand p {
            font-size: 13px;
            color: var(--text-sub);
            margin-top: 2px;
        }
        .badge-live {
            background: rgba(16, 185, 129, 0.15);
            color: var(--emerald);
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--emerald);
            box-shadow: 0 0 10px var(--emerald);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 18px;
        }
        .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-sub);
            font-weight: 700;
        }
        .stat-val {
            font-size: 24px;
            font-weight: 800;
            margin-top: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .stat-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 700;
            margin-top: 6px;
        }
        .status-ok { color: var(--emerald); }
        .status-err { color: var(--rose); }
        .section-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 14px;
            color: var(--text-sub);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .endpoint-list {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 30px;
        }
        .endpoint-row {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .endpoint-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .method {
            font-weight: 800;
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 6px;
        }
        .method-get { background: rgba(16, 185, 129, 0.2); color: var(--emerald); }
        .method-post { background: rgba(0, 71, 204, 0.2); color: #60a5fa; }
        .test-link {
            font-size: 12px;
            color: #60a5fa;
            text-decoration: none;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 8px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            transition: all 0.2s;
        }
        .test-link:hover {
            background: rgba(96, 165, 250, 0.1);
        }
        .footer-note {
            padding-top: 20px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: var(--text-sub);
            flex-wrap: wrap;
            gap: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">
                <div class="logo-icon">AJ</div>
                <div>
                    <h1>Al'amin Jagora Data REST API</h1>
                    <p>Telecom & VTU Engine • Backend Server Gateway</p>
                </div>
            </div>
            <div class="badge-live">
                <span class="dot"></span>
                <span>API ONLINE (Port 80)</span>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">MySQL Database</div>
                <div class="stat-status <?= $dbStatus === 'CONNECTED' ? 'status-ok' : 'status-err' ?>">
                    <?= $dbStatus === 'CONNECTED' ? '● Connected' : '✕ Connection Error' ?>
                </div>
                <?php if ($dbMessage): ?>
                    <p style="font-size: 11px; color: var(--rose); margin-top: 4px;"><?= htmlspecialchars($dbMessage) ?></p>
                <?php else: ?>
                    <p style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">Database: jagora_data</p>
                <?php endif; ?>
            </div>

            <div class="stat-card">
                <div class="stat-label">Tables Detected</div>
                <div class="stat-val"><?= $tableCount ?></div>
                <p style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">Schema verified</p>
            </div>

            <div class="stat-card">
                <div class="stat-label">Registered Users</div>
                <div class="stat-val"><?= $userCount ?></div>
                <p style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">Active accounts</p>
            </div>

            <div class="stat-card">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-val"><?= $txCount ?></div>
                <p style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">Processed in DB</p>
            </div>
        </div>

        <div class="section-title">Verified REST Endpoints</div>
        <div class="endpoint-list">
            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-get">GET</span>
                    <span>/vtu/plans.php</span>
                </div>
                <a href="vtu/plans.php" class="test-link" target="_blank">Test JSON ↗</a>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-post">POST</span>
                    <span>/auth/login.php</span>
                </div>
                <span style="font-size: 11px; color: var(--text-sub);">Accepts {username, password}</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-post">POST</span>
                    <span>/auth/register.php</span>
                </div>
                <span style="font-size: 11px; color: var(--text-sub);">Accepts {name, phone, email, password}</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-post">POST</span>
                    <span>/vtu/buy-data.php</span>
                </div>
                <span style="font-size: 11px; color: var(--text-sub);">Requires Bearer JWT</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-post">POST</span>
                    <span>/vtu/buy-airtime.php</span>
                </div>
                <span style="font-size: 11px; color: var(--text-sub);">Requires Bearer JWT</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-get">GET</span>
                    <span>/admin/stats.php</span>
                </div>
                <span style="font-size: 11px; color: var(--text-sub);">Requires Admin Token</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-post">POST</span>
                    <span>/webhook/xixapay.php</span>
                </div>
                <span style="font-size: 11px; color: #10b981; font-weight: 600;">XIXAPAY Automated Funding (Primary)</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method method-post">POST</span>
                    <span>/webhook/payvessel.php</span>
                </div>
                <span style="font-size: 11px; color: var(--text-sub);">Inbound payment notification</span>
            </div>
        </div>

        <div class="footer-note">
            <span>CORS Headers: Enabled (*)</span>
            <span>PHP <?= phpversion() ?> • Apache / XAMPP</span>
            <a href="?json=1" class="test-link">Get Raw Health JSON</a>
        </div>
    </div>
</body>
</html>
