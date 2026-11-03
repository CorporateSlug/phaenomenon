# Phaenomenon · first usability trial

**Who:** Aaron or another lighting designer / production collaborator using Windows and a modern browser.

**Start:** https://corporateslug.github.io/phaenomenon/production.html#/builder

**Important:** This is a browser-local prototype. No real shared accounts, guaranteed recovery, cross-device sync, inventory reservations, safety approvals or production billing. Use invented event/client information and export a JSON backup of anything you want to retain.

The objective is not to test every control. It is to see whether a new user can understand the natural sequence without explanations.

## The suggested 20-minute route

1. Open **Event Builder**. Find the sample Abbotsford Convent event. Explain, in your own words, what you think you should do next.
2. Choose **+ New event**. Enter a fictional event and client. Try selecting an existing venue and spaces. Also test creating a venue that doesn't exist, or adding a missing space to a venue that does.
3. Open **3D design**. Find the relevant space, adjust one object and locate the venue geometry controls. Can you work out where to add a second fixture?
4. Return to **Event Builder → Equipment kit**. Check whether the displayed quantities match the objects placed in the scene. If a placed item is not in the equipment library, try linking it to an existing equipment type or deliberately excluding it from the hire kit.
5. Open **Production → Team**, create or assign an illustrative person, and find the reporting hierarchy. Then review **Installation** and **Show schedule**. In the show schedule, add a fictional cue, edit its time/title and remove it. Does the editing feel straightforward without clutter?
6. Return to the guided **Review & publish** stage. Look at the pending design changes, understand what publishing means, and try exporting a JSON backup.

## Questions that matter most

- What did you expect the next button or screen to do?
- When did you hesitate because you didn't know whether you were editing the Venue itself, a Space, or the Event?
- Which controls are visible too early? Which are too buried?
- Can you get from a placed fixture to its equipment catalogue, power/DMX connections and assigned crew without guessing?
- Are the labels **Venue**, **Space**, **Event**, **3D design**, **Equipment kit**, **Technical connections**, **Crew installation** and **Production** clear and consistent?
- What would you need before using this on a real job?
- What is still missing from the technician, stagehand and production-manager views?

## What to record

For each issue, capture the **screen**, **what you wanted to do**, **what happened**, and **what you expected**. Screenshots of the fictional demo are useful. No real customer data is needed.

**Suggested severity:**
- Blocker: cannot finish the task or data seems lost
- Confusing: can finish, but need explanation or repeated attempts
- Polish: everything works but layout, terminology or spacing is awkward

## What to test after the first pass

- Second event at the same venue selecting a different set of spaces
- Another stage in the same event without duplicating the venue
- Switching between Editor, Crew and Production workspaces without losing the selected event
- Publishing a new revision and seeing changed installation tasks reset appropriately, while unchanged verified tasks stay completed
- Changing a fixture's linked equipment model or power estimate and confirming that the published crew instructions are marked for revision
- Using the 3D planner’s kit-sync action without losing manual cable, stand or other kit allocations
- Exporting a JSON backup and restoring it in the same browser
- Opening on a second browser or device to confirm that work is **not** synchronised

This exercise is designed to reveal friction and missing functionality, not to imply the prototype is fit for professional deployment.
