# Supabase backend foundation

ShopFlow includes an optional browser connection to Supabase. The current cloud features are email authentication, listing/creating stores, explicit initial import of local products/orders/settings, product and settings uploads from the active browser, an explicit manual cloud-to-browser download action, and transactional cloud order creation/cancellation. Sync is manually initiated; it is not automatic or realtime.

## Configure a new Supabase project

1. Create a Supabase project.
2. Open the SQL Editor.
3. Apply \`migrations/0001_initial_schema.sql\`.
4. Apply \`migrations/0002_transactional_inventory.sql\`.
5. Run `tests/0001_rls_catalog_checks.sql` and `tests/0002_transactional_rpc_checks.sql`. These check schema/policy metadata and RPC privileges; they do not replace tests with two real accounts.
6. In Authentication → Providers, enable email sign-in and choose the email-confirmation policy.
7. In Authentication → URL Configuration, add the deployed GitHub Pages URL to allowed redirect URLs.
8. In Project Settings → API, copy the project URL and the publishable key (or legacy anon key).

In the app, open Settings, enter the project URL and public key, connect, then create an account or sign in. Create a cloud store, then explicitly import the local browser data.

**Never use or publish a service_role or sb_secret key in the browser.** The client rejects known secret key formats. Public keys are safe to expose only when the database RLS policies are correctly enabled and tested.

## Database model

- \`stores\`: tenant/workspace records.
- \`store_members\`: owner/admin/staff membership.
- \`products\`: tenant-scoped catalog, cost and optional stock.
- \`orders\`: tenant-scoped orders with immutable line-item snapshots.
- \`store_settings\`: tenant-scoped store preferences.

The \`create_store(store_name)\` RPC creates the store, owner membership and settings row atomically. Membership writes are intentionally unavailable to browser clients; team invitations require a separately reviewed server-side workflow.

## Security and inventory

RLS is enabled on every application table. Members can read only stores where they are members. Only owners/admins can manage products and settings. Members can create orders; only managers can update/cancel them.

Migration 0002 adds \`create_order_atomic\` and \`cancel_order_atomic\`. These functions lock rows while adjusting stock to prevent overselling under concurrent transactions. When the app is connected to a Supabase account and a cloud store is selected, new order creation and cancellation call these RPCs. Without a configured cloud connection, the app remains local-only.

Imported order rows are tagged with \`local-import:\` notes because the imported product stock is already the current inventory snapshot. Cancelling imported historical orders therefore must not add their quantities back to that snapshot.

## Current limitations

- Initial cloud import is a manual snapshot upload. Later connected product/settings changes and sales/cancellations use their respective cloud operations.
- Use Download cloud changes to manually pull cloud products, supported single-item orders and settings into each browser; no automatic/realtime download is implemented.
- In cloud mode, new order creation and cancellation call the transactional RPCs; the browser also keeps a local working copy for its current UI.
- Product create/edit/delete and store-setting updates upload from the active browser to the selected cloud store. Product deletions are archived as tombstones and removed from other browsers on their next explicit download.
- Re-running the initial import can overwrite cloud product stock with this browser's current snapshot; do not use it as a routine sync operation.
- Team invitations and role-management UI are not implemented.
- Cross-account RLS tests, concurrency tests and browser end-to-end tests have not been run against a live Supabase project.
- Backups, monitoring, privacy policy, terms, support and account-recovery operations need production setup.
- Public storefronts, payments, billing and AI features are not enabled.

Do not use real customer data until the migrations are applied to a real project and isolation has been tested with at least two unrelated accounts.
