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

## Persistent workspace navigation (SlugSync-inspired)

The main Studio and Production pages share one navigation contract:

- **Consistent line icons:** Every sidebar destination and expandable group uses the same stroke weight, sizing and colour treatment. Icons are semantic rather than mixed Unicode glyphs or unrelated symbols.
- **Collapsible desktop sidebar:** The toggle in the sidebar header switches between named navigation and a slim icon rail. Native tooltips appear only for collapsed icons, not when labels are already visible. Clicking a group icon expands the sidebar so its nested destinations are accessible. The choice is stored locally and applies to both Studio and Production. Phone navigation stays a dedicated full drawer.
- **Workspace tabs directly under the global header:** Tabs show open views with an icon, workspace-first label, event context and a dismiss control. Home is always available as a persistent anchor.
- **Stable, compact tab widths:** Open tabs have a low-height, visually integrated strip. Explicit additional tabs are added on the right; crowded tabs scroll horizontally rather than shrinking. A small **+** remains pinned on the right and opens a **new workspace picker**, not the Create Event form.
- **Intentional tab creation:** Ordinary sidebar navigation **replaces the active working tab's destination**. The first departure from pinned Home uses one reusable working slot; no additional tabs appear unless the user explicitly selects **+ → workspace**. The user may then keep Builder, 3D, technical and other views open independently. Navigating between builder steps still updates that tab rather than creating more. Clicking an existing tab restores that specific event and workspace.
- **Closing is non-destructive:** Dismissing a tab closes only the shortcut/view; it never deletes a booking, design, equipment placement, cue, team assignment or published pack. Tabs persist in browser-local storage; the selected tab is kept for this browser session. Previous automatically collected v1 tabs are deliberately not migrated.
- **Cross-workspace consistency:** The tab strip persists across navigation between `index.html` (Studio) and `production.html` (Production OS). It is a **persistent navigation system** over the existing page routers, not multiple simultaneously running 3D/design processes. Unsaved form input is not guaranteed to survive route changes, so users should save drafts before switching tabs.

The shared implementation lives in `workspace-navigation.js` and `workspace-navigation.css`. Avoid implementing a second incompatible sidebar, tab bar or menu-specific icon system for new features.
