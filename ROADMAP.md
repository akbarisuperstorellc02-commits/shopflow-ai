# ShopFlow roadmap and delivery status

## Milestone 0 — local seller MVP <complete>
- [x] Responsive dashboard
- [x] Product create/edit/delete and stock tracking
- [x] Manual multi-item order entry and cancellation with per-line local inventory restoration
- [x] Customer summary and printable invoice
- [x] Store settings and browser persistence
- [x] JSON backup/restore with validation
- [x] English, Afghan Dari and Pashto interfaces
- [x] Financial reports and CSV exports
- [x] Static GitHub Pages deployment and CI source checks

## Milestone 1 — customer validation <not started>
- [ ] Interview 5 independent sellers
- [ ] Observe their current order/inventory workflow
- [ ] Confirm the most painful repetitive task
- [ ] Test willingness to pay before adding paid infrastructure

## Milestone 2 — optional cloud foundation <code complete; live validation pending>
- [x] Tenant-scoped PostgreSQL schema and RLS policies
- [x] Atomic first-store creation RPC
- [x] Supabase email authentication UI
- [x] Explicit one-way local-to-cloud initial import
- [x] Transactional multi-item create/cancel order RPCs with stock row locking
- [x] Cloud-mode browser order/cancel actions use transactional RPCs
- [x] Product create/edit/delete and store-setting uploads
- [x] Explicit manual cloud-to-browser pull for products, multi-item orders and settings
- [x] Archive product deletions as cloud tombstones and remove them on the next manual pull
- [ ] Automatic/realtime sync and conflict resolution
- [ ] Apply migrations to an operator-owned live Supabase project
- [ ] Verify RLS isolation with two unrelated accounts
- [ ] Run live concurrency, stock and duplicate-submission tests
- [ ] Live two-account verification of multi-item orders, deletion propagation and sync behavior
- [ ] Invitation workflow and role-management UI
- [ ] Production backups, monitoring, account recovery and reviewed privacy/terms documents

## Milestone 3 — commercial hosted product <not started>
- [ ] Public storefront and customer order form
- [ ] Branded downloadable invoice PDF
- [ ] Reliable email notifications
- [ ] Billing after provider eligibility is verified
- [ ] AI features after demand and operating costs are validated

## Release status

The local-first browser MVP is published and its configured GitHub Actions build/deployment checks pass. This is not equivalent to production certification or live cloud validation. The optional cloud foundation is present in source but must be configured and tested in an actual Supabase project before real customer data is used.

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), [SECURITY.md](SECURITY.md) and [DATA_HANDLING.md](DATA_HANDLING.md) for the exact operational requirements.
