# Event lifecycle — Phaenomenon

The **same event record** persists from the first opportunity through production delivery, payment reconciliation and archive. Do not create disconnected opportunities, jobs and projects for the same event.

## Data contract

The existing event identifier, title, date, venue, client, event kit and technical plans are unchanged. A new `event.lifecycle` record contains:

```js
{
  bookingStage: 'idea',           // see below
  dateCertainty: 'unknown',       // unknown | indicative | proposed | confirmed
  targetMonth: '',               // YYYY-MM, optional
  dateNotes: '',
  nextAction: '',                // optional short outreach / next-step text
  followUpDate: '',              // exact YYYY-MM-DD or blank
  productionStage: 'not-started',
  closeout: {                   // one status record per task ID below
    equipmentReturned: {status:'pending',note:'',updatedAt:''},
    // ...
  },
  closedAt: ''
}
```

Event `date` is either a valid `YYYY-MM-DD` or `''`. An event can therefore exist before any date, client or venue is known; an indicative month and free-text scheduling note may be recorded instead. A proposed or confirmed exact date requires an actual calendar day. A known day can belong to an early-stage idea; date certainty and booking stage must **not** be conflated.

**Booking stages:** identified idea, outreach planned, contacted, in discussion, quoted, tentative/on hold, confirmed, postponed, declined, lost, cancelled.

**Production stages:** not started, planning, preparing, ready, load-in, live, pack-down, delivered.

**Legacy status compatibility:** `event.status` is still written as `Enquiry`, `Quoted`, `Confirmed`, `Completed` or `Cancelled` for existing inventory and classic screens, but the lifecycle fields are the source of truth for detailed workflow reporting. Closed cancelled/declined/lost events retain the legacy `Cancelled` status; closed delivered events receive `Completed`.

## Compact UX

- **Home:** opportunity count, confirmed upcoming events, delivered-but-open closeouts, issues and follow-ups due in the next week. The selected event remains one click away.
- **All events:** grouped opportunities, confirmed upcoming, delivered events awaiting closeout, past, undated and closed/archive; row metadata shows date certainty, production stage and next action. Calendar only places events with exact dates.
- **Event Builder and classic Studio booking:** edit independent booking stage, date certainty, optional date/month, next action and follow-up date. An event may be created with just a name. Venue, organiser and equipment can be added later. Original seven technical planning steps remain intact.
- **Production > Closeout:** separate, bounded-scroll checklist, grouped by equipment, people, finance and administration; save and close/reopen actions remain visible outside the scrolling rows.
- **Workspace tab navigation:** `#/production/closeout/{eventId}` goes to a real event-specific Closeout view and can be deliberately opened from the top **+** workspace chooser. Closing its UI tab never changes event data.

## Closeout tasks

| Task key | What is being recorded | Source |
| --- | --- | --- |
| `equipmentReturned` | Equipment accounted for and returned | Manual |
| `equipmentResolved` | Damaged/missing equipment resolved | Manual |
| `timesheetsApproved` | Crew hours approved | Manual |
| `crewPaid` | Employees and contractors paid | Manual |
| `supplierReconciled` | Suppliers and hire costs reconciled | Manual |
| `invoiceIssued` | Client invoice issued | Derived from linked invoices if present; otherwise manual |
| `paymentReceived` | Client payment received | Derived from linked invoices if present; otherwise manual |
| `expensesReconciled` | Remaining expenses reconciled | Manual |
| `recordsArchived` | Event records archived | Manual |

Each manual task may be **Pending**, **Done** or **Not applicable**. Not applicable requires a reason, stored with the record and a timestamp. Completion is *recorded* rather than verified; Phaenomenon does not transfer wages, send invoices or reconcile real bank accounts.

If linked invoices exist, all must be marked **Issued externally** or **Paid** for `invoiceIssued` to be derived as Done; all must be **Paid** for `paymentReceived` to be Done. Draft invoices are never silently treated as issued or paid. Where invoice-derived values are available, the user cannot override them with a manual checkbox. If an invoice status regresses after closure, outstanding closeout is recalculated and surfaced as an item requiring review.

The user may close a delivered event, or a cancelled/declined/lost event, **only** after all applicable tasks are recorded Done or Not applicable (with a reason). The app does not auto-close events just because the date is in the past or an invoice is paid. Reopening retains the checklist and removes the `closedAt` timestamp.

## Migration and compatibility

`PhaenomenonLifecycle.ensureAll(db)` is called by both Studio and Production when loading existing browser storage. It is idempotent and preserves event IDs, venue plans, assignments, published revisions, costs and historical invoices. Existing `Confirmed` maps to a confirmed booking, `Enquiry` to an identified idea, `Quoted` to quoted, `Cancelled` to cancelled and `Completed` to a delivered production **not automatically closed**. Existing dates retain their value and are initially mapped to confirmed or proposed certainty as appropriate.

`event-builder.js` now permits creating an opportunity with no date or client. Validation for invalid exact dates, invalid month formats and invalid stage values remains enforced.

## Boundaries and future integrations

Data remains saved **in the current browser only**, with JSON backup/export available. Role views do not constitute permissions. This is not a payment processor, accounting system, employee timesheet or compliance approval service. Future integrations should replace relevant manual closeout items with verified sources, without overwriting historical evidence of who acknowledged work. Regulatory approval and technical verification remain separate from planning completion.
