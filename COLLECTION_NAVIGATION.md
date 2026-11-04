# Collection-first navigation — Phaenomenon

**Status:** Implemented in the browser-local prototype (November 2026). This is an information architecture refactor, not a separate data system.

## Core mental model

- **Left sidebar = browse what exists**. Its permanent destinations are Dashboard, Events & schedule, People & organisations, Venues & spaces, Equipment & fixtures, and Finances. Community Noticeboard and Settings stay at the bottom.
- **Browse page = find or create**. Search and scan bounded collection lists; contextual **+ New** controls create the corresponding type, not always an event.
- **Open/create = own workspace tab**. Existing records open or activate a tab keyed by record ID; a newly created record gets a separate editor tab. If the record is already open, focus it instead of opening a duplicate.
- **Within a record = tools/actions**. The unified Event Workspace is where venue setup, 3D design, connections, people and crew, finances, public publication, and closeout live. They are not top-level global sidebar tools.
- **Dashboard = dashboard**. Show useful status, upcoming events, follow-ups and alerts. Avoid a second full navigation menu, redundant persistent New event controls, and the former global Switch Event dropdown.

## Main routes

| Browse collection | Open existing record | New draft tab |
| --- | --- | --- |
| `#/events` | `#/home/{eventId}` | `#/new/event/{draftId}` |
| `#/entities` | `#/entities/{entityId}` | `#/new/entity/{draftId}` |
| `#/venues` | `#/venues/{venueId}` | `#/new/venue/{draftId}` |
| `#/equipment` | `#/equipment/{equipmentId}` | `#/new/equipment/{draftId}` |
| `#/equipment` (fixtures section) | `#/fixtures/{fixtureId}` | `#/new/fixture/{draftId}` |
| `#/finances` | `index.html#/invoices/{invoiceId}` | `#/new/invoice/{draftId}` |

The public community board is `community.html`, and its local admin review workspace is `#/community`.

The older `index.html` Studio specialist routes remain available for 3D planning, invoices, detailed legacy booking edits, technical tools and their existing data. These should be reached contextually, not from a second competing global menu.

## Tab and draft behaviour

Collection browsing reuses a general browsing tab. Opening an existing saved record or clicking a context-specific **New** button creates/activates a separate tab through `window.PhaenomenonWorkspaceTabs.openRecord(href)`. Existing record tab keys deduplicate repeat openings; event-specific specialist subviews reuse the event tab, so planning doesn't accumulate dozens of tabs. The optional **+** tab-strip menu can still open workspaces deliberately.

A new draft does **not** write into `phaenomenon-demo-v1` until the Create form is successfully submitted. Form values are stored under the session-specific `phaenomenon-draft-v1-{draftId}` key as the user enters them or changes selects/dates. On return, the fields are restored. Closing an unsaved draft asks for confirmation and discards only the draft; saving it clears the draft key and opens the real record. Existing event, venue, person/organisation, inventory, fixture and invoice IDs are not replaced.

This is **session-based convenience, not robust offline recovery**. Browser session clearing, private browsing termination or application errors may still lose draft values. Legacy specialist editor forms are not universally session-preserved.

## Data and safety

- Existing events still use the shared `eventJobs` and `lifecycle` model.
- People and organisations retain the `productionOS.entities` identity graph and event relationships.
- Venues and spaces use the existing `venues` collection and venue workflow.
- Equipment and fixture records remain in their existing inventories; creating a fixture does not create a duplicate equipment stock item.
- Invoice creation makes a **Draft**, not an issued invoice or verified payment, and requires a real existing client.
- Public community submissions remain stored in the separate community demo store and do not automatically publish private event data.
- Browser-local persistence is not multi-user cloud syncing, authenticated access control or verified compliance.

## What to test

1. Sidebar switches cleanly among the six main collections; Community stays at the bottom.
2. Search/find an existing event, entity, venue, equipment item or invoice. Open it in its own tab and click it again; no duplicate tab.
3. Use **+ New event** (date optional), **+ New person/organisation**, **+ New venue**, **+ New equipment**, **+ New fixture** and **+ New invoice draft**.
4. Fill half a new-record form, switch to another collection, reopen the draft tab; the input values remain. Closing an unfinished draft should warn before discarding it.
5. Save a draft and verify the real record appears in its collection and the tab shows the saved item, not “New”.
6. Open an event and navigate Event Builder → 3D/technical/crew → closeout; record links and existing technical data must remain intact.
7. Confirm the Dashboard no longer has a redundant grid of global workspace shortcuts and the header has no permanent selected-event dropdown.
8. Test on desktop and mobile, including collapsed sidebar and overflowing floating tabs.

Relevant automated test: `tests/collection-navigation.test.mjs`. Run the complete local Node suite with `node --test tests/*.test.mjs`. The complete Node suite and final visual browser QA are **not yet verified** in this implementation session.
