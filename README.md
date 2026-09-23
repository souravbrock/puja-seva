# GBPS Puja Seva — self-hosted (no Supabase, no Google)

Book verified purohits, dashakarma samagri & complete puja packages.
Forked from `souravbrock/pooja-seva` and migrated off Supabase + Google OAuth.

- **Auth:** Email OTP only (`/login` → 6-digit code, 10-min TTL, mailed from
  `noreply@gbps.reddevils.co.in`). No passwords, no Google, no Firebase.
- **Data:** 100% on your hosting — PHP 8.1 + MySQL API in `backend/`
  (`schema.sql`, `api.php`, `config.php`), same tables as before plus
  `users` / `otp_codes` / `sessions`.
- **Hosting:** `https://gbps.reddevils.co.in` on DomainAdda shared cPanel
  (`kaveri.domainadda.com`, user `reddevil`). See `deploy/cpanel.md`.
- **Android:** APK via GitHub Releases + Obtainium, F-Droid recipe included.
  See **`DOWNLOAD.md`**.

## Quick start

```bash
npm ci
cp .env.example .env          # VITE_API_BASE=https://gbps.reddevils.co.in
npm run dev                   # web on :5173, /api proxied to :8080
```

API locally (needs MySQL + `backend/config.local.php`):
```bash
php -S 127.0.0.1:8080 backend/api.php
```

Build:
```bash
npm run build                 # → dist/
```

## Layout

| Path | What |
|---|---|
| `src/lib/api.ts` | API client + OTP (replaces `supabase.ts` / `googleAuth.ts`) |
| `src/contexts/AuthContext.tsx` | Token session (replaces Supabase session) |
| `src/pages/Auth.tsx` | Email → OTP → verify flow |
| `backend/schema.sql` | MySQL schema (phpMyAdmin import) |
| `backend/api.php` | All `/api/*` endpoints (auth, CRUD, upload) |
| `deploy/cpanel.md` | Subdomain + DB + email + deploy steps |
| `deploy/deploy.sh` | rsync deploy over SSH |
| `.github/workflows/release.yml` | Tag `v*` → web zip + APK + GitHub Release |
| `DOWNLOAD.md` | GitHub / F-Droid / Obtainium instructions |
| `fdroid/metadata.yml` | F-Droid build recipe |
| `public/obtainium.json` | Obtainium import config |

## Deploy

```bash
SSH_KEY=~/.ssh/cpanel-deploy ./deploy/deploy.sh
```
Details + manual cPanel path in `deploy/cpanel.md`.

## Release an APK

```bash
git tag v1.0.0 && git push origin v1.0.0
# CI builds dist + app-debug.apk and attaches them to the GitHub Release.
```
