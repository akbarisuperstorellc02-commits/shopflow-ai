# ShopFlow — Starter MVP

A responsive, browser-based seller workspace prototype.

## Run locally
Open `index.html` in a modern browser. No build step or API key is required.

## Languages
- English (left-to-right)
- Afghan Dari (right-to-left)
- Pashto (right-to-left)
- Language choice is saved in the current browser and restored on return.
- Dashboard, navigation, forms, notifications, tables, and printable invoices are localized. Product/customer text entered by the seller remains as entered.

## Included in this first prototype
- Overview dashboard and basic sales metrics
- Product catalog creation with stock quantity and low-stock indicators
- Manual order entry with automatic stock deduction and insufficient-stock protection
- Product and order search
- CSV export for products and orders
- Customer list derived from orders
- Printable invoices (use the browser's Save as PDF option)
- Store name, contact email and currency settings
- Browser localStorage persistence

## Important limitations
This is a single-browser demo, not a production SaaS. Data is stored locally in the browser and is not synced across devices or users. There is no authentication, shared database, online checkout, server-side authorization, or AI integration yet. Do not enter sensitive customer information.

## Roadmap
1. Validate workflows with 3–5 small sellers.
2. Add a secure backend, authentication, and per-store data isolation.
3. Add shareable public storefronts and customer order forms.
4. Add CSV export, inventory tracking, and invoice branding.
5. Add optional AI copywriting only after customer demand is validated.
6. Add a payment provider only after confirming it supports the operator's country and business setup.

## Suggested stack for production
- Frontend: Next.js or a lightweight static frontend
- Backend/database/auth: Supabase (review current free-tier limits)
- Hosting: Cloudflare Pages or another suitable host
- Repository: GitHub

## License
MIT
