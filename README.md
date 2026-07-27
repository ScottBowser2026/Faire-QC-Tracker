# PRFQC — Multi-Facility Quality Control Tracker

Live at: **https://foodqc.lancelotbiz.com/**

A time/temperature food-safety check tracker used across multiple Renaissance Faire venues (PARF, SRF, KRF, and GARF), built as a single shared web app with strict per-facility data separation.

---

## What this app does

- Zone Managers log a **time + temperature + mandatory photo** check for a specific menu item at their assigned booth
- Each menu item is tagged **hot-holding** (≥ min °F), **cold-holding** (≤ max °F), or **no-temp-required** (baked goods, drinks) — the form adapts automatically
- Every submitted check fires an **email notification** (via EmailJS) with the photo embedded, and includes a **direct link** to view that one check without logging in
- Failed checks can be **marked resolved** by whoever handled the corrective action (Zone Manager or Admin), with a note of what was done — shows as a RESOLVED tag with who/what, otherwise shows a Clear/Resolve button
- **Check Log is mobile-responsive** — stacks into labeled cards on phone-sized screens instead of a cramped table
- Installable as a **PWA** ("Add to Home Screen") for a native-app feel on phones/tablets

---

## Roles

| Role | Scope | Can do |
|---|---|---|
| **Superadmin** | All facilities | Everything below, for any facility. Manages the facility list and other Superadmins. Sees the live cross-venue Dashboard. |
| **Admin** | One facility | Manage that facility's booths/menu items, assign Zone Managers, manage manager PINs/roles, submit checks for any booth in that facility. |
| **Zone Manager** | One facility, assigned booth(s) only | Submit checks, view Check Log. Cannot edit booths/menus/managers. |

Login is PIN-based — one PIN identifies both **who** you are and **which facility** you belong to (Superadmins aren't tied to a facility; they pick one via the switcher in the header).

---

## Data structure (Firebase Realtime Database)

```
qc/
  superadmins/{key}                          → { name, pin, email, phone }
  facilityMeta/{facilityId}                  → { name: "Display Name" }
  facilityManagers/{facilityId}/{key}        → { name, pin, role: "admin"|"manager", email, phone }
  facilities/{facilityId}/booths/{boothId}   → { name, zoneManager, menuItems: {...} }
  facilities/{facilityId}/checks/{checkId}   → { ...check record, resolved, resolvedBy, ... }
```

**Important:** `facilityMeta` and `facilityManagers` are case-sensitive exact names — a stray `facilitymeta` or `booth` (singular) instead of `booths` will silently fail to show up in the app with no error, since Firebase treats them as entirely separate, unrelated nodes. Always double check spelling/casing when hand-editing in the console.

---

## Setup checklist for a fresh deployment

1. **Firebase** — create a Realtime Database project, drop in `firebaseConfig` near the top of `index.html`
2. **EmailJS** — need a Service ID, a check-notification Template ID, and a separate PIN-reset Template ID (its "To Email" field must be the dynamic `{{to_email}}`, not a fixed address). Attachments (for embedding the photo) require EmailJS's **paid Personal plan** — the free plan silently rejects attachments.
3. **Bootstrap your first Superadmin manually** in the Firebase console under `qc/superadmins/{key}` — the app can't create its own first login. Everything else (facilities, admins, more superadmins) can be added through the app afterward.
4. **GitHub Pages** — this repo deploys via Pages from `main` branch root. Custom domain is set via the `CNAME` file (currently `foodqc.lancelotbiz.com`) plus a DNS-only (not proxied) CNAME record at the registrar.

---

## Bulk-importing menu data

`prfqc_import_template.xlsx` is the reusable spreadsheet for loading a facility's booths/menu items in bulk instead of hand-entering through the UI. Fill in rows with a `Facility ID` column matching a short id (e.g. `parf`, `srf`, `krf`, `garf`), send it back, and it gets converted into a ready-to-import JSON file per facility — which then gets imported at `qc/facilities/{id}/booths` via the Firebase console's **Import JSON** feature (⚠️ the Data Location field in that dialog must point at exactly that path, not root, not one level off — this has been a recurring gotcha).

---

## Known gaps / in-progress items

- **`functions/index.js` (SMS reminders via Twilio) is not yet updated for the multi-facility structure** — it was written before the facility rebuild and still references the old single-facility paths. Needs a rewrite to loop through `qc/facilities/*` before it'll actually work. Also still needs to be deployed via `firebase deploy --only functions` (requires the Blaze plan) — this hasn't happened yet.
- **Teams notifications have been dropped** in favor of the in-app **Dashboard** tab (Superadmin-only, live cross-venue view of pass/fail counts and overdue booths per facility).
- **GARF** facility data hasn't been loaded yet. PARF, SRF, and KRF have been imported, with some manual cleanup needed after import due to path-naming mistakes (misspelled facility ids, `booth` instead of `booths`, data landing in `facilityMeta` instead of `facilities`) — see git history / chat log for specifics if this recurs.
- **Toll-free number verification with Twilio is in progress** — submitting under Use Case Category `ACCOUNT_NOTIFICATIONS` (internal staff alerts covering QC checks, job-tracker-style alerts, and weather notices — not customer marketing), with representative sample messages for each alert type.
- **Firebase Realtime Database rules** are currently open (test-mode style, scoped only to the `qc` path) — fine for setup, should be tightened before full public/production reliance.

---

## Tech stack

Single-file HTML/CSS/JS (no build step), Firebase Realtime Database (compat SDK, self-hostable if a venue's wifi blocks Google's CDN), EmailJS for notifications, GitHub Pages for hosting, PWA manifest + service worker for installability.
