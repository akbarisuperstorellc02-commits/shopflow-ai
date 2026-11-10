# Supabase backend foundation

ShopFlow includes an optional browser connection to Supabase. The current cloud features are email authentication, listing/creating stores, and an explicit one-way import of local products, orders and settings. This is not continuous multi-device sync.

## Configure a new Supabase project

1. Create a Supabase project.
2. Open the SQL Editor.
3. Apply \`migrations/0001_initial_schema.sql\`.
4. Apply \`migrations/0002_transactional_inventory.sql\`.
5. Run \`tests/0001_rls_catalog_checks.sql\`. This checks schema and policy metadata; it does not replace tests with two real accounts.
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

- Cloud import is manual and one-way; local changes after import are not automatically uploaded.
- Cloud changes are not downloaded to other devices.
- The current order form and cancellation UI still operate on local browser data.
- Team invitations and role-management UI are not implemented.
- Cross-account RLS tests, concurrency tests and browser end-to-end tests have not been run against a live Supabase project.
- Backups, monitoring, privacy policy, terms, support and account-recovery operations need production setup.
- Public storefronts, payments, billing and AI features are not enabled.

Do not use real customer data until the migrations are applied to a real project and isolation has been tested with at least two unrelated accounts.
