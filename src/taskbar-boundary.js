/* Keep XP windows inside the usable desktop area above the taskbar.
   This is a non-destructive safety layer around the existing XP window manager. */
(function installTaskbarBoundary() {
  const MIN_VISIBLE_TITLEBAR = 48;
  const MIN_TOP = 0;

  function clampWindows() {
    const taskbar = document.querySelector('.taskbar');
    if (!taskbar) return;
    const tr = taskbar.getBoundingClientRect();
    const desktopBottom = Math.max(0, tr.top);
    const vw = window.innerWidth;

    document.querySelectorAll('.xp-window').forEach((el) => {
      if (getComputedStyle(el).display === 'none') return;
      const r = el.getBoundingClientRect();
      let left = parseFloat(el.style.left) || 0;
      let top = parseFloat(el.style.top) || 0;
      let width = r.width;
      let height = r.height;

      // Keep the entire window above the taskbar when it fits.
      if (height <= desktopBottom) {
        top = Math.min(Math.max(MIN_TOP, top), desktopBottom - height);
      } else {
        // Very tall windows still get a usable titlebar and never cover the taskbar.
        top = Math.min(Math.max(MIN_TOP, top), desktopBottom - MIN_VISIBLE_TITLEBAR);
        height = Math.max(160, desktopBottom - top);
        el.style.height = Math.round(height) + 'px';
      }

      // Keep the right edge on-screen while allowing a small titlebar sliver to
      // remain reachable for intentionally dragged windows.
      left = Math.min(left, vw - MIN_VISIBLE_TITLEBAR);
      left = Math.max(-(width - MIN_VISIBLE_TITLEBAR), left);

      const nextTop = Math.round(top) + 'px';
      const nextLeft = Math.round(left) + 'px';
      if (el.style.top !== nextTop) el.style.top = nextTop;
      if (el.style.left !== nextLeft) el.style.left = nextLeft;
      if (el.style.zIndex && Number(el.style.zIndex) >= 1000) el.style.zIndex = '999';
    });
  }

  function schedule() {
    requestAnimationFrame(clampWindows);
  }

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('load', schedule);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Initial install after React has mounted.
  setTimeout(schedule, 0);
  setTimeout(schedule, 250);
})();
