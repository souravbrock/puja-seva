import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Self-hosted build for https://gbps.reddevils.co.in (cPanel static + PHP API).
// VITE_API_BASE is baked at build time (see .env.production).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_'],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      // Local dev: `php -S 127.0.0.1:8080 -t deploy/public-stub` or backend/api.php router.
      '/api': 'http://127.0.0.1:8080',
    },
  },
});
