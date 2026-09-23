# Hosting `gbps.reddevils.co.in` on DomainAdda shared cPanel

Target: `https://gbps.reddevils.co.in` serves this repo (static web + PHP API).
Server from screenshots: `kaveri.domainadda.com:2083`, user `reddevil`,
primary domain `reddevils.co.in`, shared IP `103.69.196.177`.
Available tools used: Domains, Manage My Databases / phpMyAdmin, Email Accounts,
SSL/TLS Certificates, SSH Access, File Manager, Git Version Control.

## 1. Create the subdomain (cPanel > Domains > Domains > Create)

- Domain: `gbps.reddevils.co.in`
- Document root: `/home/reddevil/gbps.reddevils.co.in` (cPanel default — keep it)
- The steps below assume this path as `$REMOTE_DIR`.

## 2. HTTPS (cPanel > Security > SSL/TLS Certificates)

- Run AutoSSL (or Let's Encrypt) for `gbps.reddevils.co.in` + `www.gbps.reddevils.co.in`.
- Verify padlock before going live; the frontend uses `VITE_API_BASE=https://gbps.reddevils.co.in`.

## 3. Database (cPanel > Databases > Manage My Databases / Database Wizard)

1. Create DB `reddevil_gbps` + user `reddevil_gbps` with a strong password.
2. Grant ALL PRIVILEGES on `reddevil_gbps.*` to that user.
3. cPanel > Databases > phpMyAdmin > select `reddevil_gbps` > Import > `backend/schema.sql` > Go.
4. Confirm 11 tables: users, otp_codes, sessions, profiles, purohits, pujas,
   packages, puja_lists, dashakarma_items, upcoming_pujas, bookings, orders.

## 4. Email for OTP (cPanel > Email > Email Accounts)

1. Create `noreply@gbps.reddevils.co.in` (strong password, 1 GB quota is plenty).
2. cPanel > Email > Email Deliverability: ensure SPF/DKIM valid for `gbps.reddevils.co.in`
   (needed so OTP mail is not marked spam).
3. Defaults work with PHP `mail()`. If `mail()` is disabled, note SMTP host/port
   from Email Accounts > Connect Devices and put them in `config.local.php`.

## 5. Files (first deploy — pick ONE)

Option A — SSH/rsync (needs the `cpanel-deploy` key working):
```bash
SSH_KEY=~/.ssh/cpanel-deploy ./deploy/deploy.sh
```

Option B — cPanel Git Version Control (no local SSH key needed):
1. cPanel > Files > Git Version Control > Create, clone
   `https://github.com/souravbrock/puja-seva.git`, pull `main`.
2. Repository path e.g. `/home/reddevil/puja-seva`; `.cpanel.yml` copies
   `dist/*` + `backend/api.php` into `/home/reddevil/gbps.reddevils.co.in/`.
3. Run `npm ci && npm run build` once (cPanel > Software > Setup Node.js App
   or via SSH), then Manage Deployment > Pull or Deploy HEAD.

Option C — manual File Manager upload:
1. Locally: `npm run build` → `dist/`.
2. Upload `dist/*` to `/home/reddevil/gbps.reddevils.co.in/`.
3. Upload `backend/api.php` → `.../api/index.php`,
   `backend/htaccess-api.txt` → `.../api/.htaccess`,
   `deploy/htaccess-spa.txt` → `.../.htaccess`.
4. Create `.../uploads/` (0755).

## 6. Server config (one file, never in git)

Create `/home/reddevil/gbps.reddevils.co.in/api/config.local.php`:
```php
<?php
return [
  'db_name' => 'reddevil_gbps',
  'db_user' => 'reddevil_gbps',
  'db_pass' => 'PUT-STRONG-PASSWORD-HERE',
  'app_url' => 'https://gbps.reddevils.co.in',
  'mail_from' => 'noreply@gbps.reddevils.co.in',
  // 'smtp_host' => '...', 'smtp_user' => '...', 'smtp_pass' => '...', // only if mail() disabled
];
```
Also copy `backend/api.php`'s sibling `config.php` to `.../api/config.php`.
Test: `https://gbps.reddevils.co.in/api/auth/request-otp` should answer 400/200 JSON,
and `php -l api/index.php` should print "No syntax errors".

## 7. Smoke test (after deploy)

1. Open `https://gbps.reddevils.co.in/` → homepage loads, no Supabase/Google calls.
2. `/login` → enter email → receive OTP from `noreply@gbps.reddevils.co.in` → verify.
3. Book a puja / place an order → rows appear in phpMyAdmin `bookings`/`orders`.
4. Admin: log in as `admin@sevakendra.in` (request OTP for that address) → `/admin`.

## 8. Current blocker

SSH `reddevil@kaveri.domainadda.com` with key `C:\Users\soura\.ssh\cpanel-deploy`
fails: the key file does not exist locally and the server answers
`Permission denied (publickey,...)`. Share the correct private key or cPanel
password to let automation create the subdomain/DB; until then follow Option B/C.
