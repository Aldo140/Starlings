# Google Workbook Audit — 2026-06-18

This audit compares the production workbook, Apps Script endpoint, frontend
resource/map behavior, and moderation documentation. Submission text and email
addresses are intentionally omitted.

## Workbook Inventory

Visible tabs after repair:

- `Instructions`
- `Pending_Stories`
- `Live_Stories`
- `Pending_Resources`
- `Live_Resources`
- `Pending_QA`
- `Live_QA`
- `Pending_Reflections`
- `Live_Reflections`
- `Flagged_Words`

The resource moderation tabs now share this safe positional order:
common resource fields, `city`, `country`, `lat`, `lng`, then the pending
approval control or live reaction counters.

## Production Data Findings

- `Pending_Stories`: one real pending record; required story and location fields
  are populated.
- `Live_Stories`: seven approved records.
  - Four use `Unknown` as the city.
  - The current Calgary row uses matching Calgary coordinates.
  - Unknown-location stories remain visible in the browse list but do not create
    map pins.
- `Pending_Resources`: no real pending records after the temporary schema test
  was removed.
- `Live_Resources`: four unique approved resources.
  - The duplicate book row was removed.
  - `Support Group` was normalized and assigned its confirmed Calgary location:
    `Calgary`, `Canada`, `51.0447`, `-114.0719`.
  - The other three approved resources have no confirmed location and therefore
    remain in resource lists without map pins.
  - The live meme has a URL but no `image_url`; the frontend now keeps its link
    visible instead of rendering an unopenable text-only card.
- `Pending_QA`: no real pending records.
- `Live_QA`: three approved records, all with both question and answer.
- `Flagged_Words`: 71 populated terms; no duplicate terms or invalid severity
  values were detected.

Pending tabs also contain large operator-information blocks below the active
moderation area. These are not submissions and must not be counted as records.

## Critical Privacy Finding

The workbook was anonymously downloadable at the start of this audit. Public
workbook access was removed on 2026-06-18. The owner and Agnes retain named
access.

The deployed Apps Script endpoint still needs the repository backend update to
enforce its public-field allowlist. Current approved resource rows contain no
submitter email or qualification values, and the private workbook prevents
direct access to pending moderation data.

## Completed Workbook Actions

1. Created a pre-repair workbook backup.
2. Removed anonymous workbook sharing while retaining named moderator access.
3. Added `city`, `country`, `lat`, and `lng` to both resource tabs without
   breaking positional approval workflows.
4. Created both reflection tabs.
5. Removed the duplicate approved resource.
6. Corrected and located the approved `Support Group` resource in Calgary.
7. Submitted a temporary map resource through the live public endpoint,
   confirmed all location fields reached `Pending_Resources`, then deleted it.
8. Confirmed the public endpoint still reads the now-private workbook.

## Remaining Deployment Action

Deploy `docs/backend/gas-backend.js` into the existing Apps Script project
without deleting `ApprovalWorkflow.gs` or moderation-menu files. This publishes
the public-field allowlist and header-based approval workflow. The current
school account policy blocks anonymous access on newly created web apps, so the
existing grandfathered public deployment must be updated from its Apps Script
editor rather than replaced with the temporary standalone deployment.

## Frontend Rules After This Audit

- The map reads approved stories plus approved coordinate-bearing resources.
- All currently approved stories remain visible in the list. Unknown locations
  stay off the map, while named hub cities use their canonical city coordinates
  so stories and resources group under one city pin.
- Legacy resource-shaped story rows are ignored.
- Map-origin resource submissions require a location.
- Resources-page submissions require an explicit map-based opt-in before asking
  for a location.
- Location-tagged community resources appear only in `Map-Based Resources`, not
  a duplicate media-type category.
- Every supported resource type has a visible category; unknown staff-entered
  types fall into `Other Resources`.
