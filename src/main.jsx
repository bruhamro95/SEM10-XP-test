import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional UI enhancements must load only after the app has mounted.
// Each enhancement is isolated so one failure can never disable the others.
const enhancements = [
  "./audio-unlock.js",
  "./mobile-task-search.js",
  "./mobile-ui-fixes.js",
  "./tracker-sort-filter.js",
  "./tracker-bulk-actions.js",
  "./tracker-progress-exclusion.js",
  "./taskbar-boundary.js",
  "./tracker-chapter-options.js",
];

const loadEnhancements = async () => {
  await new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", resolve, { once: true });
    } else {
      resolve();
    }
  });

  await Promise.all(
    enhancements.map((path) =>
      import(path).catch((error) => {
        console.error("SEM10-XP enhancement failed:", path, error);
      })
    )
  );
};

if (typeof requestAnimationFrame === "function") {
  requestAnimationFrame(loadEnhancements);
} else {
  setTimeout(loadEnhancements, 0);
}
