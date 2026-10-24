<?php
/**
 * ============================================================================
 * VTU SCRIPT - DATA VENDING HANDLER
 * ============================================================================
 * Handles SME, Corporate Gifting, and Direct Data vending.
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

class DataHandler {
    private $pdo;

    public function __construct(PDO $pdo = null) {
        $this->pdo = $pdo ?: get_db_connection();
    }

    /**
     * Get all active data plans grouped or filtered by network
     */
    public function getActivePlans($network = null) {
        if (!$this->pdo) {
            return $this->getFallbackPlans($network);
        }

        try {
            if ($network) {
                $stmt = $this->pdo->prepare("SELECT * FROM vtu_plans WHERE network = :net AND status = 1 ORDER BY selling_price ASC");
                $stmt->execute([':net' => strtoupper($network)]);
            } else {
                $stmt = $this->pdo->query("SELECT * FROM vtu_plans WHERE status = 1 ORDER BY network, selling_price ASC");
            }
            $plans = $stmt->fetchAll();
            return !empty($plans) ? $plans : $this->getFallbackPlans($network);
        } catch (Exception $e) {
            error_log("Failed to load plans: " . $e->getMessage());
            return $this->getFallbackPlans($network);
        }
    }

    /**
     * Execute a data purchase transaction
     */
    public function purchaseData($userId, $planId, $recipientPhone, $pin) {
        $phone = preg_replace('/[^0-9]/', '', $recipientPhone);
        if (strlen($phone) === 10) {
            $phone = '0' . $phone;
        }

        if (strlen($phone) !== 11) {
            return ['status' => false, 'message' => 'Invalid Nigerian phone number. Must be 11 digits (e.g. 08012345678).'];
        }

        if (!$this->pdo) {
            return ['status' => false, 'message' => 'Database connection unavailable. Please check config/database.php.'];
        }

        try {
            $this->pdo->beginTransaction();

            // 1. Fetch user and verify PIN + Balance
            $userStmt = $this->pdo->prepare("SELECT * FROM users WHERE id = :id FOR UPDATE");
            $userStmt->execute([':id' => $userId]);
            $user = $userStmt->fetch();

            if (!$user) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'User account not found.'];
            }

            if ($user['status'] === 'suspended') {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'Account is suspended. Please contact support.'];
            }

            if (!empty($user['pin']) && $user['pin'] !== $pin) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'Incorrect transaction PIN.'];
            }

            // 2. Fetch Plan details
            $planStmt = $this->pdo->prepare("SELECT * FROM vtu_plans WHERE id = :pid AND status = 1");
            $planStmt->execute([':pid' => $planId]);
            $plan = $planStmt->fetch();

            if (!$plan) {
                $fallback = $this->findFallbackPlan($planId);
                if ($fallback) {
                    $plan = $fallback;
                } else {
                    $this->pdo->rollBack();
                    return ['status' => false, 'message' => 'Selected data bundle is currently unavailable.'];
                }
            }

            // Apply Tier pricing if reseller
            $price = ($user['tier'] === 'reseller' || $user['tier'] === 'api') 
                ? (float)$plan['reseller_price'] 
                : (float)$plan['selling_price'];

            $balanceBefore = (float)$user['balance'];

            if ($balanceBefore < $price) {
                $this->pdo->rollBack();
                return [
                    'status' => false, 
                    'message' => 'Insufficient wallet balance. Price: ' . CURRENCY_SYMBOL . number_format($price, 2) . ', Your balance: ' . CURRENCY_SYMBOL . number_format($balanceBefore, 2)
                ];
            }

            // 3. Atomically debit user balance
            $balanceAfter = $balanceBefore - $price;
            $debitStmt = $this->pdo->prepare("UPDATE users SET balance = balance - :amount WHERE id = :id AND balance >= :amount");
            $debitStmt->execute([':amount' => $price, ':id' => $userId]);

            if ($debitStmt->rowCount() === 0) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'Balance deduction failed. Please try again.'];
            }

            // 4. Generate unique reference
            $ref = 'DATA_' . date('YmdHis') . '_' . strtoupper(substr(uniqid(), -5));

            // 5. Call upstream API (Payflex / Peyflex)
            $apiResult = $this->callUpstreamApi($plan, $phone, $ref);

            $orderStatus = $apiResult['success'] ? 'SUCCESS' : 'FAILED';
            $apiMessage = $apiResult['message'] ?? 'Transaction completed';

            // If upstream failed, refund user immediately
            if ($orderStatus === 'FAILED') {
                $refundStmt = $this->pdo->prepare("UPDATE users SET balance = balance + :amount WHERE id = :id");
                $refundStmt->execute([':amount' => $price, ':id' => $userId]);
                $balanceAfter = $balanceBefore; // refunded
            }

            // 6. Record transaction
            $txStmt = $this->pdo->prepare("
                INSERT INTO transactions (user_id, reference, service_type, network, recipient, amount, balance_before, balance_after, status, description, api_response)
                VALUES (:uid, :ref, 'data', :net, :rec, :amt, :bb, :ba, :stat, :desc, :resp)
            ");
            $txStmt->execute([
                ':uid'  => $userId,
                ':ref'  => $ref,
                ':net'  => $plan['network'],
                ':rec'  => $phone,
                ':amt'  => $price,
                ':bb'   => $balanceBefore,
                ':ba'   => $balanceAfter,
                ':stat' => $orderStatus,
                ':desc' => "{$plan['network']} {$plan['bundle_size']} {$plan['plan_type']} to {$phone}",
                ':resp' => json_encode($apiResult)
            ]);

            $this->pdo->commit();

            if ($orderStatus === 'SUCCESS') {
                return [
                    'status'    => true,
                    'message'   => "Successfully vended {$plan['network']} {$plan['bundle_size']} to {$phone}.",
                    'reference' => $ref,
                    'network'   => $plan['network'],
                    'bundle'    => $plan['bundle_size'],
                    'recipient' => $phone,
                    'amount'    => $price,
                    'balance'   => $balanceAfter
                ];
            } else {
                return [
                    'status'  => false,
                    'message' => "Vending failed: {$apiMessage}. Your wallet was not debited.",
                    'refunded'=> true
                ];
            }

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Data purchase exception: " . $e->getMessage());
            return ['status' => false, 'message' => 'An unexpected error occurred. Please try again.'];
        }
    }

    /**
     * Upstream API Caller for Peyflex/Payflex
     */
    private function callUpstreamApi($plan, $phone, $reference) {
        if (VTU_GATEWAY === 'SIMULATION' || empty(PAYFLEX_API_KEY)) {
            // Instant success for test/offline environments
            return ['success' => true, 'message' => 'Delivered instantly (Simulation Mode)'];
        }

        $url = rtrim(PAYFLEX_BASE_URL, '/') . '/data/';
        $headers = [
            'Authorization: Token ' . PAYFLEX_API_KEY,
            'Content-Type: application/json'
        ];
        $body = json_encode([
            'network'      => $plan['network'],
            'mobile_number'=> $phone,
            'plan'         => $plan['api_code'],
            'Ported_number'=> true,
            'request_id'   => $reference
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($res, true);
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'message' => $json['message'] ?? 'Data bundle dispatched successfully', 'data' => $json];
        }

        return [
            'success' => false, 
            'message' => $json['error'] ?? $json['message'] ?? 'Upstream provider returned an error (' . $httpCode . ')'
        ];
    }

    /**
     * Fallback bundles if database has not yet been seeded
     */
    public function getFallbackPlans($network = null) {
        $plans = [
            ['id' => 1, 'network' => 'MTN', 'plan_type' => 'SME', 'bundle_name' => 'MTN 1.0GB SME', 'bundle_size' => '1.0 GB', 'cost_price' => 275.00, 'selling_price' => 295.00, 'reseller_price' => 285.00, 'api_code' => '1', 'validity' => '30 Days'],
            ['id' => 2, 'network' => 'MTN', 'plan_type' => 'SME', 'bundle_name' => 'MTN 2.0GB SME', 'bundle_size' => '2.0 GB', 'cost_price' => 550.00, 'selling_price' => 585.00, 'reseller_price' => 565.00, 'api_code' => '2', 'validity' => '30 Days'],
            ['id' => 3, 'network' => 'MTN', 'plan_type' => 'SME', 'bundle_name' => 'MTN 5.0GB SME', 'bundle_size' => '5.0 GB', 'cost_price' => 1375.00, 'selling_price' => 1460.00, 'reseller_price' => 1410.00, 'api_code' => '5', 'validity' => '30 Days'],
            ['id' => 4, 'network' => 'AIRTEL', 'plan_type' => 'CG', 'bundle_name' => 'Airtel 1.0GB Corporate', 'bundle_size' => '1.0 GB', 'cost_price' => 280.00, 'selling_price' => 310.00, 'reseller_price' => 295.00, 'api_code' => '101', 'validity' => '30 Days'],
            ['id' => 5, 'network' => 'AIRTEL', 'plan_type' => 'CG', 'bundle_name' => 'Airtel 2.0GB Corporate', 'bundle_size' => '2.0 GB', 'cost_price' => 560.00, 'selling_price' => 610.00, 'reseller_price' => 585.00, 'api_code' => '102', 'validity' => '30 Days'],
            ['id' => 6, 'network' => 'GLO', 'plan_type' => 'CG', 'bundle_name' => 'Glo 1.0GB Corporate', 'bundle_size' => '1.0 GB', 'cost_price' => 260.00, 'selling_price' => 290.00, 'reseller_price' => 275.00, 'api_code' => '201', 'validity' => '30 Days'],
            ['id' => 7, 'network' => '9MOBILE', 'plan_type' => 'GIFTING', 'bundle_name' => '9mobile 1.5GB Gifting', 'bundle_size' => '1.5 GB', 'cost_price' => 320.00, 'selling_price' => 360.00, 'reseller_price' => 340.00, 'api_code' => '301', 'validity' => '30 Days'],
        ];

        if ($network) {
            return array_values(array_filter($plans, function($p) use ($network) {
                return strtoupper($p['network']) === strtoupper($network);
            }));
        }

        return $plans;
    }

    private function findFallbackPlan($id) {
        $plans = $this->getFallbackPlans();
        foreach ($plans as $p) {
            if ($p['id'] == $id) return $p;
        }
        return null;
    }
}
