# Google Workbook Audit — 2026-06-18

This audit compares the production workbook, Apps Script endpoint, frontend
resource/map behavior, and moderation documentation. Submission text and email
addresses are intentionally omitted.

## Workbook Inventory

Visible tabs:

- `Instructions`
- `Pending_Stories`
- `Live_Stories`
- `Pending_Resources`
- `Live_Resources`
- `Pending_QA`
- `Live_QA`
- `Flagged_Words`

Missing tabs required by the reflection feature:

- `Pending_Reflections`
- `Live_Reflections`

The updated backend `setup()` creates both reflection tabs and adds resource
location headers.

## Production Data Findings

- `Pending_Stories`: one real pending record; required story and location fields
  are populated.
- `Live_Stories`: seven approved records.
  - Four use `Unknown` as the city.
  - One says Kelowna but contains Calgary coordinates.
  - Audited frontend corrections keep all five visible: Kelowna receives
    Kelowna coordinates, while the four imprecise records use honest regional
    labels at their stored coordinates.
- `Pending_Resources`: one real pending record; no location columns exist yet.
  - Its submitted link did not resolve during the audit and should not be
    approved without correction.
- `Live_Resources`: three physical rows representing two unique resources.
  - One approved resource is duplicated with the same ID and timestamp.
  - No resource has location fields because the required columns do not exist.
  - Both unique live links resolved successfully.
  - The live meme has a URL but no `image_url`; the frontend now keeps its link
    visible instead of rendering an unopenable text-only card.
- `Pending_QA`: no real pending records.
- `Live_QA`: three approved records, all with both question and answer.
- `Flagged_Words`: 71 populated terms; no duplicate terms or invalid severity
  values were detected.

Pending tabs also contain large operator-information blocks below the active
moderation area. These are not submissions and must not be counted as records.

## Critical Privacy Finding

The workbook was anonymously downloadable during this audit. This exposes
pending moderation data directly, bypassing the Apps Script API. The workbook
must be changed from public/anyone-with-link access to named moderators only.

The deployed Apps Script endpoint also returned all `Live_Resources` columns.
The updated backend now allowlists public fields and omits submitter email,
qualifications, moderation flags, and approval controls.

## Required Workbook Actions

1. Merge `docs/backend/gas-backend.js` into the existing Apps Script project
   without deleting `ApprovalWorkflow.gs` or moderation-menu files.
2. Run `repairWorkbookData()` as the workbook owner. It attempts to restrict
   sharing, removes the duplicate resource, writes the five audited story
   location corrections, and flags unreachable pending resource links.
3. If the repair report says `sharingRestricted: false`, restrict workbook
   sharing manually before doing anything else.
4. If more precise locations become available later, replace the four regional
   labels only when the submitter or another trustworthy source confirms them.
5. `repairWorkbookData()` runs `setup()` automatically.
6. Deploy a new Apps Script version.
7. Confirm health reports backend version
   `2026-06-18-location-based-resources` and both reflection tabs exist.
8. Confirm `Pending_Resources` and `Live_Resources` include `city`, `country`,
   `lat`, and `lng`.
9. Audit the existing approval-workflow source to confirm it moves rows by
   header name rather than fixed column number. That source is not present in
   this repository and cannot be verified from the public workbook export.

## Frontend Rules After This Audit

- The map reads approved stories plus approved coordinate-bearing resources.
- All currently approved stories remain visible. Audited legacy rows use
  explicit city or regional corrections rather than guessed nearby cities.
- Legacy resource-shaped story rows are ignored.
- Map-origin resource submissions require a location.
- Resources-page submissions require an explicit map-based opt-in before asking
  for a location.
- Location-tagged community resources appear only in `Map-Based Resources`, not
  a duplicate media-type category.
- Every supported resource type has a visible category; unknown staff-entered
  types fall into `Other Resources`.
