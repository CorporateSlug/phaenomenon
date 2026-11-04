# Phaenomenon interface principles

## Compact, task-first workspaces

Phaenomenon is a professional operational application, not a series of long marketing pages. Every view should let a user see context, available actions, and the current job without repeatedly scrolling past oversized cards or descriptive text.

### Non-negotiable design rules

1. **Viewport-based workspace on desktop.** Keep primary navigation and the page header visible. The central workspace may scroll for genuine multi-section work, but not merely because a table has many rows.
2. **Bounded, independently scrollable data.** Put long catalogues, event indices, equipment, show-cue, technician, supplier, helper and entity collections in a table or appropriately structured list contained in a panel with a defined maximum height. Both axes may scroll where necessary.
3. **Sticky table headings.** Column names remain visible while scrolling through records. Keep the table title, filtering controls, search and key actions outside the scroll body.
4. **Compact by default.** Use modest padding, concise labels, consistent control heights and one-line summaries. Don't represent seven short workflow choices as seven enormous cards. Detail belongs in the selected editor or an expandable disclosure.
5. **Show the relevant controls first.** Prioritise what the user can do next over banners, repeated headings, reassuring prose or marketing copy. Hide optional estimates and advanced settings under clear disclosure labels.
6. **Preserve important context.** Active event, venue, area, current role, save status, outstanding risks and pending unpublished changes must stay understandable. Never compact away safety notices or necessary information.
7. **Use the same input components throughout.** Selects, buttons, date selection, field labels, errors, chips and focus states should share a design system. The date picker uses a hierarchical day → month → year → decade navigator and stores ISO dates.
8. **Consistent density across workspaces.** Studio, Event Builder, venue and multi-space planners, equipment, technical connection tables, event delivery, crew and directory should look related even where one screen uses light and another uses dark colours.
9. **Responsive, not cramped.** On phones use touch-sized controls, natural page scrolling for forms, and separately scrollable wide tables. Desktop "no whole-page scrolling" must never produce clipped dialogs, hidden buttons, inaccessible content or nested scrolling traps.
10. **Accessible scrolling.** Each bounded scrolling region needs keyboard focus, an accessible name, visible focus treatment and native trackpad/wheel scrolling. Sticky headers must not hide focused rows. Print and exported documents must expand to show all records.

### Implementation primitives

- \`compact-workspace.css\` is the shared density and viewport-layout layer, loaded **after** each application's own and shared styles.
- \`.table-scroll\` (Production), \`.table-wrap\` (Studio) and \`.tech-table-wrap\` (Technical planner) apply bounded scrolling and sticky table headings.
- New data views should use \`.ph-table-region\` for bounded tables or \`.ph-bounded-list\` for collections whose contents cannot reasonably be represented as rows.
- Large card/row collections currently gain bounded overflow at record-count thresholds. Where users need scanning, sorting, comparison or filtering, **prefer migrating cards to a proper data table** rather than making ever-denser cards.
- \`shared-ui.js\` makes supported scroll regions keyboard focusable and gives them an accessible region label.
- Don't impose independent scroll on a short input form, popover or a canvas that has its own drag / zoom gestures.

### Acceptance checklist for any new screen

- On a desktop at 1440×900, can the user see page context and primary next actions without scrolling?
- Are long rows constrained to a table/list region instead of extending the document?
- Can the user scroll a large table independently and still see its column headings?
- Is the selected record and its context obvious?
- Can every action be reached via keyboard and by touch, with no clipped overlays?
- Does the screen still work at tablet and phone widths?
- Does printing show all rows rather than only the scroll viewport?
- Is there genuinely less visual complexity rather than simply smaller text?

### Exceptions

A spatial 3D editor, long instructional document, full-width planning canvas, detailed configuration form or printable crew pack can use its own specialised layout. Compactness must never override safety-critical visibility, readability or task completion.

This document describes enduring UI requirements, not a claim that every legacy view has already been converted to the ideal pattern.

## Collection-first navigation (SlugSync-inspired)

The Production and legacy Studio entry points share a single information architecture.

- **Sidebar = browse:** The sidebar has a stable order: Dashboard; Events & schedule; People & organisations; Venues & spaces; Equipment & fixtures; Finances. Community Noticeboard and Settings stay low-priority at the bottom. Event-specific operations such as 3D design, DMX, crew and closeout belong within their event, not the global sidebar.
- **Dashboard = status:** Show useful totals, upcoming events and outstanding actions; do not add a competing grid of shortcuts for every specialist tool.
- **Collections = search and review:** Each collection shows bounded, independently scrolling lists and a contextual New button. Its records retain canonical IDs. A collection is not an editor for one implicitly selected event.
- **Tabs = records or drafts:** Opening a record creates a tab (or activates an already-open tab for that record); creating an item opens a dedicated unsaved draft tab. Switching sidebar collections reuses a browsing tab rather than replacing an open record/draft. Contextual tools for the *same event* share its tab. Avoid duplicate tabs for the same record.
- **Unsaved new drafts:** Preserve new-record form values in browser session storage as Aaron navigates between tabs, including selects and date changes. Give confirmation before explicitly closing an unsaved draft; saving a draft creates the real record and then opens that record. This is not cloud-backed recovery.
- **Non-destructive close:** Closing a record's tab never deletes the underlying entity, booking, venue, fixture or invoice. Home is an ordinary closable tab; after closing the last tab the Dashboard may be visible without a pinned Home tab.
- **Consistent icons and collapsed rail:** Every collection has a semantic line icon, the sidebar can collapse to icon-only with accessible labels, and the same layout works in the older Studio area. Mobile uses Home/Events/People/Equipment/More rather than event-specific global shortcuts.
- **Floating tab geometry:** Individual fully rounded tabs float above the band bottom; preserve consistent tab width, height, spacing and keyboard focus. The **+** picker provides an optional explicit shortcut to additional workspaces. It is not the only way to open a record.
- **Simplified global header:** Show the current section and workspace Options; do not include a permanent global Switch Event selector or New Event control. Create actions belong to collection pages.
- **Cross-workspace consistency:** Tabs persist when moving between `index.html` specialist Studio tools and `production.html` collections. Tab navigation does not run parallel instances of specialist planners. Existing unsaved legacy editor forms may still require explicit saving before navigation, even though new draft forms are session-preserved.

Source: `workspace-navigation.js`, `workspace-navigation.css`, `collection-workspaces.js`, `collection-workspaces.css`. See [collection navigation architecture](COLLECTION_NAVIGATION.md).

## Event ownership and opportunity identity

- **Separate lead from stage.** An event's organising model (**Phaenomenon-led own production** or **Client-led external commission**) must remain independent of booking stage, scheduling certainty, production stage and closeout.
- **Concepts are genuine events.** An own-event idea with no confirmed date, venue or client is a valid record; do not force it into a client booking or create a duplicate when it becomes confirmed.
- **No fictitious transactions.** An own-produced event is not an external invoice addressed to the studio. Client-invoice closeout is not applicable without a linked external invoice; if a genuine external invoice is linked, its recorded issue/payment states apply.
- **Compact discoverability.** Keep own events and client work recognisable in event rows and accessible through a simple filter; don't split them into unrelated data stores or multiply dashboards.
- **Future collaborators.** Sponsors, co-producers, promoters and suppliers should be linkable through the existing entity and role systems, without overriding the primary event-lead distinction.


## Unified event entry and stage-aware disclosure

- **Event workspace as the single entry:** Opening an event from the directory, calendar, Home or Studio should lead to `#/home/{eventId}`, using the existing event record rather than creating a new project.
- **Recommend, don't obstruct:** Present the most useful next task based on lifecycle, unresolved issues, venue/design readiness and closeout. Preserve the ability to open any specialist workspace early; conceal advanced complexity through progressive disclosure, not stage gates.
- **Connected but distinct workspaces:** Event details, venues, 3D, technical, people, budgets, community publishing and closeout should link to the same event ID. Saving and navigation must not silently create duplicates.
- **Small-screen density:** Compact status facts, bounded lists, one primary next action, consistent line icons, restrained colours and collapsible advanced controls.
- **Explicit public publishing:** A public listing is an opt-in extract of user-chosen fields. Show a field-accurate preview, require permission acknowledgement, allow save for review/publish/update/unpublish, and never import private contact details, crew, budgets, technical plans or event identifiers into the public record.
- **Prototype is not deployment:** Browser-local public demo and internal admin are not a security boundary. Deploy only after origin isolation, authenticating moderation, server-side validation and a shared data layer.
