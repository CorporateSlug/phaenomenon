# Phaenomenon

**An event-booking, equipment-planning and draft-invoicing prototype for a lighting business.**

[Open the live demo](https://corporateslug.github.io/phaenomenon/)

This is an interactive starting point for Aaron, who runs events for repeat customers. All example customers and prices are fictional.

## Try the workflow

1. **Clients**: create or select a customer (repeat customers are reusable).
2. **Events**: capture event date, venue, audience size, lighting zones, event type, indoor/outdoor setting and production level.
3. **Suggested kit**: view automatically calculated starting quantities, select **Apply suggestions**, then manually adjust equipment quantities. Choose **Rebook** to reuse an existing customer's event and kit.
4. **Equipment**: update inventory counts and indicative hire rates, or add equipment types. The event planner flags possible same-day stock shortfalls against other confirmed bookings.
5. **Invoices**: select **Draft invoice** from an event to generate editable equipment-hire and crew lines. You can also create an invoice manually. Change issue/due dates, line items, tax treatment and manually track Draft, Issued externally or Paid. Use **Print / PDF** to save the demonstration invoice.

The earlier design-project and pipeline examples remain available in the sidebar.

## Important limitations

**Equipment suggestions are illustrative heuristics**, not certified lighting, rigging, electrical or venue-suitability calculations. They need calibration against Aaron's real gear, rules of thumb and event types. The stock check considers other confirmed events on **the same date** only; it does not account for overlapping multi-day events, maintenance, transport buffers or hired-in gear.

**Invoices are intentionally draft documents** and are marked as demonstrations in print. This version does not issue compliant tax invoices, send emails, receive payments or connect to accounting software. Before commercial use it needs accurate legal business details, ABN, GST registration/treatment, client details, payment terms and appropriate invoicing compliance checks. GST is **off by default** so the demo does not assume a business is GST registered.

This is a **localStorage-only demo** with no accounts, backend, sharing or cross-device syncing. Data is saved in the browser you use, and may be lost when browser data is cleared. Export JSON from Settings to keep a backup. Do not enter real confidential client or payment information.

## Run the app on a Mac

```bash
mkdir -p ~/Documents/GitHub
cd ~/Documents/GitHub
git clone https://github.com/CorporateSlug/phaenomenon.git
cd phaenomenon
python3 -m http.server 8000
```

Open http://localhost:8000/. If the repository already exists, run `git pull --ff-only` inside the `phaenomenon` folder instead of cloning again.

No packages, API keys or build step are required. GitHub Pages deploys the static app from the `main` branch.

## Next step with Aaron

Walk through two or three real past events: identify the input parameters he actually considers, the equipment he chose, and exceptions such as venue power, rigging, weather, transport and crew. Use those examples to replace the demonstration rules with a reliable, explainable, editable planning model. A commercial version should then add secure multi-user data, proper scheduling/reservations, job pick lists, invoicing, payments and accounting integrations.

See [VISION.md](VISION.md) for the longer roadmap.
