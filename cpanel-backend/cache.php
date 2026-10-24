<?php
/**
 * ============================================================================
 * AJDATASUB - Production Cache Subsystem (cPanel / PHP)
 * ============================================================================
 * Multi-Driver high-performance caching for VTU / Fintech backend:
 * 1. In-Memory APCu Driver (Sub-millisecond RAM access across PHP worker pools)
 * 2. Atomic POSIX File Driver (Works natively on ALL cPanel / shared hosts)
 * 3. HTTP 304 & ETag Optimization (Saves bandwidth & prevents client re-fetch)
 * 4. Automatic Selective Invalidation (Admin changes invalidate plan/setting caches)
 * ============================================================================
 * CRITICAL FINTECH SAFETY MANDATE:
 * - NEVER cache user balances, wallet deductions, or transaction references!
 * - Cache ONLY immutable or read-heavy catalogs (plans, platform settings, stats).
 * ============================================================================
 */

if (!defined('AJD_ROOT')) {
    define('AJD_ROOT', __DIR__);
}

class Cache {
    private static ?string $storageDir = null;
    private static ?bool $hasApcu = null;

    /**
     * Get or initialize the cache storage directory
     */
    public static function getStorageDir(): string {
        if (self::$storageDir !== null) {
            return self::$storageDir;
        }

        $base = __DIR__ . '/storage/cache';
        if (!is_dir($base)) {
            @mkdir($base, 0755, true);
        }

        // If not writable in restricted shared environments, fallback to system temp directory
        if (!is_writable($base)) {
            $base = sys_get_temp_dir() . '/ajd_cache_' . md5(__DIR__);
            if (!is_dir($base)) {
                @mkdir($base, 0755, true);
            }
        }

        // Protect directory from direct HTTP access
        $htaccess = $base . '/.htaccess';
        if (!file_exists($htaccess)) {
            @file_put_contents($htaccess, "Order deny,allow\nDeny from all\n");
        }

        self::$storageDir = $base;
        return self::$storageDir;
    }

    /**
     * Check if APCu is available and enabled
     */
    private static function apcuEnabled(): bool {
        if (self::$hasApcu === null) {
            self::$hasApcu = extension_loaded('apcu') && (bool)ini_get('apc.enabled');
        }
        return self::$hasApcu;
    }

    /**
     * Retrieve item from cache
     */
    public static function get(string $key, $default = null) {
        $safeKey = 'ajd_' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);

        // 1. Try APCu In-Memory Cache
        if (self::apcuEnabled()) {
            $success = false;
            $val = apcu_fetch($safeKey, $success);
            if ($success) {
                return $val;
            }
        }

        // 2. Try Atomic File Cache
        $file = self::getStorageDir() . '/' . md5($safeKey) . '.cache';
        if (!file_exists($file)) {
            return $default;
        }

        $content = @file_get_contents($file);
        if ($content === false || empty($content)) {
            return $default;
        }

        $data = @unserialize($content);
        if (!is_array($data) || !isset($data['expires_at'])) {
            @unlink($file);
            return $default;
        }

        if (time() > $data['expires_at']) {
            @unlink($file);
            return $default;
        }

        return $data['value'];
    }

    /**
     * Store item in cache
     */
    public static function set(string $key, $value, int $ttlSeconds = 300): bool {
        $safeKey = 'ajd_' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
        $expiresAt = time() + max(1, $ttlSeconds);

        $stored = false;

        // 1. Store in APCu if available
        if (self::apcuEnabled()) {
            apcu_store($safeKey, $value, $ttlSeconds);
            $stored = true;
        }

        // 2. Store in File Cache using atomic POSIX rename (prevents race conditions)
        $dir = self::getStorageDir();
        $file = $dir . '/' . md5($safeKey) . '.cache';
        $tmpFile = $dir . '/' . md5($safeKey) . '.' . uniqid('tmp', true);

        $payload = serialize([
            'key' => $key,
            'expires_at' => $expiresAt,
            'created_at' => time(),
            'value' => $value,
        ]);

        if (@file_put_contents($tmpFile, $payload) !== false) {
            @rename($tmpFile, $file);
            $stored = true;
        }

        return $stored;
    }

    /**
     * Remember helper: returns cached value or executes callback, stores result, and returns it.
     */
    public static function remember(string $key, int $ttlSeconds, callable $callback) {
        $val = self::get($key, '__AJD_NOT_FOUND__');
        if ($val !== '__AJD_NOT_FOUND__') {
            return $val;
        }

        $fresh = $callback();
        self::set($key, $fresh, $ttlSeconds);
        return $fresh;
    }

    /**
     * Delete an item from cache
     */
    public static function forget(string $key): bool {
        $safeKey = 'ajd_' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);

        if (self::apcuEnabled()) {
            apcu_delete($safeKey);
        }

        $file = self::getStorageDir() . '/' . md5($safeKey) . '.cache';
        if (file_exists($file)) {
            @unlink($file);
        }

        return true;
    }

    /**
     * Invalidate all cache or all keys matching a prefix
     */
    public static function flush(?string $prefix = null): bool {
        if (self::apcuEnabled()) {
            if ($prefix !== null) {
                $iter = new APCUIterator('/^ajd_' . preg_quote($prefix, '/') . '/');
                apcu_delete($iter);
            } else {
                apcu_clear_cache();
            }
        }

        $dir = self::getStorageDir();
        $files = @glob($dir . '/*.cache');
        if (is_array($files)) {
            foreach ($files as $file) {
                if ($prefix === null) {
                    @unlink($file);
                } else {
                    $content = @file_get_contents($file);
                    if ($content) {
                        $data = @unserialize($content);
                        if (isset($data['key']) && str_starts_with($data['key'], $prefix)) {
                            @unlink($file);
                        }
                    }
                }
            }
        }

        return true;
    }

    /**
     * ETag & HTTP 304 Not Modified responder for mobile bandwidth optimization
     */
    public static function sendConditionalResponse(string $etag, array $payload, int $maxAge = 300): void {
        header('Cache-Control: public, max-age=' . $maxAge . ', stale-while-revalidate=60');
        header('ETag: "' . $etag . '"');

        $ifNoneMatch = trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '', '"');
        if (!empty($ifNoneMatch) && $ifNoneMatch === $etag) {
            http_response_code(304);
            exit;
        }

        jsonResponse($payload);
    }
}
