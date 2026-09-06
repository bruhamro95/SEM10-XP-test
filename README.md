# SEM 10-XP

A Windows XP–themed Semester 10 study suite — lecture tracker (Surgery/Medicine, 169 lectures), weekly planner, Pomodoro timer, weekly goals, and exam countdowns. By Amro Adel.

Local-only. No backend, no accounts, no cloud sync — all data lives in the browser (or the installed app's local storage) on the device you use it on.

---

## Project structure

```
sem10-xp-pwa/
├─ src/App.jsx           ← the application (unchanged source)
├─ src/main.jsx          ← React entry point
├─ index.html
├─ public/icons/         ← PWA icons (192/512, maskable + apple-touch + favicon)
├─ vite.config.js        ← build + PWA (manifest, service worker) config
├─ package.json
└─ .github/workflows/deploy.yml   ← auto-build + deploy to GitHub Pages
```

## 1. Deploy to GitHub Pages (recommended — automatic)

1. Create a GitHub repo named **`SEM10-XP`** (this matters — see the base path note below).
2. Push this project to it:
   ```
   git init
   git add .
   git commit -m "SEM 10-XP"
   git branch -M main
   git remote add origin https://github.com/<your-username>/SEM10-XP.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push (or re-run the workflow from the **Actions** tab). It builds and deploys automatically.
5. Your app is live at:
   ```
   https://<your-username>.github.io/SEM10-XP/
   ```

Every future `git push` to `main` rebuilds and redeploys automatically — no local Node.js needed.

### If your repo name isn't `SEM10-XP`

The base path is set in `vite.config.js`:
```js
const BASE_PATH = process.env.SEM10_BASE || "/SEM10-XP/";
```
Change `"/SEM10-XP/"` to `"/your-repo-name/"` (or `"/"` if deploying to a custom domain / the root of a `<username>.github.io` repo).

## 2. Deploy the pre-built `dist/` directly (no build step needed)

If you'd rather skip GitHub Actions entirely, the included `dist/` folder is already built and ready — just upload its **contents** (not the folder itself) to whatever's serving your GitHub Pages branch (e.g. commit them into a `gh-pages` branch, or set Pages to serve from `/docs` and copy `dist/*` into `docs/`). This only works as-is if the site is served at `/SEM10-XP/`; if not, rebuild after changing `BASE_PATH` (see below).

## 3. Building locally (optional, for development)

```
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build → dist/
npm run preview   # serve the production build locally to test it
```

---

## Installing SEM 10-XP as an app

Once it's live on HTTPS (GitHub Pages is HTTPS by default), it's installable like any PWA:

**Windows/Mac — Chrome or Edge**
Open the site → click the install icon (⊕ or a monitor icon) in the address bar → **Install**. It opens afterward in its own window, no browser tabs/toolbar.

**Android — Chrome**
Open the site → tap **⋮ → Install app** (or the install banner that appears automatically) → confirm. Adds a real app icon to the home screen/app drawer, launches standalone.

**iOS — Safari**
Open the site → tap **Share → Add to Home Screen**. Safari doesn't support the Chromium-style install prompt, but this produces the same standalone, full-screen result.

## What persists, and where

Progress, sessions, planner, goals, exam data, and settings are all stored in the browser's `localStorage`, scoped to wherever the app is hosted. That means:
- Data persists across reloads and after installing as an app.
- Data is per-browser/per-device — there's no sync between your phone and your PC. Use **Backup everything** in the My Computer window periodically, and **Restore everything** on another device if you want to move data across.

---

## What was validated before shipping

The production build (this exact `dist/`) was tested by actually launching it in headless Chromium (not just inspected as source), served from `/SEM10-XP/` to match the real GitHub Pages path:

- Boot sequence: boot screen first (~4s) → Administrator login second → loading screen → desktop, in that order, nothing skipped or stuck
- Window management: open/close/minimize, drag, 8-direction resize, mobile fullscreen with taskbar
- Tracker: all 169 lectures present, stage order ورق → شرح → مذاكرة → حل → مراجعة confirmed in the rendered DOM
- Planner: adding entries, duplicating/splitting a lecture across sessions, Medicine and Surgery columns
- Pomodoro: linking to a planner entry, a real full-length completion cycle, session correctly recording lecture/stage/planner-entry/duration
- Tracker and Planner completion confirmed to stay as separate, independent states
- Goals: weekly/daily counts derived correctly from the session log, survives reload
- Exam countdowns rendering live
- Backup everything → Restore everything round-trip
- Full page reload with real `localStorage` persistence (not just Claude Artifact storage) confirmed working
- Service worker registers and stays active after reload
- Zero console errors, zero uncaught exceptions, zero failed network requests, zero build warnings, throughout
