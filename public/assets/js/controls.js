/* Al Fanar Travel — branded form controls
   1. Custom dropdown for every <select class="select"> (the native select stays in the DOM, hidden and in sync,
      so validation, form data and the WhatsApp message keep working unchanged).
   2. Branded autocomplete for text inputs that have a <datalist> (replaces the browser's native suggestion list).
   Both follow the WAI-ARIA combobox / listbox patterns: full keyboard support, screen-reader announcements. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;
  var openInstance = null;

  /* ---------- shared popover open/close with animation ---------- */
  function showList(list) {
    list.hidden = false;
    // next frame → transition from closed to open state
    requestAnimationFrame(function () { list.classList.add('is-open'); });
  }
  function hideList(list) {
    if (list.hidden) return;
    list.classList.remove('is-open');
    if (reduce) { list.hidden = true; return; }
    var done = function () { if (!list.classList.contains('is-open')) list.hidden = true; list.removeEventListener('transitionend', done); };
    list.addEventListener('transitionend', done);
    setTimeout(done, 260);
  }
  function scrollIntoList(list, item) {
    if (!item) return;
    var top = item.offsetTop, bottom = top + item.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 4;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 4;
  }
  document.addEventListener('pointerdown', function (e) {
    if (openInstance && !openInstance.root.contains(e.target) && !(openInstance.pop && openInstance.pop.contains(e.target)) && !e.target.classList.contains('dp-backdrop')) openInstance.close();
  });
  // Normalise Arabic for forgiving search (hamza forms, taa marbuta, alef maqsura, diacritics, tatweel)
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[()\-–_.,]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  var chevron = '<svg class="dd__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var tick = '<svg class="dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /* =========================================================
     1. Custom select
     ========================================================= */
  function enhanceSelect(sel) {
    if (sel.dataset.enhanced) return;
    sel.dataset.enhanced = '1';
    var id = sel.id || ('dd' + (++uid));
    var mini = sel.classList.contains('select--mini');
    var root = document.createElement('div');
    root.className = 'dd' + (mini ? ' dd--mini' : '');
    sel.parentNode.insertBefore(root, sel);
    root.appendChild(sel);
    sel.classList.add('dd__native');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dd__btn';
    btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var list = document.createElement('ul');
    list.className = 'dd__list';
    list.id = id + '-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('tabindex', '-1');
    list.hidden = true;
    btn.setAttribute('aria-controls', list.id);

    // label → button
    var label = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : null;
    if (label) { label.id = label.id || id + '-label'; label.setAttribute('for', btn.id); btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id); list.setAttribute('aria-labelledby', label.id); }
    else if (sel.getAttribute('aria-label')) { btn.setAttribute('aria-label', sel.getAttribute('aria-label')); list.setAttribute('aria-label', sel.getAttribute('aria-label')); }
    if (sel.getAttribute('aria-describedby')) btn.setAttribute('aria-describedby', sel.getAttribute('aria-describedby'));

    var opts = Array.prototype.slice.call(sel.options);
    var placeholderText = opts.length && opts[0].value === '' ? opts[0].textContent : '';
    var items = opts.filter(function (o) { return o.value !== ''; }).map(function (o, i) {
      var li = document.createElement('li');
      li.id = id + '-opt-' + i;
      li.className = 'dd__opt';
      li.setAttribute('role', 'option');
      li.dataset.value = o.value;
      li.innerHTML = '<span>' + o.textContent + '</span>' + tick;
      list.appendChild(li);
      return li;
    });
    root.appendChild(btn);
    root.appendChild(list);
    var active = -1;

    function render() {
      var o = sel.options[sel.selectedIndex];
      var has = o && o.value !== '';
      var text = has ? (o.getAttribute('data-short') || o.textContent) : placeholderText;
      btn.innerHTML = '<span class="dd__val' + (has ? '' : ' is-placeholder') + '">' + text + '</span>' + chevron;
      items.forEach(function (li) { li.setAttribute('aria-selected', String(li.dataset.value === sel.value)); });
      btn.disabled = sel.disabled;
    }
    function setActive(i) {
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach(function (li, j) { li.classList.toggle('is-active', j === active); });
      list.setAttribute('aria-activedescendant', items[active].id);
      scrollIntoList(list, items[active]);
    }
    function open() {
      if (btn.disabled) return;
      if (openInstance && openInstance !== api) openInstance.close();
      openInstance = api;
      root.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      showList(list);
      var cur = items.findIndex(function (li) { return li.dataset.value === sel.value; });
      setActive(cur >= 0 ? cur : 0);
      list.focus({ preventScroll: true });
    }
    function close(refocus) {
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      hideList(list);
      if (openInstance === api) openInstance = null;
      if (refocus) btn.focus({ preventScroll: true });
    }
    function choose(i) {
      var v = items[i].dataset.value;
      if (sel.value !== v) {
        sel.value = v;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      render();
      root.classList.add('is-picked');
      setTimeout(function () { root.classList.remove('is-picked'); }, 300);
      close(true);
    }
    var api = { root: root, close: function () { close(false); } };

    btn.addEventListener('click', function () { root.classList.contains('is-open') ? close(true) : open(); });
    btn.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].indexOf(e.key) !== -1) { e.preventDefault(); open(); }
    });
    var typed = '', typedT;
    list.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); setActive(active + 1); break;
        case 'ArrowUp': e.preventDefault(); setActive(active - 1); break;
        case 'Home': e.preventDefault(); setActive(0); break;
        case 'End': e.preventDefault(); setActive(items.length - 1); break;
        case 'Enter': case ' ': e.preventDefault(); choose(active); break;
        case 'Escape': e.preventDefault(); close(true); break;
        case 'Tab': close(false); break;
        default:
          if (e.key.length === 1) {
            typed += e.key; clearTimeout(typedT); typedT = setTimeout(function () { typed = ''; }, 600);
            var k = items.findIndex(function (li) { return norm(li.textContent).indexOf(norm(typed)) === 0; });
            if (k >= 0) setActive(k);
          }
      }
    });
    list.addEventListener('pointermove', function (e) { var li = e.target.closest('.dd__opt'); if (li) setActive(items.indexOf(li)); });
    list.addEventListener('click', function (e) { var li = e.target.closest('.dd__opt'); if (li) choose(items.indexOf(li)); });
    // keep in sync when the native select changes programmatically (reset, disable via conditions)
    sel.addEventListener('change', render);
    new MutationObserver(render).observe(sel, { attributes: true, attributeFilter: ['disabled', 'aria-invalid'] });
    render();
  }

  /* =========================================================
     2. Autocomplete for text inputs with a datalist
     ========================================================= */
  function enhanceAutocomplete(input) {
    var dl = input.list || document.getElementById(input.getAttribute('list'));
    if (!dl || input.dataset.enhanced) return;
    input.dataset.enhanced = '1';
    var data = Array.prototype.slice.call(dl.options).map(function (o) {
      var v = o.value; var m = v.match(/^(.*?)\s*\(([A-Z]{3})\)\s*$/);
      return { value: v, name: m ? m[1] : v, code: m ? m[2] : '', key: norm(v) };
    });
    input.removeAttribute('list');
    dl.remove();
    var id = input.id || ('ac' + (++uid));
    var root = input.closest('.ac') || (function () { var w = document.createElement('div'); w.className = 'ac'; input.parentNode.insertBefore(w, input); w.appendChild(input); return w; })();
    root.classList.add('dd');
    var list = document.createElement('ul');
    list.className = 'dd__list dd__list--ac';
    list.id = id + '-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    root.appendChild(list);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);
    var label = document.querySelector('label[for="' + input.id + '"]');
    if (label) { label.id = label.id || id + '-label'; list.setAttribute('aria-labelledby', label.id); }
    var live = document.createElement('span'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); root.appendChild(live);
    var shown = [], active = -1;
    var pinIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

    function build(q) {
      var nq = norm(q);
      var starts = [], contains = [];
      data.forEach(function (d) {
        if (!nq) { starts.push(d); return; }
        var i = d.key.indexOf(nq);
        if (i === 0 || d.key.indexOf(' ' + nq) > -1 || d.code.toLowerCase().indexOf(nq) === 0) starts.push(d);
        else if (i > 0) contains.push(d);
      });
      shown = starts.concat(contains).slice(0, 8);
      list.innerHTML = shown.map(function (d, i) {
        return '<li class="dd__opt dd__opt--ac" role="option" id="' + id + '-ac-' + i + '" aria-selected="false">' + pinIcon + '<span class="dd__name">' + d.name + '</span>' + (d.code ? '<span class="dd__code" lang="en">' + d.code + '</span>' : '') + '</li>';
      }).join('');
      active = -1;
      input.removeAttribute('aria-activedescendant');
      live.textContent = shown.length ? shown.length + ' اقتراحات متاحة' : '';
      return shown.length;
    }
    function open() {
      if (openInstance && openInstance !== api) openInstance.close();
      if (!build(input.value)) { close(); return; }
      openInstance = api;
      root.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      showList(list);
    }
    function close() {
      root.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      hideList(list);
      if (openInstance === api) openInstance = null;
    }
    function setActive(i) {
      var lis = list.children; if (!lis.length) return;
      active = (i + lis.length) % lis.length;
      Array.prototype.forEach.call(lis, function (li, j) { li.classList.toggle('is-active', j === active); li.setAttribute('aria-selected', String(j === active)); });
      input.setAttribute('aria-activedescendant', lis[active].id);
      scrollIntoList(list, lis[active]);
    }
    function choose(i) {
      input.value = shown[i].value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      root.classList.add('is-picked');
      setTimeout(function () { root.classList.remove('is-picked'); }, 300);
      close();
    }
    var api = { root: root, close: close };

    input.addEventListener('focus', function () { open(); });
    input.addEventListener('click', function () { if (!root.classList.contains('is-open')) open(); });
    input.addEventListener('input', function (e) { if (e.isTrusted && document.activeElement === input) open(); });
    input.addEventListener('blur', function () { setTimeout(close, 120); });
    input.addEventListener('keydown', function (e) {
      var isOpen = root.classList.contains('is-open');
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen) open(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (isOpen) setActive(active - 1); }
      else if (e.key === 'Enter' && isOpen && active >= 0) { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(); }
    });
    list.addEventListener('pointerdown', function (e) { e.preventDefault(); }); // keep focus in the input
    list.addEventListener('pointermove', function (e) { var li = e.target.closest('.dd__opt'); if (li) setActive(Array.prototype.indexOf.call(list.children, li)); });
    list.addEventListener('click', function (e) { var li = e.target.closest('.dd__opt'); if (li) choose(Array.prototype.indexOf.call(list.children, li)); });
  }


  /* =========================================================
     3. Date picker — branded calendar popup for <input type="date">
        The native input stays (hidden) and keeps the ISO value, min date and change events,
        so validation, dependent dates (check-out after check-in) and the WhatsApp message are unchanged.
     ========================================================= */
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var WDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var WSHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  var calIcon = '<svg class="dp__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17.5h2"/></svg>';
  var arrowR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  var arrowL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function human(d) { return WDAYS[d.getDay()] + '، ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  var sheetBackdrop = null;
  function backdrop(show) {
    if (!sheetBackdrop) { sheetBackdrop = document.createElement('div'); sheetBackdrop.className = 'dp-backdrop'; sheetBackdrop.hidden = true; document.body.appendChild(sheetBackdrop); sheetBackdrop.addEventListener('click', function () { if (openInstance) openInstance.close(); }); }
    if (show) { sheetBackdrop.hidden = false; requestAnimationFrame(function () { sheetBackdrop.classList.add('is-open'); }); }
    else { sheetBackdrop.classList.remove('is-open'); setTimeout(function () { if (!sheetBackdrop.classList.contains('is-open')) sheetBackdrop.hidden = true; }, 250); }
  }
  var isSheet = function () { return window.matchMedia('(max-width: 600px)').matches; };

  function enhanceDate(input) {
    if (input.dataset.enhanced) return;
    input.dataset.enhanced = '1';
    var form = input.form;
    var field = input.closest('.field');
    var id = input.id || ('dp' + (++uid));
    var root = document.createElement('div');
    root.className = 'dd dp-wrap';
    input.parentNode.insertBefore(root, input);
    root.appendChild(input);
    input.classList.add('dd__native');
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dd__btn dp__btn';
    btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    var label = document.querySelector('label[for="' + input.id + '"]');
    if (label) { label.id = label.id || id + '-label'; label.setAttribute('for', btn.id); btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id); }
    if (input.getAttribute('aria-describedby')) btn.setAttribute('aria-describedby', input.getAttribute('aria-describedby'));

    var pop = document.createElement('div');
    pop.className = 'dd__list dp';
    pop.id = id + '-cal';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    if (label) pop.setAttribute('aria-label', 'اختر ' + label.textContent.replace('*', '').trim());
    pop.hidden = true;
    btn.setAttribute('aria-controls', pop.id);
    root.appendChild(btn);
    root.appendChild(pop);

    // linked range: this field may start after another (check-out after check-in) or be the start of another
    var startName = field && (field.getAttribute('data-after') || field.getAttribute('data-on-or-after'));
    var strictAfter = field && field.hasAttribute('data-after');
    var endField = form && field ? form.querySelector('.field[data-after="' + field.getAttribute('data-field') + '"], .field[data-on-or-after="' + field.getAttribute('data-field') + '"]') : null;
    var view = null, focusDay = null, hoverDay = null;

    function render() {
      var d = parse(input.value);
      btn.innerHTML = calIcon + '<span class="dd__val' + (d ? '' : ' is-placeholder') + '">' + (d ? human(d) : 'اختر التاريخ') + '</span>';
      btn.disabled = input.disabled;
    }
    function bounds() {
      var min = parse(input.min);
      var max = parse(input.max);
      return { min: min, max: max };
    }
    function rangeEnds() {
      var a = null, b = null;
      if (startName && form) { a = parse((form.elements.namedItem(startName) || {}).value); b = hoverDay || parse(input.value) || focusDay; }
      else if (endField) { a = hoverDay || parse(input.value) || focusDay; var e = endField.querySelector('input[type=date]'); b = e ? parse(e.value) : null; }
      return a && b && b > a ? [a, b] : null;
    }
    function draw() {
      var y = view.getFullYear(), m = view.getMonth();
      var first = new Date(y, m, 1);
      var days = new Date(y, m + 1, 0).getDate();
      var bnd = bounds();
      var sel = parse(input.value);
      var today = parse(iso(new Date()));
      var range = rangeEnds();
      var start = startName && form ? parse((form.elements.namedItem(startName) || {}).value) : null;
      var canPrev = !bnd.min || new Date(y, m, 0) >= bnd.min;
      var html = '<div class="dp__head">' +
        '<button type="button" class="dp__nav" data-nav="-1" aria-label="الشهر السابق"' + (canPrev ? '' : ' disabled') + '>' + arrowL + '</button>' +
        '<div class="dp__title" aria-live="polite">' + MONTHS[m] + ' <span lang="en">' + y + '</span></div>' +
        '<button type="button" class="dp__nav" data-nav="1" aria-label="الشهر التالي">' + arrowR + '</button></div>' +
        '<div class="dp__grid" role="grid">' + WSHORT.map(function (w, i) { return '<span class="dp__wd" role="columnheader" title="' + WDAYS[i] + '">' + w + '</span>'; }).join('');
      for (var i = 0; i < first.getDay(); i++) html += '<span class="dp__pad" aria-hidden="true"></span>';
      for (var dnum = 1; dnum <= days; dnum++) {
        var dd = new Date(y, m, dnum);
        var dis = (bnd.min && dd < bnd.min) || (bnd.max && dd > bnd.max);
        var cls = ['dp__day'];
        if (sel && +dd === +sel) cls.push('is-selected');
        if (+dd === +today) cls.push('is-today');
        if (start && +dd === +start) cls.push('is-start');
        if (range && dd > range[0] && dd < range[1]) cls.push('in-range');
        if (range && +dd === +range[0]) cls.push('range-start');
        if (range && +dd === +range[1]) cls.push('range-end');
        if (focusDay && +dd === +focusDay) cls.push('is-focus');
        html += '<button type="button" class="' + cls.join(' ') + '" data-day="' + iso(dd) + '" aria-label="' + human(dd) + '"' + (sel && +dd === +sel ? ' aria-pressed="true"' : '') + (dis ? ' disabled' : '') + ' tabindex="' + (focusDay && +dd === +focusDay ? '0' : '-1') + '">' + dnum + '</button>';
      }
      html += '</div><div class="dp__foot"><button type="button" class="dp__link" data-today>اليوم</button>' +
        (startName && start ? '<span class="dp__hint">' + (function () { var r = rangeEnds(); return r ? Math.round((r[1] - r[0]) / 864e5) + (field.getAttribute('data-field') === 'checkout' ? ' ليالٍ' : ' يوم') : 'اختر تاريخ النهاية'; })() + '</span>' : '') +
        '<button type="button" class="dp__link" data-close>إغلاق</button></div>';
      pop.innerHTML = html;
    }
    function focusCurrent() { var b = pop.querySelector('.dp__day.is-focus'); if (b) b.focus({ preventScroll: true }); }
    function open() {
      if (btn.disabled) return;
      hoverDay = null;
      if (openInstance && openInstance !== api) openInstance.close();
      openInstance = api;
      var bnd = bounds();
      var sel = parse(input.value);
      var start = startName && form ? parse((form.elements.namedItem(startName) || {}).value) : null;
      focusDay = sel || (start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + (strictAfter ? 1 : 0)) : null) || bnd.min || parse(iso(new Date()));
      if (bnd.min && focusDay < bnd.min) focusDay = bnd.min;
      view = new Date(focusDay.getFullYear(), focusDay.getMonth(), 1);
      draw();
      root.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      var sheet = isSheet();
      pop.classList.toggle('dp--sheet', sheet);
      // phones: the sheet lives at the end of <body> so it sits above every stacking context
      if (sheet) { document.body.appendChild(pop); backdrop(true); } else if (pop.parentNode !== root) root.appendChild(pop);
      showList(pop);
      setTimeout(focusCurrent, 30);
    }
    function close(refocus) {
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      hideList(pop);
      if (pop.classList.contains('dp--sheet')) { backdrop(false); setTimeout(function () { if (pop.hidden && pop.parentNode !== root) root.appendChild(pop); }, 340); }
      if (openInstance === api) openInstance = null;
      if (refocus) btn.focus({ preventScroll: true });
    }
    function choose(v) {
      input.value = v;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      render();
      root.classList.add('is-picked');
      setTimeout(function () { root.classList.remove('is-picked'); }, 300);
      close(true);
      // continue the flow: open the paired end date if it is still empty
      if (endField && !endField.hidden) {
        var e = endField.querySelector('input[type=date]');
        var b = endField.querySelector('.dp__btn');
        if (e && !e.value && b && !b.disabled) setTimeout(function () { b.click(); }, 260);
      }
    }
    function move(days) {
      var n = new Date(focusDay.getFullYear(), focusDay.getMonth(), focusDay.getDate() + days);
      var bnd = bounds();
      if (bnd.min && n < bnd.min) return;
      focusDay = n;
      if (n.getMonth() !== view.getMonth() || n.getFullYear() !== view.getFullYear()) view = new Date(n.getFullYear(), n.getMonth(), 1);
      draw(); focusCurrent();
    }
    var api = { root: root, pop: pop, close: function () { close(false); } };

    btn.addEventListener('click', function () { root.classList.contains('is-open') ? close(true) : open(); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    pop.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || t.disabled) return;
      if (t.dataset.nav) {
        view = new Date(view.getFullYear(), view.getMonth() + +t.dataset.nav, 1);
        focusDay = new Date(view.getFullYear(), view.getMonth(), Math.min(focusDay.getDate(), new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()));
        var bnd = bounds(); if (bnd.min && focusDay < bnd.min) focusDay = bnd.min;
        var grid = pop.querySelector('.dp__grid');
        draw();
        var g2 = pop.querySelector('.dp__grid');
        if (g2 && !reduce) g2.animate([{ opacity: 0, transform: 'translateX(' + (+t.dataset.nav > 0 ? '12px' : '-12px') + ')' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
        var again = pop.querySelector('[data-nav="' + t.dataset.nav + '"]'); if (again && !again.disabled) again.focus({ preventScroll: true });
      } else if (t.dataset.day) choose(t.dataset.day);
      else if (t.hasAttribute('data-today')) { var td = parse(iso(new Date())); var bnd2 = bounds(); if (!bnd2.min || td >= bnd2.min) choose(iso(td)); else { focusDay = bnd2.min; view = new Date(focusDay.getFullYear(), focusDay.getMonth(), 1); draw(); focusCurrent(); } }
      else if (t.hasAttribute('data-close')) close(true);
    });
    // hover previews the stay/trip range without moving the keyboard position
    function paintRange() {
      var r = rangeEnds();
      pop.querySelectorAll('.dp__day').forEach(function (b) {
        var bd = parse(b.dataset.day);
        b.classList.toggle('in-range', !!(r && bd > r[0] && bd < r[1]));
        b.classList.toggle('range-end', !!(r && +bd === +r[1]));
        b.classList.toggle('range-start', !!(r && +bd === +r[0]));
      });
    }
    pop.addEventListener('pointerover', function (e) {
      var t = e.target.closest('.dp__day'); if (!t || t.disabled || !(startName || endField)) return;
      var nd = parse(t.dataset.day); if (hoverDay && +nd === +hoverDay) return;
      hoverDay = nd; paintRange();
    });
    pop.addEventListener('pointerleave', function () { hoverDay = null; paintRange(); });
    pop.addEventListener('keydown', function (e) {
      if (!e.target.classList.contains('dp__day')) { if (e.key === 'Escape') { e.preventDefault(); close(true); } return; }
      // RTL: ArrowLeft moves forward in time, ArrowRight backward
      var k = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
      if (k) { e.preventDefault(); move(k); }
      else if (e.key === 'PageDown') { e.preventDefault(); move(new Date(focusDay.getFullYear(), focusDay.getMonth() + 1, 0).getDate()); }
      else if (e.key === 'PageUp') { e.preventDefault(); move(-new Date(focusDay.getFullYear(), focusDay.getMonth(), 0).getDate()); }
      else if (e.key === 'Home') { e.preventDefault(); move(-focusDay.getDay()); }
      else if (e.key === 'End') { e.preventDefault(); move(6 - focusDay.getDay()); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') { /* keep focus inside while open */ var f = pop.querySelectorAll('button:not([disabled])'); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    input.addEventListener('change', render);
    new MutationObserver(render).observe(input, { attributes: true, attributeFilter: ['disabled', 'min', 'value'] });
    render();
  }

  /* =========================================================
     4. Branded stepper for free number inputs (budget) — replaces the browser's spin arrows
     ========================================================= */
  function enhanceNumber(input) {
    if (input.dataset.enhanced || input.closest('.counter')) return;
    input.dataset.enhanced = '1';
    var wrap = document.createElement('div');
    wrap.className = 'num';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var step = parseFloat(input.dataset.step || 100);
    var box = document.createElement('div');
    box.className = 'num__steps';
    box.innerHTML = '<button type="button" tabindex="-1" data-d="1" aria-label="زيادة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>' +
      '<button type="button" tabindex="-1" data-d="-1" aria-label="إنقاص"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>';
    wrap.appendChild(box);
    var timer, rep;
    function bump(d) {
      if (input.disabled) return;
      var v = parseFloat(input.value) || 0;
      v = Math.max(0, v + d * step);   // exact +/-100 from whatever is there (1250 → 1350), never below 0
      input.value = v;

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      wrap.classList.remove('is-bump'); void wrap.offsetWidth; wrap.classList.add('is-bump');
    }
    box.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      var d = +b.dataset.d; bump(d);
      timer = setTimeout(function () { rep = setInterval(function () { bump(d); }, 90); }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { box.addEventListener(ev, function () { clearTimeout(timer); clearInterval(rep); }); });
    new MutationObserver(function () { wrap.classList.toggle('is-disabled', input.disabled); }).observe(input, { attributes: true, attributeFilter: ['disabled'] });
  }

  function init(root) {
    (root || document).querySelectorAll('select.select').forEach(enhanceSelect);
    (root || document).querySelectorAll('input[list]').forEach(enhanceAutocomplete);
    (root || document).querySelectorAll('form input[type="date"]').forEach(enhanceDate);
    (root || document).querySelectorAll('form input[type="number"]').forEach(enhanceNumber);
  }
  window.AFControls = { init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
