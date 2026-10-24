<?php
/**
 * ==============================================================================
 * VTU BUY DISPATCHER (PHP BACKEND)
 * ==============================================================================
 * Dynamically routes /api/vtu/buy to the correct service processor (airtime, cable,
 * electricity, exam, data-card, recharge-pin, data) based on requested serviceType.
 */
require_once __DIR__ . '/transaction.php';
