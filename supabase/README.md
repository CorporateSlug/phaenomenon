# Phaenomenon · future shared workspace backend

**Status: preparatory schema only. Not deployed, not connected to the browser app, and not yet security-tested.** The current GitHub Pages prototype still uses localStorage. Its role selectors are view presets, not access-control permissions. Do not enter sensitive customer information.

This folder contains the first PostgreSQL/Supabase migration proposal for the stage after the event builder and browser-local workflows.

## Proposed access model

- A **workspace** has a signed-in, registered owner, connected to the authentication user ID.
- Membership roles are admin, designer, technician, crew and viewer. **A membership is not the same as a creative or technical event assignment.**
- Members can read their workspace. In the first migration only owners, admins and designers edit the full event document, venues and equipment. Technician and crew updates require later scoped endpoints.
- Published pack revisions remain **read-only to all browser roles**. A future audited server-side publish function must validate and issue the next revision transactionally.
- No anonymous grants exist for these tables. All exposed tables use explicit grants and Row Level Security. Helper functions use a non-exposed private schema and pinned search paths.

## Initial tables

| Table | Purpose |
| --- | --- |
| ph_workspaces | Workspace and owner |
| ph_memberships | Access membership and role |
| ph_venues | Reusable venue geometry |
| ph_spaces | Reusable spaces tied to their parent venue, with tenant-aware foreign keys |
| ph_equipment | Shared equipment catalogue and rough stock values |
| ph_event_documents | Current event documents and planning revision field |
| ph_published_revisions | Read-only snapshots of issued crew instructions |

This does not try to copy every prototype entity: people and organisations, per-asset stock records, crew assignments, show tasks, issues and audit logs require additional role-specific security rules.

## Mandatory work before connecting real users

1. Create a separate development Supabase project. Never paste service-role or secret keys into browser JavaScript, GitHub or chat.
2. Review the SQL migration, especially security-definer function ownership, exposed schemas and grants. Do not deploy it unreviewed to production.
3. Test every role and operation in the development database using pgTAP (supabase test db), including anonymous users, outsiders, revoked members, owners, admins, designers, technicians, crew and viewers. Check SELECT, INSERT, UPDATE and DELETE on every table and cross-tenant foreign keys.
4. Build a real invitation, identity verification and membership acceptance process. An email typed into a form does not grant permission.
5. Implement an authenticated event save API using an **expected revision** parameter and transactional compare-and-swap. Reject conflicting changes, and reconcile legacy browser IDs before importing.
6. Implement audited publication of crew packs, restricted task updates and immutable history. In-browser checkboxes cannot be treated as safety approvals.
7. Use private media buckets with workspace-scoped policies and expiring signed URLs; never put private client media on a public static site.
8. Implement backups, monitoring, recovery, revocation, retention, deletion/export and incident processes.
9. Only then launch a limited cross-device sync pilot with a clearly visible cloud/local state.

## What is already available

- The Event Builder uses stable event IDs and computed progress markers.
- Venues and spaces are reusable, with explicit event relationships.
- Production has event-specific roles, reporting trees, crew packs and revision acknowledgements.
- Browser recovery validates JSON and stores a few best-effort local recovery points. These are not off-device backups.
- Same-browser tabs detect changes, but different computers do not sync.

The migration remains deliberately disconnected from GitHub Pages. Aaron can try the app on Windows without an account, and his data will remain in his browser.

## Reference

Supabase guidance for explicit grants, RLS, non-exposed security-definer functions and role testing:

https://supabase.com/docs/guides/database/postgres/row-level-security

Guidance reviewed: 4 November 2026.
