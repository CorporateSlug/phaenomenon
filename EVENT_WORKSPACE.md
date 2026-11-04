# Unified Event Workspace

**Status:** Implemented in the browser-local Phaenomenon prototype.  
**Entry:** [production.html#/home](production.html#/home) or open a specific `#/home/{eventId}`.  
**Public listing editor:** `#/home/{eventId}/publish`.

## Design principle

**One persistent event, multiple workspaces.** Concepts, outreach opportunities, client bookings, self-produced events, confirmed productions, delivered events and closed archives all use the **existing** event record. The new Event Workspace replaces the earlier technical-heavy Event overview with stage-aware navigation and suggested next actions; it does not duplicate event data or make separate copies of a production.

The Events directory, month calendar, Home dashboard, classic Studio event details and new-event creation all open or link to this same event overview.

## What changes by stage

| Stage | Priority | Primary actions |
| --- | --- | --- |
| Idea, outreach, tentative, postponed | Next recorded follow-up; if absent, define the concept or outreach | Edit details, people, venue, optional public listing for own events |
| Confirmed, production underway | Unresolved issues, missing venue, layout, crew pack or delivery | Design, technical, people, budget and production workspaces |
| Delivered or no longer proceeding | Remaining closeout obligations | Equipment returns, crew timesheets, client invoices, supplier reconciliation |
| Closed | Historical record and explicit reopening | Review closure and archive |

The full specialist toolset is never locked by lifecycle stage. For early events, production/finance controls live in a compact expandable section; for confirmed/delivered events, they appear directly. Status and planning markers are **not** approvals of technical safety.

## Public community listing workflow

The workspace now includes an **optional, event-specific public listing section**, accessible from a card or the page disclosure:

1. Enter or review the **public event name**, actual public date/time, neighbourhood, category, publicly shareable venue, public description, public organiser and optional external ticket/info URL.
2. The form shows a **live, escaped preview of those public fields only**.
3. Explicitly confirm permission to publish every field. This applies even to Phaenomenon-led events. For client-led work, an authorised public organiser name is required.
4. Choose **Save for review** or **Publish to local public demo now**. Publishing asks for confirmation.
5. Return to the workspace to **edit/update** that same listing without creating duplicates, or explicitly **Unpublish** it.

Private booking notes, client contact data, crew details, financial information, equipment, technical plans, internal venue assumptions and private event IDs are **not** copied to public listings. Venue and description begin blank unless there is already a linked public listing. Title and known event date may be offered as draft values, but nothing is sent without an explicit submit.

The public community listing lives in the existing separate browser-local `phaenomenon-community-demo-v1` store. A private `lifecycle.publicListingId` field is the only cross-reference. The public listing never stores the internal event ID. The community site continues to show **approved** entries only. A draft or rejected entry is not public.

## Current prototype boundary

This is **not a live multi-user public website**. Both stores exist in the same browser origin and are not protected from one another by an authentication boundary. The public page and private app must be hosted on properly isolated origins with a server-backed publish API and authenticated moderation before real deployment. There is no automated synchronisation or secure multi-user permissions.

Likewise, Studio financial tools currently offer client invoices, not full ticket sales or a self-produced event profit-and-loss ledger. That can be developed later without replacing this event workspace.

## Regression and demonstration scenarios

- **Own concept:** Create “Phaenomenon Summer Party” without date or client, set an outreach action, optionally preview public information without publishing, then later add a confirmed date and venue.
- **External client production:** Create a confirmed client booking, assign spaces, test a production issue, and verify that technical/crew workspaces are prominent.
- **Delivered event:** Set production to Delivered and observe closeout become the next action. Close only once applicable obligations are resolved or explicitly waived.
- **Community publishing:** Enter public details with permission, save as pending, publish, update the linked listing and unpublish. Verify no duplicate listing, no hidden publication and no private-data leakage.

Run targeted regression tests with `node --test tests/event-workspace.test.mjs`. A fuller suite is available with `node --test tests/*.test.mjs`. The browser's visual layout and the live-hosting security model still require separate verification.
