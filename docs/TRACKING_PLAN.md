# Measurement & tracking plan

Principle: a click or a prefilled WhatsApp window is **intent**, not a lead. Google Ads should bid on outcomes the business has verified.

## Funnel definitions

| # | Stage | Where it happens | Source of truth | Event / status |
|---|---|---|---|---|
| 1 | Form started | Website | dataLayer | `form_start` |
| 2 | Form completed (valid) | Website | dataLayer + `/api/lead` record | `form_complete`, lead status `whatsapp_prefilled` |
| 3 | WhatsApp opened | Website | dataLayer | `whatsapp_open` (`method`: `auto` / `button` / `direct_link`) |
| 4 | **Verified received lead** | WhatsApp Business inbox | CRM (agent confirms a message containing the lead ID arrived) | `message_received_verified` |
| 5 | **Qualified lead** | CRM | Agent applies qualification rules below | `qualified` |
| 6 | **Confirmed booking** | CRM / accounting | Booking issued and paid | `booking_confirmed` + `booking_value_kwd` |

The lead ID is in the first lines of every WhatsApp message, so the agent (or a WhatsApp Business API integration) can match the conversation to the web record that holds the attribution.

### Suggested qualification rule (for Al Fanar to confirm)
Received message **and** customer replied to the first agent response **and** dates are in the future **and** destination/route is serviceable **and** budget is realistic or customer accepted a quote request. Spam, duplicates (same lead ID), test leads and job seekers are excluded.

## Website events (GTM dataLayer)

All events include `page_service` (`hotels|flights|honeymoon|umrah|home`) and `page_path`. **No form values that identify a person (name, notes, child ages, destination text) are sent to analytics.**

| Event | Extra params | Trigger |
|---|---|---|
| `page_view_service` | `lp_variant` | Page load |
| `cta_click` | `cta_location` (`header`, `sticky_mobile`, `final`, `tips`, `experiences`, `mobile_menu`) | Any CTA scrolling to the form |
| `form_start` | `service` | First focus/input in a form (once per page view) |
| `form_optional_open` | `service` | Optional preferences section opened |
| `form_validation_error` | `service`, `error_fields` (field keys only) | Submit with errors |
| `form_complete` | `service`, `lead_id`, `revision`, `lead_record` (`beacon_queued`/`fetch_sent`/`no_endpoint`/`failed`) | Valid submit |
| `whatsapp_open` | `service`, `lead_id`, `method` | Auto-open succeeded, or Open WhatsApp button clicked, or footer direct link |
| `whatsapp_copy_message` | `service`, `lead_id`, `ok` | Copy fallback used |
| `form_edit` | `service`, `lead_id` | User returns to edit (lead ID is kept; revision increments) |
| `destination_select` | `destination` (card key, e.g. `dubai`, `maldives`), `cta_location` | Destination photo card clicked (flights / honeymoon) — preselects the form |
| `faq_open` | `faq_index` | FAQ item expanded |
| `consent_update` | `consent_analytics`, `consent_ads` | Banner choice |

## GA4 setup
- GA4 Configuration tag in GTM, Consent Mode v2 (defaults denied, set in `app.js`; GTM loads in advanced mode, tags respect consent).
- Mark as GA4 key events: `form_complete` (secondary), and the offline `qualified_lead` / `booking_confirmed` sent via Measurement Protocol from the CRM.
- Custom dimensions: `service`, `lp_variant`, `cta_location`, `method`.
- Do **not** register `lead_id` as an event-scoped dimension in GA4 if your privacy review treats it as an identifier; it is mainly for joining with CRM.

## Google Ads conversions

| Conversion action | Type | Primary for bidding? | Source |
|---|---|---|---|
| Qualified lead – <service> | Offline import (GCLID/GBRAID/WBRAID or Enhanced Conversions for Leads) | **Yes** (once volume allows, ≈30+/month per campaign) | CRM upload with lead ID → click ID join |
| Confirmed booking – <service> | Offline import with value in KWD | Yes, value-based once volume allows | CRM |
| Verified received lead | Offline import | Primary only while qualified volume is too low | CRM |
| Form complete | Website (GTM) | **No** — secondary/observation | dataLayer |
| WhatsApp open | Website (GTM) | **No** — secondary/observation | dataLayer |

Click IDs reach the lead record only when the visitor accepted advertising cookies; leads without a click ID can still be counted in CRM reports but cannot be imported. Have the privacy policy and consent text reviewed before relying on this.

## Attribution kept with each lead
- `first_touch` and `last_touch`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `landing_page`, `referrer` (hostname only), timestamp — session storage.
- `click_ids`: `gclid` / `gbraid` / `wbraid` — only with ad consent; kept up to 90 days in local storage for returning visitors.
- Recommended final URL suffix in Google Ads: `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}` (auto-tagging on).

## Dashboard KPIs (per service, per campaign)
- Form start rate = `form_start` / sessions
- Form completion rate = `form_complete` / `form_start`
- WhatsApp open rate = `whatsapp_open` (unique lead IDs) / `form_complete`
- **Send-through rate** = verified received / `form_complete` (the key UX health metric for the WhatsApp hand-off)
- Qualification rate = qualified / verified received
- Booking rate = confirmed / qualified
- Cost per qualified lead, cost per booking, booking value / cost (ROAS)
- Top validation-error fields (UX fixes)

No conversion-rate or Quality Score improvement is claimed; measure the baseline for 2–4 weeks with these definitions, then test.
