/* Mobile-friendly search enhancer for the Pomodoro task picker.
   The picker remains the native XP select; this adds a small search field above it
   so phones don't have to scroll through the entire list. */
function installTaskSearch() {
  const selects = document.querySelectorAll('.timer-app select.xp-select');
  selects.forEach((select) => {
    if (select.dataset.mobileSearchInstalled === '1') return;
    select.dataset.mobileSearchInstalled = '1';

    const wrap = document.createElement('div');
    wrap.className = 'mobile-task-search-wrap';

    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'xp-text-input mobile-task-search';
    input.placeholder = 'Search tasks / lectures...';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Search tasks and lectures');

    const note = document.createElement('div');
    note.className = 'xp-small-text mobile-task-search-note';
    note.textContent = 'Type to narrow the list on mobile — e.g. “cardiac” or “oncology”.';

    wrap.appendChild(input);
    wrap.appendChild(note);
    select.parentNode.insertBefore(wrap, select);

    const original = Array.from(select.options).map((option) => ({
      option,
      text: option.textContent,
      group: option.parentElement && option.parentElement.tagName === 'OPTGROUP' ? option.parentElement : null,
    }));

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        original.forEach(({ option }) => { option.hidden = false; });
        Array.from(select.querySelectorAll('optgroup')).forEach((g) => { g.hidden = false; });
        return;
      }
      const visibleGroups = new Set();
      original.forEach(({ option, text, group }) => {
        const match = text.toLowerCase().includes(q);
        option.hidden = !match;
        if (match && group) visibleGroups.add(group);
      });
      Array.from(select.querySelectorAll('optgroup')).forEach((g) => { g.hidden = !visibleGroups.has(g); });
      if (select.value && select.selectedOptions[0] && select.selectedOptions[0].hidden) select.value = '';
    });
  });
}

const observer = new MutationObserver(installTaskSearch);
function startTaskSearchEnhancer() {
  installTaskSearch();
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startTaskSearchEnhancer, { once: true });
} else {
  startTaskSearchEnhancer();
}
