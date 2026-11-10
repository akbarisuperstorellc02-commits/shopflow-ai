# ShopFlow roadmap

## Milestone 0 — local MVP
- [x] Responsive dashboard shell
- [x] Product creation, editing and deletion
- [x] Manual order entry and cancellation with inventory restoration
- [x] Customer summary and printable invoice
- [x] Local browser persistence and JSON backup/restore
- [x] Three interface languages: English, Afghan Dari and Pashto
- [x] Financial reports, sales trend chart and CSV exports

## Milestone 1 — customer validation
- [ ] Interview 5 independent sellers
- [ ] Observe their current order/inventory workflow
- [ ] Confirm the most painful repetitive task
- [ ] Test willingness to pay before paid infrastructure

## Milestone 2 — secure cloud foundation
- [x] Design tenant-scoped PostgreSQL schema
- [x] Enable row-level security policies for all core tables
- [x] Add atomic first-store creation RPC
- [x] Document safe Supabase setup and key handling
- [ ] Add authentication UI and session handling
- [ ] Add cloud repository adapter and local-data import
- [ ] Add transactional inventory/order RPCs
- [ ] Add invitation workflow and role management
- [ ] Add automated cross-tenant security tests
- [ ] Configure backups, monitoring, privacy policy and terms

## Milestone 3 — sellable product
- [ ] Public storefront and customer order form
- [ ] Branded downloadable invoice PDF
- [ ] Reliable email notifications
- [ ] Billing only after payment-provider eligibility is verified
- [ ] AI features only after user demand and operating costs are validated

## Release gates
- [ ] Two-account RLS isolation tests pass
- [ ] Concurrent order/stock tests pass
- [ ] Mobile and desktop end-to-end tests pass
- [ ] Data export, deletion and recovery flows verified
- [ ] Privacy, terms and support contact published
