// Taskbar-safe window geometry layer.
// Keeps existing XP window behavior but clamps visible windows to the usable area above the taskbar.
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const STYLE_ID = "sem10-taskbar-window-fix";
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .xp-window {
      max-height: calc(100vh - var(--sem10-taskbar-height, 34px));
      box-sizing: border-box;
    }
    .window-body {
      min-height: 0;
      overflow: auto;
    }
  `;
  document.head.appendChild(style);

  const update = () => {
    const taskbar = document.querySelector(".taskbar");
    const height = Math.max(34, taskbar?.getBoundingClientRect().height || 34);
    document.documentElement.style.setProperty("--sem10-taskbar-height", `${height}px`);

    // Correct only windows that currently extend below the usable desktop area.
    const usableBottom = window.innerHeight - height;
    document.querySelectorAll(".xp-window").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > usableBottom) {
        const delta = r.bottom - usableBottom + 2;
        const currentTop = parseFloat(el.style.top);
        if (Number.isFinite(currentTop)) el.style.top = `${Math.max(0, currentTop - delta)}px`;
      }
    });
  };

  window.addEventListener("resize", update, { passive: true });
  const observer = new MutationObserver(update);
  observer.observe(document.body, { childList: true, subtree: true });
  update();
})();
