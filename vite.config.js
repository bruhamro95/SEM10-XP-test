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
    let transformed = code.replaceAll('"/sounds/', `"${soundBase}`);

    // The XP startup sound belongs to the desktop transition, not the initial
    // black boot screen. Move that one call from component mount to the moment
    // the desktop is actually ready (after login + loading).
    transformed = transformed.replace(
      '  useEffect(() => {\n    playChime("boot");\n    const t = setTimeout(() => setPreBoot(true), 4000);',
      '  useEffect(() => {\n    const t = setTimeout(() => setPreBoot(true), 4000);'
    );
    transformed = transformed.replace(
      '  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;\n',
      '  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;\n  useEffect(() => { if (ready) playChime("boot"); }, [ready]);\n'
    );

    // Do not play a second sound on the Administrator click. The single XP
    // startup sound is fired when the desktop becomes ready above.
    transformed = transformed.replace(
      'onClick={() => { playChime("login"); onLogin(); }}',
      'onClick={onLogin}'
    );

    // Make Pomodoro alerts sound like a bright mechanical bell instead of the
    // dull XP Notify WAV. The bell uses several partials with fast decay and a
    // second strike, giving the short, ringing alarm character of Pomofocus.
    const oldPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  try {\n    const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n    const audio = new Audio(encodeURI(file));\n    audio.volume = 0.55;\n    audio.play().catch(() => {});\n    return;\n  } catch (e) { /* fall through to the compact synthesized fallback */ }\n  try {\n    const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n    const ctx = new (window.AudioContext || window.webkitAudioContext)();\n    pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n  } catch (e) { /* audio unavailable in this context */ }\n}`;
    const newPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  // Pomodoro completion uses a dedicated bell timbre rather than the generic XP notify sound.\n  if (kind === "notify") {\n    try {\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      const now = ctx.currentTime;\n      const strikes = [\n        [0, 659.25, 0.30], [0, 1318.51, 0.22], [0, 1975.53, 0.16], [0, 2637.02, 0.10],\n        [0.34, 659.25, 0.24], [0.34, 1318.51, 0.17], [0.34, 1975.53, 0.12], [0.34, 2637.02, 0.08]\n      ];\n      strikes.forEach(([delay, freq, gain]) => {\n        const osc = ctx.createOscillator();\n        const g = ctx.createGain();\n        osc.type = "sine";\n        osc.frequency.setValueAtTime(freq, now + delay);\n        g.gain.setValueAtTime(0.0001, now + delay);\n        g.gain.exponentialRampToValueAtTime(gain, now + delay + 0.008);\n        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.48);\n        osc.connect(g); g.connect(ctx.destination);\n        osc.start(now + delay);\n        osc.stop(now + delay + 0.55);\n      });\n      return;\n    } catch (e) { /* fall through to the normal alert sound */ }\n  }\n  const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n  try {\n    const audio = new Audio(encodeURI(file));\n    audio.volume = 0.55;\n    const p = audio.play();\n    if (p && typeof p.catch === "function") {\n      p.catch(() => {\n        try {\n          const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n          const Ctx = window.AudioContext || window.webkitAudioContext;\n          if (!Ctx) return;\n          const ctx = new Ctx();\n          if (ctx.state === "suspended") ctx.resume().catch(() => {});\n          pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n        } catch (e) { /* audio unavailable in this context */ }\n      });\n    }\n  } catch (e) {\n    try {\n      const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n    } catch (e2) { /* audio unavailable in this context */ }\n  }\n}`;
    transformed = transformed.replace(oldPlayChime, newPlayChime);

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
