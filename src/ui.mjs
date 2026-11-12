import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { icons as I } from './icons.mjs';

export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------- context helpers ---------------- */
export function makeCtx({ cfg, mode, route, root }) {
  const depth = route === '/' ? 0 : route.split('/').filter(Boolean).length;
  const rel = depth === 0 ? '' : '../'.repeat(depth);
  const ctx = {
    cfg, mode, route, root,
    // internal link to a route
    link: (r) => {
      const hash = r.includes('#') ? r.slice(r.indexOf('#')) : '';
      r = r.replace(/#.*/, '');
      if (mode === 'prod') return (r || '/') + hash;
      if (r === '' ) return hash;
      const p = r === '/' ? 'index.html' : r.replace(/^\//, '') + '/index.html';
      return rel + p + hash;
    },
    asset: (p) => {
      const url = (mode === 'prod' ? '/assets/' : rel + 'assets/') + p;
      if (!/\.(css|js)$/.test(p)) return url;
      // content hash → browsers always load the latest CSS/JS after an update
      const f = path.join(root, 'public/assets', p);
      const v = fs.existsSync(f) ? crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 8) : Date.now().toString(36);
      return url + '?v=' + v;
    },
    // value or visible placeholder
    ph: (value, label) => {
      if (value) return esc(value);
      return cfg.showEditorNotes !== false && cfg.showPlaceholders ? `<span class="ph" title="بانتظار الاعتماد">[${esc(label)}]</span>` : '';
    }
  };
  return ctx;
}

/* ---------------- image slots ----------------
   Looks for public/assets/img/<file>.jpg (+ optional -800/-1600 .webp/.avif variants made by tools/images.mjs).
   If the approved photo is not there yet, renders an on-brand placeholder that names the exact file required. */
export function media(ctx, { file, alt, ar = '4/3', eager = false, icon = 'bed', need, sizes = '(max-width: 900px) 100vw, 50vw', cls = '', pos = '', posMobile = '', badge = false }) {
  const imgDir = path.join(ctx.root, 'public/assets/img');
  const has = (f) => fs.existsSync(path.join(imgDir, f));
  const style = ar ? ` style="--ar:${ar}"` : '';
  if (has(`${file}.jpg`)) {
    const src = (f) => ctx.asset('img/' + f);
    const set = (ext) => [800, 1600].filter((w) => has(`${file}-${w}.${ext}`)).map((w) => `${src(`${file}-${w}.${ext}`)} ${w}w`).join(', ');
    const avif = set('avif'), webp = set('webp'), jpg = set('jpg');
    const [w, h] = (ar || '4/3').split('/').map(Number);
    const posStyle = pos || posMobile ? ` style="object-position:var(--pos)" data-pos` : '';
    const vars = [ar ? `--ar:${ar}` : '', pos ? `--pos:${pos}` : '', posMobile ? `--pos-m:${posMobile}` : ''].filter(Boolean).join(';');
    const badgeHtml = badge ? '<span class="media__badge" aria-hidden="true">صورة توضيحية</span>' : '';
    return `<figure class="media ${cls}"${vars ? ` style="${vars}"` : ''}><picture>${avif ? `<source type="image/avif" srcset="${avif}" sizes="${sizes}">` : ''}${webp ? `<source type="image/webp" srcset="${webp}" sizes="${sizes}">` : ''}<img src="${src(file + '.jpg')}"${jpg ? ` srcset="${jpg}" sizes="${sizes}"` : ''} alt="${esc(alt)}" width="${w * 400}" height="${h * 400}"${posStyle} ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}></picture>${badgeHtml}</figure>`;
  }
  const label = ctx.cfg.showPlaceholders && ctx.cfg.showEditorNotes !== false
    ? `<span class="media__label">صورة مرخّصة مطلوبة: ${esc(need)}<br><code>assets/img/${esc(file)}.jpg</code></span>` : '';
  return `<figure class="media media--missing ${cls}"${style} ${alt ? ` role="img" aria-label="${esc(alt)}"` : ' aria-hidden="true"'}><div class="media__art">${I[icon] || ''}${label}</div></figure>`;
}

/* ---------------- form fields ---------------- */
const CURRENCIES = [['KWD', 'د.ك', 'دينار كويتي'], ['SAR', 'ر.س', 'ريال سعودي'], ['AED', 'د.إ', 'درهم إماراتي'], ['QAR', 'ر.ق', 'ريال قطري'], ['BHD', 'د.ب', 'دينار بحريني'], ['OMR', 'ر.ع', 'ريال عماني'], ['EGP', 'ج.م', 'جنيه مصري'], ['USD', 'USD', 'دولار أمريكي'], ['EUR', 'EUR', 'يورو']];
let uid = 0;
const fid = (form, name) => `${form}-${name}`;

function wrap(form, d, inner, { labelFor = true, asFieldset = false } = {}) {
  const id = fid(form, d.name);
  const attrs = [
    `class="field${d.full ? ' f-full' : ''}"`,
    `data-field="${d.name}"`,
    `data-type="${d.type}"`,
    d.msg !== false ? `data-msg-label="${esc(d.msg || d.label)}"` : '',
    d.required ? 'data-required' : '',
    d.requiredUnless ? `data-required-unless="${d.requiredUnless}"` : '',
    d.showWhen ? `data-show-when="${d.showWhen}" hidden` : '',
    d.minToday ? 'data-min-today' : '',
    d.after ? `data-after="${d.after}"` : '',
    d.onOrAfter ? `data-on-or-after="${d.onOrAfter}"` : '',
    d.nightsFrom ? `data-nights-from="${d.nightsFrom}"` : '',
    d.maxOf ? `data-max-of="${d.maxOf}"` : '',
    d.unitSuffix ? `data-unit-suffix="${esc(d.unitSuffix)}"` : ''
  ].filter(Boolean).join(' ');
  const req = d.required ? ' <span class="req" aria-hidden="true">*</span>' : (d.optionalTag ? ' <small class="hint">(اختياري)</small>' : '');
  const hint = d.hint ? `<span class="hint" id="${id}-hint">${d.hint}</span>` : '';
  const err = `<span class="err" id="${id}-err" role="alert"></span>`;
  if (asFieldset) {
    return `<fieldset ${attrs}><legend class="label">${esc(d.label)}${req}</legend>${inner}${hint}${err}</fieldset>`;
  }
  return `<div ${attrs}><label ${labelFor ? `for="${id}"` : ''}>${esc(d.label)}${req}</label>${inner}${hint}${err}</div>`;
}
const describedBy = (form, d) => `aria-describedby="${[d.hint ? fid(form, d.name) + '-hint' : '', fid(form, d.name) + '-err'].filter(Boolean).join(' ')}"`;
const reqAttr = (d) => (d.required ? ' required aria-required="true"' : '');

export function field(form, d) {
  const id = fid(form, d.name);
  const dis = d.showWhen ? ' disabled' : '';
  switch (d.type) {
    case 'text': {
      const list = d.list ? `<datalist id="${id}-dl">${d.list.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>` : '';
      const input = `<input class="input${d.icon ? ' input--icon' : ''}" type="text" id="${id}" name="${d.name}"${reqAttr(d)} ${describedBy(form, d)}${d.placeholder ? ` placeholder="${esc(d.placeholder)}"` : ''}${d.value ? ` value="${esc(d.value)}"` : ''}${d.list ? ` list="${id}-dl"` : ''} autocomplete="${d.autocomplete || 'off'}" maxlength="${d.maxlength || 120}"${dis}>`;
      return wrap(form, d, d.list || d.icon ? `<div class="ac">${d.icon ? `<span class="ac__icon">${I[d.icon]}</span>` : ''}${input}${list}</div>` : input);
    }
    case 'date':
      return wrap(form, d, `<input class="input" type="date" id="${id}" name="${d.name}"${reqAttr(d)} ${describedBy(form, d)}${dis}>`);
    case 'textarea':
      return wrap(form, d, `<textarea class="textarea" id="${id}" name="${d.name}" ${describedBy(form, d)} maxlength="600" rows="3"${d.placeholder ? ` placeholder="${esc(d.placeholder)}"` : ''}${dis}></textarea>`);
    case 'select':
      return wrap(form, d, `<select class="select" id="${id}" name="${d.name}"${reqAttr(d)} ${describedBy(form, d)}${dis}>${d.placeholder ? `<option value="">${esc(d.placeholder)}</option>` : ''}${d.options.map(([v, l]) => `<option value="${v}"${d.value === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`);
    case 'counter':
      return wrap(form, d, `<div class="counter"><button type="button" data-step="1" aria-label="زيادة ${esc(d.label)}" tabindex="-1">+</button><input type="number" inputmode="numeric" id="${id}" name="${d.name}" min="${d.min}" max="${d.max}" value="${d.value}" ${describedBy(form, d)}${dis}><button type="button" data-step="-1" aria-label="إنقاص ${esc(d.label)}" tabindex="-1">−</button></div>`);
    case 'radio': {
      const seg = d.seg ? ` chips--seg" style="--n:${d.options.length}` : '';
      const inner = `<div class="chips${seg}">${d.options.map(([v, l], i) => `<label class="chip"><input type="radio" name="${d.name}" value="${v}"${d.value === v ? ' checked' : ''}${i === 0 && d.required ? ' required' : ''}${dis}><span>${esc(l)}</span></label>`).join('')}</div>`;
      return wrap(form, d, inner, { asFieldset: true });
    }
    case 'checks': {
      const inner = `<div class="chips">${d.options.map(([v, l]) => `<label class="chip"><input type="checkbox" name="${d.name}" value="${v}"${(d.value || []).includes(v) ? ' checked' : ''}${dis}><span>${esc(l)}</span></label>`).join('')}</div>`;
      return wrap(form, d, inner, { asFieldset: true });
    }
    case 'single-check':
      return `<div class="field${d.full ? ' f-full' : ''}" data-field="${d.name}" data-type="single-check" data-msg-label="${esc(d.msg || d.label)}"${d.showWhen ? ` data-show-when="${d.showWhen}" hidden` : ''}><label class="check-inline"><input type="checkbox" id="${id}" name="${d.name}" value="yes"${dis}> ${esc(d.label)}</label><span class="err" id="${id}-err"></span></div>`;
    case 'budget':
      return wrap(form, d, `<div class="budget"><input class="input" type="number" inputmode="numeric" min="0" step="1" data-step="100" value="0" id="${id}" name="${d.name}"${reqAttr(d)} ${describedBy(form, d)}${dis}><span class="budget__cur" aria-label="دينار كويتي" title="دينار كويتي">د.ك</span><input type="hidden" name="${d.name}_currency" value="KWD"></div>`);
    default:
      throw new Error('Unknown field type ' + d.type);
  }
}

export function row(form, defs, cols = 2) {
  return `<div class="f-grid${cols === 3 ? ' f-grid--3' : ''}">${defs.map((d) => field(form, d)).join('')}</div>`;
}

/* ---------------- form card ---------------- */
export function formCard(ctx, { id, service, serviceLabel, prefix, title, sub, required, optional, cta, disclosure }) {
  const brand = esc(ctx.cfg.brand.nameAr);
  return `
<div class="form-card" id="booking">
  <nav aria-label="اختر الخدمة" class="svc-nav"><ul class="svc-tabs" data-active="${service}">${[['/hotels','hotels','الفنادق','bed'],['/flights','flights','الطيران','plane'],['/flights/honeymoon','honeymoon','شهر العسل','heart'],['/flights/umrah','umrah','العمرة','mosque']].map(([r,k,l,ic]) => `<li><a href="${ctx.link(r)}" data-keep-query${k === service ? ' aria-current="page"' : ''}>${I[ic]}<span>${l}</span></a></li>`).join('')}</ul></nav>
  <div class="form-card__head"><div><h2 id="${id}-title">${esc(title)}</h2><p class="form-card__sub">${esc(sub)}</p></div></div>
  <form class="lead-form" id="${id}" data-service="${service}" data-service-label="${esc(serviceLabel)}" data-lead-prefix="${prefix}" novalidate aria-labelledby="${id}-title">
    <p class="req-legend">الحقول المعلّمة بـ <b aria-hidden="true">*</b><span class="sr-only">نجمة</span> مطلوبة</p>
    <fieldset class="f-stack"><legend class="sr-only">بيانات الطلب الأساسية</legend>${required.join('')}</fieldset>
    ${disclosure ? `<p class="disclosure" style="margin-top:14px">${disclosure}</p>` : ''}
    <details class="more">
      <summary><span>أضف تفضيلاتك <small>(اختياري — يساعدنا نرسل خيارات أدق)</small></span></summary>
      <div class="more__body"><fieldset><legend class="sr-only">تفضيلات اختيارية</legend>${optional.join('')}</fieldset></div>
    </details>
    <div class="form-errors-summary" role="alert" aria-live="assertive"></div>
    <div class="form-actions">
      <button type="submit" class="btn btn--wa btn--block">${I.whatsapp}<span>${esc(cta)}</span></button>
    </div>
    <p class="form-note">${I.lock}<span>بعد الضغط سيُفتح واتساب برسالة جاهزة فيها كل التفاصيل — <strong>راجعها ثم اضغط «إرسال» بنفسك</strong>. لا نطلب أي دفع أو بيانات جواز سفر في هذا النموذج. <a href="${ctx.link('/privacy')}">سياسة الخصوصية</a></span></p>
  </form>

  <div class="success" aria-live="polite">
    <div class="success__badge">${I.tick}</div>
    <h2>طلبك جاهز — باقي خطوة واحدة</h2>
    <p>رقم طلبك: <span class="lead-id" data-lead-id></span></p>
    <ol>
      <li>افتح واتساب من الزر أدناه (إذا لم يُفتح تلقائياً).</li>
      <li>تأكد من الرسالة ثم <strong>اضغط «إرسال»</strong> — لن يصلنا طلبك قبل ذلك.</li>
      <li>يتواصل معك فريق ${brand} في نفس المحادثة${ctx.cfg.contact.workingHoursAr ? ' خلال ساعات العمل: ' + esc(ctx.cfg.contact.workingHoursAr) : ''}.</li>
    </ol>
    <p class="hint" style="margin:0 0 6px">نص الرسالة:</p>
    <pre class="msg-preview" data-msg-preview tabindex="0"></pre>
    <div class="success__actions">
      <a class="btn btn--wa btn--block" data-wa-open href="#" target="_blank" rel="noopener">${I.whatsapp}<span>افتح واتساب وأرسل الطلب</span></a>
      <div class="success__row">
        <button type="button" class="btn btn--ghost" data-copy-msg>${I.copy}<span>نسخ الرسالة</span></button>
        <button type="button" class="btn btn--ghost" data-edit>${I.edit}<span>تعديل الطلب</span></button>
      </div>
      <p class="copy-status" aria-live="polite"></p>
      ${ctx.cfg.contact.whatsappDisplay ? `<p class="hint">رقم واتساب ${brand}: <span dir="ltr">${esc(ctx.cfg.contact.whatsappDisplay)}</span></p>` : (ctx.cfg.showPlaceholders ? `<p class="hint">${ctx.ph('', 'رقم واتساب المعتمد — يظهر هنا كبديل عند تعذّر فتح الرابط')}</p>` : '')}
    </div>
  </div>
</div>`;
}

/* ---------------- layout ---------------- */
const NAV = [
  { route: '/hotels', label: 'الفنادق' },
  { route: '/flights', label: 'تذاكر الطيران', children: [
    { route: '/flights', label: 'تذاكر الطيران', note: 'رحلات ذهاب وعودة ومتعددة الوجهات' },
    { route: '/flights/honeymoon', label: 'شهر العسل', note: 'تخطيط رحلة العرسان' },
    { route: '/flights/umrah', label: 'العمرة', note: 'ترتيبات رحلة العمرة' }
  ] }
];

function brandBlock(ctx) {
  const b = ctx.cfg.brand;
  if (b.logoFile) return `<a class="brand" href="${ctx.link('/')}" aria-label="${esc(b.nameAr)} — الصفحة الرئيسية"><img src="${ctx.asset('img/' + b.logoFile)}" alt="Al-Fanar Travel &amp; Tourism — ${esc(b.nameAr)}" width="345" height="290"></a>`;
  return `<a class="brand" href="${ctx.link('/')}" aria-label="${esc(b.nameAr)} — الصفحة الرئيسية"><span class="brand__mark" style="color:var(--yellow)">${I.lighthouse}</span><span class="brand__text" lang="en"><span class="brand__en1">AL FANAR</span><span class="brand__en2">TRAVEL &amp; TOURISM</span></span><span class="sr-only" lang="ar">${esc(b.nameAr)}</span></a>`;
}

function header(ctx, page) {
  const cur = ctx.route;
  const items = NAV.map((n) => {
    if (!n.children) return `<li class="nav__item"><a class="nav__link" href="${ctx.link(n.route)}"${cur === n.route ? ' aria-current="page"' : ''}>${n.label}</a></li>`;
    const isCur = cur.startsWith('/flights');
    return `<li class="nav__item${isCur ? ' is-current' : ''}"><button class="nav__toggle" type="button" aria-expanded="false" aria-controls="sub-flights">${n.label}${I.chevron}</button><ul class="nav__sub" id="sub-flights">${n.children.map((c) => `<li><a href="${ctx.link(c.route)}"${cur === c.route ? ' aria-current="page"' : ''}>${c.label}<small>${c.note}</small></a></li>`).join('')}</ul></li>`;
  }).join('') + `<li class="nav__item"><a class="nav__link" href="#contact">تواصل معنا</a></li>`;
  const cta = page.cta ? `<a class="btn header-cta" href="#booking" data-cta="header">${I.whatsapp}<span>${esc(page.ctaShort || page.cta)}</span></a>` : `<a class="btn header-cta" href="${ctx.link('/hotels')}" data-cta="header_home">${I.whatsapp}<span>ابدأ طلبك</span></a>`;
  return `
<header class="site-header">
  <div class="container">
    ${brandBlock(ctx)}
    <nav class="nav" id="site-nav" aria-label="القائمة الرئيسية">
      <ul class="nav__list">${items}</ul>
      ${page.cta ? `<a class="btn nav__mobile-cta" href="#booking" data-cta="mobile_menu">${esc(page.ctaShort || page.cta)}</a>` : ''}
    </nav>
    <div style="display:flex;gap:8px;align-items:center">${cta}<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="فتح القائمة"><span></span><span></span><span></span></button></div>
  </div>
</header>`;
}

function footer(ctx) {
  const c = ctx.cfg.contact, L = ctx.cfg.licensing, b = ctx.cfg.brand;
  const waDirect = c.whatsappNumber
    ? `<a href="https://wa.me/${c.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('السلام عليكم، عندي استفسار عن خدمات ' + b.nameAr + '.')}" target="_blank" rel="noopener" data-wa-direct="footer" dir="ltr">${esc(c.whatsappDisplay || c.whatsappNumber)}</a>`
    : ctx.ph('', 'رقم واتساب الأعمال الموثّق');
  return `
<footer class="site-footer" id="contact">
  <div class="container">
    <div class="footer-grid">
      <div>
        ${brandBlock(ctx)}
        <p>نساعدك في طلب خيارات الفنادق وتذاكر الطيران وترتيبات شهر العسل والعمرة عبر محادثة واحدة على واتساب.</p>
      </div>
      <div>
        <h2>الخدمات</h2>
        <ul>
          <li><a href="${ctx.link('/hotels')}">حجز فنادق</a></li>
          <li><a href="${ctx.link('/flights')}">تذاكر الطيران</a></li>
          <li><a href="${ctx.link('/flights/honeymoon')}">شهر العسل</a></li>
          <li><a href="${ctx.link('/flights/umrah')}">العمرة</a></li>
        </ul>
      </div>
      <div>
        <h2>معلومات</h2>
        <ul>
          <li><a href="${ctx.link('/privacy')}">سياسة الخصوصية</a></li>
          <li><a href="${ctx.link('/terms')}">الشروط والأحكام</a></li>
        </ul>
      </div>
      <div>
        <h2>تواصل معنا</h2>
        <ul>
          <li>واتساب: ${waDirect}</li>
          <li>هاتف: ${c.phoneDisplay ? `<a href="tel:${c.phoneDisplay.replace(/[^\d+]/g, '')}" dir="ltr">${esc(c.phoneDisplay)}</a>` : ctx.ph('', 'رقم الهاتف')}</li>
          <li>الموقع: ${c.mapsUrl ? `<a href="${esc(c.mapsUrl)}" target="_blank" rel="noopener" data-cta="footer_map">${c.addressAr ? esc(c.addressAr) + ' — ' : ''}عرض موقعنا على خرائط Google</a>` : ctx.ph(c.addressAr, 'عنوان المكتب في الكويت')}</li>
          <li>ساعات العمل: ${ctx.ph(c.workingHoursAr, 'ساعات العمل')}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(b.legalNameAr || b.nameAr)}. ${L.commercialRegistration ? 'سجل تجاري: ' + esc(L.commercialRegistration) + ' · ' : ctx.cfg.showPlaceholders ? ctx.ph('', 'رقم السجل التجاري') + ' · ' : ''}${L.tourismLicense ? 'رقم الترخيص: ' + esc(L.tourismLicense) : ctx.cfg.showPlaceholders ? ctx.ph('', 'رقم الترخيص السياحي') : ''}</span>
      <span class="footer-note">الصور المعروضة في الموقع لأغراض العرض والإلهام، وتختلف الفنادق والخدمات الفعلية حسب الخيار الذي تؤكده مع فريقنا.</span>
      <button type="button" data-open-consent>إعدادات ملفات تعريف الارتباط</button>
    </div>
  </div>
</footer>`;
}

function consent(ctx) {
  return `
<div class="consent" id="consent" role="dialog" aria-modal="false" aria-labelledby="consent-title" hidden>
  <h2 id="consent-title">نستخدم ملفات تعريف الارتباط</h2>
  <p>نستخدمها لقياس أداء الإعلانات وتحسين الموقع. يمكنك القبول أو الاكتفاء بالضروري فقط، ولن يؤثر ذلك على إرسال طلبك. <a href="${ctx.link('/privacy')}">التفاصيل</a></p>
  <div class="consent__actions">
    <button type="button" class="btn" data-consent="all">قبول الكل</button>
    <button type="button" class="btn btn--ghost" data-consent="necessary">الضروري فقط</button>
  </div>
</div>`;
}

export function layout(ctx, page, body) {
  const cfg = ctx.cfg;
  const canonical = cfg.siteUrl.replace(/\/$/, '') + (page.route === '/' ? '/' : page.route);
  const ld = page.jsonld ? page.jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n') : '';
  const hp = page.heroPreload && fs.existsSync(path.join(ctx.root, 'public/assets/img', page.heroPreload + '-800.avif'));
  const preloadHero = hp ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${ctx.asset('img/' + page.heroPreload + '-800.avif')} 800w, ${ctx.asset('img/' + page.heroPreload + '-1600.avif')} 1600w" imagesizes="(max-width: 1000px) 100vw, 50vw" fetchpriority="high">` : '';
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${esc(canonical)}">
${page.noindex || cfg.showPlaceholders ? '<meta name="robots" content="noindex, nofollow"><!-- pre-launch: remove by setting showPlaceholders=false -->' : '<meta name="robots" content="index, follow">'}
<meta name="theme-color" content="#28387F">
<meta name="color-scheme" content="light">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_KW">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(cfg.brand.nameAr)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap">
${preloadHero}
<link rel="stylesheet" href="${ctx.asset('css/site.css')}">
<script>/* switching service tabs: skip the intro animations so the page swaps calmly */try{if(sessionStorage.getItem('af_nav')==='tab'){document.documentElement.classList.add('no-intro');sessionStorage.removeItem('af_nav')}}catch(e){}</script>
${page.form ? `<script type="speculationrules">${JSON.stringify({ prefetch: [{ source: 'list', urls: ['/hotels', '/flights', '/flights/honeymoon', '/flights/umrah'].filter((r) => r !== page.route).map((r) => ctx.link(r)), eagerness: 'moderate' }] })}</script>` : ''}
<link rel="icon" type="image/png" sizes="32x32" href="${ctx.asset('img/brand/favicon-32.png')}">
<link rel="icon" type="image/png" sizes="48x48" href="${ctx.asset('img/brand/favicon-48.png')}">
<link rel="icon" type="image/png" sizes="192x192" href="${ctx.asset('img/brand/icon-192.png')}">
<link rel="icon" type="image/png" sizes="16x16" href="${ctx.asset('img/brand/favicon-16.png')}">
<link rel="apple-touch-icon" href="${ctx.asset('img/brand/apple-touch-icon.png')}">
<link rel="manifest" href="${ctx.asset('site.webmanifest')}">
${page.heroPreload ? `<meta property="og:image" content="${esc(cfg.siteUrl.replace(/\/$/, '') + '/assets/img/' + page.heroPreload + '-1600.jpg')}">` : `<meta property="og:image" content="${esc(cfg.siteUrl.replace(/\/$/, '') + '/assets/img/brand/icon-512.png')}">`}
<script src="${ctx.asset('js/config.js')}"></script>
<script src="${ctx.asset('js/app.js')}" defer></script>
${page.form ? `<script src="${ctx.asset('js/controls.js')}" defer></script>
<script src="${ctx.asset('js/forms.js')}" defer></script>` : ''}
${ld}
</head>
<body data-service="${page.service || 'home'}">
<a class="skip-link" href="${page.form ? '#booking' : '#main'}">${page.form ? 'انتقل إلى نموذج الطلب' : 'انتقل إلى المحتوى'}</a>
${header(ctx, page)}
<main id="main">
${body}
</main>
${footer(ctx)}
${page.cta ? `<div class="sticky-cta"><a class="btn btn--wa btn--block" href="#booking" data-cta="sticky_mobile">${I.whatsapp}<span>${esc(page.cta)}</span></a></div>` : ''}
${consent(ctx)}
</body>
</html>
`;
}

/* ---------------- reusable sections ---------------- */
/* Desktop-only panel under the headline: fills the space beside the (taller) form with useful content */
function heroExtras(ctx, strip) {
  const c = ctx.cfg.contact;
  const contact = c.mapsUrl ? `
      <div class="hero__contact">
        <span class="hero__contact-icon">${I.lobby}</span>
        <span class="hero__contact-text"><b>تفضّل بزيارتنا في مكتبنا</b><span>${esc(c.addressAr || 'الكويت')}</span>${c.workingHoursAr ? `<span class="hero__hours">${I.clock}${esc(c.workingHoursAr)}</span>` : ''}</span>
        <span class="hero__contact-actions">
          <a class="hero__chip hero__chip--wa" href="${esc(c.mapsUrl)}" target="_blank" rel="noopener" data-cta="hero_map">${I.pin}<span>موقعنا على الخريطة</span></a>
        </span>
      </div>` : '';
  return `
    <div class="hero__extras">
      <ul class="hero__feat">${strip.map(([ic, t]) => `<li>${I[ic]}<span>${t}</span></li>`).join('')}</ul>
      <ol class="hero__steps" aria-label="كيف يعمل الطلب">
        <li><b>١</b><span>املأ التفاصيل</span></li>
        <li><b>٢</b><span>أرسلها عبر واتساب</span></li>
        <li><b>٣</b><span>تصلك الخيارات</span></li>
      </ol>${contact}
    </div>`;
}

export function hero(ctx, { eyebrow, h1, lead, points, assure, mediaOpts, formHtml }) {
  // Layout from the client designs: copy + form on the blue start side, photo on the end side (left in RTL).
  // The supplied photos keep their subject on the right of the frame, so focal points are set per image (pos / posMobile).
  const strip = [...points, ['lock', assure[0]]];
  return `
<section class="hero" aria-labelledby="h1">
  <div class="hero__media">${media(ctx, { ...mediaOpts, ar: null, eager: true, sizes: '(max-width: 1000px) 100vw, 50vw' })}</div>
  <div class="container hero__inner">
    <div class="hero__copy">
      <p class="eyebrow">${eyebrow}</p>
      <h1 id="h1">${h1}</h1>
      <p class="hero__lead">${lead}</p>
      ${heroExtras(ctx, strip)}
    </div>
    ${formHtml}
  </div>
</section>
<section class="hero-strip" aria-label="ما يمكنك تحديده في طلبك">
  <ul class="container hero-strip__list">${strip.map(([ic, t]) => `<li>${I[ic]}<span>${t}</span></li>`).join('')}</ul>
</section>`;
}

export function steps(title, sub, items, { id = 'how' } = {}) {
  return `
<section class="section" id="${id}" aria-labelledby="${id}-h">
  <div class="container">
    <div class="section-head section-head--center"><h2 id="${id}-h" class="title-rule">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>
    <ol class="steps">${items.map(([ic, h, p]) => `<li class="step"><div class="step__icon">${I[ic]}</div><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>
  </div>
</section>`;
}

export function faq(id, title, items, side = '') {
  return `
<section class="section section--sand" id="${id}" aria-labelledby="${id}-h">
  <div class="container">
    <div class="section-head section-head--center"><h2 id="${id}-h" class="title-rule">${title}</h2></div>
    <div class="faq-wrap${side ? ' faq-wrap--side' : ''}">
      <div class="faq">${items.map(([q, a]) => `<details><summary>${q}</summary><div class="faq__a"><p>${a}</p></div></details>`).join('')}</div>
      ${side ? `<div class="faq-side">${side}</div>` : ''}
    </div>
  </div>
</section>`;
}
export function faqJsonLd(items) {
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.filter(([, a]) => !a.includes('class="ph"')).map(([q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) };
}

export function trust(ctx, title, items) {
  const L = ctx.cfg.licensing;
  const facts = [
    ['السجل التجاري', L.commercialRegistration, 'رقم السجل التجاري'],
    ['رقم الترخيص', L.tourismLicense, 'رقم الترخيص'],
    ['اعتماد IATA', L.iataAccreditation, 'رقم IATA إن وُجد'],
  ].filter(([, v]) => v || (ctx.cfg.showPlaceholders && ctx.cfg.showEditorNotes !== false));
  const map = ctx.cfg.contact.mapsUrl ? `<li><b>موقعنا:</b> <a href="${esc(ctx.cfg.contact.mapsUrl)}" target="_blank" rel="noopener" style="color:#fff">عرض على خرائط Google</a></li>` : '';
  return `
<section class="section section--navy" aria-labelledby="trust-h">
  <div class="container">
    <div class="section-head"><h2 id="trust-h">${title}</h2><p>نوضّح لك كل شيء قبل أي التزام — بدون وعود لا نستطيع إثباتها.</p></div>
    <div class="trust">${items.map(([ic, h, p]) => `<div class="trust__item">${I[ic]}<h3>${h}</h3><p>${p}</p></div>`).join('')}${(ctx.cfg.services.designClaims || []).filter((c) => c.approved && (!c.pages || c.pages === 'all' || String(c.pages).split(',').map((x) => x.trim()).includes(ctx.route))).map((c) => `<div class="trust__item">${I[c.icon] || I.star}<h3>${esc(c.textAr)}</h3><p>${esc(c.detailAr)}</p></div>`).join('')}</div>
    ${ctx.cfg.showPlaceholders && ctx.cfg.showEditorNotes !== false && (ctx.cfg.services.designClaims || []).some((c) => !c.approved) ? `<div class="ph-block" style="margin-top:18px">عبارات موجودة في التصاميم ومخفية حتى يعتمدها الفنار بدليل: ${(ctx.cfg.services.designClaims || []).filter((c) => !c.approved).map((c) => '«' + esc(c.textAr) + '»').join('، ')}. فعّلها من <code>site.config.json → services.designClaims</code>.</div>` : ''}
    ${facts.length || map ? `<ul class="biz-facts">${facts.map(([k, v, l]) => `<li><b>${k}:</b> ${ctx.ph(v, l)}</li>`).join('')}${map}</ul>` : ''}
  </div>
</section>`;
}

/* Destination gallery: photo cards that preselect the destination in the page's booking form.
   items: [{ file, name, value, tagline, alt, pos }] — value is written into the form field `field`. */
export function destGallery(ctx, { id, title, sub, field = 'destination', items }) {
  return `
<section class="section dest-section" id="${id}" aria-labelledby="${id}-h">
  <div class="container">
    <div class="section-head section-head--center"><h2 id="${id}-h" class="title-rule">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>
    <ul class="dest-gallery" style="--cols:${items.length}">
      ${items.map((d) => `<li><a class="dest-card" href="#booking" data-fill="${field}=${esc(d.value)}" data-dest="${esc(d.key)}">
        <span class="dest-card__media">
          ${media(ctx, { file: d.file, alt: d.alt, ar: '4/5', pos: d.pos, icon: 'pin', need: d.name, sizes: '(max-width: 700px) 80vw, (max-width: 1100px) 45vw, 400px' })}
          <span class="dest-card__pill">${esc(d.category)}</span>
        </span>
        <span class="dest-card__body">
          <span class="dest-card__head"><span class="dest-card__name">${esc(d.name)}</span><span class="dest-card__meta">${d.meta}</span></span>
          <span class="dest-card__desc">${esc(d.desc)}</span>
          <span class="dest-card__cta"><span class="dest-card__cta-idle">${I.whatsapp}اطلب هذه الوجهة</span><span class="dest-card__cta-on">${I.tick}تمت إضافتها لطلبك</span></span>
        </span>
      </a></li>`).join('')}
    </ul>
  </div>
</section>`;
}

export function finalCta(title, text, cta, bgHtml = '') {
  return `
<section class="section section--tight">
  <div class="container">
    <div class="final-cta${bgHtml ? ' final-cta--photo' : ''}">${bgHtml ? `<div class="final-cta__bg" aria-hidden="true">${bgHtml}</div>` : ''}<div><h2>${title}</h2><p>${text}</p></div><a class="btn" href="#booking" data-cta="final">${I.whatsapp}<span>${cta}</span></a></div>
  </div>
</section>`;
}

export { I };
