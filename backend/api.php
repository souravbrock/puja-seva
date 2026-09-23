<?php
// GBPS self-hosted API (PHP 8.1+, PDO MySQL). No Supabase / Google / Firebase.
// Deploy as <docroot>/api/index.php (this file) + <docroot>/api/.htaccess.
// Local dev: `php -S 127.0.0.1:8080 -t public` with public/api/index.php symlink,
// or `php -S 127.0.0.1:8080 backend/api.php` for API-only checks.

declare(strict_types=1);

$configPath = __DIR__ . '/config.local.php';
$config = require __DIR__ . '/config.php';
if (is_file($configPath)) {
    $local = require $configPath;
    if (is_array($local)) $config = array_merge($config, $local);
}

// ---------- helpers ----------

function json_out(int $status, $data): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function cors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // Reflect same-scheme origins; API is same-origin in production.
    header('Access-Control-Allow-Origin: ' . ($origin !== '' ? $origin : '*'));
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function db(array $config): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function bearer_token(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($h, 'Bearer ')) return substr($h, 7);
    return null;
}

function current_user(array $config): ?array {
    $token = bearer_token();
    if (!$token) return null;
    try {
        $pdo = db($config);
        $st = $pdo->prepare('SELECT s.user_id, s.expires_at, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? LIMIT 1');
        $st->execute([hash('sha256', $token)]);
        $row = $st->fetch();
        if (!$row) return null;
        if (strtotime((string) $row['expires_at']) < time()) return null;
        return ['id' => (int) $row['user_id'], 'email' => (string) $row['email'], 'name' => (string) $row['name']];
    } catch (Throwable) {
        return null;
    }
}

function require_auth(array $config): array {
    $u = current_user($config);
    if (!$u) json_out(401, ['error' => 'Login required']);
    return $u;
}

function is_admin(array $config, array $user): bool {
    $email = strtolower($user['email']);
    $admins = array_map('strtolower', (array) ($config['admin_emails'] ?? []));
    if (in_array($email, $admins, true)) return true;
    try {
        $st = db($config)->prepare('SELECT role FROM profiles WHERE user_id = ? LIMIT 1');
        $st->execute([$user['id']]);
        $row = $st->fetch();
        return ($row['role'] ?? '') === 'admin';
    } catch (Throwable) {
        return false;
    }
}

function require_admin(array $config, array $user): void {
    if (!is_admin($config, $user)) json_out(403, ['error' => 'Admin only']);
}

function send_otp_mail(array $config, string $to, string $code): void {
    $subject = 'Your GBPS login code: ' . $code;
    $appUrl = $config['app_url'];
    $message = "Your one-time login code is: {$code}\n\nIt expires in 10 minutes. If you did not request it, ignore this email.\n\n— GBPS Puja Seva ({$appUrl})";
    $headers = 'From: ' . $config['mail_from_name'] . ' <' . $config['mail_from'] . ">\r\n" .
        'Reply-To: ' . $config['mail_from'] . "\r\n" .
        'Content-Type: text/plain; charset=UTF-8';
    // PHP mail() works on most cPanel hosts when the sender domain exists there.
    $ok = @mail($to, $subject, $message, $headers);
    if (!$ok) error_log("[gbps] mail() failed for {$to}");
}

function int_or_null($v) {
    if ($v === null || $v === '') return null;
    return (int) $v;
}

// ---------- routing ----------

cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
// Works both behind .htaccess rewrite (?route=...) and php -S (REQUEST_URI).
$route = (string) ($_GET['route'] ?? '');
if ($route === '') {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $route = preg_replace('#^/api/#', '', $uri);
    $route = trim($route, '/');
}
$parts = $route === '' ? [] : explode('/', $route);
$resource = $parts[0] ?? '';

try {
    $pdo = db($config);
} catch (Throwable $e) {
    json_out(500, ['error' => 'Database unavailable']);
}

// ----- auth: request OTP -----
if ($resource === 'auth' && ($parts[1] ?? '') === 'request-otp' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim((string) ($b['email'] ?? '')));
    $name = trim((string) ($b['name'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(400, ['error' => 'Enter a valid email address']);
    $code = (string) random_int(100000, 999999);
    $st = $pdo->prepare('INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (?, ?, ?)');
    $st->execute([$email, hash('sha256', $code), date('Y-m-d H:i:s', time() + (int) $config['otp_ttl_seconds'])]);
    // Ensure a users row exists (name filled on first verify if provided)
    $st = $pdo->prepare('INSERT IGNORE INTO users (email, name) VALUES (?, ?)');
    $st->execute([$email, $name !== '' ? $name : explode('@', $email)[0]]);
    if ($name !== '') {
        $st = $pdo->prepare('UPDATE users SET name = ? WHERE email = ? AND (name IS NULL OR name = "")');
        $st->execute([$name, $email]);
    }
    send_otp_mail($config, $email, $code);
    $out = ['ok' => true];
    if (!empty($config['dev_return_otp'])) $out['dev_otp'] = $code;
    json_out(200, $out);
}

// ----- auth: verify OTP -----
if ($resource === 'auth' && ($parts[1] ?? '') === 'verify-otp' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim((string) ($b['email'] ?? '')));
    $otp = preg_replace('/\D/', '', (string) ($b['otp'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $otp)) {
        json_out(400, ['error' => 'Email + 6-digit code required']);
    }
    $st = $pdo->prepare('SELECT * FROM otp_codes WHERE email = ? AND consumed = 0 ORDER BY id DESC LIMIT 1');
    $st->execute([$email]);
    $row = $st->fetch();
    if (!$row) json_out(400, ['error' => 'No code found. Request a new one.']);
    if (strtotime((string) $row['expires_at']) < time()) json_out(400, ['error' => 'Code expired. Request a new one.']);
    if ((int) $row['attempts'] >= (int) $config['otp_max_attempts']) json_out(429, ['error' => 'Too many attempts. Request a new code.']);
    if (!hash_equals((string) $row['code_hash'], hash('sha256', $otp))) {
        $pdo->prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
        json_out(400, ['error' => 'Invalid code']);
    }
    $pdo->prepare('UPDATE otp_codes SET consumed = 1 WHERE id = ?')->execute([$row['id']]);
    $st = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $user = $st->fetch();
    if (!$user) json_out(500, ['error' => 'Account error']);
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
        ->execute([$user['id'], hash('sha256', $token), date('Y-m-d H:i:s', time() + (int) $config['session_ttl_seconds'])]);
    json_out(200, ['token' => $token, 'user' => ['id' => (int) $user['id'], 'email' => $user['email'], 'name' => $user['name']]]);
}

// ----- auth: me -----
if ($resource === 'auth' && ($parts[1] ?? '') === 'me' && $method === 'GET') {
    $u = require_auth($config);
    $st = $pdo->prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1');
    $st->execute([$u['id']]);
    $profile = $st->fetch() ?: null;
    json_out(200, ['user' => $u, 'profile' => $profile]);
}

// ----- upload -----
if ($resource === 'upload' && $method === 'POST') {
    $u = require_auth($config);
    $b = body();
    $fileName = (string) ($b['fileName'] ?? '');
    $fileBase64 = (string) ($b['fileBase64'] ?? '');
    $bucket = preg_replace('/[^a-z0-9-]/', '', (string) ($b['bucket'] ?? 'purohit-photos')) ?: 'purohit-photos';
    if ($fileName === '' || $fileBase64 === '') json_out(400, ['error' => 'fileName and fileBase64 are required']);
    $bin = base64_decode($fileBase64, true);
    if ($bin === false || strlen($bin) > 8 * 1024 * 1024) json_out(400, ['error' => 'Invalid file (max 8 MB)']);
    $dir = rtrim((string) $config['upload_dir'], '/') . '/' . $bucket;
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) json_out(500, ['error' => 'Upload dir unwritable']);
    $safe = time() . '-' . preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($fileName));
    if (file_put_contents($dir . '/' . $safe, $bin) === false) json_out(500, ['error' => 'Write failed']);
    void $u;
    json_out(200, ['url' => '/uploads/' . $bucket . '/' . $safe, 'path' => $safe]);
}

// ----- generic CRUD -----
$table_for = [
    'profiles' => 'profiles',
    'purohits' => 'purohits',
    'pujas' => 'pujas',
    'packages' => 'packages',
    'puja-lists' => 'puja_lists',
    'items' => 'dashakarma_items',
    'upcoming' => 'upcoming_pujas',
    'bookings' => 'bookings',
    'orders' => 'orders',
];

// Admin-only writes for catalogue; bookings/orders/profiles/purohits allow customer flows.
$admin_write = ['pujas' => true, 'packages' => true, 'puja-lists' => true, 'items' => true, 'upcoming' => true];

if (isset($table_for[$resource])) {
    $table = $table_for[$resource];
    $q = $_GET;
    unset($q['route']);

    if ($method === 'GET') {
        $where = [];
        $params = [];
        foreach (['id', 'user_id', 'email', 'status', 'category', 'puja_id', 'purohit_id'] as $k) {
            if (isset($q[$k]) && $q[$k] !== '') {
                $col = $k === 'puja_id' && $table === 'packages' ? 'puja_id' : $k;
                if (!in_array($col, ['id', 'user_id', 'email', 'status', 'category', 'puja_id', 'purohit_id'], true)) continue;
                // Only filter on columns that exist for this table (avoid SQL errors).
                $where[] = "`$col` = ?";
                $params[] = $q[$k];
            }
        }
        $order = match ($table) {
            'bookings', 'orders' => 'created_at DESC',
            'upcoming_pujas' => 'event_date ASC',
            'packages' => 'total_price ASC',
            'puja_lists' => 'price ASC',
            default => 'id ASC',
        };
        // rating-first for purohits (matches legacy behaviour)
        if ($table === 'purohits') $order = 'rating DESC';
        $sql = "SELECT * FROM `$table`";
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= " ORDER BY $order LIMIT 500";
        try {
            $st = $pdo->prepare($sql);
            $st->execute($params);
            json_out(200, $st->fetchAll());
        } catch (Throwable $e) {
            json_out(400, ['error' => 'Invalid filter for this resource']);
        }
    }

    if ($method === 'POST') {
        $b = body();
        // Public creates: purohit registration, booking, order. Profiles bootstrap needs auth.
        $public_create = ($resource === 'purohits') || ($resource === 'bookings') || ($resource === 'orders');
        $user = $public_create ? current_user($config) : require_auth($config);
        if (isset($admin_write[$resource])) require_admin($config, $user ?? require_auth($config));

        $cols = [];
        $place = [];
        $vals = [];
        $allowed = [
            'profiles' => ['user_id', 'email', 'name', 'phone', 'role', 'gotra', 'address'],
            'purohits' => ['user_id', 'full_name', 'phone', 'email', 'aadhaar', 'address', 'experience_years', 'specialization', 'certification', 'about', 'pricing', 'photos', 'status', 'rating', 'completed_pujas'],
            'pujas' => ['name', 'description', 'duration', 'category', 'image_url', 'base_price', 'is_active'],
            'packages' => ['name', 'puja_id', 'description', 'includes_purohit', 'purohit_fee', 'items_price', 'total_price', 'tier', 'image_url', 'is_active'],
            'puja-lists' => ['puja_id', 'name', 'description', 'tier', 'price', 'items'],
            'items' => ['name', 'name_hindi', 'description', 'price', 'unit', 'category', 'image_url', 'used_in_pujas', 'in_stock'],
            'upcoming' => ['title', 'description', 'puja_id', 'event_date', 'venue', 'address', 'purohit_id', 'price', 'seats_total', 'seats_booked', 'image_url'],
            'bookings' => ['user_id', 'customer_name', 'gotra', 'phone', 'email', 'puja_location', 'package_id', 'puja_id', 'purohit_id', 'upcoming_puja_id', 'booking_date', 'amount', 'status', 'notes'],
            'orders' => ['user_id', 'customer_name', 'phone', 'email', 'delivery_address', 'items', 'total_amount', 'status'],
        ][$resource];

        // Minimal validation (mirrors legacy API)
        if ($resource === 'bookings' && (empty($b['customer_name']) || empty($b['phone']) || empty($b['email']))) {
            json_out(400, ['error' => 'customer_name, phone and email are required']);
        }
        if ($resource === 'orders' && (empty($b['customer_name']) || empty($b['phone']) || empty($b['delivery_address']) || empty($b['items']))) {
            json_out(400, ['error' => 'customer_name, phone, delivery_address and items are required']);
        }

        foreach ($allowed as $c) {
            if (!array_key_exists($c, $b)) continue;
            $v = $b[$c];
            if (in_array($c, ['pricing', 'photos', 'items', 'used_in_pujas'], true) && !is_string($v)) $v = json_encode($v);
            if (in_array($c, ['package_id', 'puja_id', 'purohit_id', 'upcoming_puja_id', 'user_id'], true)) $v = int_or_null($v);
            $cols[] = "`$c`";
            $place[] = '?';
            $vals[] = $v;
        }
        if (!$cols) json_out(400, ['error' => 'Nothing to insert']);
        $st = $pdo->prepare("INSERT INTO `$table` (" . implode(',', $cols) . ') VALUES (' . implode(',', $place) . ')');
        $st->execute($vals);
        $id = (int) $pdo->lastInsertId();
        $st = $pdo->prepare("SELECT * FROM `$table` WHERE id = ? LIMIT 1");
        $st->execute([$id]);
        $row = $st->fetch();
        // booking seat bump
        if ($resource === 'bookings' && !empty($b['upcoming_puja_id'])) {
            $pdo->prepare('UPDATE upcoming_pujas SET seats_booked = seats_booked + 1 WHERE id = ?')->execute([(int) $b['upcoming_puja_id']]);
        }
        json_out(201, $row);
    }

    if ($method === 'PUT') {
        $user = require_auth($config);
        if (isset($admin_write[$resource])) require_admin($config, $user);
        $b = body();
        $id = $b['id'] ?? null;
        $user_id = $b['user_id'] ?? null;
        if (!$id && !($resource === 'profiles' && $user_id)) json_out(400, ['error' => 'id required']);
        unset($b['id'], $b['created_at']);
        $sets = [];
        $vals = [];
        foreach ($b as $c => $v) {
            if (!preg_match('/^[a-z_]+$/', (string) $c)) continue;
            if (in_array($c, ['pricing', 'photos', 'items', 'used_in_pujas'], true) && !is_string($v)) $v = json_encode($v);
            $sets[] = "`$c` = ?";
            $vals[] = $v;
        }
        if (!$sets) json_out(400, ['error' => 'Nothing to update']);
        if ($id) {
            $vals[] = $id;
            $pdo->prepare("UPDATE `$table` SET " . implode(',', $sets) . ' WHERE id = ?')->execute($vals);
            $st = $pdo->prepare("SELECT * FROM `$table` WHERE id = ? LIMIT 1");
            $st->execute([$id]);
            json_out(200, $st->fetch());
        } else {
            $vals[] = $user_id;
            $pdo->prepare("UPDATE `$table` SET " . implode(',', $sets) . ' WHERE user_id = ?')->execute($vals);
            $st = $pdo->prepare("SELECT * FROM `$table` WHERE user_id = ? LIMIT 1");
            $st->execute([$user_id]);
            json_out(200, $st->fetch());
        }
    }

    if ($method === 'DELETE') {
        $user = require_auth($config);
        require_admin($config, $user);
        $b = body();
        if (empty($b['id'])) json_out(400, ['error' => 'id required']);
        $pdo->prepare("DELETE FROM `$table` WHERE id = ?")->execute([$b['id']]);
        json_out(200, ['ok' => true]);
    }

    json_out(405, ['error' => 'Method not allowed']);
}

json_out(404, ['error' => 'Unknown endpoint']);
