import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional UI enhancements must never be allowed to block the core app.
// Load them after React has mounted; a failure in one enhancement is isolated.
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

Promise.allSettled(enhancements.map((path) => import(path))).catch(() => {});
