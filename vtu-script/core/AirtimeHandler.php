<?php
/**
 * ============================================================================
 * VTU SCRIPT - AIRTIME VENDING HANDLER
 * ============================================================================
 * Handles instant airtime top-ups with automatic discount calculations.
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

class AirtimeHandler {
    private $pdo;

    public function __construct(PDO $pdo = null) {
        $this->pdo = $pdo ?: get_db_connection();
    }

    /**
     * Get discount percentage for a given network
     */
    public function getDiscount($network) {
        global $AIRTIME_DISCOUNTS;
        $net = strtoupper($network);
        return isset($AIRTIME_DISCOUNTS[$net]) ? (float)$AIRTIME_DISCOUNTS[$net] : 2.0;
    }

    /**
     * Purchase airtime for a recipient
     */
    public function purchaseAirtime($userId, $network, $amount, $recipientPhone, $pin) {
        $amount = (float)$amount;
        if ($amount < 50 || $amount > 50000) {
            return ['status' => false, 'message' => 'Airtime amount must be between ₦50 and ₦50,000.'];
        }

        $phone = preg_replace('/[^0-9]/', '', $recipientPhone);
        if (strlen($phone) === 10) {
            $phone = '0' . $phone;
        }

        if (strlen($phone) !== 11) {
            return ['status' => false, 'message' => 'Invalid Nigerian phone number. Must be 11 digits (e.g. 08012345678).'];
        }

        $net = strtoupper($network);
        if (!in_array($net, ['MTN', 'AIRTEL', 'GLO', '9MOBILE'])) {
            return ['status' => false, 'message' => 'Invalid mobile network selected.'];
        }

        if (!$this->pdo) {
            return ['status' => false, 'message' => 'Database connection unavailable.'];
        }

        try {
            $this->pdo->beginTransaction();

            // 1. Fetch user & verify PIN
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

            // 2. Calculate discounted payable amount
            $discountPercent = $this->getDiscount($net);
            // Reseller tier gets an extra 0.5% discount
            if ($user['tier'] === 'reseller' || $user['tier'] === 'api') {
                $discountPercent += 0.5;
            }

            $discountAmount = round(($amount * $discountPercent) / 100, 2);
            $payableAmount = $amount - $discountAmount;

            $balanceBefore = (float)$user['balance'];

            if ($balanceBefore < $payableAmount) {
                $this->pdo->rollBack();
                return [
                    'status' => false,
                    'message' => 'Insufficient balance. You need ' . CURRENCY_SYMBOL . number_format($payableAmount, 2) . ' (discount of ' . CURRENCY_SYMBOL . number_format($discountAmount, 2) . ' applied).'
                ];
            }

            // 3. Atomically debit user balance
            $balanceAfter = $balanceBefore - $payableAmount;
            $debitStmt = $this->pdo->prepare("UPDATE users SET balance = balance - :amount WHERE id = :id AND balance >= :amount");
            $debitStmt->execute([':amount' => $payableAmount, ':id' => $userId]);

            if ($debitStmt->rowCount() === 0) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'Failed to deduct wallet balance. Please try again.'];
            }

            // 4. Generate reference
            $ref = 'AIRTIME_' . date('YmdHis') . '_' . strtoupper(substr(uniqid(), -5));

            // 5. Upstream API call (Peyflex / Payflex)
            $apiResult = $this->callUpstreamApi($net, $amount, $phone, $ref);

            $orderStatus = $apiResult['success'] ? 'SUCCESS' : 'FAILED';
            $apiMessage = $apiResult['message'] ?? 'Airtime dispatched';

            if ($orderStatus === 'FAILED') {
                // Refund
                $refundStmt = $this->pdo->prepare("UPDATE users SET balance = balance + :amount WHERE id = :id");
                $refundStmt->execute([':amount' => $payableAmount, ':id' => $userId]);
                $balanceAfter = $balanceBefore;
            }

            // 6. Record transaction
            $txStmt = $this->pdo->prepare("
                INSERT INTO transactions (user_id, reference, service_type, network, recipient, amount, discount, balance_before, balance_after, status, description, api_response)
                VALUES (:uid, :ref, 'airtime', :net, :rec, :amt, :disc, :bb, :ba, :stat, :desc, :resp)
            ");
            $txStmt->execute([
                ':uid'  => $userId,
                ':ref'  => $ref,
                ':net'  => $net,
                ':rec'  => $phone,
                ':amt'  => $amount,
                ':disc' => $discountAmount,
                ':bb'   => $balanceBefore,
                ':ba'   => $balanceAfter,
                ':stat' => $orderStatus,
                ':desc' => "{$net} ₦" . number_format($amount, 2) . " airtime to {$phone} (Saved: ₦" . number_format($discountAmount, 2) . ")",
                ':resp' => json_encode($apiResult)
            ]);

            $this->pdo->commit();

            if ($orderStatus === 'SUCCESS') {
                return [
                    'status'    => true,
                    'message'   => "Successfully vended ₦" . number_format($amount, 2) . " {$net} airtime to {$phone}.",
                    'reference' => $ref,
                    'network'   => $net,
                    'amount'    => $amount,
                    'paid'      => $payableAmount,
                    'discount'  => $discountAmount,
                    'recipient' => $phone,
                    'balance'   => $balanceAfter
                ];
            } else {
                return [
                    'status'  => false,
                    'message' => "Airtime top-up failed: {$apiMessage}. Your wallet was not charged.",
                    'refunded'=> true
                ];
            }

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Airtime vending exception: " . $e->getMessage());
            return ['status' => false, 'message' => 'An error occurred while processing airtime.'];
        }
    }

    private function callUpstreamApi($network, $amount, $phone, $reference) {
        if (VTU_GATEWAY === 'SIMULATION' || empty(PAYFLEX_API_KEY)) {
            return ['success' => true, 'message' => 'Airtime delivered instantly (Simulation Mode)'];
        }

        $url = rtrim(PAYFLEX_BASE_URL, '/') . '/topup/';
        $headers = [
            'Authorization: Token ' . PAYFLEX_API_KEY,
            'Content-Type: application/json'
        ];
        $body = json_encode([
            'network'      => $network,
            'amount'       => $amount,
            'mobile_number'=> $phone,
            'Ported_number'=> true,
            'airtime_type' => 'VTU',
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
            return ['success' => true, 'message' => $json['message'] ?? 'Airtime dispatched successfully', 'data' => $json];
        }

        return [
            'success' => false, 
            'message' => $json['error'] ?? $json['message'] ?? 'Provider error (' . $httpCode . ')'
        ];
    }
}
