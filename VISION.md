# Phaenomenon · connected event production

**Product direction (November 2026):** Phaenomenon is evolving from a lighting-studio demo into an integrated, task-driven event production workspace. The goal is a **single event model**, not one universal screen or a loose bundle of specialist apps.

The core system should maintain reusable canonical records for **people, organisations, venues, spaces and events**; separate a product model, a physical equipment unit, and that unit's event allocation; connect each event's technical layout to its physical cable/power/data/audio/video systems; and relate all of that to production schedules, tasks, crews and show cues.

The experience is intentionally **progressively disclosed**: an event home asks what the person needs to accomplish. Design, Technical, Crew and Production expose different slices of the same data. Production itself is broken into People & team, Equipment, Installation and Show & cues; crew sees assigned tasks and approved-plan revisions, not the entire technical model. Selecting a view is not a security boundary.

Key rules:

1. **Identity is not a role.** A person can be a technician, helper, organiser or leader depending on the event. Reporting hierarchies are event-specific.
2. **Physical, logical and temporal models remain distinct but connected.** A fixture position, a cable connection, a show cue and a crew assignment must be related without being the same record.
3. **No invisible propagation of safety-critical instructions.** Revisions are published after review. Unchanged installation tasks may retain completion; changed tasks need new checks and pack reviews.
4. **Actual safety sign-offs require real expertise and authenticated authority.** Early prototypes must not turn a checkbox or calculated wattage into a safety approval.
5. **Import and integrate rather than recreate everything.** Video/audio routing and creative lighting looks are provisional. Future GDTF/MVR interchange, console/TouchDesigner interfaces, and professional CAD integration must be validated against actual tool support.
6. **An event can span stages, rooms, dates and suppliers.** Reusable venues share physical data, while each booking has independent equipment allocation, team, run sheet and issued documents.

The current incremental implementation is documented in [PRODUCTION_OS.md](PRODUCTION_OS.md), with regression checks in [tests/production-os.test.mjs](tests/production-os.test.mjs). Remaining major engineering work includes secure shared storage, verified identities and permissions, per-asset stock tracking, formal change acknowledgements, auditable publishing, realistic audiovisual device modelling and professional import/export standards.

---

# Phaenomenon: unified event production

## Current direction: connected event production (November 2026)

Phaenomenon is now being developed as an **event-centred technical and creative production workspace**, not only a lighting calculator or a studio admin app. Preserve the existing 3D planner and its guided **Design → Connect → Review → Export** workflow as the specialist technical foundation.

**Core product principles**

1. **One connected event model:** Event, venue, spaces, actual equipment, reusable catalogue models, signals, power, crew, suppliers, creative looks and schedule are separate but linked records. Do not duplicate an entity because it plays a different role at another event.
2. **Role determines the starting experience, task determines the interface, permissions determine what can change.** Designer, lighting technician, crew member and production manager access the same event through focused views. In the current prototype, role controls are only view presets, not permissions.
3. **Publish installation instructions deliberately.** Live layout changes must create an explicit pending revision, with a human-reviewed impact summary. Previous crew packs remain stable. Installation completion, technical verification and formal safety approval are different concepts.
4. **Build a complete project pathway:** Booking and brief → venue/3D design → power, patch and cabling → creative show looks and run-of-show → staff/equipment allocation → installation → review and handover.
5. **Retain interoperability:** Investigate GDTF/MVR scene and fixture exchange, verified manufacturer data and optional integration with TouchDesigner, lighting consoles and other stage/video/audio tools. Avoid attempting to duplicate entire professional applications.
6. **Make it work for different scales:** A one-room DJ night should be quick to plan; a two-stage festival should support independent areas, shared infrastructure and cross-area connections.

**Implementation status:** The additive [Production OS workspace](production.html) and [technical architecture notes](PRODUCTION_OS.md) demonstrate entity navigation, role-aware starting views, crew task assignment, published revisions, issue reporting, production assignments and draft show planning. The original studio booking, equipment and invoicing tools remain available. Test using `node --test tests/production-os.test.mjs`.

**Next engineering boundary:** Real shared use requires an authenticated backend, per-project access control, event/organisation membership, identity-attributed audit history, conflict handling, backups and privacy review. These cannot be achieved through frontend role presets or localStorage. Technical safety and regulatory compliance require independent qualified review; prototype calculations and invented venue infrastructure are not sufficient.

---

## Earlier roadmap (retained for reference)

# Phaenomenon: event lighting operations first

**Updated product direction:** Aaron primarily works with repeat customers on events. The immediate product is not a generic architectural lighting-design workflow. It should help him book recurring events, translate a compact event brief into a practical draft equipment kit, check owned stock, produce event costing, and then prepare invoice drafts.

## Near-term priorities

1. Real equipment catalogue with stock counts, hire rates, kit templates, ownership versus subcontracted gear, and condition/maintenance.
2. Event intake: repeat customer, venue, dates/times, event type, audience, lighting zones, scope, budget, crew and technical constraints.
3. Explainable, adjustable equipment suggestions tuned to Aaron's real decision rules rather than an invented universal algorithm.
4. Availability with full date/time interval overlap, dispatch/return buffers, transport and kit reservations.
5. Quotes and invoices: correct Australian business and tax details; customer-specific price rules; progress payments, deposits and credit notes; email and payment provider/accounting integration after authentication.
6. Printable equipment picklists, venue setup notes and job packs.

**Current prototype limitations:** The suggestions are illustrative, stock conflicts are same-date only, all demo data is stored in the browser, and the invoice PDFs are intentionally marked as non-production drafts. Safety-critical decisions (power, rigging, suitability and venue compliance) must be checked by a qualified human.

---

## Original broader design-studio roadmap (retained for reference)

# Phaenomenon: product vision and engineering roadmap

## Product hypothesis

A lighting design practice often has the same information scattered across project folders, inboxes, quotes, notes, spreadsheets, fixture schedules, drawings and supplier communications. A deliberately integrated studio workspace could make the complete story of each project visible, from initial lead to commissioning and handover.

The goal is **a single source of context**, not a collection of unrelated tracking screens. Each piece of information should have a reason to exist and a relationship to a client, site, project, deliverable, fixture, document or decision.

This prototype demonstrates interaction and information architecture, **not** the full operational correctness of a commercial system.

## Primary workflow

1. **Enquiry and qualification**: who is asking, site, type of work, project value, scope, decision maker, next action.
2. **Proposal and award**: fee proposal, versions, assumptions, exclusions, approvals, conversion to an active project.
3. **Brief and concept**: client priorities, ambience, rooms/zones, visual references, design intent, constraints.
4. **Design development**: drawings, reflected ceiling plans, calculations, fixture schedule, control philosophy, revisions.
5. **Coordination and procurement**: product alternatives, suppliers, cost comparison, lead times, approvals, purchase orders, RFI tracking.
6. **Installation**: site inspections, milestones, contractors, punch lists, commissioning, change tracking.
7. **Handover and support**: as-built documents, scene settings, warranties, defects and maintenance contact.

## Core concepts to model

| Entity | Important relationships / fields |
| --- | --- |
| Client / organisation | Contacts, roles, preferred communication, billing details |
| Opportunity | Owner, client, site, value, probability, stage, history, proposal versions |
| Project | Client, site, scope, stage, roles, budget, milestones, revision index |
| Zone / space | Project, floor/area, intended atmosphere, lighting requirements |
| Task / milestone | Assignee, project, deliverable, due date, blockers, status |
| Fixture / product | Manufacturer, SKU, cut sheet, optics, CCT, CRI, driver, rating, lead time, price, version |
| Project fixture schedule | Fixture, project, zone, quantity, finish, driver, alternates, approval, order status |
| Document | Project, type, revision, author, issue purpose, source file, approval status |
| Decision / RFI | Author, context, question, response, due date, linked drawings and versions |
| Supplier and purchase order | Lead time, unit costs, currency, tax, order status, delivery, warranty |
| Estimate / quote | Version, line items, assumptions, GST, exclusions, acceptance |
| Time and expenditure | Person, task/project, date, rate, cost, approval, invoicing status |
| Event | Project, site, attendees, crew/consultants, date, notes |

## What would make it genuinely useful?

### One project, many connected perspectives

Project managers want deadlines and costs; designers want the design brief, product data and drawings; installers need the latest approved schedule and site tasks; business owners need workload, fee forecasts and margin. These should all be views of connected records rather than separate copies.

### Traceable decisions

If someone asks “why did we switch that luminaire?” there should be a record of the source specification, alternative, reason for change, approver, date, affected zone and documents. The audit trail should carry forward into the final handover pack.

### Source-backed product information

A luminaire record is incomplete without a manufacturer source link, sheet version and date of verification. Supplier pricing is time-sensitive, may change and should never be silently substituted for a validated quote. Specs should distinguish confirmed information from assumptions.

### Gentle operational intelligence

Useful automated prompts could include: fixture lead time exceeds installation date; an RFI is holding up a drawing issue; one project's procurement dates overlap another's crew allocation; an estimate no longer matches the approved schedule; a client hasn't approved a revision. Avoid claiming AI capabilities without an actual integration.

### Simple, useful reporting

Track conversion by lead source, expected fee income, committed versus potential work, project stage aging, overdue deliverables, budget variance, product lead-time risk, capacity over upcoming weeks and unfinished handovers. Define financial metrics carefully, including what is gross, net and GST inclusive.

## Suggested architecture after validating the prototype

**Client:** TypeScript + React, with an accessible component library, typed forms, a route system and proper automated UI tests. Move the current plain JavaScript data operations into typed domain functions before adding more screens.

**Backend:** A relational database (for example PostgreSQL) with project, people, permissions and immutable audit events. Prefer managed infrastructure initially. Define row-level access per organisation and project and test it.

**Files:** Secure object storage for drawings, PDFs, cut sheets and photos, with versioning, content types, malware checks, access control and retention rules. Do not store document binary data inside ordinary database text rows.

**Auth:** Organisation accounts, project membership and role-scoped access. Keep supplier/client portal permissions separate from internal staff permissions. Use established authentication infrastructure rather than hand-rolling password storage.

**Integration adapters:** Optional accounting, calendar, email, document and supplier systems, with explicit consent, bounded sync and verifiable provenance. Do not build integrations before their workflows have been validated with real users.

**Quality:** Schema migrations, backups/restore drills, end-to-end tests, access-control tests, observable error reporting and a clear data export path. Never auto-publish a prototype with customer data.

**AI, optionally:** Ingest user-approved and access-controlled source material, preserve citations, allow corrections, and require human review before changing an estimate, sending supplier communication or issuing drawings. AI can summarise design briefs and draft checklists but should not invent photometric/engineering compliance.

## Delivery phases

### Phase 0: Validate needs with Aaron (current)

- Walk through this demo together.
- Record 5–10 actual problems, including repeated admin, mistakes and workarounds.
- Understand whether the studio focuses on architectural work, entertainment/events or a blend.
- Rank each workflow on frequency, pain, uniqueness and complexity.

### Phase 1: Studio MVP

- Organisational accounts, clients, projects, tasks, phases, calendar.
- Editable brief and reliable document links.
- Custom project statuses, comments and audit history.
- Import/export, backups and basic dashboard.

### Phase 2: Lighting-specific differentiation

- Zones, product/fixture library, annotated schedule and alternates.
- Provenance-aware product data and supplier quotes.
- Costed schedules, approval checkpoints and revision history.
- Drawing/RCP links and handover outputs.

### Phase 3: Business operations

- Pipeline and proposal versioning, fee tracking, expenses and timesheets.
- Procurement, lead-time checks, order status and site task coordination.
- Role-based portals for clients, consultants and installers.
- Accounting/calendar integrations only when justified.

### Phase 4: Higher-order intelligence

- Cross-project capacity planning and profitability.
- Automated change-impact flags and review workflows.
- Source-backed project search, templates and contextual drafting assistance.

## Architecture principle: progress without lock-in

Keep data models separate from UI. Use stable IDs and explicit relationships; avoid copying entire fixture records into every job. Save provenance, revisions and who made changes. Build easy import/export. Resist adding dozens of AI features before the underlying records and permissions are reliable.

## If Aaron works in stage or event lighting

Replace the architectural default with a parallel workflow:

- Leads → show/event → venues and production dates → design/plot → equipment allocation → prep/hire → load-in → show → load-out.
- People: production manager, LX designer, operators, technicians, crew, vendors.
- Assets: fixtures by serial/unit, availability, maintenance, cases, rentals, transport.
- Documents: lighting plot, DMX patch, power and circuit, cues, channel/fixture modes, technical rider, revisions.
- Commercial: equipment hire, labour days, trucking, overtime, deposits and cross-show conflicts.

The shared foundation is still clients, projects, scheduling, resources, documents, communication, estimates and decisions.

## Responsible data handling

Before real customer use: choose a data controller and privacy policy, determine hosting jurisdiction and retention expectations, implement tested account permissions, backups, encryption in transit and at rest, meaningful logs, breach-response processes, and export/deletion paths. Ensure actual commercial proposals and invoices comply with applicable tax and consumer obligations. Lighting design calculations and compliance decisions should remain under qualified human review.


## Venue models, layout planning and cable routing (prototype delivered)

The initial space planner is available under **3D space planner**. Its simplified isometric canvas maintains true X, Y and Z coordinates (in metres) for equipment placements inside dimensioned rectangular rooms, with a top-down view for layout editing. Venue dimensions are reusable records, while placed objects and cable runs are event-specific. Repeat-booking duplication copies its event layout as a starting point. Event equipment kits can be explicitly updated from catalogue-linked placed objects.

The first-pass cable estimate assumes drops to the floor, right-angle travel along the floor, rises to targets and configurable slack. It does not take actual approved routes into account. A future route engine should support user-drawn waypoints, overhead cable paths, cable trays, obstacles, connector/power compatibility, real reel lengths and labels for pack lists. Do not equate a summed fixture wattage with safe circuit loading.

Next engineering phases:
1. **Measured venue capture:** wall segments, polygon rooms, obstacle locations, existing network/power outlets, uploaded floorplan and photo calibration. Keep uncertainty in measurements explicit.
2. **Genuine 3D asset models:** real equipment footprints, elevations, truss geometry and fixture orientation with snap-to-surface controls. Consider a render engine only after core data contracts settle.
3. **Physical cable graph:** route waypoints, cable type/connector family, reel inventory, distribution, patch points, protocol limits and safe working plans reviewed by qualified contractors.
4. **Job and commercial integration:** event layout -> assigned inventory -> pick list -> dispatch/returns -> custom quotation -> deposit -> compliant invoice and payments.
5. **Production backend:** Authenticated users, business-scoped access control, version history and shared collaboration, plus eventual accounting integration.


## Flexible venues: implemented geometry prototype (November 2026)

The space planner now represents a venue using an editable 2D **simple polygon** footprint (local X/Y metres), plus an independent indoor/outdoor property and a schematic roof profile (none/flat/mono-slope/gable/custom heights). Perimeter points have stable identifiers, and legacy rectangular venues are upgraded non-destructively. Each event references a saved venue but has its own equipment placements and power/data/audio cable connections.

**Editing model:** Top-down drag handles and numeric coordinates, polygon validation, L/U/angled templates, vertex addition/removal, site resizing, per-corner custom roof heights and a projected orbitable 3D-style view. Equipment outside a newly edited footprint is relocated inside. For cables, a shortest 2D path inside the footprint uses visibility edges around concave corners, then adds the two endpoint elevation changes and a slack allowance. All calculations are estimates and must not imply certified installation paths.

**Next engineering milestones:** Replace the flat-floor-only representation with a measured terrain/floor elevation mesh; allow multiple separate structures and roof patches in one site; add doors, interior walls, columns, truss and obstacles; add editable cable waypoints/cable trays with types, routing rules and cable inventory; import floorplan images with scale calibration; import IFC/DXF or other 3D files through validated conversion; add viewer transparency controls and snap precision; introduce qualified electrical/rigging review workflows. Validation, permissions, backups, stable IDs, asset provenance and audit history are necessary before anyone relies on the results commercially.

## Space Planner 2.0 (November 2026)

A WebGL enhancement now provides orthographic top/isometric and perspective camera modes, orbit/pan/zoom controls, rotation of placed equipment, selectable fixtures, editable light pan/tilt/beam spread/range, and scene-aware dimension annotations. Three.js 0.174.0 is loaded from a pinned CDN with a fallback to the previous 2D schematic if unavailable. Data remains the existing local event/venue format, including new optional per-item orientation and beam properties.

This is a foundation, not photometric or rigging engineering software. Future work should add actual manufacturer photometry/IES files, realistic fixture dimensions, ceiling and roof geometry meshes, validated cable routing through defined pathways and obstacles, power-circuit and network capacity checks, better snapping and undo/redo, and on-site verification workflows.
