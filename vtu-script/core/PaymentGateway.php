<?php
/**
 * ============================================================================
 * VTU SCRIPT - PAYMENT GATEWAY & AUTOMATED WALLET FUNDING
 * ============================================================================
 * Supports Monnify, Payvessel, and instant virtual account generation.
 */

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

class PaymentGateway {
    private $pdo;

    public function __construct(PDO $pdo = null) {
        $this->pdo = $pdo ?: get_db_connection();
    }

    /**
     * Get or generate virtual bank accounts for user
     */
    public function getUserVirtualAccounts($userId) {
        if (!$this->pdo) {
            return $this->getMockAccounts($userId);
        }

        $stmt = $this->pdo->prepare("SELECT virtual_bank_name, virtual_account_number, virtual_account_name, phone FROM users WHERE id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if ($user && !empty($user['virtual_account_number'])) {
            return [
                [
                    'bank_name'      => $user['virtual_bank_name'] ?: 'Wema Bank',
                    'account_number' => $user['virtual_account_number'],
                    'account_name'   => $user['virtual_account_name'] ?: (APP_NAME . " / User " . $userId),
                ],
                [
                    'bank_name'      => 'Moniepoint Microfinance Bank',
                    'account_number' => '8' . substr($user['phone'], -9),
                    'account_name'   => $user['virtual_account_name'] ?: (APP_NAME . " / User " . $userId),
                ]
            ];
        }

        // Generate and assign deterministic accounts
        $wemaAcc = '7' . substr($user['phone'] ?? '07048609646', -9);
        $accName = APP_NAME . " - " . ($user['phone'] ?? $userId);

        $update = $this->pdo->prepare("
            UPDATE users SET virtual_bank_name = 'Wema Bank', virtual_account_number = :acc, virtual_account_name = :name
            WHERE id = :id
        ");
        $update->execute([':acc' => $wemaAcc, ':name' => $accName, ':id' => $userId]);

        return [
            [
                'bank_name'      => 'Wema Bank',
                'account_number' => $wemaAcc,
                'account_name'   => $accName,
            ],
            [
                'bank_name'      => 'Moniepoint MFB',
                'account_number' => '8' . substr($user['phone'] ?? '07048609646', -9),
                'account_name'   => $accName,
            ]
        ];
    }

    /**
     * Process automated webhook credit (Idempotent)
     */
    public function creditWebhookPayment($reference, $accountNumber, $amount, $gateway = 'MONNIFY', $rawPayload = '') {
        $amount = (float)$amount;
        if ($amount <= 0) {
            return ['status' => false, 'message' => 'Invalid credit amount.'];
        }

        if (!$this->pdo) {
            return ['status' => false, 'message' => 'Database connection unavailable.'];
        }

        try {
            $this->pdo->beginTransaction();

            // 1. Check idempotency: Has this transaction reference already been credited?
            $checkStmt = $this->pdo->prepare("SELECT id FROM transactions WHERE reference = :ref");
            $checkStmt->execute([':ref' => $reference]);
            if ($checkStmt->fetch()) {
                $this->pdo->rollBack();
                return ['status' => true, 'message' => 'Transaction already processed (Idempotent).'];
            }

            // 2. Locate user by virtual account number or phone
            $userStmt = $this->pdo->prepare("
                SELECT id, balance FROM users 
                WHERE virtual_account_number = :acc 
                   OR phone = :acc 
                   OR phone LIKE :wildcard
                FOR UPDATE
            ");
            $userStmt->execute([
                ':acc' => $accountNumber,
                ':wildcard' => '%' . substr($accountNumber, -10)
            ]);
            $user = $userStmt->fetch();

            if (!$user) {
                $this->pdo->rollBack();
                error_log("Webhook credit warning: No user found for account {$accountNumber}, ref {$reference}");
                return ['status' => false, 'message' => 'Account not linked to any user.'];
            }

            $userId = $user['id'];
            $balanceBefore = (float)$user['balance'];
            $balanceAfter = $balanceBefore + $amount;

            // 3. Credit user balance
            $creditStmt = $this->pdo->prepare("UPDATE users SET balance = balance + :amt WHERE id = :id");
            $creditStmt->execute([':amt' => $amount, ':id' => $userId]);

            // 4. Log transaction
            $txStmt = $this->pdo->prepare("
                INSERT INTO transactions (user_id, reference, service_type, amount, balance_before, balance_after, status, description, api_response)
                VALUES (:uid, :ref, 'wallet_fund', :amt, :bb, :ba, 'SUCCESS', :desc, :resp)
            ");
            $txStmt->execute([
                ':uid'  => $userId,
                ':ref'  => $reference,
                ':amt'  => $amount,
                ':bb'   => $balanceBefore,
                ':ba'   => $balanceAfter,
                ':desc' => "Automated Bank Transfer Funding via {$gateway} (Acc: {$accountNumber})",
                ':resp' => is_string($rawPayload) ? $rawPayload : json_encode($rawPayload)
            ]);

            $this->pdo->commit();
            return ['status' => true, 'message' => 'User wallet successfully funded.', 'new_balance' => $balanceAfter];

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Webhook credit exception: " . $e->getMessage());
            return ['status' => false, 'message' => 'Database error while funding wallet.'];
        }
    }

    private function getMockAccounts($userId) {
        return [
            [
                'bank_name'      => 'Wema Bank',
                'account_number' => '701' . sprintf('%07d', $userId),
                'account_name'   => APP_NAME . " / Reseller",
            ],
            [
                'bank_name'      => 'Moniepoint MFB',
                'account_number' => '801' . sprintf('%07d', $userId),
                'account_name'   => APP_NAME . " / Reseller",
            ]
        ];
    }
}
