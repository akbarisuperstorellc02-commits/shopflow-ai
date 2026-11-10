# ShopFlow roadmap

## Milestone 0 — local MVP
- [x] Responsive dashboard
- [x] Product create/edit/delete
- [x] Manual order entry and cancellation with local inventory restoration
- [x] Customer summary and printable invoice
- [x] Browser persistence and JSON backup/restore
- [x] English, Afghan Dari and Pashto
- [x] Financial reports and CSV exports

## Milestone 1 — customer validation
- [ ] Interview 5 independent sellers
- [ ] Observe their current order/inventory workflow
- [ ] Confirm the most painful repetitive task
- [ ] Test willingness to pay before adding paid infrastructure

## Milestone 2 — cloud foundation
- [x] Tenant-scoped PostgreSQL schema and RLS policies
- [x] Atomic first-store creation RPC
- [x] Supabase email authentication UI
- [x] Explicit one-way local-to-cloud import
- [x] Transactional create/cancel order RPCs with stock row locking
- [x] Connect cloud-mode browser order/cancel actions to transactional RPCs
- [x] Sync cloud-mode product create/edit/delete and store-setting updates to the selected store
- [x] Load cloud account labels/translations on first launch (not only after restoring a backup)
- [ ] Bidirectional sync with conflict resolution and store switching
- [ ] Invitation workflow and role-management UI
- [ ] Live two-account RLS and concurrency tests
- [ ] Backups, monitoring, privacy policy and terms

## Milestone 3 — sellable product
- [ ] Public storefront and customer order form
- [ ] Branded downloadable invoice PDF
- [ ] Reliable email notifications
- [ ] Billing after provider eligibility is verified
- [ ] AI features after demand and operating costs are validated

## Release gates
- [ ] Two-account RLS isolation tests pass
- [ ] Concurrent order/stock tests pass
- [ ] Mobile and desktop end-to-end tests pass
- [ ] Data export, deletion and recovery flows verified
- [ ] Privacy, terms and support contact published
