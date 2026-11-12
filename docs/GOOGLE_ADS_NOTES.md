# Google Ads landing-page relevance notes

Client diagnostic (screenshot, not a forecast): `حجز فندق` QS 3/10 (landing page experience below average, expected CTR below average, ad relevance above average; 6,215 impr., 3.04% CTR, $446.08); `حجوزات الفنادق` 5/10 (LPE average); `حجز فنادق` 2/10 (LPE below average).

What the `/hotels` page now does about landing-page experience — without promising a score change:
- Dedicated hotel page as the final URL (previously a general page): hotel-room hero, hotel-only form, hotel FAQs.
- Exact search intent in the primary elements: title «حجز فنادق | خيارات إقامة تناسبك – الفنار للسياحة», H1 «حجز فنادق يناسب وجهتك وميزانيتك», intro «تدور على حجز فندق…», section «كيف نساعدك في حجوزات الفنادق؟», FAQ «كيف أطلب حجز فندق…». Each phrase appears where it is useful — no stuffing.
- «عروض فنادق» / «عروض على الفنادق» are used **only** when real offers are configured.
- Form is visible in the first screen on desktop and right after the headline on mobile; no interstitial; sticky CTA on mobile.
- Transparent about how it works (request → options → you confirm), no hidden payment, privacy link next to the form.
- Lightweight static pages; images need AVIF/WebP + proper sizing once supplied.

## Keyword → page → message match

| Ad group | Keywords (phrase/exact) | Final URL | RSA headline ideas (≤30 chars; verify before use) |
|---|---|---|---|
| Hotel booking | حجز فندق، حجز فنادق، حجوزات الفنادق | `/hotels` | حجز فنادق يناسب ميزانيتك · اطلب خيارات الفنادق بواتساب · حدّد المدينة والتواريخ · الفنار للسياحة – حجز فندق |
| Hotel offers | عروض فنادق، عروض على الفنادق | `/hotels` **only if** offers exist; otherwise pause | Use the actual offer name/dates only |
| Flights | تذاكر طيران، حجز طيران | `/flights` | تذاكر طيران لوجهتك القادمة · اطلب خيارات الطيران بواتساب |
| Honeymoon | شهر العسل، رحلات شهر العسل | `/flights/honeymoon` | رحلة شهر العسل تبدأ هنا · خطّطوا لرحلتكم بواتساب |
| Umrah | عمرة من الكويت، رحلات عمرة | `/flights/umrah` | ترتيبات عمرة تناسب احتياجك · استفسر عن خيارات العمرة |

Avoid in ads anything the page does not support (prices, "best", discounts, guaranteed availability). Recommended A/B test once tracking is live: current single-screen form vs. a 2-step variant (step 1 destination + dates, step 2 guests/budget) using `lp_variant` — judge on qualified leads, not form completions.
