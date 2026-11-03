-- Phaenomenon shared-workspace foundation (DESIGN MIGRATION — NOT DEPLOYED)
-- Intended for Supabase PostgreSQL with auth.users and auth.uid().
-- DO NOT expose a browser service role/secret key.
-- Apply and review in a dedicated development project only, then run RLS tests.
-- Existing localStorage data is not migrated by this file.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.ph_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now()
);
create index if not exists ph_workspaces_owner_idx on public.ph_workspaces (owner_id);

create table if not exists public.ph_memberships (
  workspace_id uuid not null references public.ph_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','designer','technician','crew','viewer')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);
create index if not exists ph_memberships_user_idx on public.ph_memberships (user_id);

-- A SECURITY DEFINER function breaks circular membership/workspace policies.
-- It must be owned by a privileged migration owner that bypasses RLS.
-- Pin the search_path, schema-qualify every reference, and keep it OUT of exposed schemas.
create or replace function private.ph_role(p_workspace_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.ph_workspaces w
      where w.id=p_workspace_id and w.owner_id=(select auth.uid())
    ) then 'owner'
    else (
      select m.role from public.ph_memberships m
      where m.workspace_id=p_workspace_id and m.user_id=(select auth.uid())
      limit 1
    )
  end
$$;
revoke all on function private.ph_role(uuid) from public, anon, authenticated;
grant execute on function private.ph_role(uuid) to authenticated;

create table if not exists public.ph_venues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.ph_workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  geometry jsonb not null default '{}'::jsonb check (jsonb_typeof(geometry)='object'),
  created_at timestamptz not null default now(),
  unique (workspace_id,id)
);
create unique index if not exists ph_venues_unique_name
  on public.ph_venues (workspace_id,lower(trim(name)));
create index if not exists ph_venues_workspace_idx on public.ph_venues(workspace_id);

create table if not exists public.ph_spaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  venue_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  geometry jsonb not null default '{}'::jsonb check (jsonb_typeof(geometry)='object'),
  created_at timestamptz not null default now(),
  foreign key (workspace_id,venue_id) references public.ph_venues(workspace_id,id) on delete cascade,
  unique (workspace_id,id)
);
create unique index if not exists ph_spaces_unique_name
  on public.ph_spaces(workspace_id,venue_id,lower(trim(name)));
create index if not exists ph_spaces_venue_idx on public.ph_spaces(workspace_id,venue_id);

create table if not exists public.ph_equipment (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.ph_workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  category text not null default 'Other',
  owned_quantity integer not null default 0 check (owned_quantity>=0),
  rated_watts numeric(12,2) check (rated_watts is null or rated_watts>=0),
  hire_rate numeric(12,2) not null default 0 check (hire_rate>=0),
  profile_reference text,
  created_at timestamptz not null default now(),
  unique (workspace_id,id)
);
create index if not exists ph_equipment_workspace_idx on public.ph_equipment(workspace_id);

-- A document represents one event. The revision number is reserved for a
-- future transactional compare-and-swap API, NOT enforced by this prototype.
create table if not exists public.ph_event_documents (
  workspace_id uuid not null references public.ph_workspaces(id) on delete cascade,
  source_id text not null check (char_length(source_id) between 1 and 180),
  title text not null check (char_length(trim(title)) between 1 and 180),
  event_date date,
  document jsonb not null default '{}'::jsonb check (jsonb_typeof(document)='object'),
  revision bigint not null default 1 check (revision>=1),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key(workspace_id,source_id)
);
create index if not exists ph_event_documents_date_idx
  on public.ph_event_documents(workspace_id,event_date);

-- Publishing and installation require separate, later controls.
-- Issued revision records are read-only to ALL browsers until a reviewed,
-- authenticated server-side publication pipeline is implemented.
create table if not exists public.ph_published_revisions (
  workspace_id uuid not null,
  event_source_id text not null,
  revision bigint not null check(revision>=1),
  snapshot jsonb not null check (jsonb_typeof(snapshot)='object'),
  authored_by uuid references auth.users(id) on delete set null,
  issued_at timestamptz not null default now(),
  primary key(workspace_id,event_source_id,revision),
  foreign key(workspace_id,event_source_id)
    references public.ph_event_documents(workspace_id,source_id) on delete cascade
);
create index if not exists ph_revisions_event_idx
  on public.ph_published_revisions(workspace_id,event_source_id,issued_at);

-- Every exposed table gets explicit grants AND explicit RLS.
alter table public.ph_workspaces enable row level security;
alter table public.ph_memberships enable row level security;
alter table public.ph_venues enable row level security;
alter table public.ph_spaces enable row level security;
alter table public.ph_equipment enable row level security;
alter table public.ph_event_documents enable row level security;
alter table public.ph_published_revisions enable row level security;

revoke all on table
  public.ph_workspaces,public.ph_memberships,public.ph_venues,
  public.ph_spaces,public.ph_equipment,public.ph_event_documents,
  public.ph_published_revisions from anon, authenticated;
grant select,insert,update,delete on public.ph_workspaces to authenticated;
grant select,insert,update,delete on public.ph_memberships to authenticated;
grant select,insert,update,delete on public.ph_venues to authenticated;
grant select,insert,update,delete on public.ph_spaces to authenticated;
grant select,insert,update,delete on public.ph_equipment to authenticated;
grant select,insert,update,delete on public.ph_event_documents to authenticated;
grant select on public.ph_published_revisions to authenticated;

create policy ph_workspace_select on public.ph_workspaces for select to authenticated
using ((select auth.uid())=owner_id or private.ph_role(id) is not null);
create policy ph_workspace_insert on public.ph_workspaces for insert to authenticated
with check ((select auth.uid())=owner_id);
create policy ph_workspace_update on public.ph_workspaces for update to authenticated
using ((select auth.uid())=owner_id)
with check ((select auth.uid())=owner_id);
create policy ph_workspace_delete on public.ph_workspaces for delete to authenticated
using ((select auth.uid())=owner_id);

create policy ph_member_select on public.ph_memberships for select to authenticated
using (user_id=(select auth.uid()) or private.ph_role(workspace_id) in ('owner','admin'));
create policy ph_member_insert on public.ph_memberships for insert to authenticated
with check (private.ph_role(workspace_id) in ('owner','admin') and
  role in ('admin','designer','technician','crew','viewer'));
create policy ph_member_update on public.ph_memberships for update to authenticated
using (private.ph_role(workspace_id) in ('owner','admin'))
with check (private.ph_role(workspace_id) in ('owner','admin') and
  role in ('admin','designer','technician','crew','viewer'));
create policy ph_member_delete on public.ph_memberships for delete to authenticated
using (private.ph_role(workspace_id) in ('owner','admin'));

create policy ph_venue_select on public.ph_venues for select to authenticated
using (private.ph_role(workspace_id) is not null);
create policy ph_venue_insert on public.ph_venues for insert to authenticated
with check (private.ph_role(workspace_id) in ('owner','admin','designer'));
create policy ph_venue_update on public.ph_venues for update to authenticated
using (private.ph_role(workspace_id) in ('owner','admin','designer'))
with check (private.ph_role(workspace_id) in ('owner','admin','designer'));
create policy ph_venue_delete on public.ph_venues for delete to authenticated
using (private.ph_role(workspace_id) in ('owner','admin'));

create policy ph_space_select on public.ph_spaces for select to authenticated
using (private.ph_role(workspace_id) is not null);
create policy ph_space_insert on public.ph_spaces for insert to authenticated
with check (private.ph_role(workspace_id) in ('owner','admin','designer'));
create policy ph_space_update on public.ph_spaces for update to authenticated
using (private.ph_role(workspace_id) in ('owner','admin','designer'))
with check (private.ph_role(workspace_id) in ('owner','admin','designer'));
create policy ph_space_delete on public.ph_spaces for delete to authenticated
using (private.ph_role(workspace_id) in ('owner','admin'));

create policy ph_equipment_select on public.ph_equipment for select to authenticated
using (private.ph_role(workspace_id) is not null);
create policy ph_equipment_insert on public.ph_equipment for insert to authenticated
with check (private.ph_role(workspace_id) in ('owner','admin','designer'));
create policy ph_equipment_update on public.ph_equipment for update to authenticated
using (private.ph_role(workspace_id) in ('owner','admin','designer'))
with check (private.ph_role(workspace_id) in ('owner','admin','designer'));
create policy ph_equipment_delete on public.ph_equipment for delete to authenticated
using (private.ph_role(workspace_id) in ('owner','admin'));

create policy ph_event_select on public.ph_event_documents for select to authenticated
using (private.ph_role(workspace_id) is not null);
create policy ph_event_insert on public.ph_event_documents for insert to authenticated
with check (private.ph_role(workspace_id) in ('owner','admin','designer') and
  updated_by=(select auth.uid()));
create policy ph_event_update on public.ph_event_documents for update to authenticated
using (private.ph_role(workspace_id) in ('owner','admin','designer'))
with check (private.ph_role(workspace_id) in ('owner','admin','designer') and
  updated_by=(select auth.uid()));
create policy ph_event_delete on public.ph_event_documents for delete to authenticated
using (private.ph_role(workspace_id) in ('owner','admin'));

create policy ph_revision_select on public.ph_published_revisions for select to authenticated
using (private.ph_role(workspace_id) is not null);
-- No browser insert/update/delete policy for issued revisions until an audited
-- publishing endpoint and a compare-and-swap revision gate are implemented.

comment on table public.ph_event_documents is
  'Future authenticated event storage. App currently remains browser-local; not wired to this table.';
comment on table public.ph_published_revisions is
  'Append-only Data API history; revision sequencing and authorised publishing require a future audited transaction.';

commit;
