/**
 * Searchable Select Dropdown Component
 * Converts native <select> elements into searchable dropdowns
 */

function initSearchableSelects() {
  document.querySelectorAll('select').forEach(sel => {
    if (sel.dataset.ssInit) return;
    sel.dataset.ssInit = "true";

    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ss-input';
    input.placeholder = 'Search or select...';
    input.autocomplete = 'off';

    const arrow = document.createElement('span');
    arrow.className = 'ss-arrow';
    arrow.textContent = '▼';

    const dropdown = document.createElement('div');
    dropdown.className = 'ss-dropdown';

    sel.parentNode.insertBefore(wrapper, sel);
    wrapper.appendChild(input);
    wrapper.appendChild(arrow);
    wrapper.appendChild(dropdown);
    wrapper.appendChild(sel);
    sel.style.display = 'none';

    function buildOptions(filter = '') {
      dropdown.innerHTML = '';
      const lowerFilter = filter.toLowerCase();
      let hasMatch = false;
      Array.from(sel.options).forEach(opt => {
        if (opt.value === '' && opt.textContent.startsWith('--')) {
          if (!filter) {
            const div = document.createElement('div');
            div.className = 'ss-option';
            div.textContent = opt.textContent;
            div.dataset.value = opt.value;
            div.addEventListener('mousedown', e => {
              e.preventDefault();
              sel.value = opt.value;
              input.value = '';
              dropdown.classList.remove('open');
              sel.dispatchEvent(new Event('change'));
            });
            dropdown.appendChild(div);
          }
          return;
        }
        if (lowerFilter && !opt.textContent.toLowerCase().includes(lowerFilter)) return;
        hasMatch = true;
        const div = document.createElement('div');
        div.className = 'ss-option' + (opt.value === sel.value ? ' selected' : '');
        div.textContent = opt.textContent;
        div.dataset.value = opt.value;
        div.addEventListener('mousedown', e => {
          e.preventDefault();
          sel.value = opt.value;
          input.value = opt.textContent;
          dropdown.classList.remove('open');
          sel.dispatchEvent(new Event('change'));
        });
        dropdown.appendChild(div);
      });
      if (!hasMatch && filter) {
        const noMatch = document.createElement('div');
        noMatch.className = 'ss-no-match';
        noMatch.textContent = 'No match found';
        dropdown.appendChild(noMatch);
      }
    }

    function syncDisplay() {
      const opt = sel.options[sel.selectedIndex];
      input.value = (opt && opt.value) ? opt.textContent : '';
    }

    input.addEventListener('focus', () => {
      input.select();
      buildOptions('');
      dropdown.classList.add('open');
    });

    input.addEventListener('input', () => {
      buildOptions(input.value);
      dropdown.classList.add('open');
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.classList.remove('open');
        syncDisplay();
      }, 150);
    });

    input.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.ss-option');
      let idx = Array.from(items).findIndex(i => i.classList.contains('highlighted'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) idx++;
        items.forEach(i => i.classList.remove('highlighted'));
        if (items[idx]) { items[idx].classList.add('highlighted'); items[idx].scrollIntoView({block:'nearest'}); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) idx--;
        items.forEach(i => i.classList.remove('highlighted'));
        if (items[idx]) { items[idx].classList.add('highlighted'); items[idx].scrollIntoView({block:'nearest'}); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const hl = dropdown.querySelector('.ss-option.highlighted');
        if (hl) hl.dispatchEvent(new MouseEvent('mousedown'));
      } else if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        input.blur();
      }
    });

    syncDisplay();
  });
}

// Patch toggleModal to re-init searchable selects when modals open
(function() {
  const _origToggleModal = toggleModal;
  window.toggleModal = function(id, show) {
    _origToggleModal(id, show);
    if (show) setTimeout(initSearchableSelects, 50);
  };
})();

// Init on DOM ready & fallback
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initSearchableSelects, 100);
});
setTimeout(initSearchableSelects, 200);
