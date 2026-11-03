# Phaenomenon

**A little glimpse of what a purpose-built workspace for a lighting design studio could be.**

Phaenomenon is an interactive proof of concept for a project and business management app. It connects enquiries, clients, projects, tasks, fixture specifications, schedules, budgets and indicative estimates in a single interface.

It was built as a creative starting point for Aaron, not as a finished commercial product. Everything here is deliberately approachable, easy to modify and filled with **fictional demo data**.

**[Explore the live prototype](https://corporateslug.github.io/phaenomenon/)** (available once GitHub Pages is enabled).

## Try it

**Option A: open it directly.** Double-click `index.html`. No installation or account is required. Modern browsers generally allow this, though some browser privacy policies may restrict storage for local files.

**Option B: run a local server (recommended).** In Terminal, inside the downloaded folder:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

On mobile, the layout adapts into a compact dashboard.

## What already works

| Area | Explore | Try doing this |
| --- | --- | --- |
| **Overview** | Project health, upcoming tasks, pipeline totals and milestones | Complete an outstanding task and watch the count update |
| **Projects** | Project portfolio, stages, briefs, dates, budgets | Open North Pier Hotel and change its stage |
| **Tasks** | Per-project deliverables and completion progress | Add a task or tick one off |
| **Pipeline** | Enquiries, proposals, negotiation and won projects | Move Solstice Wellness to **Won**, then click **Create project** |
| **Schedule** | Month calendar, design reviews, site visits and milestones | Add a milestone, then navigate to its date |
| **Fixture library** | Product codes, CCT, beam angle, manufacturer, stock and cost | Add a fictional fixture, then assign it to a project |
| **Fixture schedule** | Quantities, per-project selections and calculated costs | Adjust a quantity in a project's **Fixtures** tab |
| **Estimate** | Design fee, fixture supply, installation allowance and GST | Select a project's **Estimate** tab, then print or save as PDF |
| **Clients** | Contacts and linked projects | Add a client, then create a project for them |
| **Settings** | Local data management | Export your changes to JSON, import them or reset the demo |

The top search box searches across projects, opportunities, clients and fixtures. Navigation updates the URL fragment so browser Back and Forward can move between sections and opened projects.

## How the app works

This starter version uses **plain HTML, CSS and JavaScript**: no dependencies, npm install, backend, paid API, credentials or build process. Sample data is generated the first time you open the app, with dates relative to that day.

```text
index.html          Main entry point
styles.css          Visual design and responsive layout
app.js              Sample data, app state, calculations and interactions
assets/             Screenshots for previewing the concept
VISION.md           Proposed architecture, scope and product roadmap
```

Changes are stored in your browser's `localStorage`. JSON export/import is provided for convenience. **This is not a synchronised, secure, multi-user database.** Clearing browser storage can erase changes unless you've exported them.

### The mental model

```text
Client
  └── Project
       ├── Stage + brief
       ├── Tasks + due dates
       ├── Fixture schedule ──> Fixture library
       ├── Events / milestones
       └── Draft estimate
              ├── Design fees
              ├── Fixture costs × quantities
              ├── Installation allowance
              └── GST

Opportunity (pipeline) ──> Won ──> New project
```

## Deploy the interactive prototype

This repository contains the full static demo. To publish it: open **Settings → Pages** on GitHub, select **Deploy from a branch**, choose **main** and **/(root)**, then save. Once deployment finishes, visit **https://corporateslug.github.io/phaenomenon/**.

For local use, open `index.html` or start `python3 -m http.server 8000` and visit http://localhost:8000.

No credentials, build steps or paid services are required. The example data is fictional and browser-only; avoid entering real client details.

## Where it could go next

See [VISION.md](VISION.md) for the full ideas map, proposed data model, rollout phases, architectural choices and operational risks. Possible upgrades include:

- A real client/project database with accounts and permissions
- Technical drawing / reflected ceiling plan and revision management
- Fixture schedules linked to manufacturer cut sheets and supplier quotes
- Client approvals, change requests and handover packs
- Crew allocation, procurement, timesheets and installation tracking
- Quote versions, invoicing and accounting integrations
- Automatic reminders, decision history and studio-level reporting

**Scope note:** The example portfolio leans toward architectural, hospitality and residential lighting design. For stage, theatre or event lighting, the same structure could instead revolve around shows, venues, hire stock, crew, DMX patching and cue documentation.

## Important limitations

- **Fictional data only.** Every business name, contact, fixture and amount is invented for demo purposes.
- **Not production-ready.** There is no authentication, encryption, audit trail, external backup, role-based access or cloud sync. Do not store real customer information in the demo.
- **Costs are illustrative.** Estimates are not tax invoices, binding proposals, validated supplier costs or an alternative to an accounting system. Verify GST, contract language and financial calculations before using a production version.
- **Technical specifications are illustrative.** Check real fixtures, standards, drawings and product availability against original manufacturer and project documentation.
- The app does **not** call AI models or external services. Its figures and summaries are simple calculations over its local dataset.

---

*Made to inspire a conversation: what would a tool look like if it were designed around how a lighting studio actually works?*