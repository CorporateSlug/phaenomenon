# Phaenomenon

**Event bookings, equipment planning and draft invoicing for a lighting business.**

Phaenomenon is an interactive, browser-based proof of concept for a small event-lighting studio working with repeat customers. It is intended as a starting point for Aaron to explore what an app tailored to his real workflow could look like.

**[Open the live demo](https://corporateslug.github.io/phaenomenon/)**

## The workflow

1. **Clients:** Create a reusable customer record in **Clients**.
2. **Events:** Choose the customer, event date, venue, event type, guest count, number of lighting zones, indoor/outdoor setting and production level.
3. **Space planner:** Open **3D space planner** from an event. Select a saved venue (or create a new one), draw a custom floor boundary, choose indoor/outdoor and roof profiles, drag fixtures and other equipment into the 3D-style isometric scene, and adjust their exact X/Y/height coordinates. Create labelled power, network, DMX and audio cable connections to estimate lengths, then link placed items to the equipment catalogue and explicitly copy them into the event kit.
4. **Equipment:** View a **suggested starting kit** based on those parameters. Select **Apply suggestions**, then review and edit every quantity. You can update owned stock and hire prices in **Equipment**.
5. **Availability and pricing:** The kit shows an indicative cost and flags when the assigned quantity exceeds owned stock after subtracting equipment allocated to other **confirmed events on that same date**.
6. **Invoicing:** Choose **Draft invoice** from the event. Edit item descriptions, quantities and unit prices, select GST treatment, save, and use your browser's Print / Save as PDF function. Manually record whether an invoice was issued externally or paid.
7. **Repeat booking:** Select **Rebook** to make a new event for an existing customer with a copied kit, venue layout and editable dates.

The original design-project, fixture-specification and pipeline example sections remain available to explore, but event operations are now the primary workflow.

## Space planner: what is working now

- **Reusable venue geometry:** Existing records are automatically given rectangular footprints without erasing events or equipment data. New venues can be indoor or outdoor. Resize the site dimensions to scale a saved footprint across bookings.
- **Irregular floorplans:** Choose rectangular, L-shaped, U-shaped or angled starting shapes. Click **Edit corners on plan** to switch to top view, drag numbered vertices, add a corner on the longest boundary edge or enter exact X/Y measurements. You can remove selected corners. Validation rejects self-intersecting, collapsed or out-of-bounds polygons.
- **Roofs and outdoor sites:** Set **No roof (open sky)**, **Flat**, **Single slope**, **Pitched/gable** or **Custom corner heights**, choosing the slope direction and individual elevations in metres. Outdoor is roofless by default, but an open-air venue can optionally have a schematic overhead roof/canopy. Roof geometry is a transparent visual guide, not a structural model.
- **3D-style canvas:** Orbit a dimensioned isometric model, switch to a top-down floorplan, zoom and position equipment. This is a lightweight **2D-canvas projection of 3D coordinates**, not CAD/BIM, photorealistic 3D, terrain meshing or an imported architectural model. Sloped floors, curved surfaces, separate overlapping roofs, windows, obstacles and multi-storey features are not supported yet.
- **Equipment categories:** Fixtures, audio, power, network, control, rigging, stages and generic objects. Items can be dragged or positioned numerically; after a venue shape change, equipment outside the new perimeter is moved back into the footprint. Mapping items to the equipment catalogue allows copying quantities to the event's billable kit.
- **Preliminary cable routes:** Connect any two objects with power, network/Ethernet, DMX or audio runs. The algorithm finds a shortest unobstructed route *within the 2D footprint*, including detours around concave exterior corners, then adds vertical travel and configurable slack. It suggests a nominal single cable length and totals metres by type. It cannot detect real interior walls, cables through doorways, truss routes, elevated cable trays, outdoor site hazards or separate room transitions; real routes may be longer or require different cable segments and hardware.
- **Sample layout:** Fictional Harbour Hall has placed objects and example connections. All site measurements, mounting-point heights, outlets and equipment specifications must be verified.

**Planning and safety:** The tool is schematic only. Its outputs are not a technical lighting design, a rigging approval, a network feasibility check or an electrical design. It does **not** assess phase balancing, protection, voltage drop, network bandwidth, IP/weather rating, wind exposure, structural loading, exit clearance or Australian electrical and event safety obligations. All relevant measurements and routes require on-site checks and appropriate qualified review before use.

## The equipment recommendation model

The current calculation uses simple **illustrative heuristics** involving audience size, lighting zones, event type, indoor versus outdoor and complexity. It populates recommendations for LED washes, moving-head spots, uplights, outdoor-rated washes, a lighting controller, stands, power distribution and cable runs. Quantities can be overridden freely.

These recommendations are **not a technical lighting design, an electrical load assessment, an inventory reservation system or a rigging safety assessment**. They require Aaron's real inventory, room/venue layouts, equipment specification, power supply, safe-work practices, crew plans and actual rules of thumb before they can be relied on commercially. Availability checks are same-date only; overlapping multi-day bookings, maintenance, transport and subcontracted equipment are not yet modelled.

## Billing: what works and what doesn't

- Create draft invoices manually or from an event's current kit and estimated crew hours.
- Edit invoice lines, numbering, customer, dates and notes.
- Choose 0% GST or 10% GST *only when applicable to the actual business*.
- Track Draft, Issued externally and Paid statuses manually.
- Print/save a **demo-marked draft** as PDF from the browser.

**There is no email delivery, payment collection, accounting integration, automated reconciliation or compliant production invoice issuance.** Printed pages are deliberately labelled demonstration drafts. Before real invoicing in Australia, actual legal entity name, ABN, GST registration/tax treatment, customer details, bank/payment instructions and invoicing requirements need to be implemented and verified.

## Run locally

The app is plain HTML, CSS and JavaScript with no build tools or server-side dependencies.

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