<?php
// GBPS backend config. Copy to config.local.php on the server and fill secrets.
// On cPanel shared hosting set these via "MultiPHP INI Editor" env or config.local.php
// which is NOT committed to git.

declare(strict_types=1);

$env = static function (string $key, string $default = ''): string {
    $v = getenv($key);
    if ($v !== false && $v !== '') return $v;
    return $default;
};

return [
    // MySQL created via cPanel > Databases > Manage My Databases
    'db_host' => $env('GBPS_DB_HOST', 'localhost'),
    'db_name' => $env('GBPS_DB_NAME', 'reddevil_gbps'),
    'db_user' => $env('GBPS_DB_USER', 'reddevil_gbps'),
    'db_pass' => $env('GBPS_DB_PASS', ''),

    // Public origin of the frontend (CORS + links in mail)
    'app_url' => rtrim($env('GBPS_APP_URL', 'https://gbps.reddevils.co.in'), '/'),

    // OTP: 6 digits, 10 min TTL, max 5 verify attempts
    'otp_ttl_seconds' => (int) $env('GBPS_OTP_TTL', '600'),
    'otp_max_attempts' => 5,

    // Session token TTL: 30 days
    'session_ttl_seconds' => 30 * 24 * 3600,

    // Outgoing mail: use the cPanel email account, e.g. noreply@gbps.reddevils.co.in
    // cPanel > Email > Email Accounts. PHP mail() usually works without SMTP auth
    // on the same host; SMTP options below are used if mail() is disabled.
    'mail_from' => $env('GBPS_MAIL_FROM', 'noreply@gbps.reddevils.co.in'),
    'mail_from_name' => $env('GBPS_MAIL_FROM_NAME', 'Puja Seva'),
    'smtp_host' => $env('GBPS_SMTP_HOST', ''),
    'smtp_port' => (int) $env('GBPS_SMTP_PORT', '465'),
    'smtp_user' => $env('GBPS_SMTP_USER', ''),
    'smtp_pass' => $env('GBPS_SMTP_PASS', ''),

    // Emails that always get the admin role
    'admin_emails' => ['souravbrock@gmail.com'],

    // Uploads: stored under <docroot>/uploads (served directly)
    'upload_dir' => $env('GBPS_UPLOAD_DIR', __DIR__ . '/../uploads'),

    // If true, /api/auth/request-otp returns the code in JSON (local dev only).
    // NEVER enable in production.
    'dev_return_otp' => $env('GBPS_DEV_RETURN_OTP', '') === '1',
];
