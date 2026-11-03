# Phaenomenon

## Event switching and event schedule

Open [All events & schedule](production.html#/events) from the Production OS sidebar (or the **All events** button beside the event selector). The event index reads the same saved bookings as the classic studio workspace, with an **Event list** showing upcoming, past and undated events and a **Month calendar** with previous/next month, Today and Selected event controls. Select any event to open its guided builder directly. The **Switch event** selector remains available throughout each event workspace and updates the browser route to the newly selected event, so follow-on navigation remains consistent. The classic [Studio calendar](index.html#/schedule) is linked from the event index for broader diary needs.

All of these are local-browser views of your existing event data. No separate calendar database or cross-device sync is created.



## New: Guided Event Builder, equipment links and local recovery

**Start here:** [Event Builder](production.html#/builder) — the central place to create an event and move through its stages, without duplicating the existing planners or requiring a rigid wizard.

**For Aaron’s first Windows test:** [Usability trial guide](USER_TESTING.md). It contains a short practical route and feedback prompts, using fictional event data.

The guided flow has seven independent steps:

1. **Event details** — name, date, client, type, status and basic brief. Create a new event or client in Production and edit details inline.
2. **Venue & spaces** — choose reusable venues and spaces or create missing ones inside the current workflow.
3. **3D design** — open the existing spatial planner to position equipment and model the event.
4. **Equipment kit** — review and allocate stock; reconcile quantities of catalogue-linked objects with the event kit, without deleting other assignments. Link scene objects to existing stock, create clearly empty placeholders or intentionally exclude non-hire features.
5. **Technical connections** — retain existing DMX, power, network, audio and video planners.
6. **People & responsibilities** — assign event roles, reporting lines and installation tasks.
7. **Review & publish** — review changes and issue revisioned crew packs without conflating planning completion with technical approval.

**Recent workflow improvements:** The 3D planner now uses the same **non-destructive kit reconciliation** as the Event Builder: matching placed equipment raises insufficient allocations but never deletes other kit items or reduces larger manually planned quantities. Its inspector can mark permanent scenery and other venue-only objects as **not part of the kit**. In the Builder, optional **Planning assumptions & estimated costs** keeps event environment, complexity, guests, lighting zones and rough crew hours/rates editable without crowding the main form. A direct **Event Builder** link returns from the 3D planner to the relevant event.

**Crew-pack propagation:** Published snapshots now capture the event kit and relevant linked equipment specifications. Changing an equipment model or catalogue power assumption produces an explicit revision warning and resets affected previously completed installation tasks on publication, while preserving genuinely unchanged tasks. Kit quantity changes still require revision review but do not unnecessarily reset unchanged physical placement checks.

**Show schedule:** Existing show cues can now be edited or removed. Editing a completed cue sets its status back to **Planned**, and removing a cue leaves other cues and draft lighting looks intact. This schedule is descriptive only; it is not a control surface for live equipment.

The steps are **non-blocking**: jump to any stage, change a draft, return later and use the suggested next step. Event details, venue setup, equipment logistics and publish review can open inside the Builder. Specialist 3D and technical editors remain separate but connected.

**Browser persistence and recovery:** Both workspaces save to the same browser-local data model. The app now offers a visible local save indicator, limited best-effort browser recovery points, JSON export and validated JSON restore. These recovery points are subject to browser storage quotas and can disappear if browser data is cleared. They are **not central backups and do not synchronise Aaron’s computer with yours**. Export important work as JSON.

**Future shared backend:** [Proposed database and access model](supabase/README.md) includes a PostgreSQL/Supabase migration with multi-workspace membership, reusable Venue/Space records and default-restricted access policies. **The migration is not deployed or connected to the public demo.** Real user accounts, secure invitations, audited publication and cross-device synchronisation still require a configured backend and database-level permission tests.

The integrated regression suite uses Node 22 and the built-in test runner:

    node --test tests/*.test.mjs

The web prototype remains for demonstration and planning, **not** live technical safety assessment, verified stock reservation, signed compliance approval or production customer data.

---

## Mobile experience (November 2026)

The phone layout is a deliberate **task-first mobile view** of the same browser application, not a separate simplified product.

- **Production phone dock:** **Build**, **3D**, **Tech**, **Crew**, **More**. The current event stays available in a compact top selector. **More** opens a full-height navigation sheet containing Production, Directory, event settings, the equipment and fixture libraries, and Studio management.
- **Studio phone dock:** **Events**, **Build**, **3D**, **More**. The Events screen shows the selected event immediately with a compact **Choose event** control instead of forcing the user to scroll through every booking.
- **Focused screens:** The Event Builder uses short touch-friendly steps and a prominent suggested next action; deeper settings remain available in context. Production tabs are horizontally swipeable on narrow screens and wide technical tables scroll inside their panels.
- **Touch support:** Controls are sized for fingers; form text stays readable without iOS input-focus zoom; venue/event/cue dialogs open as bottom sheets; navigation and dialogs account for safe-area insets. The existing technical planner and multi-space editor retain all controls.
- **Accessibility:** More menus support backdrop/Escape dismissal and show the selected navigation section. Reduced-motion users are not forced through drawer transitions.
- **Limits:** The public site remains a local-first **website**. It does not yet sync or securely share work between phones and computers, save to a managed server, or guarantee recovery. Export JSON backups before relying on experimental changes. Opening it through another browser or a Home Screen shortcut may use a different local data store.

Useful links: [Phone Event Builder](production.html#/builder) · [Studio/Bookings](index.html#/bookings) · [Mobile usability guide](USER_TESTING.md).

Regression coverage: `node --test tests/mobile-ux.test.mjs` and `node --test tests/*.test.mjs`.

---

## Simplified navigation and focused workspaces (November 2026)

The classic Studio and Production views now use the same task-based information architecture. The main menus keep **Event workspace**, **Events** and **Studio overview** immediately accessible; specialised links sit in expandable groups:

- **Plan & design:** 3D planner and technical connections.
- **Deliver the event:** Crew installation and Production (team, equipment, installation, show schedule).
- **Library & people:** Reusable Venues and Spaces, people and organisations, equipment and fixture library.
- **Studio management:** Projects, opportunities, calendar, clients, invoices and Settings.

The Studio sidebar has **Plan & design**, **Equipment library** and **Studio management** submenus, rather than a long flat list. Production offers **Plan & design**, **Deliver the event**, **Library & people** and **Studio management**. Both switch to an expandable vertical menu on smaller screens, instead of forcing users to scroll through a long horizontal bar.

Within **Events**, selecting a booking shows two focused tabs: **Event details** (including the saved Venue and selected Spaces) and **Equipment kit**. Switching tabs does not rebuild the unsaved form fields. Optional booking totals are behind a summary disclosure, while rebooking and invoice drafting remain under **More**. The selected event can be opened directly in the Production workspace or 3D planner.

The **Event overview** defaults to four primary tasks (3D design, connections, crew installation and production). Reusable Venue/Space configuration and extended progress detail can expand on demand. Production uses the short tabs **Team**, **Equipment & logistics**, **Installation** and **Show schedule**. Optional creation forms (assignments, show cues, draft looks and entity records) remain accessible but collapsed until needed. The starting-view preset and JSON backup live under **Options** in the Production header.

The legacy **Design → Connect → Review → Export** technical-planning sequence and its DMX, power and cable subtasks are unchanged. All data and actions remain available; this is an information architecture and presentation pass, not a new data model or a security update.

Navigation checks: `node --test tests/navigation.test.mjs`. Run the full suite with `node --test tests/*.test.mjs`.

---

## New: Connected Event Production workspace

**[Open the role-aware event production workspace](production.html)** · [Architecture and limitations](PRODUCTION_OS.md)

The existing **Design → Connect → Review → Export** stage lighting planner is retained. A new shared event workspace provides:

- Event-first, task-based navigation for design, technical, crew and production responsibilities.
- Casebook-style people, organisations, venues, spaces and event entity profiles, aliases and typed links, with event-specific roles and Back/Forward navigation.
- Versioned crew instruction packs generated from the existing venue, equipment, DMX and cable records.
- Area-specific printable installation diagrams, task completion, technical verification and issue reporting.
- Production readiness, assignments, run-of-show cues and draft creative lighting looks.
- A nested **event crew hierarchy** with in-charge, second-in-charge, team lead and helper positions, reporting-line editor, direct-report links, and protection against circular team structures. Each event has its own team tree.
- Change-impact review before a revised installation pack is published.
- Event-specific **load-in and return scheduling** with provisional equipment availability against overlapping confirmed bookings, including supplier-provided quantities and linked-layout checks.
- **Crew pack review tracking** per named team member and published revision, without treating it as a verified signature.
- Optional **video devices and video signal connections** in the existing 3D and technical planning workflows, with video/audio schematic topology views.
- Same-browser cross-tab update detection and safeguards against silently overwriting more recent work.

**Prototype limitation:** The new roles are UI presets, not security permissions. Data is stored in the same browser's local storage as the classic demo; other tabs on the same origin refresh changes, but there are no accounts, cross-device synchronisation or safety approvals. The Abbotsford Convent two-stage example and named demo crew are fictional/illustrative.

The new Production header includes **Export backup** for the entire local workspace. Keep a copy somewhere secure. This prototype does not create an automatic cloud backup.

To run the regression suites (Production, Venue/Space data, and Event booking pop-ups) with a recent Node.js installation: `node --test tests/*.test.mjs`.

---

**Event bookings, equipment planning and draft invoicing for a lighting business.**

Phaenomenon is an interactive, browser-based proof of concept for a small event-lighting studio working with repeat customers. It is intended as a starting point for Aaron to explore what an app tailored to his real workflow could look like.

**[Open the live demo](https://corporateslug.github.io/phaenomenon/)**

## The workflow

1. **Clients:** Create a reusable customer record in **Clients**.
2. **Events:** Select the customer, date, a **saved Venue**, and one or more **Spaces** within it. Use **+ Create venue** to create a missing Venue and its first Space in a pop-up without losing the event form. If the Venue already exists but a Space is missing, use **+ Create missing space** to add it to that Venue and then select it for the event. Lighting zones are separate kit-estimation inputs.
3. **Space planner:** Open **3D space planner** from an event. Work with reusable Venue geometry and the Spaces assigned to that event, edit floor boundaries and roofs, position lighting, audio, video and technical equipment, and plan the corresponding power, network, DMX, audio and video connections. New Spaces created in the planner join the current event and remain reusable at that Venue.
4. **Equipment:** View a **suggested starting kit** based on those parameters. Select **Apply suggestions**, then review and edit every quantity. You can update owned stock and hire prices in **Equipment**.
5. **Availability and pricing:** The kit shows an indicative cost and flags when the assigned quantity exceeds owned stock after subtracting equipment allocated to other **confirmed events on that same date**.
6. **Invoicing:** Choose **Draft invoice** from the event. Edit item descriptions, quantities and unit prices, select GST treatment, save, and use your browser's Print / Save as PDF function. Manually record whether an invoice was issued externally or paid.
7. **Repeat booking:** Select **Rebook** to make a new event for an existing customer with a copied kit, venue layout and editable dates.

The original design-project, fixture-specification and pipeline example sections remain available to explore, but event operations are now the primary workflow.


## Lighting fixture library and optical controls

The 3D planner now has a **fixture-family picker**: select **Lighting fixture** in the scene palette to choose an LED PAR, Fresnel, profile spotlight, moving wash, moving spot, LED batten, stage blinder or followspot. Each family has a distinct SVG icon in the equipment list and a different simplified 3D housing/lens silhouette.

- **Saved per-item optics:** Type, orientation, pan, downward tilt, beam spread, throw range, intensity and light colour or colour temperature persist with the event layout. Existing generic lights migrate to a PAR starting profile without losing their saved aiming or placement settings.
- **Capability-aware controls:** Profile-dependent zoom ranges, moving-head aiming, colour vs variable-white controls, iris on compatible spots and followspots, four illustrative framing shutter inputs on profiles, gobo-style preview and edge softness. Changing a family applies its starting parameters without changing the item's venue coordinates.
- **3D preview:** The beam's colour, direction, spread, approximate aperture, iris and intensity affect its translucent cone and floor footprint. The fixture body is aimed separately from whole-item rotation. Colour swatches and sliders update the model while editing.
- **Manufacturer data:** The built-in presets are *examples of fixture families*, not validated technical limits for a specific product. A future version should import verified manufacturer models and optical parameters (for example GDTF fixture data). Light coverage is visual-only, not a photometric simulation. Do not derive electrical capacity, safe exposure or rigging approval from these models.

## Space planner: what is working now

- **Reusable venue geometry:** Existing records are automatically given rectangular footprints without erasing events or equipment data. New venues can be indoor or outdoor. Resize the site dimensions to scale a saved footprint across bookings.
- **Irregular floorplans:** Choose rectangular, L-shaped, U-shaped or angled starting shapes. Click **Edit corners on plan** to switch to top view, drag numbered vertices, add a corner on the longest boundary edge or enter exact X/Y measurements. You can remove selected corners. Validation rejects self-intersecting, collapsed or out-of-bounds polygons.
- **Roofs and outdoor sites:** Set **No roof (open sky)**, **Flat**, **Single slope**, **Pitched/gable** or **Custom corner heights**, choosing the slope direction and individual elevations in metres. Outdoor is roofless by default, but an open-air venue can optionally have a schematic overhead roof/canopy. Roof geometry is a transparent visual guide, not a structural model.
- **Real 3D viewport (Space Planner 2.0):** Uses Three.js WebGL when available, with **Top**, **Iso** (orthographic) and **Perspective** cameras. Drag empty space to orbit, Shift-drag/right-drag to pan, and use the wheel to zoom after clicking to activate the viewer. The zoom/fit buttons work without activation. Move placed objects or switch to **Rotate** to change their facing, with Shift for 15-degree angle snapping. Venue measurements appear as unobtrusive dimension lines and labels can be toggled. In the right inspector, set equipment rotation and, for lights, pan, downward tilt, beam angle and range. Toggle translucent, *illustrative* light cones with **Beams**. Model changes continue to use the existing event and venue records. If WebGL or the rendering library cannot load, the previous schematic canvas remains available. This is not yet CAD/BIM, photometric simulation or a verified lighting design. Sloped floors, curved surfaces, separate overlapping roofs, interior obstacles and multi-storey features are not yet modelled.
- **Equipment categories:** Fixtures, audio, power, network, control, rigging, stages and generic objects. Items can be dragged or positioned numerically; after a venue shape change, equipment outside the new perimeter is moved back into the footprint. Mapping items to the equipment catalogue allows copying quantities to the event's billable kit.
- **Preliminary cable routes:** Connect any two objects with power, network/Ethernet, DMX or audio runs. The algorithm finds a shortest unobstructed route *within the 2D footprint*, including detours around concave exterior corners, then adds vertical travel and configurable slack. It suggests a nominal single cable length and totals metres by type. It cannot detect real interior walls, cables through doorways, truss routes, elevated cable trays, outdoor site hazards or separate room transitions; real routes may be longer or require different cable segments and hardware.
- **Sample layout:** Fictional Harbour Hall has placed objects and example connections. All site measurements, mounting-point heights, outlets and equipment specifications must be verified.

**Planning and safety:** The tool is schematic only. Light-beam cones are directional illustrations only, not calculations of lux, photometric distribution, beam occlusion, coverage or safety. Its outputs are not a technical lighting design, a rigging approval, a network feasibility check or an electrical design. It does **not** assess phase balancing, protection, voltage drop, network bandwidth, IP/weather rating, wind exposure, structural loading, exit clearance or Australian electrical and event safety obligations. All relevant measurements and routes require on-site checks and appropriate qualified review before use.

## The equipment recommendation model

The current calculation uses simple **illustrative heuristics** involving audience size, lighting zones, event type, indoor versus outdoor and complexity. It populates recommendations for LED washes, moving-head spots, uplights, outdoor-rated washes, a lighting controller, stands, power distribution and cable runs. Quantities can be overridden freely.

These recommendations are **not a technical lighting design, an electrical load assessment, an inventory reservation system or a rigging safety assessment**. They require verified inventory, Venue/Space layouts, equipment specifications, power infrastructure, safe-work practices and installation plans before commercial use. The simplified legacy booking availability estimate is same-date only; the Production workspace adds a provisional load-in/return window check.

## Billing: what works and what doesn't

- Create draft invoices manually or from an event's current kit and estimated crew hours.
- Edit invoice lines, numbering, customer, dates and notes.
- Choose 0% GST or 10% GST *only when applicable to the actual business*.
- Track Draft, Issued externally and Paid statuses manually.
- Print/save a **demo-marked draft** as PDF from the browser.

**There is no email delivery, payment collection, accounting integration, automated reconciliation or compliant production invoice issuance.** Printed pages are deliberately labelled demonstration drafts. Before real invoicing in Australia, actual legal entity name, ABN, GST registration/tax treatment, customer details, bank/payment instructions and invoicing requirements need to be implemented and verified.

## Run locally

The app is plain HTML, CSS and JavaScript with no build tools or server-side dependencies. The enhanced 3D viewer imports the pinned **Three.js 0.174.0** library from jsDelivr (falling back to unpkg), so an internet connection is required for the WebGL renderer. If it is blocked, the built-in schematic viewer remains available.

```bash
mkdir -p ~/Documents/GitHub
cd ~/Documents/GitHub
git clone https://github.com/CorporateSlug/phaenomenon.git
cd phaenomenon
python3 -m http.server 8000
```

Open **http://localhost:8000/**. If you have already cloned it, run `git pull` inside the `phaenomenon` directory instead of cloning again. GitHub Pages publishes automatically from the repository's `main` branch when configured in **Settings → Pages**.

## Data storage and privacy

This is a single-browser, local-first demo using `localStorage`. **Changes do not sync across users, devices, or the live and local versions**, and they may disappear if browser storage is cleared. Use **Settings → Export JSON** to save a copy and **Import JSON** to load it on another browser. Updating the code normally preserves browser-stored demo edits; resetting the demo deliberately restores fictional sample data.

**All sample customer names, addresses and costs are fictional. Do not put real client, commercially sensitive, banking or private data into this demo.** The repository is public and contains no login or protected database.

## Suggested next steps with Aaron

- Build out his actual inventory, kits, gear categories and hire rates.
- Ask for two or three recent events and reconstruct which parameters led to the equipment selected, including add-ons and exceptions.
- Add multiple separate building/roof shapes, sloping terrain, interior obstacles, floorplan/CAD imports, editable cable waypoints, power-circuit data, weather and wind exposure checks, rigging verification, multi-day availability and dispatch workflows.
- Support repeat-customer pricing, equipment add-ons, quotes, deposits, payment reminders, and (eventually) compliant invoices integrated with an accounting provider.
- Move data to an authenticated, access-controlled backend before real customer use.

See [VISION.md](VISION.md) for a longer product and engineering roadmap.
## Technical planning (linked event systems)

The Space Planner now uses a **four-step guided workflow**, following the same progressive-disclosure pattern as SlugSync: **1. Design → 2. Connect → 3. Review → 4. Export**. Each step has short instructions, forward/back navigation and optional direct jumping to earlier steps. The earlier six top-level technical views are preserved as focused tasks inside these four steps, rather than competing navigation tabs.

1. **Design:** Choose an event and venue, model the floorplan/roof, add and aim equipment in 3D. When ready, continue to Connect.
2. **Connect:** Complete the three small tasks in order: **DMX patch**, **Power circuits**, then **Cable runs**. Existing technical editors and detailed manufacturer inputs remain available, with advanced cable settings collapsed.
3. **Review:** Read automatically generated DMX and power connection diagrams and exceptions. Use direct **Edit DMX**, **Edit power**, **Edit cables** or **Move fixtures** shortcuts to make corrections.
4. **Export:** Review the installation checklist and print the crew pack (including connection maps), or export a CSV schedule.

The event, fixture positions, physical cable connections, DMX addresses, power assignments and reports all share the same underlying data. Changes in the 3D model automatically update cable length estimates and regenerate the map/reports. Workflow position is remembered with the event in browser storage, but visiting a stage does **not** mean its technical checks have passed. Users can move between any stages without blocked steps.

- **DMX:** Enter real fixture mode footprints, choose universes and assign starts. Automatic addressing only works on enabled devices with entered footprints. Locked addresses are preserved. Collisions and addresses exceeding 512 are flagged. DMX physical topology is defined by actual cable connections, not inferred from address order.
- **Power:** Enter circuits with user-defined voltage, current limit and warning threshold; assign each device and optionally supply rated current. Values calculated from watts/voltage are rough estimates only and do not account for power factor, protection or installation rules.
- **Cables:** Connect placed devices by system, set connector, physical allocated length, direct/piggyback designation and optional supplier. The geometry engine proposes length with slack; warnings flag allocated cables shorter than the estimated run and configured length limits. No unstated manufacturer or electrical limits are assumed.
- **Power + data map:** Separate diagrams show *explicit* connection topology per DMX universe and circuit. Items without connections remain visible; they are not silently daisy-chained.
- **Install pack:** Review the latest fixture patch, circuit loads and cable schedules. Print a crew-facing document or export a CSV. The checklist is locally stored with the event.

**Privacy:** The public demo is populated with fictional data. Aaron's supplied supplier list, workbook and event plan are not published to this repository. Future import tools should explicitly ask the operator before saving private event or supplier information.

**Safety:** All figures are planning aids. The application does not establish safe loading, electrical compliance, structural/rigger certification or photometric accuracy. Verify the physical equipment specifications, power distribution, cable routing and local regulations with competent personnel before installation.

## Reusable Venues and Spaces

**Consistent terminology:** **Venue** is a reusable site or location. **Space** is a modelled room, hall, courtyard, stage area or other subdivision inside that Venue. **Event** selects a Venue and the Spaces it uses. Lighting **zones** remain separate equipment-planning inputs.

The **Events** booking form now uses a Venue selector and a multi-select Space list, replacing free-text Venue entry. Choosing **+ Create venue** opens a pop-up to name the Venue and create its first Space, with dimensions and indoor/outdoor type. Choosing **+ Create missing space** opens a pop-up that adds a new Space to the existing Venue without duplicating it. These workflows are also available under **Event home → Venue & spaces** in Production.

A Space saved to the Venue library can be added to other events later. Newly created Spaces are **not silently added to previously configured events**, and event-specific equipment stays separate from the reusable Venue model. If an event already has placed equipment, changing Venues requires confirmation and an explicit layout review before another crew pack is published. A Space containing placed equipment cannot be deselected until the items have been moved or removed.

Venue, Space and Event entity profiles remain distinct. The event entity has typed **Uses space** links only to its selected Spaces.

---

## Multi-space venues and Abbotsford Convent demo

Open **3D Space Planner → Try two-stage demo** to load **Abbotsford Convent · Indoor + Outdoor demo**. This creates a sample event and reusable venue containing:
- One **indoor stage** with a roof profile, equipment, DMX node and independent power distribution.
- One **outdoor stage** with open sky, its own equipment, DMX node and independent power distribution.
- An **illustrative between-space site pathway**, used by a cross-area network cable. Estimated lengths go from equipment to the defined passage and then to the destination, instead of straight through the site. Route lengths update when equipment moves.
- A **Whole venue / Indoor stage / Outdoor stage** switcher above the 3D viewport for whole-site or focused editing.
- **Edit spaces** to update independent area position, size, environment, roof and a starting footprint template. Additional areas and provisional shared cable pathways can be added.

This demo uses **invented dimensions, relative positions, equipment choices, cable pathways and electrical planning assumptions**. It is **not** a surveyed representation of the Abbotsford Convent and does not contain Aaron's private supplier or event data. Real paths, accessibility, room geometry, approved power sources and cable protection must be verified on site.

In **Review**, the Power + Data Map includes between-space network connections alongside DMX, power, audio and video topology. In **Export**, the install pack lists fixtures by Space and flags unsurveyed connections. Each Space is saved under its reusable Venue and can be linked to multiple events.

Single-area venues still work unchanged; adding a second space is optional and does not erase existing placements.

