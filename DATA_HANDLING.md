# Data handling notes

This document describes the current application's intended data flow. It is operational documentation, not a legally reviewed privacy policy.

## Local-only use

- Product, order, customer-derived and store-setting records are stored in the browser's local storage.
- The application does not require an account or a backend for local workflows.
- Browser data can be lost if site data is cleared, the browser profile is removed, or the device fails. Export a JSON backup and keep it somewhere safe.
- Anyone with access to the same unlocked browser profile may be able to access the stored business data. Local storage is not encrypted storage.

## Optional Supabase use

- The store operator supplies a Supabase project URL and public publishable/anon key and chooses to connect.
- Authentication and cloud data are handled by that operator's Supabase project under its configuration and policies.
- The browser client must never receive a service-role key, secret API key, database password or other privileged credential.
- Cloud uploads and downloads are initiated by explicit application actions; the current implementation is not realtime synchronization.
- Cloud pull replaces matching local product records and settings after confirmation, preserves local-only records, and skips unsupported multi-item orders.
- The initial import is a snapshot operation and should not be repeated as a normal synchronization action.

## Operator responsibilities

Before entering real customer data, the operator must configure and test Row Level Security, account recovery, backups, retention, deletion, and access controls in their own Supabase project. The operator should explain their data practices to their customers and obtain any consent required by applicable law.

## Current limits

The project does not currently provide a hosted private backend, automatic backup service, independent analytics policy, formal data-processing agreement, or legally reviewed privacy/terms documents. Do not represent this note as a substitute for those items.
