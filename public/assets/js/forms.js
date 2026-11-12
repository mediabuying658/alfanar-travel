/* Al Fanar Travel — booking request forms → validated lead → prefilled WhatsApp message.
   Flow: validate → lead_id → record lead (server endpoint, with attribution) → Arabic message → open WhatsApp → customer presses Send.
   IMPORTANT: opening WhatsApp is NOT a sent message and NOT a qualified lead. Those are confirmed later from the WhatsApp inbox / CRM. */
(function () {
  'use strict';
  var CFG = window.AF_CONFIG || {};
  var AF = window.AF || {};

  var MSG = {
    required: 'هذا الحقل مطلوب',
    choose: 'اختر أحد الخيارات',
    chooseOne: 'اختر خياراً واحداً على الأقل',
    dateInvalid: 'أدخل تاريخاً صحيحاً',
    datePast: 'اختر تاريخاً من اليوم فصاعداً',
    after: function (l) { return 'يجب أن يكون بعد ' + l; },
    onOrAfter: function (l) { return 'لا يمكن أن يكون قبل ' + l; },
    min: function (n) { return 'الحد الأدنى ' + n; },
    max: function (n) { return 'الحد الأقصى ' + n; },
    maxOf: function (l) { return 'لا يمكن أن يزيد عن عدد ' + l; },
    budget: 'ارفع الميزانية باستخدام الأسهم أو اكتب المبلغ بالدينار',
    tooLong: 'النص طويل جداً',
    summary: function (n) { return n === 1 ? 'يرجى تصحيح حقل واحد قبل الإرسال.' : 'يرجى تصحيح ' + n + ' حقول قبل الإرسال.'; }
  };

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function todayISO() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function parseISO(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; var p = s.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return isNaN(d) ? null : d; }
  var dateFmt;
  try { dateFmt = new Intl.DateTimeFormat('ar-KW-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { dateFmt = null; }
  function fmtDate(s) { var d = parseISO(s); if (!d) return s; return dateFmt ? dateFmt.format(d) + ' (' + s + ')' : s; }
  function nightsBetween(a, b) { var x = parseISO(a), y = parseISO(b); if (!x || !y) return null; return Math.round((y - x) / 864e5); }

  /* Lead ID: AF-<SERVICE>-<YYMMDD>-<5 chars Crockford base32>, e.g. AF-H-261112-7KQ2M */
  function makeLeadId(prefix) {
    var alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    var bytes = new Uint8Array(5);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    var r = ''; for (var i = 0; i < 5; i++) r += alphabet[bytes[i] % 32];
    var d = new Date();
    var ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return 'AF-' + prefix + '-' + ymd + '-' + r;
  }

  function fieldEls(form) { return $$('.field[data-field]', form); }
  function isShown(f) { return !f.hidden && !f.closest('[hidden]') && !f.hasAttribute('data-collapsing'); }
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // first control a person can actually focus (custom dropdown button, visible inputs)
  function focusable(root) { return $('.dd__btn:not([disabled]), input:not([type=hidden]):not([disabled]):not([tabindex="-1"]), textarea:not([disabled])', root); }
  function ctrl(form, name) { return form.elements.namedItem(name); }
  function valueOf(form, name) {
    var el = ctrl(form, name);
    if (!el) return '';
    if (el instanceof RadioNodeList || (el.length && el[0] && el[0].type)) {
      var list = el; var vals = [];
      for (var i = 0; i < list.length; i++) { if (list[i].checked && !list[i].disabled) vals.push(list[i].value); }
      if (list[0].type === 'radio') return vals[0] || '';
      if (list[0].type === 'checkbox') return vals;
      return list.value;
    }
    if (el.type === 'checkbox') return el.checked && !el.disabled ? (el.value || 'on') : '';
    return el.disabled ? '' : (el.value || '').trim();
  }
  function labelOfField(f) { return f.getAttribute('data-msg-label') || ''; }
  function optionLabel(form, name, value) {
    var sel0 = ctrl(form, name);
    if (sel0 && sel0.tagName === 'SELECT') { var o0 = $$('option', sel0).filter(function (o) { return o.value === value; })[0]; return o0 ? o0.textContent.trim() : value; }
    var inp = $$('[name="' + name + '"]', form).filter(function (i) { return i.value === value; })[0];
    if (inp && inp.tagName === 'OPTION') return inp.textContent.trim();
    if (inp) { var s = inp.parentElement.querySelector('span'); if (s) return s.textContent.trim(); }
    var sel = ctrl(form, name);
    if (sel && sel.tagName === 'SELECT') { var o = $$('option', sel).filter(function (o) { return o.value === value; })[0]; if (o) return o.textContent.trim(); }
    return value;
  }

  /* ---------- conditional fields (progressive disclosure) ----------
     data-show-when="tripType=return|multi"  |  "children>0"  |  "destFlexible:unchecked" */
  function evalCond(form, cond) {
    var m;
    if ((m = cond.match(/^(\w+)=(.+)$/))) { var v = valueOf(form, m[1]); return m[2].split('|').indexOf(Array.isArray(v) ? v[0] : v) !== -1; }
    if ((m = cond.match(/^(\w+)>(\d+)$/))) return (parseFloat(valueOf(form, m[1])) || 0) > +m[2];
    if ((m = cond.match(/^(\w+):(checked|unchecked)$/))) { var c = ctrl(form, m[1]); var on = !!(c && c.checked); return m[2] === 'checked' ? on : !on; }
    return true;
  }
  /* Smoothly expand / collapse a field (height + fade). Logic state (disabled) changes immediately. */
  function animateField(w, show, instant) {
    if (w._anim) { w._anim.cancel(); w._anim = null; }
    if (instant || REDUCE || !w.animate) {
      w.hidden = !show; w.removeAttribute('data-collapsing'); return;
    }
    if (show) {
      w.hidden = false; w.removeAttribute('data-collapsing');
      var h = w.offsetHeight;
      w.style.overflow = 'hidden';
      w._anim = w.animate([{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: h + 'px', opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' });
    } else {
      var h2 = w.offsetHeight;
      w.setAttribute('data-collapsing', '');
      w.style.overflow = 'hidden';
      w._anim = w.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0, marginTop: '0px' }], { duration: 220, easing: 'ease-in' });
    }
    w._anim.onfinish = function () {
      w.style.overflow = ''; w._anim = null;
      if (!show) { w.hidden = true; w.removeAttribute('data-collapsing'); }
    };
  }
  function applyConditions(form, instant) {
    $$('[data-show-when]', form).forEach(function (w) {
      var show = evalCond(form, w.getAttribute('data-show-when'));
      var currentlyShown = !w.hidden && !w.hasAttribute('data-collapsing');
      if (currentlyShown === show) return;
      $$('input, select, textarea', w).forEach(function (i) { i.disabled = !show; });
      if (!show) w.classList.remove('is-invalid');
      animateField(w, show, instant);
    });
  }

  /* ---------- validation ---------- */
  function setError(f, msg) {
    var err = $('.err', f);
    var controls = $$('input, select, textarea, .dd__btn', f);
    if (msg) {
      f.classList.add('is-invalid');
      if (err) err.textContent = msg;
      controls.forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
    } else {
      f.classList.remove('is-invalid');
      if (err) err.textContent = '';
      controls.forEach(function (c) { c.removeAttribute('aria-invalid'); });
    }
  }
  function fieldLabelText(form, name) {
    var f = $('.field[data-field="' + name + '"]', form);
    return f ? (f.getAttribute('data-msg-label') || name) : name;
  }
  function validateField(form, f) {
    if (!isShown(f)) { setError(f, ''); return true; }
    var name = f.getAttribute('data-field');
    var type = f.getAttribute('data-type');
    var required = f.hasAttribute('data-required');
    var unless = f.getAttribute('data-required-unless');
    if (unless) { var u = ctrl(form, unless); if (u && u.checked) required = false; }
    var v = valueOf(form, name);
    var msg = '';

    if (type === 'budget') {
      var flex = ctrl(form, name + '_flexible');
      var flexOn = flex && flex.checked;
      var n = parseFloat(v);
      if (required && !flexOn && !(n > 0)) msg = MSG.budget;
      else if (v && n < 0) msg = MSG.budget;
    } else if (type === 'checks') {
      if (required && (!v || !v.length)) msg = MSG.chooseOne;
    } else if (type === 'radio') {
      if (required && !v) msg = MSG.choose;
    } else if (required && !v) {
      msg = type === 'select' ? MSG.choose : MSG.required;
    }

    if (!msg && v && type === 'date') {
      var d = parseISO(v);
      if (!d) msg = MSG.dateInvalid;
      else if (f.hasAttribute('data-min-today') && v < todayISO()) msg = MSG.datePast;
      else {
        var after = f.getAttribute('data-after');
        var onOrAfter = f.getAttribute('data-on-or-after');
        if (after && valueOf(form, after) && v <= valueOf(form, after)) msg = MSG.after(fieldLabelText(form, after));
        if (onOrAfter && valueOf(form, onOrAfter) && v < valueOf(form, onOrAfter)) msg = MSG.onOrAfter(fieldLabelText(form, onOrAfter));
      }
    }
    if (!msg && type === 'counter') {
      var el = ctrl(form, name); var num = parseInt(v, 10);
      var min = +el.min, max = +el.max;
      if (isNaN(num)) msg = MSG.required;
      else if (num < min) msg = MSG.min(min);
      else if (num > max) msg = MSG.max(max);
      var maxOf = f.getAttribute('data-max-of');
      if (!msg && maxOf && num > (parseInt(valueOf(form, maxOf), 10) || 0)) msg = MSG.maxOf(fieldLabelText(form, maxOf));
    }
    if (!msg && typeof v === 'string' && v.length > 600) msg = MSG.tooLong;
    setError(f, msg);
    return !msg;
  }
  function validateForm(form) {
    var bad = [];
    fieldEls(form).forEach(function (f) { if (!validateField(form, f)) bad.push(f); });
    return bad;
  }

  /* ---------- message ---------- */
  function buildMessage(form, leadId) {
    var service = form.getAttribute('data-service-label');
    var brand = CFG.brandNameAr || 'الفنار للسياحة';
    var lines = ['السلام عليكم، أرغب في ' + service + ' عن طريق ' + brand + '.', '', 'رقم الطلب: ' + leadId, ''];
    fieldEls(form).forEach(function (f) {
      if (!isShown(f)) return;
      var label = labelOfField(f); if (!label) return;
      var name = f.getAttribute('data-field');
      var type = f.getAttribute('data-type');
      var v = valueOf(form, name);
      var out = '';
      if (type === 'budget') {
        var flex = ctrl(form, name + '_flexible');
        var cur = ctrl(form, name + '_currency');
        var curLabel = 'د.ك';
        if (cur && cur.selectedIndex >= 0) { var co = cur.options[cur.selectedIndex]; curLabel = co.getAttribute('data-short') || co.textContent; }
        if (flex && flex.checked) out = 'مرنة / غير محددة';
        else if (v && parseFloat(v) > 0) out = v + ' ' + curLabel + (f.getAttribute('data-unit-suffix') ? ' ' + f.getAttribute('data-unit-suffix') : '');
      } else if (type === 'checks') {
        out = (v || []).map(function (x) { return optionLabel(form, name, x); }).join('، ');
      } else if (type === 'radio' || type === 'select') {
        out = v ? optionLabel(form, name, v) : '';
      } else if (type === 'date') {
        out = v ? fmtDate(v) : '';
      } else if (type === 'counter') {
        // skip optional zero counts (e.g. 0 children) to keep the message short
        out = (v === '0' && ctrl(form, name).min === '0') ? '' : v;
      } else if (type === 'single-check') {
        out = v ? 'نعم' : '';
      } else {
        out = v;
      }
      if (out === '' || out == null) return;
      lines.push('• ' + label + ': ' + out);
      var nightsFrom = f.getAttribute('data-nights-from');
      if (nightsFrom) { var n = nightsBetween(valueOf(form, nightsFrom), v); if (n > 0) lines.push('• عدد الليالي: ' + n); }
    });
    lines.push('', 'أرجو تزويدي بالخيارات المتاحة والتفاصيل. شكراً.');
    return lines.join('\n');
  }

  function collectFields(form) {
    var data = {};
    fieldEls(form).forEach(function (f) {
      if (!isShown(f)) return;
      var name = f.getAttribute('data-field');
      var v = valueOf(form, name);
      if (f.getAttribute('data-type') === 'budget') { var flex = ctrl(form, name + '_flexible'); data[name + '_flexible'] = !!(flex && flex.checked); var cur = ctrl(form, name + '_currency'); if (cur) data[name + '_currency'] = cur.value; }
      if (f.getAttribute('data-type') === 'budget' && !(parseFloat(v) > 0)) return;
      if (v !== '' && !(Array.isArray(v) && !v.length)) data[name] = v;
    });
    return data;
  }

  /* ---------- lead persistence ----------
     Sends to CFG.leadEndpoint (server function holds any secrets). Uses sendBeacon so navigation to WhatsApp does not cancel it. */
  function recordLead(payload) {
    var ep = CFG.leadEndpoint;
    if (!ep) return 'no_endpoint';
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ep, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return 'beacon_queued';
    } catch (e) {}
    try {
      fetch(ep, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(function () {});
      return 'fetch_sent';
    } catch (e) { return 'failed'; }
  }

  /* ---------- UI wiring ---------- */
  function initCounters(form) {
    $$('.counter', form).forEach(function (c) {
      var input = $('input', c);
      $$('button[data-step]', c).forEach(function (b) {
        b.addEventListener('click', function () {
          var v = (parseInt(input.value, 10) || 0) + parseInt(b.getAttribute('data-step'), 10);
          v = Math.max(+input.min, Math.min(+input.max, v));
          input.value = v;
          c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    });
  }
  function initDates(form) {
    var t = todayISO();
    $$('input[type="date"]', form).forEach(function (d) {
      var f = d.closest('.field');
      if (f && f.hasAttribute('data-min-today')) d.min = t;
    });
    // keep dependent date minimums in sync (e.g. checkout after checkin)
    $$('.field[data-after], .field[data-on-or-after]', form).forEach(function (f) {
      var src = f.getAttribute('data-after') || f.getAttribute('data-on-or-after');
      var srcEl = ctrl(form, src); var el = ctrl(form, f.getAttribute('data-field'));
      if (!srcEl || !el) return;
      srcEl.addEventListener('change', function () {
        if (!srcEl.value) return;
        var d = parseISO(srcEl.value);
        if (f.hasAttribute('data-after')) d.setDate(d.getDate() + 1);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        el.min = d.toISOString().slice(0, 10);
        if (el.value && el.value < el.min) { el.value = ''; el.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    });
  }
  function initBudget(form) {
    $$('.field[data-type="budget"]', form).forEach(function (f) {
      var name = f.getAttribute('data-field');
      var num = ctrl(form, name); var flex = ctrl(form, name + '_flexible'); var cur = ctrl(form, name + '_currency');
      if (!num || !flex) return;
      flex.addEventListener('change', function () { num.disabled = flex.checked; if (cur) cur.disabled = flex.checked; if (flex.checked) num.value = ''; f.classList.toggle('is-flexible', flex.checked); validateField(form, f); });
    });
  }

  function initForm(form) {
    var card = form.closest('.form-card');
    var service = form.getAttribute('data-service');
    var started = false;
    var leadId = null; var revision = 0;
    var summary = $('.form-errors-summary', form);
    var submitBtn = $('button[type="submit"]', form);

    initCounters(form); initDates(form); initBudget(form); applyConditions(form, true);

    function markStart() {
      if (started) return; started = true;
      AF.track('form_start', { service: service });
    }
    form.addEventListener('focusin', markStart);
    form.addEventListener('input', markStart);
    form.addEventListener('change', function (e) {
      applyConditions(form);
      var f = e.target.closest('.field');
      if (f && f.classList.contains('is-invalid')) validateField(form, f);
    });
    form.addEventListener('focusout', function (e) {
      var f = e.target.closest('.field');
      if (f && e.target.value && f.getAttribute('data-type') !== 'counter') validateField(form, f);
    });
    var more = $('details.more', form);
    if (more) more.addEventListener('toggle', function () { if (more.open) AF.track('form_optional_open', { service: service }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      markStart();
      applyConditions(form);
      var bad = validateForm(form);
      if (bad.length) {
        // If an optional-section field is invalid, open the section so the user can see it
        bad.forEach(function (f) { var d = f.closest('details'); if (d) d.open = true; });
        summary.textContent = MSG.summary(bad.length);
        summary.classList.add('is-visible');
        var first = focusable(bad[0]);
        if (first) first.focus();
        bad.forEach(function (f) { f.classList.remove('is-shake'); void f.offsetWidth; f.classList.add('is-shake'); });
        AF.track('form_validation_error', { service: service, error_fields: bad.map(function (f) { return f.getAttribute('data-field'); }).join(',') });
        return;
      }
      summary.classList.remove('is-visible');

      if (!leadId) leadId = makeLeadId(form.getAttribute('data-lead-prefix'));
      revision += 1;
      var message = buildMessage(form, leadId);
      var url = AF.waUrl(message);

      var payload = {
        lead_id: leadId,
        revision: revision,
        status: 'whatsapp_prefilled',          // NOT sent, NOT qualified
        service: service,
        created_at: new Date().toISOString(),
        page: location.pathname,
        lp_variant: document.body.dataset.variant || 'a',
        fields: collectFields(form),
        message: message,
        attribution: AF.getAttribution ? AF.getAttribution() : {},
        consent: AF.consent ? { analytics: !!AF.consent.analytics, ads: !!AF.consent.ads } : { analytics: false, ads: false },
        client: { lang: navigator.language, tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '' }
      };
      var persist = recordLead(payload);
      AF.lastLead = payload;

      // Non-PII event: values such as names/notes never go to analytics.
      AF.track('form_complete', { service: service, lead_id: leadId, revision: revision, lead_record: persist });

      // Success panel
      $('[data-lead-id]', card).textContent = leadId;
      $('[data-msg-preview]', card).textContent = message;
      var waBtn = $('[data-wa-open]', card);
      waBtn.href = url;
      card.classList.add('is-done');
      var heading = $('.success h2', card);
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
      card.scrollIntoView({ block: 'start', behavior: 'auto' });

      // Try to open WhatsApp straight away (inside the submit gesture). If blocked, the button in the panel is the fallback.
      if (CFG.autoOpenWhatsApp !== false) {
        var w = null;
        try { w = window.open(url, '_blank'); } catch (err) { w = null; }
        if (w) { try { w.opener = null; } catch (err) {} AF.track('whatsapp_open', { service: service, lead_id: leadId, method: 'auto' }); }
      }
    });

    // Success panel actions
    $('[data-wa-open]', card).addEventListener('click', function () {
      AF.track('whatsapp_open', { service: service, lead_id: leadId, method: 'button' });
    });
    $('[data-copy-msg]', card).addEventListener('click', function () {
      var txt = $('[data-msg-preview]', card).textContent;
      var status = $('.copy-status', card);
      var done = function (ok) {
        status.textContent = ok ? 'تم نسخ الرسالة. الصقها في محادثة واتساب مع ' + (CFG.brandNameAr || 'الفنار للسياحة') + (CFG.whatsappDisplay ? ' على الرقم ' + CFG.whatsappDisplay : '') + '.' : 'تعذّر النسخ تلقائياً. حدّد نص الرسالة أعلاه وانسخه يدوياً.';
        AF.track('whatsapp_copy_message', { service: service, lead_id: leadId, ok: ok });
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { selectText(); done(false); });
      else { selectText(); done(false); }
      function selectText() { try { var r = document.createRange(); r.selectNodeContents($('[data-msg-preview]', card)); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {} }
    });
    $('[data-edit]', card).addEventListener('click', function () {
      card.classList.remove('is-done');
      var first = focusable(form);
      if (first) first.focus();
      AF.track('form_edit', { service: service, lead_id: leadId });
    });
  }

  document.addEventListener('DOMContentLoaded', function () { $$('form.lead-form').forEach(initForm); });

  // exposed for automated QA
  AF._forms = { buildMessage: buildMessage, makeLeadId: makeLeadId, validateForm: validateForm };
})();
