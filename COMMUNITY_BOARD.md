# Community noticeboard — public demo

**Status:** Working front-end demonstration · **not yet publicly hosted or multi-user**.

**Public page:** [community.html](community.html)  
**Internal reviewer:** [production.html#/community](production.html#/community)

## Why it exists

An intentionally low-effort local queer-community event noticeboard. People should be able to find gatherings, performances and casual meetups without creating a promotional campaign, a social profile or an elaborate event page. The concept is associated with Phaenomenon but distinct from the production management tool.

The demo includes:
- A responsive public page with compact date-ordered example listings, search and category filter.
- A short, optional-details submission form: title, date, optional time, neighbourhood, optional venue, category, description, optional public organiser name and an optional external ticket/information URL.
- All submitted entries default to **Pending**, not published.
- A dedicated internal review screen for Aaron to approve, decline or unpublish local submissions.
- Public viewing of **approved** submissions only; examples are permanently labelled as example listings.
- Clear demo notices explaining that posts and approvals are saved **in one browser only**.

## Boundary between community and production

The public page loads only `community-data.js`, `community-public.js`, `community.css` and shared date picker files. It **never imports the production app, event booking store, crew information, equipment or invoice data**.

Public demo entries use a distinct browser storage key `phaenomenon-community-demo-v1`. The production workspace continues using its own internal data store. The public board is not an automatic mirror of internal events. Before a real publish integration, users must explicitly select which public details to publish.

**Important:** This JavaScript separation is a *prototype interface boundary*, not a security boundary. Browsers on the same origin can access the same origin storage. Both the internal reviewer and the public HTML are unauthenticated static pages. Never expose actual private or sensitive production data by deploying this demo as-is on a public origin.

## To try it locally

Start a local server from the repository root:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000/community.html` to browse example listings and submit an event, then open `http://localhost:8000/production.html#/community` in **the same browser and origin** to approve it. Refresh the public page to see the approved submission. Using another browser, device, origin or computer will not sync the submission.

## Before accepting actual community submissions

This demo is intentionally **not** a production service. It would require:
1. A shared server-side database and submission API.
2. Real authenticated reviewer permissions and private moderation endpoints.
3. Server-side validation, rate limiting, spam/abuse reporting and safe link screening.
4. Privacy safeguards for community members and sensitive/private venues. Do not require names or exact addresses to submit. Publish only information explicitly intended for public distribution.
5. Edit, cancellation and removal mechanisms for organisers, with moderation audit history and sensible retention rules.
6. Accessible public hosting on a dedicated community origin or appropriately isolated service. Do not serve the private Phaenomenon app or its storage under the same public origin.
7. Optional integration for **explicit opt-in** publishing of a Phaenomenon-led public event; default is not published.

Native ticket sales, marketing automation, accounts/social followers and internal production workflows remain outside the community board's lightweight first scope.
