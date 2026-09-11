/* Pomodoro multi-task enhancement.
   This keeps the original Timer/Tracker/Planner React structure intact.
   Multi-select adds a session queue on top of the existing single-task picker.
*/
(() => {
  const state = { multi: false, selected: [] };
  let installed = false;
  let observerStarted = false;

  const getPicker = () => document.querySelector('.timer-app select.xp-select');
  const getLabel = (value, select) => {
    if (!value || !select) return '';
    const opt = Array.from(select.options).find(o => o.value === value);
    return opt ? opt.textContent : value;
  };

  function fireSelect(select, value) {
    if (!select || !value) return;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function updateLinkedLabel() {
    const label = document.querySelector('.timer-linked-label');
    if (!label) return;
    if (state.selected.length > 1) {
      const select = getPicker();
      label.textContent = 'on: ' + state.selected.map(v => getLabel(v, select)).filter(Boolean).join(' + ');
    }
  }

  function render() {
    const select = getPicker();
    const box = document.querySelector('.pom-multi-box');
    if (!select || !box) return;

    const addBtn = box.querySelector('.pom-multi-add');
    const list = box.querySelector('.pom-multi-list');
    const toggle = box.querySelector('.pom-multi-toggle');
    const count = box.querySelector('.pom-multi-count');

    toggle.textContent = state.multi ? 'Multi-select: ON' : 'Multi-select: OFF';
    toggle.setAttribute('aria-pressed', String(state.multi));
    toggle.style.fontWeight = state.multi ? 'bold' : 'normal';
    addBtn.disabled = !state.multi || !select.value || state.selected.includes(select.value) || select.disabled;
    count.textContent = state.selected.length ? `${state.selected.length} selected for this Pomodoro` : 'No lectures selected';

    list.innerHTML = '';
    state.selected.forEach((value, index) => {
      const row = document.createElement('div');
      row.className = 'pom-multi-row';
      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${getLabel(value, select)}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pom-multi-remove';
      remove.textContent = '×';
      remove.title = 'Remove from this Pomodoro';
      remove.disabled = select.disabled;
      remove.addEventListener('click', () => {
        if (select.disabled) return;
        state.selected = state.selected.filter(v => v !== value);
        if (state.selected.length === 0) fireSelect(select, '');
        else if (state.selected[0] !== select.value) fireSelect(select, state.selected[0]);
        render();
      });
      row.append(label, remove);
      list.appendChild(row);
    });

    list.style.display = state.multi || state.selected.length ? 'block' : 'none';
    box.classList.toggle('pom-multi-active', state.multi);
    updateLinkedLabel();
  }

  function install() {
    if (installed) return true;
    const select = getPicker();
    if (!select) return false;

    installed = true;
    const box = document.createElement('div');
    box.className = 'pom-multi-box';
    box.style.marginTop = '7px';
    box.innerHTML = `
      <div class="pom-multi-controls" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <button type="button" class="xp-button pom-multi-toggle" aria-pressed="false">Multi-select: OFF</button>
        <button type="button" class="xp-button pom-multi-add" disabled>+ Add selected</button>
      </div>
      <div class="pom-multi-meta" style="display:flex;justify-content:space-between;align-items:center;margin-top:5px">
        <span class="pom-multi-count xp-small-text">No lectures selected</span>
        <button type="button" class="pom-multi-clear">Clear</button>
      </div>
      <div class="pom-multi-list"></div>
    `;

    select.parentNode.insertBefore(box, select.nextSibling);

    box.querySelector('.pom-multi-toggle').addEventListener('click', () => {
      if (select.disabled) return;
      state.multi = !state.multi;
      if (!state.multi) state.selected = [];
      render();
    });

    box.querySelector('.pom-multi-add').addEventListener('click', () => {
      if (!state.multi || !select.value || select.disabled) return;
      if (!state.selected.includes(select.value)) {
        state.selected.push(select.value);
        if (state.selected.length === 1) fireSelect(select, select.value);
        render();
      }
    });

    box.querySelector('.pom-multi-clear').addEventListener('click', () => {
      if (select.disabled) return;
      state.selected = [];
      fireSelect(select, '');
      render();
    });

    select.addEventListener('change', () => render());
    render();
    return true;
  }

  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;
    const observer = new MutationObserver(() => {
      if (!installed) install();
      updateLinkedLabel();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { install(); startObserver(); });
  } else {
    install();
    startObserver();
  }
})();
