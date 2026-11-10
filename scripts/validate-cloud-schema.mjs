import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readFileSync('supabase/migrations/0001_initial_schema.sql', 'utf8');
const catalogTests = readFileSync('supabase/tests/0001_rls_catalog_checks.sql', 'utf8');

const requiredTables = ['stores', 'store_members', 'products', 'orders', 'store_settings'];
for (const table of requiredTables) {
  assert.match(migration, new RegExp('create table if not exists public\\\\.' + table + '\\\\b', 'i'), `Missing table: ${table}`);
  assert.match(migration, new RegExp('alter table public\\\\.' + table + ' enable row level security', 'i'), `RLS is not enabled: ${table}`);
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

console.log('Cloud schema static checks passed: 5 tenant tables, RLS, store RPC grants and core role policies.');
