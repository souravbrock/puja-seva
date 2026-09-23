# Download GBPS Puja Seva (Android)

Self-hosted app — API: `https://gbps.reddevils.co.in`.
No Supabase, no Google login — Email OTP only.
Check the **latest release** before installing; all three sources below track the same GitHub tags (`vX.Y.Z`).

## Option 1 — GitHub Releases (recommended)

1. Open **https://github.com/souravbrock/puja-seva/releases/latest**
2. Download **`gbps-app-debug.apk`** (Android) and optionally `gbps-web.zip` (web build).
3. Verify checksum (optional but recommended):
   ```bash
   sha256sum gbps-app-debug.apk
   # compare with SHA256SUMS.txt from the same release page
   ```
4. On Android: allow “Install unknown apps” for your browser → open the APK → Install.
5. Open the app → `/login` → enter email → enter the 6-digit code mailed from
   `noreply@gbps.reddevils.co.in`.

To check for updates: revisit `/releases/latest` — the tag (e.g. `v1.0.1`) and date
tell you if you are behind. CI builds every `v*` tag via `.github/workflows/release.yml`.

## Option 2 — Obtainium (auto-update from GitHub)

1. Install Obtainium (https://obtainium.imranr.dev/).
2. In Obtainium: **Add App →** paste `https://github.com/souravbrock/puja-seva`
3. Set APK filter regex: `gbps-app-.*\.apk` (pre-filled in `public/obtainium.json`).
4. Add → Obtainium now checks GitHub Releases for new `v*` tags and notifies you.

Direct import config: this repo ships `https://gbps.reddevils.co.in/obtainium.json`
with id `in.co.reddevils.gbps` and the same filter.

## Option 3 — F-Droid

Status: **submission-ready, not yet published** in the official F-Droid repo.

- Build recipe: `fdroid/metadata.yml` (builds `v1.0.0+` tags from source with
  `npm ci && npm run build` + Capacitor/Gradle `assembleDebug`).
- To publish: fork `fdroid/fdroiddata`, add the metadata, open a Merge Request.
- Meanwhile, F-Droid users can install via **Option 1 or 2** — the APK is the same
  binary CI attaches to GitHub Releases.

## Version / compatibility

- App ID: `in.co.reddevils.gbps` · App name: `GBPS Puja Seva`
- Requires Android 8.0+ (Capacitor default `minSdk`).
- Backend required: `https://gbps.reddevils.co.in/api` must be deployed
  (see `deploy/cpanel.md`); the APK without the server shows cached content only.
- Web/PWA alternative: visit `https://gbps.reddevils.co.in` → browser menu → Install.
