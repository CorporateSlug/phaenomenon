// Static schema guardrails only. This does NOT test live PostgreSQL RLS behavior.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const migration=readFileSync(new URL('../supabase/migrations/20261104000000_foundation.sql',import.meta.url),'utf8');
const tables=['ph_workspaces','ph_memberships','ph_venues','ph_spaces','ph_equipment','ph_event_documents','ph_published_revisions'];
test('Every browser-exposed future collaboration table explicitly enables RLS',()=>{
 for(const table of tables)assert.match(migration,new RegExp('alter table public\\.'+table+' enable row level security;'));
});
test('Migration revokes browser default grants before granting specific operations',()=>{
 assert.match(migration,/revoke all on table[\s\S]+from anon, authenticated;/);
 assert.doesNotMatch(migration,/grant\s+(select|insert|update|delete)[^;]*\bto\s+anon\s*;/i);
 assert.match(migration,/grant select on public\.ph_published_revisions to authenticated;/);
 assert.doesNotMatch(migration,/grant\s+[^;]*\b(insert|update|delete)\b[^;]*public\.ph_published_revisions\b[^;]*\bto authenticated;/i);
});
test('Membership helpers live outside public schema with pinned search_path',()=>{
 assert.match(migration,/create schema if not exists private;/);
 assert.match(migration,/function private\.ph_role\(p_workspace_id uuid\)/);
 assert.match(migration,/security definer set search_path = ''/);
 assert.match(migration,/revoke all on function private\.ph_role\(uuid\) from public, anon, authenticated;/);
});
test('Event documents and published revisions are separate with restricted writers',()=>{
 assert.match(migration,/create table if not exists public\.ph_event_documents/);
 assert.match(migration,/create table if not exists public\.ph_published_revisions/);
 assert.match(migration,/ph_event_update[\s\S]*with check \(private\.ph_role\(workspace_id\) in \('owner','admin','designer'\)/);
 assert.doesNotMatch(migration,/create policy ph_revision_insert/);
});
test('Tenant-aware venue to space foreign key prevents cross-workspace links',()=>{
 assert.match(migration,/foreign key \(workspace_id,venue_id\) references public\.ph_venues\(workspace_id,id\)/);
});
