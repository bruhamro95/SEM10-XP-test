import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages project-site base path for this repository.
const BASE_PATH = process.env.SEM10_BASE || "/SEM10-XP-test/";

// App.jsx historically used /sounds/... absolute URLs. Rewrite those literals
// at build time so they point inside the GitHub Pages project site. This keeps
// Audio completely native and avoids runtime URL interception.
const projectSoundPaths = {
  name: "project-sound-paths",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;

    const soundBase = `${BASE_PATH}sounds/`;
    const transformed = code.replaceAll('"/sounds/', `"${soundBase}`);

    return transformed === code ? null : { code: transformed, map: null };
  },
};

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    projectSoundPaths,
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        name: "SEM 10-XP",
        short_name: "SEM 10-XP",
        description: "Semester 10 study tracker, planner, Pomodoro timer and exam countdowns — Windows XP themed. By Amro Adel.",
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: "standalone",
        orientation: "any",
        background_color: "#3f7ee8",
        theme_color: "#0a46c6",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,wav}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: BASE_PATH + "index.html",
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
});
