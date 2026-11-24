# Car Hire owner web app

Responsive React + TypeScript client for `..\car-hire-backend`. Online-only by design: Android is the offline daily client. Local Git repository; nothing is published or deployed automatically.

## Functionality

- Owner login/logout with secure server sessions and CSRF. Credentials/tokens are not placed in localStorage. Expired-session login overlays retain the current form; financial writes await server acknowledgement.
- **Settings > Appearance > Theme** selects Light, Dark or System default. Changes apply immediately across the workspace, dialogs, tables, forms and sign-in; the browser retains the choice after reload/sign-out and shares it between tabs. The non-sensitive appearance preference is browser-local, not a synced business setting. Storage failures are reported in Settings; the current tab can still change its appearance.
- One **Overview** page contains the financial dashboard and reports: date/vehicle-scoped recognized revenue, collections, outstanding, accrued/paid expenses, expected/cash profit and separate deposit cash. One **Search vehicle** dropdown lists all vehicles by registration, alphabetically, including those beyond the first API page; All vehicles clears it. There is no separate registration search input. Hire balances identify each hire by registration, local planned start/end and agreed amount. Every card displays its date/calculation basis. Download hire balance CSV; legacy Reports bookmarks still open Overview.
- Vehicles: registration/make/model/year, operational status, mileage and correction reason, notes; search, paging, editing and protected tombstone deletion. Record tables keep Open/Delete actions pinned in view, offer keyboard-focusable horizontal scrolling and show a small-screen scrolling hint; form action buttons wrap rather than being clipped on narrow screens.
- Customers: contact details, optional licence/emergency references and notes. Booking requires a usable contact; incomplete customer records can be prepared first.
- Hire workspace: one register ordered by planned pickup (earliest first), with search/date filters and a Status selector sourced from the editor: Draft, Booked, Active, Completed and Cancelled. All statuses clears the status filter; filters combine. Includes vehicle/customer selection, planned/actual pickup and return in the user's timezone, status transitions, charges, zero-charge confirmation and itinerary. The backend authoritatively rejects vehicle/service overlaps and orders hires before pagination.
- Payments/security deposits: pending/received/failed entries, manual cash/M-Pesa/bank/card references, partial/final payments, refunds linked to originals, deposit applications/refunds. Received entries are immutable; add compensating entries instead.
- Expenses, owner-defined categories and providers, paid-date tracking and receipt uploads. Maintenance links expenses without double counting.
- Maintenance service windows and next-due details; odometer/fuel readings; basic pre/post inspection notes; fines/damages with responsibility and charging state.
- Reminder register: dates or mileage, vehicle/source, open/snoozed/completed/dismissed state. **Settings enables reminders**, with required lead days, Nairobi notification time and backup-reminder interval. Export-age notifications use the last deliberately acknowledged-safe or ingested export, not an unconfirmed download. Explicit browser notification permission, private notification text and daily delivery deduplication. Browser delivery requires an open tab; it is not push notification infrastructure.
- Private PDF/PNG/JPEG receipt/attachment upload and authenticated download from each saved record.
- Data management: verified full-snapshot ZIP download, quarantine validation preview, atomic import confirmation, reconciliation results, export history, deliberate safe-storage acknowledgement, reauthentication, scoped purge preview and typed confirmation.
- Sync/data-health summary and immutable server audit evidence. Android conflicts are resolved in Android; the web currently displays conflict evidence without a dedicated resolution workbench.
- Grouped vertical desktop sidebar with **Collapse menu / Expand menu** controls that reclaim content width without discarding drafts. Phones/tablets use a labeled **Menu** drawer independently of desktop collapse state. The menu exposes every section, highlights the current page, keeps **Sign out** visible and provides a scrolling hint. Select a destination to close it, or use Close menu, Escape or the outside area without discarding the current draft. Keyboard focus stays inside the open menu and returns to its trigger on dismissal. Cards, filters, forms and action buttons reflow at smaller widths; wide tables scroll inside their own region, and dialogs scroll within short viewports. There are no horizontally hidden navigation tabs. Labeled inputs, keyboard focus styling, skip link, inert background while signed out, filters and server-side paging. Filter state is represented in the URL.

## Record summaries and calculations

Each financial chart line has a labeled checkbox. Show all three, any pair or a single line; uncheck all to hide the chart with a selection prompt. The axis rescales to the visible lines. Selections survive date/vehicle refreshes, and the exact monthly table always shows every amount.

**Financial report** is a separate monthly line-chart page, not another copy of Overview. Select any start/end dates (including a July-June or other financial year) and optionally a vehicle. It plots received Payment entries minus received Refund entries, paid expenses by paid date (business date fallback), and their cash-basis difference as net profit. Pending/failed payments, security deposits, deposit applications, deposit refunds, unpaid/cancelled expenses and deleted records are excluded. All months appear in order, including zero months; boundary months use only selected dates. Negative values are supported. An exact monthly table and distinct line patterns accompany the responsive chart. Up to 1200 months are supported. It uses `/reports/monthly`; deploy web/backend together. This is cash profit, not recognized-revenue/accrual profit.

Hires show registration, charge, local planned pickup/return and a numeric **Days** column; payment rows show registration, amount and payment date. Hire selectors show only registration, local start/end and charge, and retain selected labels while searching. Expense rows show category/provider names and include paid date, falling back to business date; an optional provider not supplied displays `-`. Registration searches work for all three registers. Reference lookups reuse known records, deduplicate IDs and bound concurrent requests without changing the backend contract.

**Filtered total** on Hires, Payments and Expenses sums all matching records across every page using the same server-side search/status/vehicle/date filters. It is not a stored field. Hire totals use agreed charges; payment totals sum displayed entry amounts (including refunds and pending/failed entries), not net cash or outstanding balances. Loading/error states do not present a stale total as current.

The hire form has a read-only **Number of days**, rounding partial elapsed 24-hour days up without recalculating the agreed charge. Missing actual timestamps default to planned timestamps; explicit actual values remain intact. Recording a payment atomically fills missing actual pickup/return on the linked hire without advancing its status. The form explains this behavior before saving.

## Docker

The multi-stage `Dockerfile` builds this client and serves it using non-root Nginx. `docker\nginx.conf` handles SPA routes, same-origin API/documentation proxying, private downloads, upload limits and static asset caching. No API URL or credentials are compiled into the browser bundle.

Use the companion backend's `deployment\Build-PortableBundle.ps1` to package web, backend and PostgreSQL images together. Its deployment README covers importing/running on another laptop, credentials and persistent data. Do not run this web image alone without the companion backend service on its Docker network. Local loopback HTTP is the default; remote access requires HTTPS configuration.

## Run

Requirements: Node.js 22.12+ and the companion backend running on loopback port 8080.

```powershell
npm ci
npm run dev
```

Vite binds to loopback. Its `/api` proxy forwards to the backend; the browser never needs direct database access. For production, run `npm run build`, serve `dist` over HTTPS and reverse-proxy `/api` to the backend on the **same origin**. Do not use the development server as production hosting. Configure backend credentials through its environment, not this source tree.

## Rules and implementation

API records are parsed with Zod before use. `openapi.json` and `src\openapi.d.ts` capture the backend contract; update them after API changes by saving the authenticated `/v3/api-docs` response to `openapi.json`, then running `npm run api:generate`. Never put credentials into the checked-in API document. The server owns financial totals and all authoritative validation.

### Code navigation

- `src\main.tsx`: React bootstrap and global stylesheet import only.
- `src\app`: workspace shell, grouped navigation metadata, shared sidebar/menu content, session initialization and expiry handling. The opened workspace remains mounted behind the login overlay so expired sessions retain form state; opening/dismissing the navigation menu or resizing does not remount editors.
- `src\pages`: screen-level dashboard/reports, entity registers, data-management and audit/sync orchestration.
- `src\features\auth`: login UI and submission hook.
- `src\features\appearance`, `src\pages\settings.tsx`: persistent browser theme preference, system/cross-tab listeners and the local appearance settings panel; business settings remain separate.
- `src\features\records`: record editor, fields, searchable references, attachments, filters, table and deletion dialog. `hooks` owns editor/list/reference state; `schemas` groups form definitions into fleet, finance, operations and settings, with shared field builders. Defaults and record labels live alongside them.
- `src\features\data`: export, import and controlled-purge panels with one shared state hook, retaining validation previews, reauthentication and confirmation flow.
- `src\features\reminders`: reminder status UI, polling/notification hook and due-date calculations. `src\features\reports` owns report-loading state.
- `src\components`: reusable cross-feature UI such as notices.
- `src\services`: same-origin API, CSRF/session/error handling, runtime Zod record validation, writes/downloads and paginated record loading. Generated OpenAPI types stay in `src\openapi.d.ts`.
- `src\utilities`: decimal money parsing/display and strict browser-local/UTC date conversions, with unit tests in `inputs.test.ts` and `dates.test.ts`.
- `src\styles`: semantic light/dark palette tokens in `themes.css` and shared layout in `app.css`; `src\types` and feature-local `types.ts` files: shared report and feature contracts.

KES input uses decimal-string parsing into integer minor units, not floating-point multiplication. Timestamp display and entry use the browser's timezone without a GMT suffix; storage remains UTC. Invalid/nonexistent local times are rejected. Existing instants retain their original precision and repeated-hour occurrence when left unchanged; ambiguous newly entered local times require an unambiguous time. Business dates, report recognition and reminder scheduling retain Nairobi semantics. Defaults: KES, Africa/Nairobi, no turnaround buffer, completed actual-return revenue recognition. Payment/refund cash is separate from charges and refundable deposits. Portable import uses the companion exporters' versioned typed-envelope contract; it is not an arbitrary Excel importer.

## Validate

```powershell
npm run build
npm run lint
npm test
npm run format
```

Full-stack tests require a **disposable** backend database and backend owner test password `carhire-browser-test-only` (a test fixture, never a production credential). Start the backend on 8080 with non-secure cookies permitted only on loopback, and this UI with `npm run dev -- --port 5179 --strictPort`:

```powershell
npx playwright install chromium
npm run test:e2e
```

The tests create synthetic business records. Do not run them against your business database. Coverage includes entity/hire/payment/report flow, reminder configuration errors, retained forms after session expiry, export/import, mobile navigation, read-only day counts and actual-time defaults, registration-based references, paid-date fallbacks and filtered totals across pages. Unit tests cover money, browser-local/UTC conversion, daylight-saving gaps/overlaps, precise day rounding and malformed server contracts.

Dependency advisory auditing could not complete in this environment: the configured registry returned HTTP 400 and the public registry connection failed TLS. A clean vulnerability audit is not claimed.

## Scope and release limitations

This is not yet a full functional-specification acceptance sign-off. Utilization/ageing reports, PDFs, recurring expense generation, full condition-item checklists, device revocation/token rotation, a dedicated web conflict-resolution workflow and production deployment/backup monitoring remain unfinished. Browser reminders require an open authenticated tab and platform permission; mileage reminders use vehicle mileage, so keep it current. Complex financial conflicts require deliberate compensating entries. Large reference lists use searchable bounded selectors. Performance, assistive-technology coverage and all 30 specification acceptance criteria still need release qualification. No public booking, GPS, payment-provider integration or offline web is included.
