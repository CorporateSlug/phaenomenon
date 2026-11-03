# Phaenomenon: event lighting operations first

The primary use case is **repeat-customer event bookings**, followed by equipment planning and invoicing. The previous architectural lighting project ideas are retained below as optional long-term possibilities, not the immediate priority.

## Practical next milestones

1. Populate Aaron's actual equipment inventory, kit templates, hire prices and stock levels.
2. Reconstruct two or three real jobs and determine which parameters he uses to select equipment. Replace the current demonstration-only rules with his own decision model.
3. Add event duration, equipment reservation windows, returns, maintenance, transport and crew planning.
4. Produce job packs, equipment picklists, site notes and check-in / check-out records.
5. Support customer-specific rates, quotes and deposits, then proper Australian invoice details and secure integration with his chosen invoicing/accounting system.
6. Move from browser-only local storage to a secured multi-user backend before real business use.

**Current limitations:** Gear suggestions are editable heuristics and not technical/safety validation. Stock checks compare same-date confirmed events only. Invoice PDFs are marked DEMO DRAFT and the app cannot send or collect payments.

---

## Broader design studio roadmap (retained from the first concept)

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