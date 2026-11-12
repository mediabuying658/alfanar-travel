# Changelog

## 12 Nov 2026 — Feedback round 6
- Branded calendar date picker (Arabic months/days, past dates disabled, stay/trip range with night count, auto-opens the end date, keyboard support, bottom sheet on phones) and branded budget stepper; browser spin arrows hidden.
- Currency is a fixed «د.ك» label (not editable); copy says «بالدينار الكويتي».
- Pre-launch strip and all yellow editor notes removed (`showEditorNotes: false`). The «عروض فنادق» section is now always shown with three template cards to edit in `site.config.json → services.hotelOffers` (or the admin panel) — replace them before running ads.
- Transparent PNG favicon; wider desktop layout; blue backdrop so pulling the page down never shows white.
- Fixed a regression that stopped custom dropdowns from opening.

## 12 Nov 2026 — Feedback round 5 + handover
- Business details from the client's Drive (MOCI commercial-registration extract, company profile): legal name «شركة الفنار ترافل للسياحة والسفر ذ.م.م», CR 397884, licence 2019/8205, address (خيطان – الفروانية، قطعة 7، شارع 70، قيصرية الرجعان، محل 10), hours 9:00 am–10:00 pm, IATA member since 2015.
- Header is now fixed (always visible); the mobile menu opens directly beneath it and the page behind is locked while it is open; choosing a menu link closes it.
- Handover: `.pages.yml` admin panel (Pages CMS), `integrations/google-sheet-webhook.gs` lead inbox, `docs/DEPLOY.md`, `docs/ADMIN_GUIDE.md`, `.gitignore`; image tool uses a content-hash manifest so deploys only re-process changed photos; Vercel build runs the image step.

## 12 Nov 2026 — Feedback round 4
- Tab switch: the banner label («حجوزات الفنادق — …»), intro text and desktop side panel now fade in instead of popping (own view-transition + soft fade fallback).
- Design claims **approved by the client** and published in the trust section: خبرة في تنظيم الرحلات · متابعة شخصية لرحلتك · دعم على مدار الساعة · أسعار تنافسية حسب التواريخ والوجهات (all pages) · فنادق قريبة من الحرم (Umrah page only). Umrah trust grid shows 3×3.
- Location: Google Maps link (29.2768043, 47.9625277) in the footer, the trust facts row and the desktop contact card («موقعنا»).
- Email removed everywhere (Al Fanar has no email).
- Flights collage: the walking-traveller photo was replaced by Al Fanar's «وين ودك تسافر؟» ad creative (clickable → form); the smiling-traveller photo was replaced by the traveller in thobe and shemagh.

## 12 Nov 2026 — Feedback round 3
- **Sticky mobile button** no longer covers the end of the page: the page gets bottom space equal to the bar on screens ≤900 px.
- **Flights photos**: the lounge hero is no longer reused; four new client airport photos fill the collage, FAQ side photo and a new photo background for the final CTA (`finalCta()` accepts an optional background).
- **Desktop hero**: the empty blue space beside the form now holds a 2×2 feature grid, a 3-step strip (املأ → أرسل عبر واتساب → تصلك الخيارات) and a direct-contact card (WhatsApp +965 2228 6633 · اتصل بنا). Mobile keeps the feature strip under the banner.
- **Tab switching** (Hotels / Flights / Honeymoon / Umrah): cross-document View Transitions — the header stays put, the banner, headline and booking card morph instead of flashing; the next page skips its intro animations; sibling pages are prefetched (Speculation Rules) so the switch is near-instant. Browsers without View Transitions fall back to a normal load. New event `service_tab_switch`.
- Image tool now skips already-processed photos (`--force` to rebuild all).

## 12 Nov 2026 — Feedback round: cards, dropdowns, banner, motion, contact
- **Destination cards** (`destGallery()` in `src/ui.mjs`): rebuilt in the reference style — photo with a category pill (مدن / مدن وتاريخ / شواطئ / جزر / طبيعة), white body with the name, a meta line (airport code + country on flights, country/region on honeymoon), a short description and an «اطلب هذه الوجهة» action that turns into «تمت إضافتها لطلبك». The «صورة توضيحية» badges were removed from all photos; one general line about imagery now sits in the footer.
- **Branded dropdowns** (new `public/assets/js/controls.js`): every `<select>` becomes an animated listbox in the site style (keyboard, type-ahead, screen-reader roles); the native select stays hidden and in sync. City/airport fields use a branded autocomplete instead of the browser datalist (Arabic-normalised search — «اسطنبول» finds «إسطنبول» — with IATA code chips).
- **Origin is open**: no more default «الكويت»; origin is required and suggestions cover Gulf, Levant, Egypt, Iraq, Europe and Asia airports. Meta descriptions no longer say «from Kuwait».
- **Multi-currency budgets**: currency dropdown next to every budget (د.ك default, ر.س، د.إ، ر.ق، د.ب، ر.ع، ج.م، USD، EUR); the WhatsApp message shows the chosen currency.
- **Banner layout**: desktop now uses the mobile pattern — full-width photo banner, headline and form overlapping its lower edge.
- **Motion**: animated submenu (hover + click), mobile menu slide and burger→X, smooth `<details>` open/close (FAQ + preferences), animated show/hide of conditional fields, dropdown pop-in, success/edit transitions, error fade + shake, counter bump, consent slide in/out, hero load-in, scroll reveal. All disabled under `prefers-reduced-motion`.
- **Contact**: WhatsApp and phone +965 2228 6633 (from client). The official OTA (alfanartravel.com.kw) lists only this phone and a "24/7 SUPPORT" statement; address, hours and CR found in a third-party directory are stored as candidates in `site.config.json → contact._candidates_from_public_directory`, not published.

## 12 Nov 2026 — Destination photography
Changed components
- `src/ui.mjs` → **new `destGallery()`**: photo destination cards (image, Arabic name, tagline, dark-blue legibility gradient, «اختر هذه الوجهة» pill, hover zoom/lift, selected state «تمت إضافتها لطلبك», illustrative badge + disclaimer note).
- `src/pages.mjs` → `/flights`: new section «وجهات تستاهل تكون رحلتك الجاية» (Dubai, Istanbul, Paris) after «كيف تطلب تذاكر الطيران؟». `/flights/honeymoon`: the blue text-only destination cards were replaced by «وجهات شهر عسل تستاهل تعيشون تفاصيلها» (Maldives, Santorini, Bali, Paris). Paris added to the honeymoon destination suggestions list.
- `public/assets/js/app.js` → `initQuickFill()`: card click prevents the jump, reopens the form if a request was already prepared, unticks «لم نحدد الوجهة بعد», writes the destination into the form field, marks the chosen card, scrolls smoothly to the form and focuses the next empty required field; typing a different destination clears the card state. New dataLayer event **`destination_select`** (`destination` key such as `dubai`, `cta_location: destination_card`).
- `public/assets/css/site.css` → `.dest-gallery` / `.dest-card*` styles: 3–4 columns desktop, 2 columns tablet, swipe carousel with scroll-snap on phones; reduced-motion safe; balanced section titles on mobile.
- Assets → 6 destination photos in AVIF/WebP/JPEG at 800w and 1600w (`public/assets/img/destinations/`).
Unchanged: booking forms and validation, WhatsApp message builder and number, lead recording, existing tracking events, Hotels and Umrah heroes.

Verification (headless Chrome, desktop 1366 px + mobile 390 px): 76 checks — every card shows its own image, clicking preselects the right value, the chosen card is highlighted, the page scrolls to the form, the destination appears in the WhatsApp message and link, `destination_select` fires once per click, no JS errors. Existing form suite 0 failures; axe WCAG 2 A/AA 0 violations.

## 12 Nov 2026 — Brand identity, client photos, logo
Blue #28387F / yellow #FFD12B identity, official logo + favicons, six hotel/flight/honeymoon/umrah photos, layouts aligned with the four page designs, design marketing claims gated behind approval.

## 12 Nov 2026 — Initial build
Four Arabic RTL booking pages with category forms, WhatsApp hand-off, lead API, consent-aware attribution and tracking plan.
