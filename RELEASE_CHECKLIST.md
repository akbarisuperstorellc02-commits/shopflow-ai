# Release checklist

This checklist distinguishes the shipped browser MVP from the additional work required before using cloud mode with real customer data or selling the service as a hosted SaaS.

## Current public MVP

- [x] Static application published on GitHub Pages.
- [x] Installable PWA manifest, app icon and offline app-shell cache.
- [x] Responsive seller workspace and local browser persistence.
- [x] Product and stock management.
- [x] Manual single-product order entry and cancellation.
- [x] Customer summaries, printable invoice, CSV exports and financial reports.
- [x] English, Afghan Dari and Pashto UI.
- [x] JSON backup and restore with validation.
- [x] Optional Supabase client integration and database migrations included in source.
- [x] CI JavaScript syntax and cloud source-guardrail checks.

## Before enabling Supabase for real business data

- [ ] Create a Supabase project owned by the operator.
- [ ] Apply both migrations in order and review the SQL.
- [ ] Run the SQL catalog/RLS and transactional RPC checks against that project.
- [ ] Test with at least two unrelated user accounts and verify cross-tenant reads/writes are denied.
- [ ] Test concurrent sales, cancellation, insufficient stock and duplicate submissions.
- [ ] Configure email confirmation, password recovery and exact Auth redirect URLs.
- [ ] Configure backups, retention, monitoring and an incident-response contact.
- [ ] Test export, deletion and recovery with non-production data first.

## Before commercial SaaS launch

- [ ] Complete mobile and desktop end-to-end testing on supported browsers.
- [x] Implement source-level product deletion tombstones and apply them on the next manual cloud pull.
- [ ] Verify deletion propagation with two real accounts and implement automatic/realtime sync with conflict resolution.
- [ ] Decide and implement team invitations and role-management UX.
- [ ] Add a real support channel and publish reviewed privacy and terms documents.
- [ ] Complete accessibility, performance and security reviews.
- [ ] Implement storefront, online payments, billing or notifications only after their requirements and providers are selected.
- [ ] Add a suitable open-source or commercial license after the owner's distribution decision.

## Release rule

A successful GitHub Actions deployment confirms that the checked source passes the configured build/guardrail steps and that GitHub Pages deployment completed. It does **not** prove that a live Supabase project exists, that RLS is secure in production, or that the product is ready for regulated or high-volume business use.
