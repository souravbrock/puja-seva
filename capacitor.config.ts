// Capacitor wrapper so the same web build ships as an Android APK.
// Web hosting stays on https://gbps.reddevils.co.in (cPanel). The APK is a
// thin native shell pointing at the self-hosted API (VITE_API_BASE).
// CI (.github/workflows/release.yml) runs `npm run build` then Gradle to
// produce app-release.apk / app-debug.apk for GitHub Releases + Obtainium.
// F-Droid builds from source using the same steps (see fdroid/metadata.yml).
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.co.reddevils.gbps',
  appName: 'Puja Seva',
  webDir: 'dist',
  server: {
    // Keep bundled offline-first; API base is compiled into the JS bundle.
    androidScheme: 'https',
  },
};

export default config;
