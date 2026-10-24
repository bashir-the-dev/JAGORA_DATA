<?php
/**
 * ==============================================================================
 * ADMIN - USER RATINGS & FEEDBACK REVIEWS MANAGEMENT (LIVE MYSQL)
 * ==============================================================================
 * Allows Super Admin to view, analyze, filter, and moderate user ratings and 
 * feedback comments submitted across the AJDATASUB mobile & web apps.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminUser($pdo);

// Ensure the feedbacks table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `feedbacks` (
          `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          `user_phone` VARCHAR(20) NOT NULL,
          `rating` INT NOT NULL DEFAULT 5,
          `comment` TEXT NOT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (\Throwable $t) {}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = getRequestBody();

// -----------------------------------------------------------------------------
// 1. MODERATION ACTION: DELETE FEEDBACK
// -----------------------------------------------------------------------------
if ($method === 'DELETE' || ($method === 'POST' && (($body['action'] ?? '') === 'delete' || isset($_GET['delete'])))) {
    $feedbackId = (int)($body['id'] ?? ($_GET['id'] ?? 0));
    if ($feedbackId <= 0) {
        jsonResponse(['status' => 'error', 'success' => false, 'message' => 'Valid feedback ID is required.'], 400);
    }

    try {
        $delStmt = $pdo->prepare("DELETE FROM feedbacks WHERE id = ?");
        $delStmt->execute([$feedbackId]);
        
        jsonResponse([
            'status' => 'success',
            'success' => true,
            'message' => 'Feedback review removed successfully.'
        ]);
    } catch (\Throwable $e) {
        error_log('Delete feedback error: ' . $e->getMessage());
        jsonResponse(['status' => 'error', 'success' => false, 'message' => 'Unable to remove feedback. Please try again.'], 500);
    }
}

// -----------------------------------------------------------------------------
// 2. FETCH RATINGS & STATISTICAL BREAKDOWN (GET)
// -----------------------------------------------------------------------------
try {
    // 2A. Aggregate Stats
    $totalReviews = (int)$pdo->query("SELECT COUNT(*) FROM feedbacks")->fetchColumn();
    
    $avgRatingRow = $pdo->query("SELECT COALESCE(AVG(rating), 5.0) FROM feedbacks")->fetchColumn();
    $avgRating = round((float)$avgRatingRow, 1);

    // Distribution breakdown
    $breakdownStmt = $pdo->query("
        SELECT rating, COUNT(*) as count 
        FROM feedbacks 
        GROUP BY rating 
        ORDER BY rating DESC
    ");
    $distribution = [
        '5' => 0,
        '4' => 0,
        '3' => 0,
        '2' => 0,
        '1' => 0,
    ];
    while ($row = $breakdownStmt->fetch(PDO::FETCH_ASSOC)) {
        $star = (string)$row['rating'];
        if (isset($distribution[$star])) {
            $distribution[$star] = (int)$row['count'];
        }
    }

    // 2B. Fetch Detailed Reviews joined with Users table
    $query = "
        SELECT 
            f.id,
            f.user_phone AS phone,
            f.rating,
            f.comment,
            f.created_at AS createdAt,
            COALESCE(u.full_name, u.name, 'Customer') AS userName,
            COALESCE(u.email, '') AS userEmail
        FROM feedbacks f
        LEFT JOIN users u ON u.phone = f.user_phone
        ORDER BY f.id DESC
        LIMIT 250
    ";
    $reviewsStmt = $pdo->query($query);
    $reviews = [];
    while ($r = $reviewsStmt->fetch(PDO::FETCH_ASSOC)) {
        $reviews[] = [
            'id' => (string)$r['id'],
            'phone' => (string)$r['phone'],
            'userName' => (string)$r['userName'],
            'userEmail' => (string)$r['userEmail'],
            'rating' => (int)$r['rating'],
            'comment' => (string)$r['comment'],
            'suggestion' => (string)$r['comment'],
            'createdAt' => (string)$r['createdAt'],
        ];
    }

    jsonResponse([
        'status' => 'success',
        'success' => true,
        'data' => [
            'summary' => [
                'totalReviews' => $totalReviews,
                'averageRating' => $avgRating,
                'distribution' => $distribution,
            ],
            'feedbacks' => $reviews,
            'reviews' => $reviews,
        ]
    ]);
} catch (\Throwable $e) {
    jsonResponse([
        'status' => 'error',
        'success' => false,
        'message' => 'Failed to load ratings: ' . $e->getMessage()
    ], 500);
}
