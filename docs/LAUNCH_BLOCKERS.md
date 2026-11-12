# Missing approved information (launch blockers)

Everything below is a visible placeholder today. Fill `site.config.json` (or supply the asset) and rebuild. A production build (`showPlaceholders: false`) refuses to run while required items are empty.

| # | Item | Config key / location | Needed for | Owner |
|---|---|---|---|---|
| 1 | ~~WhatsApp number~~ — **set: +965 2228 6633** (also phone). Confirm it is a WhatsApp **Business** account that receives messages | `contact.whatsappNumber` | — | Al Fanar |
| 2 | ~~Official logo~~ — **received** (PNG) and used in header, footer and favicons. Optional: SVG for extra sharpness | `brand.logoFile` | — | Al Fanar |
| 3 | Legal company name | `brand.legalNameAr` | Footer, privacy policy | Al Fanar |
| 4 | ~~Commercial registration~~ — **397884** (MOCI extract, Nov 2024) | — | — | — |
| 5 | ~~Licence no.~~ — **2019/8205** (04/03/2019); legal name, address (Khaitan) and hours (9 am–10 pm, company profile) filled | — | — | — |
| 6 | IATA accreditation (only if it exists) | `licensing.iataAccreditation` | Trust section (hidden if empty after launch) | Al Fanar |
| 7 | Working hours (phone + map location set; no email by client decision). Optional written address. Directory candidates to confirm: «شارع حبيب المناور، بجانب إكسايت الغانم» · 9:00–17:00 · CR 397884 | `contact.*`, `licensing.*` | Footer, FAQ «متى يردّ الفريق», trust section | Al Fanar |
| 8 | Payment methods | `src/pages.mjs → paymentFaq` | FAQ on all four pages | Al Fanar |
| 9 | Production domain | `siteUrl` | Canonical tags, sitemap, OG | Al Fanar / dev |
| 10 | ~~Photos~~ — **6 client-supplied concept images in use** (labelled «صورة توضيحية»). Optional extra photos listed in `docs/IMAGE_MAP.md` | — | — | Al Fanar / design |
| 11 | GTM container ID (GA4 + Ads tags inside) | `integrations.gtmContainerId` | All measurement | Media buying |
| 12 | Lead webhook (CRM, Google Sheet via Apps Script, etc.) + secret + allowed origins | Vercel env vars for `api/lead.js` | Recording leads with attribution | Dev / Al Fanar |
| 13 | Privacy policy & terms reviewed by counsel (Kuwait data-protection rules) | `/privacy`, `/terms`, then `integrations.privacyPolicyApproved: true` | Consent, Ads policy compliance | Al Fanar legal |
| 14 | Confirm whether honeymoon **packages** are offered | `services.honeymoonPackagesConfirmed` | Copy currently says package availability is confirmed case by case | Al Fanar |
| 15 | Confirm whether Umrah **packages** / **visa** help are offered | `services.umrahPackagesConfirmed`, `services.umrahVisaServiceConfirmed` | Visa option is hidden and a disclaimer shown until confirmed | Al Fanar |
| 16 | Genuine hotel offers (if any) | `services.hotelOffers` | «عروض فنادق» section and the keywords عروض فنادق / عروض على الفنادق only appear with real, dated offers | Al Fanar |
| 17 | ~~Brand colours~~ — applied from the ad identity: #28387F blue, #FFD12B yellow, white; Cairo 800/700/400–500, Poppins | `site.css :root` | — | — |
| 19 | ~~Design marketing claims~~ — **approved by client 12 Nov 2026** and live | `services.designClaims` | — | — |
| 18 | Lead qualification rules & CRM statuses | `docs/TRACKING_PLAN.md` | Offline conversion imports | Al Fanar sales + media buying |

Not included by design: testimonials, ratings, prices, discounts, partnerships, "best price" or response-time promises — add only with evidence.
