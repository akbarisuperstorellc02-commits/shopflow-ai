# ShopFlow AI

A responsive seller workspace for managing products, orders, inventory, customers and financial reports.

## Current release

The live app is a **local-first seller MVP with optional Supabase account setup and manual cloud synchronization**. Core local workflows work without a backend. Cloud features require the user to create and configure a Supabase project.

- Live app: https://akbarisuperstorellc02-commits.github.io/shopflow-ai/
- GitHub repository: https://github.com/akbarisuperstorellc02-commits/shopflow-ai
- Deployment checks: https://github.com/akbarisuperstorellc02-commits/shopflow-ai/actions

## Features

- Responsive seller dashboard.
- Product creation, editing, deletion, price/cost and stock tracking.
- Manual order entry, stock validation and cancellation/restoration.
- Customer summaries and printable A4 invoice.
- Store identity, contact details, logo and currency settings.
- Search, CSV exports and financial reports.
- English, Afghan Dari and Pashto interfaces; English digits in all languages.
- JSON backup and restore with validation and file-size limits.
- Local browser persistence.
- Optional Supabase email authentication, cloud store creation, initial data import, product/settings uploads, manual cloud downloads and transactional cloud order creation/cancellation.
- PostgreSQL tenant schema, row-level security and transactional inventory RPC migrations.

## Run

Open \`index.html\` in a modern browser or visit the live GitHub Pages URL. No local build step is required for the browser MVP.

## Enable the optional cloud features

1. Create your own Supabase project.
2. Apply \`supabase/migrations/0001_initial_schema.sql\`, then \`0002_transactional_inventory.sql\`.
3. Run \`supabase/tests/0001_rls_catalog_checks.sql\`.
4. Configure email authentication and the deployed URL in Supabase Auth settings.
5. Open ShopFlow → Settings, enter the project URL and public publishable/anon key, then connect.
6. Sign up or sign in, create a cloud store, and use the explicit import button.

Never use a \`service_role\` or \`sb_secret_\` key in browser code. Read [the Supabase setup and limitations guide](supabase/README.md) before using real customer data.

## Important limitations

- Initial cloud import is manual. After setup, connected product/settings changes and sales upload to the selected cloud store. Use Download cloud changes to manually pull products, supported single-item orders and settings into this browser. This is not automatic/realtime sync.
- When connected to Supabase with a selected cloud store, new sales and cancellations use transactional database RPCs; the browser keeps a local working copy. Without a cloud connection, the app continues in local-only mode.
- Cloud downloads replace matching product records and store settings after confirmation, while preserving local-only records. Multi-item orders are skipped because the current interface supports one product per order. Cloud-side product deletions are not propagated to local browsers.
- Supabase migrations have not been applied to a live project by this repository's CI. Live cross-account and concurrency tests remain required.
- Team invitations, public storefronts, payments, billing, email notifications and AI features are not enabled.
- GitHub Pages is a static host; it does not provide a private server or protect secrets embedded in browser code.

## Project structure

- \`assets/js/app.js\`: local seller application.
- \`assets/js/cloud.js\`: optional Supabase auth and local-to-cloud import.
- \`assets/css/styles.css\`: responsive UI.
- \`supabase/migrations/\`: database schema, RLS and transactional RPCs.
- \`supabase/tests/\`: catalog and RLS metadata checks.
- \`scripts/validate-cloud-schema.mjs\`: CI guardrails for the cloud schema and client.

## License

No open-source license has been added yet. All rights remain with the repository owner unless a license is added.
