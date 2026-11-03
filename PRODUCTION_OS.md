# Phaenomenon · Connected Event Production (prototype)

## Entry points

- **Classic studio:** [index.html](index.html) — event bookings, equipment and invoicing, plus the existing four-step **Design → Connect → Review → Export** 3D/technical planner.
- **Connected event workspace:** [production.html](production.html) — task-oriented event homepage, role view presets, entity registry, crew installation and production operations.
- **Published demo:** When GitHub Pages is configured for the repository's main branch, the relative route is `/phaenomenon/production.html`.

The production workspace is **additive**. It does not replace existing project data or overwrite the classic technical planner.

## Data model

The prototype shares the existing `localStorage` key `phaenomenon-demo-v1`, with a namespaced `productionOS` object:

| Record | Purpose |
| --- | --- |
| `productionOS.entities` | Canonical people, organisations, venues, spaces and event profiles; aliases and notes; deterministic links to the existing clients, venues, areas and bookings. |
| `productionOS.relationships` | Typed entity edges, including source-derived venue/space and event/venue links and user-defined relationships. |
| `productionOS.assignments` | Event-specific person/organisation roles and area responsibilities. Identity is independent of the role on a particular event. |
| `productionOS.teamHierarchy[eventId]` | Event-specific reporting hierarchy for people: a position such as In charge, Second in charge, Team lead or Helper; optional supervisor entity ID and responsibilities. Separate from job roles, identity and permissions. |
| `productionOS.published[eventId]` | A numbered immutable-by-convention snapshot of the current venue layout, connections and technical records; corresponding instruction tasks, their statuses and archived revisions. |
| `productionOS.issues` | Reported discrepancies or problems tied to an event and optionally an installation task. |
| `productionOS.show[eventId]` | Lightweight run-of-show activities and optional links to creative lighting looks. |
| `productionOS.looks[eventId]` | Draft lighting looks with areas, colours, levels and effect concepts, not active console programming. |

**Asset separation:** the existing equipment catalogue (`equipment`), actual equipment quantities/stock, and an event's placed equipment items (`venuePlans[eventId].items`) are not synonymous. A future serial-numbered inventory layer can add individual physical asset IDs and reservations.

**Source data:** venues, clients, events and venue spaces are presented as canonical entities while the classic `venues`, `clients` and `eventJobs` records remain their sources. This avoids destructive migration of existing prototype data.

## User experience

**Event home** provides five task choices rather than a wall of specialist tools:

1. **Design:** inspect the live multi-area venue and positioned equipment, then jump to the classic planner. Draft creative lighting looks.
2. **Technical:** inspect current fixture patch, power circuits and cable runs. Independently mark already-installed tasks as verified.
3. **Crew:** select an area, read published installation instructions and diagrams, mark equipment installed, report problems and print the pack.
4. **Production:** manage the event team and role assignments, see readiness, review issues, maintain the run of show and publish new revisions.
5. **Entities:** search people, organisations, venues, spaces and events; add aliases, notes and relationships; drill into profiles with Back/Forward history.

A **starting workspace** selector offers designer/lead, lighting technician, installation crew and production manager presets. These guide the starting screen only. Changing a view **does not** change permission.

**Team hierarchy:** The Production workspace includes an expandable, nested reporting tree for the people working on an event. Each person appears once even if they have several event roles. Select a tree node to assign their position (In charge, Second in charge, Team lead, Helper, Crew member or Other), choose a supervisor and add optional responsibilities. Hierarchies belong to individual events; the same person can lead one show and report to someone else at another. Multiple independent team leaders are allowed. Self-supervision and reporting cycles are rejected. Removing a person's final event assignment removes their node from the tree, reconnects any direct reports to the removed person's supervisor, and preserves the underlying canonical person. A crew member's reporting contact appears in Crew, and their linked reporting relationships are navigable from their entity profile. The tree is an operational chart, not a security model or a replacement for formal safety and engineering authority.

**Task ownership:** Production managers can link each published installation task to a person assigned to that event. Crew can filter tasks by stage and by member, without creating duplicate people. An assignment outside a person's listed event area is flagged for review. These assignments are lightweight organisational records, not authenticated user accounts or actual access restrictions.

**Equipment suppliers:** Event role assignments can optionally specify a catalogue item and quantity supplied. This records who is expected to provide equipment, but does not yet reserve individual serial-numbered assets or verify supplier stock.

## Publication and change propagation

Design and current technical records remain editable in the classic planner. **Crew packs use a saved published snapshot** rather than reading those live records directly.

- Publishing generates installation tasks from the snapshot's placed equipment and cable runs.
- Each task has a stable identity and a fingerprint of its relevant geometry, device and connection details.
- Later venue/layout/patch changes create a visible *unpublished changes* state and a change-impact review in Design and Production.
- Publishing a revision archives the prior version. Only tasks whose relevant fingerprints changed are reset. Unchanged completed or verified tasks keep their statuses.
- The crew view clearly indicates the revision used. A pending draft change does not secretly rewrite that revision.
- Installation completion, technical verification and approval are different concepts. This prototype stores task states and dates; it **does not** provide authenticated sign-offs, identity attribution or safety certification.

## Abbotsford Convent demonstration

The demo contains an illustrative two-area venue named **Abbotsford Convent · two-stage concept**, with indoor and outdoor stages, placed equipment and a notional link between areas. The people and suppliers are fictional demo records. **No dimensions, power points, approved routes, structural capacities, site permissions or contacts are asserted to be real.**

## What is deliberately not done

- No synchronised accounts, invitations, backend, audit identity, real-time collaboration or enforced permissions.
- No complete manufacturing-grade 3D/CAD, acoustic simulation, photometrics, TouchDesigner node engine, console/DMX playback or live show control.
- No certified cable/electrical planning, structural rigging approval, phase balancing, cable protection, RCD or weather safety verification.
- No production-ready invoices, payments or supplier procurement.
- No cross-browser/synchronised migration; changing a tab or device can leave an old copy in memory. **Use one active tab and export JSON backups** from the classic workspace.

## Next engineering milestones

1. **Typed domain schema and tests:** migrate to TypeScript; formalise People, Organisation, Venue, Space, Event, PhysicalAsset, ProductModel, Allocation, Assignment, Connection and CrewTask with stable IDs.
2. **Durable storage and permissions:** authenticated organisations and project membership, role-scoped server actions, optimistic concurrency, backups, explicit approval identities and an audit log.
3. **Change-impact engine:** dependency graph for circuit/patch/cable/fixture/crew-task changes, reviewable diffs, controlled superseding of issued plans and acknowledgement by affected staff.
4. **Equipment and logistics:** owned vs hired stock, individually tracked fixtures/cases, date/time overlap, transport buffers, supplier commitments and picking/return workflows.
5. **Professional interoperability:** fixture sources, GDTF/MVR where appropriate, import/export validation, console/Tou​chDesigner interfaces behind explicit user controls.
6. **Production operations:** production calendar, call sheets, crew invitations, approval and issue escalation, offline read-only packs and sync conflict handling.

This is a proof of concept intended for usability testing with Aaron, not a deployable system for safety-critical production management.
