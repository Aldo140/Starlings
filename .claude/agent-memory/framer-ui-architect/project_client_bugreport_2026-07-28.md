---
name: project_client_bugreport_2026-07-28
description: Root cause + fixes for "approve does nothing" across Notes/Resources/QA, the reflections last-approval race, and the location-required-for-resources UX bug
type: project
---

Reported live 2026-07-28 (via chat, not email this time): (1) new Notes/Resources/QA submissions land "at the bottom" past a description block in the sheet, and clicking Approve on them does nothing — auto-move-to-Live and auto-delete-from-pending both silently fail; (2) on Share a Note/Resource, choosing "Resource" still forces a location, and even when a location IS given, submission fails with an error implying the sheet doesn't support location; (3) Reflections mostly works, but when approving several pending reflections in a row, the last one clicked doesn't move.

**Why this matters:** this blocks Agnes's actual moderation workflow across three of the four content types — not cosmetic.

## Root cause 1 — Approve does nothing on new Notes/Resources/QA rows (CONFIRMED, fixed in repo)

`docs/backend/Code.gs.js` `doPost()` was placing new rows at `sheet.getLastRow() + 1`. `getLastRow()` returns the last row with **any** content sheet-wide — including the moderator info/instructions block that `ApprovalWorkflow.gs`'s (undocumented-here) `writeInfoBlock()`/`polishSheet()` writes starting at row `INFO_START_OFFSET` (= 50, defined in `ApprovalWorkflow.gs.js`). Meanwhile `approvalOnEdit()`, `approveCheckedRows()`, and `sweepApproved()` in `ApprovalWorkflow.gs.js` **all** explicitly bail on any row `>= INFO_START_OFFSET` ("don't fire in the info block"). Net effect: any submission landing past row 50 was permanently un-approvable by every mechanism — checkbox click, bulk menu approve, and the sweep — which matches "appears at the bottom, none of the approve buttons work" exactly.

**Fixed in repo (`docs/backend/Code.gs.js`):** `doPost()` now scans rows 2 through `INFO_START_OFFSET - 1` for the first genuinely empty row and inserts there, instead of trusting `getLastRow()`. If that whole zone is full (~48 pending rows), it now returns a clear `success:false` error ("queue is full, approve/reject some pending items first") instead of corrupting placement further.

**Reflections wasn't as broken** because (per the 2026-07-14 fix batch) it already had explicit `TAB_CONFIG` handling and presumably lower submission volume, so it likely hadn't accumulated 48+ rows to push past the info block as often as Notes/Resources/QA — not because its insertion logic was actually different (`doPost()` is shared across all four types).

**Still needs manual action (outside this repo):** paste the updated `docs/backend/Code.gs.js` into the live Apps Script `Code.gs` file and redeploy (Deploy > Manage Deployments > Edit > New version). See the file's own top-of-file instructions block.

## Root cause 2 — "Location fields have not been enabled" always fires (CONFIRMED, fixed in repo)

`apiService.supportsResourceLocations()` (`services/api.ts`) checks `data.sheets` from the `?action=health` response and looks for `city/country/lat/lng` in `Pending_Resources`/`Live_Resources`'s `normalizedHeaders`. But `docs/backend/Code.gs.js`'s health handler **never returned a `sheets` field at all** — only `{success, spreadsheetId, expectedTabs}`. Since `!Array.isArray(data.sheets)` is true when the field is missing, `supportsResourceLocations()` returned `false` unconditionally, for every deployment, regardless of whether the sheet actually had those columns. This feature has likely never worked since it was built.

**Fixed in repo:** the health handler now also returns `sheets: [{name, exists, normalizedHeaders}, ...]` for all expected tabs.

**Still needs manual action:** paste into live `Code.gs`, redeploy, then test `?action=health` directly and confirm the response includes a non-empty `sheets` array before trusting map-based resource submissions again.

## UX fix — resource tab no longer requires a location (separate frontend fix, done)

Independent of the backend bug, `views/ShareView.tsx`'s "Recommend a Resource" tab unconditionally required a city (`isFormValid()`), unlike `AddResourceView.tsx` where map placement is opt-in. Per explicit instruction from the developer (Aldo) on 2026-07-28: location is now optional for the resource tab (still required for the note tab — a note pinned to the map needs a place). The `supportsResourceLocations()` gate is now only checked when the user actually attaches a location, so resources without one are never blocked by it.

## Root cause 3 — reflections: last approval in a row doesn't work (DIAGNOSED, partial mitigation only — see [[component_conventions]] for what NOT to touch blind)

`moveRowToLive()` uses `pendingSheet.deleteRow(row)`, which shifts every row below the approved one up by one. `approveCheckedRows()` (bulk menu action) already guards against this by sorting rows **descending** before moving. But `approvalOnEdit()` (the individual-checkbox-click path) has no such protection — each click's row shift happens live, so ticking checkboxes top-to-bottom in quick succession can leave the *last* click addressing a row that already shifted (or was already vacated by an earlier move), silently no-op'ing.

**Fixed in repo (defensive only):** `moveRowToLive()` now bails out (returns `false`, no-ops) if the target row is already blank, so a race like this can no longer write a junk empty row into `Live_Reflections` — but it does **not** fix the underlying UX race; the un-approved item is still left sitting there needing a retry.

**Practical workaround for Agnes/whoever is moderating today:** approve multiple pending items either (a) via the "✅ Approve Checked Rows" menu action (already race-safe, sorts descending), or (b) by ticking individual checkboxes **bottom-to-top** instead of top-to-bottom.

**A real fix would require seeing the rest of the live script** — `formatOneTab()`, `writeInfoBlock()`, `polishSheet()`, `columnToLetter()` are referenced in `ApprovalWorkflow.gs.js`'s own header comment as existing live but NOT reproduced in this repo's mirror. The robust fix (switch `moveRowToLive` from `deleteRow` to `clearContent`, so approved rows leave a gap instead of shifting everything, combined with `doPost()`'s "first empty row" scan naturally refilling those gaps) was deliberately **not** attempted blind, since conditional formatting in the unseen `formatOneTab()` may assume compacted (non-gapped) data and could break in ways I can't verify without that source. If asked to fix this for real, ask the user to paste the current full live Apps Script project first.

## Ground-truth ledger (2026-07-28)

| Item | Status | Confidence |
|---|---|---|
| doPost() writing past the info block (Notes/Resources/QA approve broken) | Fixed in repo | High — root cause fully traced by reading both `Code.gs.js` and `ApprovalWorkflow.gs.js` together; INFO_START_OFFSET boundary matches symptom exactly. **Not yet deployed live** — needs manual paste + redeploy. |
| Health handler missing `sheets`/`normalizedHeaders` (location-gate always false) | Fixed in repo | High — confirmed by direct code comparison between what `services/api.ts` expects and what the mirrored health handler returned. **Not yet deployed live.** |
| ShareView resource-tab forced location | Fixed in repo | Solid — pure frontend, `npm run check` passing (typecheck + 22 tests + build). |
| Reflections last-approval race | Diagnosed + defensive guard added | Medium — mechanism is plausible and consistent with the reported symptom, but not independently reproduced against the live sheet; full fix deferred pending the rest of the live script. |
