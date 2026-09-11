import "./audio-unlock.js";
import "./mobile-task-search.js";
import "./tracker-sort-filter.js";
import "./tracker-bulk-actions.js";
import "./tracker-progress-exclusion.js";
import "./taskbar-boundary.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
