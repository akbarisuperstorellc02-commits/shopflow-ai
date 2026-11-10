# ShopFlow AI

A responsive seller workspace for managing products, orders, inventory, customers and financial reports.

## Current release status

The published GitHub Pages app is a **local-first MVP**, not yet a production SaaS. It stores data in the current browser's localStorage. It does not currently provide user sign-in, cloud synchronization, shared multi-device data, online checkout, or live AI services.

## Run locally

Open `index.html` in a modern browser. No build step or API key is required.

## Languages

- English (left-to-right)
- Afghan Dari (right-to-left)
- Pashto (right-to-left)
- Interface numbers remain Western/English digits.
- Language selection is saved in the current browser.

## Included features

- Responsive dashboard and sales overview
- Product create/edit/delete with optional stock and purchase-cost tracking
- Manual order entry, stock deduction, insufficient-stock protection and cancellation with stock restoration
- Customer summaries and searchable product/order lists
- Branded A4 printable invoices (browser Print / Save as PDF)
- Store profile, contact details, logo and currency settings
- Daily/monthly financial reports, revenue, known cost, gross profit and sales trend
- CSV export for products, orders and financial reports
- JSON backup and validated restore
- Browser localStorage persistence

Gross profit is not net profit. Overheads, taxes, shipping, refunds and payment fees are not fully accounted for. Historical orders without a recorded purchase cost are excluded from cost/profit calculations.

## Supabase account and cloud import (configuration required)

The `supabase/` folder contains a PostgreSQL schema with tenant-scoped stores, memberships, products, orders and settings, row-level security (RLS), and a safe `create_store(name)` function.

Read [Supabase setup and security notes](supabase/README.md) before applying it. **This schema is not yet connected to the live frontend.** Do not enter real customer data expecting it to sync to the cloud.

Never commit a Supabase `service_role` key, database password, or other secret. The UI rejects a JWT `service_role` key and only accepts a project URL plus a public publishable/anon key.

## Development roadmap

See [ROADMAP.md](ROADMAP.md) for remaining authentication, cloud-sync, transactional inventory, team access, privacy and release gates.

## License

MIT
