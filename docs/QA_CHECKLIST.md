# Pre-launch QA checklist

Run on the production URL, on a real iPhone (Safari) and Android (Chrome), plus desktop Chrome/Safari/Edge. ✅ = verified in this build’s automated run (headless Chrome, 12 Nov 2026, after the rebrand); everything else needs a manual pass on production.

## Business facts & content
- [ ] No yellow placeholders and no pre-launch banner (`showPlaceholders: false`, build passes)
- [ ] WhatsApp number in config is the verified business number; test message arrives in Al Fanar's inbox
- ✅ Official logo in header/footer; favicon set (ico/png/apple-touch/manifest) generated from the lighthouse mark
- [ ] Legal name, CR and licence numbers correct
- [ ] Design marketing claims either approved with evidence or left hidden
- ✅ Brand tokens: #28387F (nav, backgrounds, selected tabs, footer), #FFD12B (CTAs, active indicators, headline emphasis); no other brand colours
- ✅ All photos carry «صورة توضيحية» and descriptive Arabic alt text; full-page design screenshots are not used on the site
- [ ] No testimonials, ratings, prices, discounts or claims that cannot be evidenced
- [ ] «عروض فنادق» section shows only real, dated offers (or is absent)
- [ ] Honeymoon/Umrah package and visa wording matches what Al Fanar actually offers
- [ ] Privacy policy & terms approved by counsel; links work from forms and consent banner

## Forms (each of the 4 pages)
- ✅ Empty submit shows Arabic errors on every required field, summary message, focus moves to first invalid field
- ✅ Hotels: checkout ≤ check-in rejected; nights calculated; child-ages field appears only when children > 0
- ✅ Flights: one-way hides return date; multi-city reveals and requires the route field; infants > adults rejected
- ✅ Honeymoon: «لم نحدد الوجهة» hides destination and removes its requirement; budget «مرنة» works
- ✅ Umrah: «مكة فقط» hides Madinah nights; at least one service required; visa option absent until confirmed
- ✅ Past dates rejected (min = today)
- [ ] Native date pickers open correctly on iOS/Android
- [ ] Counters usable by touch and keyboard
- ✅ Re-submitting after «تعديل الطلب» keeps the same lead ID (revision increments)

## Destination cards (flights, honeymoon)
- ✅ Each card shows its own photo (Dubai, Istanbul, Paris / Maldives, Santorini, Bali, Paris)
- ✅ Click → destination preselected, card highlighted, smooth scroll to form, destination in WhatsApp message; `destination_select` fires
- ✅ Desktop grid, tablet 2 columns, phone swipe carousel
- [ ] Swipe feels natural on a real iPhone/Android; cards don't trigger accidental clicks while swiping

## Branded controls & motion
- ✅ Custom dropdowns: mouse + keyboard (Enter/Space/arrows/Home/End/Esc/type-ahead), native select synced, focus returns to the button
- ✅ City autocomplete: Arabic-normalised filtering, arrows + Enter, click/tap, IATA chips
- ✅ Currency choice reaches the WhatsApp message
- ✅ Submenu opens on hover/click; mobile menu animates; `<details>` open/close smoothly; conditional fields animate
- [ ] Check dropdowns with VoiceOver (iOS) and TalkBack (Android)
- [ ] Check motion feels smooth on a mid-range Android phone

## WhatsApp hand-off
- ✅ Lead ID format `AF-<H|F|HM|U>-YYMMDD-XXXXX`
- ✅ Message contains service, lead ID, all filled fields in order, dates with weekday, KWD budget; hidden/empty fields omitted
- ✅ `wa.me` link text decodes exactly to the previewed message
- [ ] On iPhone & Android: WhatsApp app opens with message prefilled (auto-open and button)
- [ ] On desktop: WhatsApp Web/desktop opens; popup-blocked case falls back to the button
- [ ] «نسخ الرسالة» works; fallback selects text if clipboard is blocked
- [ ] Message sent from a test phone arrives with lead ID; agent can find the web record by lead ID

## Lead recording & attribution
- ✅ `/api/lead` accepts valid leads (204), rejects malformed (422) and foreign origins (403); HMAC signature sent to webhook
- [ ] Production env vars set; a test lead lands in CRM/Sheet with UTMs
- ✅ UTMs captured first/last touch; GCLID attached only after «قبول الكل»; withheld with «الضروري فقط»
- [ ] GCLID survives navigation between pages in the same session
- [ ] No personal data in GA4/Ads events (check GTM preview: no names, notes, destinations)

## Tracking
- [ ] GTM preview shows: `form_start`, `form_validation_error`, `form_complete`, `whatsapp_open`, `whatsapp_copy_message`, `cta_click`, `faq_open`, `consent_update`
- [ ] Consent Mode default = denied; updates on choice; choice remembered; re-openable from footer
- [ ] `form_complete`/`whatsapp_open` set as **secondary** conversions in Google Ads
- [ ] Offline import of qualified leads / bookings tested with one real GCLID

## RTL, layout, mobile
- ✅ `lang="ar" dir="rtl"`; logical CSS properties; nav order الفنادق → تذاكر الطيران (شهر العسل، العمرة)
- ✅ Mobile: headline → form → supporting points; form begins in the first screen after the headline
- [ ] Sticky mobile CTA appears when the form is off-screen and hides when visible; doesn't cover consent buttons
- [ ] No horizontal scroll at 320px; header menu opens/closes, Escape closes
- [ ] Latin text (brand EN, airport codes) renders in Poppins; Arabic in Cairo

## Accessibility
- ✅ axe-core WCAG 2 A/AA: 0 violations on all pages
- [ ] Keyboard-only: skip link → form; all controls reachable; focus visible
- [ ] VoiceOver/TalkBack read labels, required state and errors
- [ ] `prefers-reduced-motion` respected

## Performance & SEO
- [ ] Lighthouse mobile on production: LCP < 2.5 s, CLS < 0.1, INP < 200 ms (with real images)
- ✅ Hero image is AVIF/WebP with preload + `fetchpriority=high`; others lazy; focal points hold on desktop and mobile crops
- [ ] Unique `<title>`, meta description, canonical per page; `/hotels` title = «حجز فنادق | خيارات إقامة تناسبك – الفنار للسياحة», H1 = «حجز فنادق يناسب وجهتك وميزانيتك»
- [ ] `robots.txt` allows crawling and lists sitemap; pages not `noindex` after launch
- [ ] Ads final URLs point to the service page (not `/`), with tracking template/UTM suffix
- [ ] 404 page works; `/hotels/` and `/hotels` resolve to one canonical URL
