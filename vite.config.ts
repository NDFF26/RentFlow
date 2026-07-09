import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Ensure firebase-applet-config.json exists during build (e.g. on GitHub Actions where it is ignored)
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project",
          appId: process.env.VITE_FIREBASE_APP_ID || "placeholder-app",
          apiKey: process.env.VITE_FIREBASE_API_KEY || "placeholder-key",
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-domain",
          firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || "placeholder-db",
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-bucket",
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender",
          measurementId: ""
        },
        null,
        2
      )
    );
  }

  // Automatically use repository subpath when building in GitHub Actions for GitHub Pages
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
  const base = isGithubActions ? '/RentFlow/' : './';

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
