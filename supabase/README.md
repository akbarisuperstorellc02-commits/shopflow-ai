# Supabase backend foundation

This folder contains the first database/security layer for moving ShopFlow from a
single-browser prototype toward a multi-user product.

## Important status

The live GitHub Pages app is **still local-only**. This SQL migration is a
prepared backend foundation; it does not turn on sign-in, cloud sync, or
multi-device access in the current UI. Do not promise customers that data is
cloud-backed until the frontend integration and end-to-end tests are complete.

## Apply to a new Supabase project

1. Create a Supabase project in a region suitable for the intended customers.
2. Open **SQL Editor** in that project.
3. Review and run `migrations/0001_initial_schema.sql`.
4. In **Authentication → Providers**, enable Email sign-in and configure the
   confirmation and password-reset URLs for the production domain.
5. In **Authentication → URL Configuration**, add the deployed app URL and
   the local development URL to the allowed redirect URLs.
6. In **Project Settings → API**, the project URL and publishable/anon key may
   be used by a browser client only after RLS is enabled and tested.
7. Never put the `service_role` key, database password, or any secret key in
   browser JavaScript, GitHub Pages, a public repository, or a screenshot.

## Data model

- `stores`: one tenant/workspace.
- `store_members`: membership and owner/admin/staff roles.
- `products`: tenant-scoped catalog and optional stock/cost.
- `orders`: tenant-scoped sales with JSON line-item snapshots.
- `store_settings`: tenant-scoped settings.

The `create_store(name)` RPC atomically creates a store, its owner membership,
and an empty settings row for the signed-in user. The client cannot insert or
modify memberships directly. This prevents self-joining another store or
self-promoting a role. An invitation flow must be added as a separately
reviewed server-side function before team invitations are enabled.

## Security model

Row Level Security is enabled on every application table. There are no anon
or public read policies. Members can read only their own store's records.
Only owners/admins can manage catalog and settings. Members can create orders;
only managers can edit or delete them. Store membership writes are intentionally
blocked for browser clients.

Before production, test with at least two unrelated accounts and verify that
neither can select, insert, update, or delete the other's store data. Also test
unauthenticated access, role changes, account deletion, and recovery flows.

## Current migration limitations

- This is a foundation, not a complete production backend.
- Inventory deduction/restoration must move into a transactional database RPC
  before concurrent users can safely create/cancel orders. The current local
  JavaScript stock checks are not concurrency-safe across devices.
- The frontend has not yet been wired to this schema.
- Email delivery, rate limits, backups, monitoring, data retention, privacy
  policy, and operational support still need configuration.
- Public storefronts, payment processing, invitations, and AI services are not
  enabled by this migration.

## Required next implementation steps

1. Add Supabase Auth UI and a safe session lifecycle.
2. Add a cloud repository adapter and an explicit local-to-cloud import flow.
3. Implement transactional create/cancel order RPCs with stock locking.
4. Add store switching and invitation-based membership management.
5. Add automated cross-tenant/RLS tests and browser end-to-end tests.
6. Only then offer cloud sync to real stores.
