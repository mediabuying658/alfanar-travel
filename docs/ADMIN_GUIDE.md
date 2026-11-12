# Editing the site yourself (customers never see drafts)

There are three levels. All of them save to the private GitHub repo; nothing changes for customers until a change reaches the `main` branch.

## A · Admin panel — business details, claims, offers, photos (no code)
1. Go to **https://app.pagescms.org** → *Sign in with GitHub* → choose the `alfanar-travel` repo.
2. Top-left branch selector → **staging**.
3. **إعدادات الموقع وبيانات الشركة** — a form for: WhatsApp & phone numbers, address, hours, map link, registration & licence numbers, GTM ID, pre-launch mode, service toggles (honeymoon packages / Umrah packages / visa), trust claims (add, edit, hide), hotel offers (only real, dated offers).
4. **Media** — replace a photo by uploading a file with the **same name** in the same folder of `images-src/` (e.g. `images-src/hotels/hero-room.png`). The deploy re-optimises it automatically (AVIF/WebP, 800 & 1600 px).
5. Save → open the private preview from Vercel (Deployments tab, or the link GitHub shows on the commit) → when happy, merge `staging` → `main`.

## B · Any text on the pages (headlines, descriptions, FAQs, destination cards, form labels)
All page wording lives in **`src/pages.mjs`** (one block per page: Hotels, Flights, Honeymoon, Umrah, Home, Privacy, Terms). In GitHub, open the file on the `staging` branch → ✏️ edit → change the Arabic text between the quotes → **Commit changes**. Or press `.` on the repo page to open the full web editor (VS Code in the browser).
- Colours, spacing, fonts: `public/assets/css/site.css` (brand colours are at the top: `--blue`, `--yellow`).
- Shared parts (header, footer, form card, destination card): `src/ui.mjs`.
- Don't edit `dist/` — it is regenerated on every deploy.

## C · On your computer
```bash
npm install            # once
npm run images         # after adding/replacing photos in images-src/
node build.mjs         # builds dist/ and lists anything still missing
npx serve dist         # preview at http://localhost:3000
```

## Where the leads are
The Google Sheet from `integrations/google-sheet-webhook.gs`: one row per request (lead ID, service, details, campaign source, click IDs when consented). Your team fills the last columns — *received on WhatsApp / qualified / booking confirmed / value* — which feed Google Ads offline conversions (see `TRACKING_PLAN.md`).
