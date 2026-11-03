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
| `productionOS.entities` | Canonical people, organisations, venues, spaces and event profiles; aliases and notes; deterministic links to the existing clients, Venues, Spaces and bookings. |
| `productionOS.relationships` | Typed entity edges, including source-derived venue/space and event/venue links and user-defined relationships. |
| `productionOS.assignments` | Event-specific person/organisation roles and Space responsibilities. Identity is independent of the role on a particular event. |
| `productionOS.teamHierarchy[eventId]` | Event-specific reporting hierarchy for people: a position such as In charge, Second in charge, Team lead or Helper; optional supervisor entity ID and responsibilities. Separate from job roles, identity and permissions. |
| `productionOS.packAcknowledgements[eventId]` | Local review markers tied to a person and crew pack revision. Not authenticated or signed approvals. |
| `productionOS.operations[eventId]` | Event load-in and return intervals used for preliminary equipment stock checks. |
| `productionOS.published[eventId]` | A numbered immutable-by-convention snapshot of the current venue layout, connections and technical records; corresponding instruction tasks, their statuses and archived revisions. |
| `productionOS.issues` | Reported discrepancies or problems tied to an event and optionally an installation task. |
| `productionOS.show[eventId]` | Lightweight run-of-show activities and optional links to creative lighting looks. |
| `productionOS.looks[eventId]` | Draft lighting looks with areas, colours, levels and effect concepts, not active console programming. |

**Asset separation:** the existing equipment catalogue (`equipment`), actual equipment quantities/stock, and an event's placed equipment items (`venuePlans[eventId].items`) are not synonymous. A future serial-numbered inventory layer can add individual physical asset IDs and reservations.

**Source data:** venues, clients, events and venue spaces are presented as canonical entities while the classic `venues`, `clients` and `eventJobs` records remain their sources. This avoids destructive migration of existing prototype data.

## Reusable Venues and Spaces

The user-facing terminology is now consistent: **Venue** (reusable physical site), **Space** (room, hall, courtyard or stage area within a Venue), and **Event** (one booking selecting a Venue and the Spaces it uses). Lighting zones and production teams are separate concepts.

The shared helper [venue-workflow.js](venue-workflow.js) powers both entry points. In **classic Event bookings**, the Venue is a saved-record selector, followed by checkboxes for Spaces used. **+ Create venue** opens a pop-up for a new Venue and first named Space. **+ Create missing space** adds a new Space to the *selected existing* Venue without duplicating the Venue or losing the event form. In **Production → Event home**, the same selection and creation flows are available. The classic 3D planner also uses the shared model.

Venue master geometry lives in `venues[]`, and its Spaces in `venues[].spaces[]`. The event stores `venueId` and `spaceIds[]`, while each event's movable equipment and connections live in `venuePlans[eventId]`. If an existing venue acquires a new Space, previously configured events do **not** automatically acquire it. An Event's entity profile has derived **Uses space** relationships only to Spaces selected for that Event.

Legacy single-space Venues are given one reusable **Main space**; venue names from old booking text are matched to existing Venue IDs instead of creating duplicates. Names are checked case-insensitively to prevent duplicate Venues or duplicate Spaces within a Venue. Moving an event with placements to another Venue prompts for confirmation and flags the saved layout for review. Publishing another crew pack is blocked while that review is pending. The review marker can only be cleared once all placed items have coordinates inside their selected Spaces; this is **not a technical safety certification**. An occupied Space cannot be removed from an event's selections until its equipment is moved or removed. Adding a non-selected Space does not by itself invalidate crew packs issued for unrelated Events.

Tests: [tests/venue-workflow.test.mjs](tests/venue-workflow.test.mjs) and [tests/venue-booking-ui.test.mjs](tests/venue-booking-ui.test.mjs).

---

## Navigation and screen complexity

Phaenomenon uses a short always-visible event core with expandable menus. **Events** are selected once and carried across Studio → Production deep links; workspaces represent tasks, not separate copies of the event. The user-facing structure is:

| Section | Content |
| --- | --- |
| Event | Event overview; event booking details and selected Venue/Spaces |
| Plan & design | 3D design; technical connections, including the retained Design → Connect → Review → Export sequence |
| Deliver the event | Crew installation and production operations |
| Library & people | Venue/Space library, entities and their event roles, equipment and fixture library |
| Studio management | Projects, opportunities, calendar, clients, invoices and settings |

The classic Studio sidebar offers **Plan & design**, **Equipment library** and **Studio management** submenus; the Production sidebar offers **Plan & design**, **Deliver the event**, **Library & people** and **Studio management**. On mobile the sidebar is a deliberate expandable vertical menu. The role-based starting view is optional and lives inside **Options**; it does not determine user permissions.

In Events, **Event details** and **Equipment kit** are two tabs backed by the same booking. The inactive tab is hidden rather than destroyed, so changing tabs preserves unsaved form fields. Booking KPIs, Venue/Space configuration, secondary progress reporting, entity creation, crew assignments, draft lighting looks and show cue forms use opt-in disclosures rather than occupying screen space at all times.

The Event overview intentionally shows just four task choices. Within Production, the four tabs are **Team**, **Equipment & logistics**, **Installation** and **Show schedule**; the technical planner's established four-step flow remains intact. This is progressive disclosure rather than removal of technical capabilities.

The navigation test suite is [tests/navigation.test.mjs](tests/navigation.test.mjs). It checks the menus, selected-event links, section tab behaviour, retained workflow links and reduced default clutter.

---

## User experience

**Event overview** provides four primary task choices rather than a wall of specialist tools (entity discovery is under Library & people):

1. **Design:** inspect the live multi-area venue and positioned equipment, then jump to the classic planner. Draft creative lighting looks.
2. **Technical:** inspect current fixture patch, power circuits and cable runs. Independently mark already-installed tasks as verified.
3. **Crew:** select an area and person, follow published installation instructions and diagrams, mark equipment installed, record review of a specific revision, report problems and print the pack.
4. **Production:** manage the event hierarchy and task assignments, check installation readiness, monitor crew pack reviews, compare preliminary gear availability against overlapping events, review issues and run-of-show cues, and publish new revisions.
**Library & people** (separate from the four primary tasks) supports people, organisations, Venues, Spaces and event records, with aliases, notes, typed relationships and Back/Forward navigation.

An optional starting-view selector under **Options** offers designer/lead, lighting technician, installation crew and production manager presets. These guide the starting screen only. Changing a view **does not** change permission.

To avoid an overwhelming production dashboard, Production now has four focused task tabs: **Team**, **Equipment & logistics**, **Installation**, and **Show schedule**. The selected tab is remembered in this browser. These are contextual work areas over the same event model, not separate copies of data.

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
- No manufacturing-grade 3D/CAD, acoustic simulation, photometrics, TouchDesigner node engine, console/DMX playback or live show control. New video/SDI/HDMI-style connection planning is illustrative and does not validate signal integrity or physical cable limitations.
- No certified cable/electrical planning, structural rigging approval, phase balancing, cable protection, RCD or weather safety verification.
- No production-ready invoices, payments or supplier procurement. Supplier quantities shown in the event model are unverified and are not real supplier reservations.
- No cross-device synchronisation or authenticated collaboration. Tabs on the same browser origin now detect saved changes and refresh; stale writes are blocked instead of silently overwriting newer data. This is **not** transactional collaboration. Still use JSON backups and avoid simultaneous live crew editing.

## Next engineering milestones

1. **Typed domain schema and tests:** migrate to TypeScript; formalise People, Organisation, Venue, Space, Event, PhysicalAsset, ProductModel, Allocation, Assignment, Connection and CrewTask with stable IDs.
2. **Durable storage and permissions:** authenticated organisations and project membership, role-scoped server actions, optimistic concurrency, backups, explicit approval identities and an audit log.
3. **Change-impact engine:** dependency graph for circuit/patch/cable/fixture/crew-task changes, reviewable diffs, controlled superseding of issued plans and acknowledgement by affected staff.
4. **Equipment and logistics:** advance the new date/time overlap and count checks into separate owned/hired stock, individual fixture/case tracking, supplier confirmations, dispatch buffers, packing and returns.
5. **Professional interoperability:** fixture sources, GDTF/MVR where appropriate, import/export validation, console/Tou​chDesigner interfaces behind explicit user controls.
6. **Production operations:** production calendar, call sheets, crew invitations, approval and issue escalation, offline read-only packs and sync conflict handling.

This is a proof of concept intended for usability testing with Aaron, not a deployable system for safety-critical production management.

## Latest integrated workflows

The new **Equipment and logistics** panel records load-in and return date/time windows, edits requested kit quantities, and checks against owned catalogue stock reserved by other **confirmed** overlapping events. Equipment allocated by suppliers is included as *expected* supply; it does not establish real supplier confirmation. If layout placements linked to the equipment catalogue exceed the event kit, the panel flags the discrepancy. These counts cannot prove venue, power, vehicle, delivery or inventory suitability.

**Crew pack circulation** records that a selected team member reviewed a specific published revision. Publishing a new revision archives previous task snapshots and requires a new review marker. These are in-browser organisational records, not verified identities or legal/safety sign-offs.

The scene planner now supports a **video equipment family** and HDMI/SDI-style video connections. The technical Review tab displays separate audio, video, Ethernet, DMX and power diagrams. They are schematic representations; the prototype does not process audiovisual signals or operate live equipment.
