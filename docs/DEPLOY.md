# Deploying the Al Fanar landing pages

Hosting: **Vercel** (free tier is enough). The site is static HTML plus one small serverless function (`api/lead.js`) that saves each request to a Google Sheet. Total setup ≈ 30–45 minutes.

## 1 · Put the project on GitHub (private)
1. github.com → **New repository** → name `alfanar-travel` → **Private** → *don't* add a README → Create.
2. Upload the project: either drag the unzipped folder into the repo page («uploading an existing file»), or from a terminal:
   ```bash
   cd alfanar-travel
   git init && git add . && git commit -m "Al Fanar landing pages"
   git branch -M main
   git remote add origin https://github.com/<your-account>/alfanar-travel.git
   git push -u origin main
   git checkout -b staging && git push -u origin staging     # your private drafts branch
   ```

## 2 · Lead inbox (Google Sheet)
Follow the 5 steps at the top of `integrations/google-sheet-webhook.gs` (create the Sheet → Apps Script → paste → set `LEAD_TOKEN` → deploy as Web app). Keep the Web app URL and the token.

## 3 · Create the Vercel project
1. vercel.com → sign in with GitHub → **Add New… → Project** → import `alfanar-travel`.
2. Framework preset: **Other**. Build/output settings are read from `vercel.json` (build: `npm run images && node build.mjs`, output: `dist`). Leave them.
3. **Environment Variables** (Production *and* Preview):
   | Name | Value |
   |---|---|
   | `LEAD_WEBHOOK_URL` | the Apps Script Web app URL |
   | `LEAD_WEBHOOK_SECRET` | the same long random token you saved as `LEAD_TOKEN` |
   | `ALLOWED_ORIGINS` | `https://www.your-domain.com,https://your-domain.com` (add the `*.vercel.app` URL while testing) |
4. **Deploy.** The first build shows the site at `https://alfanar-travel.vercel.app` (still in pre-launch mode: yellow banner, hidden from Google).

## 4 · Keep drafts away from customers
- Vercel → Project → **Settings → Deployment Protection → Vercel Authentication: On (Standard Protection)**. Preview deployments (every branch except `main`) then require your Vercel login; customers can never open them.
- Work on the `staging` branch → Vercel builds a private preview URL for every save → check it → merge `staging` into `main` (GitHub → Pull request → Merge) → the live site updates in ~1 minute.
- Every deploy is kept; Vercel → Deployments → **Instant Rollback** undoes a bad change in one click.

## 5 · Connect the domain
Vercel → Project → **Settings → Domains → Add** `www.your-domain.com` (and the bare domain). Add the DNS records Vercel shows (A `76.76.21.21` for the bare domain, CNAME `cname.vercel-dns.com` for `www`) at your domain registrar. HTTPS is automatic.

## 6 · Go live
Edit `site.config.json` (or use the admin panel — see `ADMIN_GUIDE.md`):
- `siteUrl` → `https://www.your-domain.com`
- `integrations.gtmContainerId` → `GTM-XXXXXXX`
- `integrations.privacyPolicyApproved` → `true` once counsel signs off
- `showPlaceholders` → `false` (the build refuses to publish while anything required is missing)

Commit to `main`. Then run `docs/QA_CHECKLIST.md` on the live URL, send one real test request to the WhatsApp number, confirm the row appears in the Sheet, and only then switch the Google Ads final URLs to `/hotels`, `/flights`, `/flights/honeymoon`, `/flights/umrah`.

## Other hosts
Any static host (Netlify, Cloudflare Pages, cPanel) can serve `dist/` after `npm install && npm run images && node build.mjs`. Only the lead-saving function needs a serverless runtime; on other hosts point `integrations.leadEndpoint` at the Apps Script URL through a small proxy, or keep Vercel just for `/api/lead`.
