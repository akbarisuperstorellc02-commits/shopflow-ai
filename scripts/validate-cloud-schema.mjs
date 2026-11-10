import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readFileSync('supabase/migrations/0001_initial_schema.sql', 'utf8');
const catalogTests = readFileSync('supabase/tests/0001_rls_catalog_checks.sql', 'utf8');\nconst transactional = readFileSync('supabase/migrations/0002_transactional_inventory.sql', 'utf8');\nconst cloudClient = readFileSync('assets/js/cloud.js', 'utf8');

const requiredTables = ['stores', 'store_members', 'products', 'orders', 'store_settings'];
for (const table of requiredTables) {
  assert.ok(migration.includes(`create table if not exists public.${table} (`), `Missing table: ${table}`);
  assert.ok(migration.includes(`alter table public.${table} enable row level security;`), `RLS is not enabled: ${table}`);
}
assert.match(migration, /create or replace function public\.create_store\(store_name text\)[\s\S]*?security definer[\s\S]*?set search_path = ''/i, 'create_store must be SECURITY DEFINER with an empty search_path');
assert.match(migration, /revoke all on function public\.create_store\(text\) from public/i, 'create_store must be revoked from PUBLIC');
assert.match(migration, /grant execute on function public\.create_store\(text\) to authenticated/i, 'create_store must be granted to authenticated only');
assert.match(migration, /create policy "members can read products"/i, 'Missing product member-read policy');
assert.match(migration, /create policy "managers can insert products"/i, 'Missing manager-only product insert policy');
assert.match(migration, /create policy "members can create orders"/i, 'Missing member order insert policy');
assert.match(migration, /create policy "managers can update orders"/i, 'Missing manager-only order update policy');
assert.match(migration, /create policy "owners can update their stores"/i, 'Missing store-owner update policy');
assert.match(catalogTests, /RLS is not enabled on public\.%/i, 'Catalog SQL test must assert RLS');
assert.match(catalogTests, /Unexpected anon policy found/i, 'Catalog SQL test must assert no anon policies');

assert.match(transactional, /create or replace function public\\.create_order_atomic/i, 'Missing atomic order creation RPC');\nassert.match(transactional, /for update/i, 'Atomic order creation must lock product rows');\nassert.match(transactional, /create or replace function public\\.cancel_order_atomic/i, 'Missing atomic order cancellation RPC');\nassert.match(transactional, /revoke all on function public\\.create_order_atomic/i, 'Order RPC must revoke PUBLIC execution');\nassert.match(cloudClient, /service_role/i, 'Cloud client must reject service-role credentials');\nassert.match(cloudClient, /\.rpc\('create_store'/i, 'Cloud client must call safe store creation RPC');\nassert.match(cloudClient, /storeId \+ ':product'/i, 'Cloud import identifiers must be scoped per store');\nconsole.log('Cloud guardrails passed: tenant tables, RLS, auth/store RPC, and transactional inventory RPC checks.');
