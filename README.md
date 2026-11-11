# ShopFlow AI

A responsive seller workspace for managing products, orders, inventory, customers and financial reports.

## Current release

The public release is a **local-first seller MVP with optional Supabase account setup and manual cloud synchronization**. Core local workflows work without a backend. Cloud features require the store owner to create and configure a Supabase project.

- Live app: https://akbarisuperstorellc02-commits.github.io/shopflow-ai/
- GitHub repository: https://github.com/akbarisuperstorellc02-commits/shopflow-ai
- Deployment checks: https://github.com/akbarisuperstorellc02-commits/shopflow-ai/actions
- Release readiness: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- Data handling: [DATA_HANDLING.md](DATA_HANDLING.md)
- Security reporting and deployment guidance: [SECURITY.md](SECURITY.md)
- Supabase setup and limitations: [supabase/README.md](supabase/README.md)
- Product roadmap: [ROADMAP.md](ROADMAP.md)

## Features

- Responsive seller dashboard, installable as a Progressive Web App (PWA) on supported browsers.
- Network-first app-shell updates with cached offline fallback for local-first workflows; cloud actions still require an internet connection.
- Product creation, editing, deletion, price/cost and stock tracking.
- Manual multi-item order entry with per-line quantity and stock validation, transactional cloud checkout, and cancellation/restoration.
- Customer summaries and printable A4 invoice.
- Store identity, contact details, logo and currency settings.
- Search, CSV exports and financial reports.
- English, Afghan Dari and Pashto interfaces; English digits in all languages.
- JSON backup and restore with validation and file-size limits.
- Local browser persistence.
- Optional Supabase email authentication, cloud store creation, initial data import, product/settings uploads, manual cloud downloads and transactional cloud order creation/cancellation.
- PostgreSQL tenant schema, row-level security and transactional inventory RPC migrations.

## Install and offline use

On a supported browser, open the live HTTPS app and use the browser menu’s **Install app** or **Add to Home Screen** option. The app shell is cached after the first successful load. Product and order workflows use this browser’s local data offline; Supabase sign-in and cloud sync require an internet connection. Browser storage is not an encrypted backup, so export backups regularly.

## Run

Open `index.html` in a modern browser or visit the live GitHub Pages URL. No local build step is required for the browser MVP.

## Enable optional cloud features

1. Create your own Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql`, then `0002_transactional_inventory.sql`.
3. Run `supabase/tests/0001_rls_catalog_checks.sql` and `supabase/tests/0002_transactional_rpc_checks.sql`.
4. Configure email authentication and the deployed URL in Supabase Auth settings.
5. Open ShopFlow → Settings, enter the project URL and public publishable/anon key, then connect.
6. Sign up or sign in, create a cloud store, and use the explicit initial import button.
7. Complete the two-account isolation and concurrency tests in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before entering real customer data.

Never use a `service_role` or `sb_secret_` key in browser code. Public keys are safe to expose only when RLS is correctly enabled and tested. Read [the Supabase setup and limitations guide](supabase/README.md) and [data handling notes](DATA_HANDLING.md) first.

## Important limitations

- Cloud sync is manual, not realtime. Connected product/settings changes and sales upload to the selected cloud store. Use Download cloud changes to manually pull products, supported single-item orders and settings into this browser.
- Cloud downloads replace matching product records and store settings after confirmation, preserve local-only records, propagate archived product deletions, and import every line in multi-item orders.
- Initial cloud import is a snapshot upload and may overwrite cloud product stock with the local snapshot. Do not repeat it as a routine sync method.
- Supabase migrations are included in the repository but have not been applied to a live project by repository CI. Live cross-account and concurrency tests remain required.
- Team invitations, public storefronts, online payments, billing, email notifications and AI features are not enabled.
- GitHub Pages is a static host; it does not provide a private server or protect secrets embedded in browser code.
- The application is not yet a fully production-ready hosted SaaS. See [the release checklist](RELEASE_CHECKLIST.md).

## Project structure

- `assets/js/app.js`: local seller application.
- `assets/js/cloud.js`: optional Supabase authentication and cloud operations.
- `assets/css/styles.css`: responsive UI.
- `supabase/migrations/`: database schema, RLS and transactional RPCs.
- `supabase/tests/`: SQL metadata and RPC privilege checks.
- `scripts/validate-cloud-schema.mjs`: CI source guardrails.

## License

No open-source license has been added. All rights remain with the repository owner unless a license is added.
