# Image & brand asset map

Source photos were supplied by the client (Drive folder `1kZemFnz…`, approved for use on 12 Nov 2026). They are **AI-generated visual concepts**, not photographs of bookable properties, so every photo on the site carries a small «صورة توضيحية» (illustrative image) badge and generic alt text. The four full-page designs (`docs/design-references/`) were used as layout references only; no screenshot is embedded in the site.

Pipeline: originals in `images-src/<page>/<slot>.png` → `node tools/images.mjs` → `public/assets/img/<slot>{-800,-1600}.{avif,webp,jpg}` + `<slot>.jpg`. Each `<picture>` serves AVIF → WebP → JPEG with `sizes`, explicit width/height, `fetchpriority=high` + preload for the hero and `loading=lazy` elsewhere. Focal points are set per placement with `object-position` (desktop `pos`, mobile `posMobile`), because all photos keep the subject on the right of the frame and an empty wall on the left.

| Source file (client) | Slot | Placements (page → section) | Focal point | Alt text |
|---|---|---|---|---|
| `01_Hotels_Hero_Dubai_Suite.png` | `hotels/hero-room` | /hotels hero (end-side panel, mobile banner) · Home «الفنادق» card | 80% 55% | جناح فندقي بسرير مزدوج وإطلالة على أفق المدينة |
| 〃 | 〃 | /hotels card «نوع الغرف وعددها» | 92% 70% (bed) | سرير مزدوج بمفرش أزرق في غرفة فندقية |
| 〃 | 〃 | /hotels «نصائح قبل طلب حجز الفندق» | 64% 45% (window) | نافذة غرفة فندقية مطلة على البحر وأفق المدينة |
| `02_Hotels_Lobby.png` | `hotels/lobby` | /hotels card «الموقع والمرافق» | 72% 55% | ردهة استقبال فندق بإضاءة دافئة وزخارف عربية |
| 〃 | 〃 | /hotels FAQ side photo (desktop only) | 82% 60% | ركن جلوس في ردهة فندق |
| `03_Hotels_Breakfast.png` | `hotels/breakfast` | /hotels card «الإفطار والوجبات» | 55% 70% | طاولة إفطار في مطعم فندق مع بوفيه وإطلالة على المدينة |
| `04_Flights_Hero_Airport_Lounge.png` | `flights/hero-airport` | /flights hero · Home «تذاكر الطيران» card | 74% 50% | مسافر ينتظر في صالة المطار وطائرة على المدرج خلف الزجاج |
| `Golden_Departure_Through_the_Terminal.png` | `flights/traveler-thobe-terminal` | /flights «تسافر كثيراً؟» collage (1) | 50% 45% | مسافر بالثوب والشماغ يجر حقيبته في صالة المطار عند الغروب |
| `ChatGPT_Image_Nov_12_2026_03_19_58_PM.png` (Al Fanar ad creative «وين ودك تسافر؟») | `flights/ad-where-to-travel` | /flights «تسافر كثيراً؟» collage (2) — whole tile links to the booking form | full frame (3:4) | إعلان الفنار للسياحة والسفر: وين ودك تسافر؟ … |
| `Golden-Hour_Airport_Departure.png` | `flights/terminal-concourse-golden` | /flights FAQ side photo | 22% 50% | مسافرون في صالة مطار واسعة عند الغروب والطائرة على المدرج |
| `Sunlit_Airport_Terminal_Journey.png` | `flights/terminal-lounge-sunlit` | /flights final CTA background (under a blue overlay) | 40% 45% | decorative (empty alt) |
| `05_Honeymoon_Hero_Resort.png` | `honeymoon/hero-resort` | /flights/honeymoon hero · Home card | 52% 55% | طاولة عشاء لشخصين على شرفة منتجع مطلة على البحر عند الغروب |
| 〃 | 〃 | «اختاروا طابع رحلتكم» | 80% 50% | جلسة خاصة بجانب مسبح منتجع على البحر |
| 〃 | 〃 | FAQ side photo | 25% 50% | غروب الشمس على البحر من شرفة منتجع |
| `06_Umrah_Hero_Makkah_Suite.png` | `umrah/hero-makkah` | /flights/umrah hero · Home card | 63% 50% | غرفة فندقية بإطلالة على المسجد الحرام والكعبة المشرفة |
| 〃 | 〃 | «تفاصيل نراعيها في طلبك» | 62% 55% | إطلالة على الكعبة المشرفة والمسجد الحرام من نافذة غرفة فندقية |
| 〃 | 〃 | FAQ side photo | 72% 30% | برج الساعة في مكة المكرمة عند الغروب |

## Destination photos (client-supplied, 12 Nov 2026 — AI-generated illustrations)

Section component: `destGallery()` in `src/ui.mjs`. Cards are 4:5 portrait crops, lazy-loaded, `sizes="(max-width:700px) 78vw, (max-width:1100px) 45vw, 400px"` (browsers pick the 800w AVIF/WebP; the 1600w file only on high-density screens). Each card has the «صورة توضيحية» badge and the section ends with a note that the photos don't represent bookable properties.

| Client filename | Asset (`public/assets/img/destinations/…`) | Page → section → card | Focal point | Value written to the form | Alt text |
|---|---|---|---|---|---|
| `dubai_sunset_waterfront_dining.png` | `dubai-sunset-waterfront-dining` | /flights → «وجهات تستاهل تكون رحلتك الجاية» → دبي | 62% 50% (Burj Khalifa + water) | `destination = دبي (DXB)` | أفق دبي وبرج خليفة عند الغروب من مطعم على الواجهة البحرية |
| `istanbul_sunset_rooftop_with_blue_mosque.png` | `istanbul-sunset-rooftop-blue-mosque` | /flights → … → إسطنبول | 70% 45% (Blue Mosque) | `destination = إسطنبول (IST)` | الجامع الأزرق ومضيق البوسفور عند الغروب من شرفة في إسطنبول |
| `golden_hour_paris_balcony_panorama.png` | `paris-golden-hour-balcony-panorama` | /flights → … → باريس · /flights/honeymoon → … → باريس | 72% 45% (Eiffel Tower) | `باريس (CDG)` on flights · `باريس` on honeymoon | برج إيفل ونهر السين عند الغروب من شرفة في باريس |
| `maldives_overwater_villas_at_sunset.png` | `maldives-overwater-villas-sunset` | /flights/honeymoon → «وجهات شهر عسل تستاهل تعيشون تفاصيلها» → المالديف | 62% 50% (villas + lagoon) | `destination = المالديف` | فلل فوق الماء ومياه فيروزية صافية في المالديف |
| `santorini_sunset_terrace_with_bougainvillea.png` | `santorini-sunset-terrace-bougainvillea` | /flights/honeymoon → … → سانتوريني | 66% 50% (blue domes) | `destination = سانتوريني – اليونان` | قباب سانتوريني الزرقاء وغروب الشمس فوق البحر من شرفة مزهرة |
| `bali_sunset_infinity_pool_retreat.png` | `bali-sunset-infinity-pool-retreat` | /flights/honeymoon → … → بالي | 60% 50% (temple gates + volcano) | `destination = بالي` | مسبح مطل على مدرجات الأرز والبركان عند الغروب في بالي |

Note: the Santorini source had a faint generator watermark in the top-right corner; the top 60 px / right 30 px were trimmed before optimisation (`images-src/destinations/` holds the trimmed master).

## Brand assets (client logo `Al-Fanar.png`, 345×290 PNG, transparent)
| File | Use |
|---|---|
| `brand/logo-white.png` | Header and footer (on #28387F) — same artwork recoloured white |
| `brand/logo-blue.png` | Original, for light backgrounds |
| `brand/mark-blue.png` | Lighthouse mark only (source for icons) |
| `brand/favicon.ico` (16/32/48), `favicon-16.png`, `favicon-32.png` | Browser tab |
| `brand/apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` | iOS home screen, web manifest, default og:image |

## Gaps / notes
- Only one photo per theme was supplied, so supporting sections reuse crops of the same image. Ideal additions: a second room type, an aircraft cabin, a Madinah photo.
- The Umrah image shows a room overlooking the Haram; that visually suggests «hotels near the Haram». Keep the illustrative badge, and only add the claim in copy once Al Fanar confirms it (see `services.designClaims`).
- The airport image shows a fictional airline livery; replace if any real carrier objects to look-alike branding.
- A vector (SVG) or ≥1000px logo would render sharper on large retina screens; the 345px PNG is adequate at the current 62px header height.
