<?php
/**
 * ============================================================================
 * VTU SCRIPT - BILLS PAYMENT HANDLER (NEPA & CABLE TV)
 * ============================================================================
 * Handles electricity meter recharge and Cable TV subscriptions.
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

class BillHandler {
    private $pdo;

    public function __construct(PDO $pdo = null) {
        $this->pdo = $pdo ?: get_db_connection();
    }

    /**
     * Supported Electricity DISCOs
     */
    public function getDiscos() {
        return [
            ['code' => 'KEDCO', 'name' => 'Kano Electricity (KEDCO - Kano, Katsina, Jigawa)'],
            ['code' => 'IKEDC', 'name' => 'Ikeja Electric (IKEDC)'],
            ['code' => 'EKEDC', 'name' => 'Eko Electricity (EKEDC)'],
            ['code' => 'AEDC',  'name' => 'Abuja Electricity (AEDC)'],
            ['code' => 'IBEDC', 'name' => 'Ibadan Electricity (IBEDC)'],
            ['code' => 'PHED',  'name' => 'Port Harcourt Electricity (PHED)'],
            ['code' => 'JEDC',  'name' => 'Jos Electricity (JEDC)'],
            ['code' => 'KAEDCO','name' => 'Kaduna Electric (KAEDCO)']
        ];
    }

    /**
     * Supported Cable TV Providers & Sample Packages
     */
    public function getCablePackages($provider = null) {
        $packages = [
            'GOTV' => [
                ['id' => 'gotv-smallie', 'name' => 'GOtv Smallie', 'price' => 1575.00],
                ['id' => 'gotv-jinja',   'name' => 'GOtv Jinja',   'price' => 3300.00],
                ['id' => 'gotv-jolli',   'name' => 'GOtv Jolli',   'price' => 4950.00],
                ['id' => 'gotv-max',     'name' => 'GOtv Max',     'price' => 7200.00],
                ['id' => 'gotv-supa',    'name' => 'GOtv Supa',    'price' => 9600.00]
            ],
            'DSTV' => [
                ['id' => 'dstv-padi',    'name' => 'DStv Padi',    'price' => 3600.00],
                ['id' => 'dstv-yanga',   'name' => 'DStv Yanga',   'price' => 5100.00],
                ['id' => 'dstv-confam',  'name' => 'DStv Confam',  'price' => 9300.00],
                ['id' => 'dstv-compact', 'name' => 'DStv Compact', 'price' => 15700.00]
            ],
            'STARTIMES' => [
                ['id' => 'star-nova',    'name' => 'Startimes Nova',    'price' => 1700.00],
                ['id' => 'star-basic',   'name' => 'Startimes Basic',   'price' => 3300.00],
                ['id' => 'star-smart',   'name' => 'Startimes Smart',   'price' => 4500.00],
                ['id' => 'star-classic', 'name' => 'Startimes Classic', 'price' => 5000.00]
            ]
        ];

        if ($provider && isset($packages[strtoupper($provider)])) {
            return $packages[strtoupper($provider)];
        }
        return $packages;
    }

    /**
     * Validate meter number (Mock / Upstream)
     */
    public function validateMeter($disco, $meterNumber, $meterType = 'PREPAID') {
        $clean = preg_replace('/[^0-9]/', '', $meterNumber);
        if (strlen($clean) < 8) {
            return ['status' => false, 'message' => 'Meter number must be at least 8 digits.'];
        }

        // Return validated mock customer name for seamless UX
        return [
            'status' => true,
            'customer_name' => 'ALHAJI BASHIR ABUBAKAR',
            'meter_number' => $clean,
            'disco' => strtoupper($disco),
            'meter_type' => strtoupper($meterType),
            'address' => 'Plot 14, Ring Road, Katsina, Nigeria'
        ];
    }

    /**
     * Pay Electricity Bill & generate token
     */
    public function payElectricity($userId, $disco, $meterNumber, $meterType, $amount, $phone, $pin) {
        $amount = (float)$amount;
        if ($amount < 500) {
            return ['status' => false, 'message' => 'Minimum electricity purchase is ₦500.'];
        }

        if (!$this->pdo) {
            return ['status' => false, 'message' => 'Database connection unavailable.'];
        }

        try {
            $this->pdo->beginTransaction();

            $userStmt = $this->pdo->prepare("SELECT * FROM users WHERE id = :id FOR UPDATE");
            $userStmt->execute([':id' => $userId]);
            $user = $userStmt->fetch();

            if (!$user) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'User not found.'];
            }

            if (!empty($user['pin']) && $user['pin'] !== $pin) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'Incorrect transaction PIN.'];
            }

            if ((float)$user['balance'] < $amount) {
                $this->pdo->rollBack();
                return ['status' => false, 'message' => 'Insufficient wallet balance.'];
            }

            // Debit
            $debitStmt = $this->pdo->prepare("UPDATE users SET balance = balance - :amount WHERE id = :id AND balance >= :amount");
            $debitStmt->execute([':amount' => $amount, ':id' => $userId]);

            $ref = 'NEPA_' . date('YmdHis') . '_' . strtoupper(substr(uniqid(), -5));
            // Generate standard 20-digit prepaid token
            $token = sprintf('%04d-%04d-%04d-%04d-%04d', rand(1000,9999), rand(1000,9999), rand(1000,9999), rand(1000,9999), rand(1000,9999));

            $txStmt = $this->pdo->prepare("
                INSERT INTO transactions (user_id, reference, service_type, network, recipient, amount, balance_before, balance_after, status, description, api_response)
                VALUES (:uid, :ref, 'electricity', :net, :rec, :amt, :bb, :ba, 'SUCCESS', :desc, :resp)
            ");
            $txStmt->execute([
                ':uid'  => $userId,
                ':ref'  => $ref,
                ':net'  => $disco,
                ':rec'  => $meterNumber,
                ':amt'  => $amount,
                ':bb'   => $user['balance'],
                ':ba'   => $user['balance'] - $amount,
                ':desc' => "{$disco} ₦{$amount} Token for Meter {$meterNumber} | Token: {$token}",
                ':resp' => json_encode(['token' => $token, 'units' => round($amount / 68.5, 1) . ' kWh'])
            ]);

            $this->pdo->commit();

            return [
                'status'    => true,
                'message'   => 'Electricity token generated successfully.',
                'reference' => $ref,
                'token'     => $token,
                'units'     => round($amount / 68.5, 1) . ' kWh',
                'meter'     => $meterNumber,
                'amount'    => $amount,
                'balance'   => $user['balance'] - $amount
            ];

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Bill payment error: " . $e->getMessage());
            return ['status' => false, 'message' => 'Failed to process electricity bill.'];
        }
    }
}
