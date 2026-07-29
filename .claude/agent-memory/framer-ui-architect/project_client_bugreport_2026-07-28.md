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

## Update 2026-07-29 — two more bugs found during live testing

**Reflections: row appears in Pending_Reflections, but the reflection isn't linked to a resource ("no data is transferred").** Root cause: `doPost()`'s row-building used `postData[header]`, a case-sensitive EXACT string match between the sheet's literal header text and the frontend's JS field name. Frontend sends `resourceId` (camelCase); if the live sheet's header differs in case at all (e.g. `resourceid`), the lookup silently returns `undefined` and that one cell writes blank — while `id`/`timestamp`/`status`/`flagged` still populate fine since those are hardcoded branches, so the row *looks* complete except for the one broken field. **Same bug, worse instance found while fixing this:** the frontend sends `submitterEmail` (camelCase) for "Apply to Post" partner submissions, but the live `Pending_Resources` header is `submitter_email` (snake_case, confirmed via the health endpoint's `normalizedHeaders`) — these never matched even case-insensitively, so **every partner application has been silently missing the applicant's email.** Fixed in `Code.gs.js`: `doPost()` now falls back to a normalized match (case + all non-alphanumeric stripped) whenever the exact key misses.

**Blank "APPROVED" row appears in Live_* between two real approvals when approving several pending items in a row via individual checkbox clicks.** This is the race predicted in the original 2026-07-28 entry below, now confirmed with real repro data (a `Live_Resources` row with only `status=APPROVED` populated, sandwiched between two real test-resource rows). Root cause: `approvalOnEdit()` moved only the single row the triggering edit fired on (`e.range.getRow()`), but rapid checkbox clicks queue multiple onEdit executions behind the `LockService` lock — by the time a queued execution runs, an earlier execution in the *same batch* may have already `deleteRow()`'d a row above it, shifting everything below up by one. The stale row number the queued execution was holding no longer points at what the user clicked. **Fixed properly this time** (not just a defensive guard): `approvalOnEdit()` now re-scans and moves every currently-ticked row bottom-to-top via a new shared `moveAllCheckedRows_()` helper — the exact same safe logic `approveCheckedRows()` (the bulk menu button) already used and never had this bug. Individual clicks and the bulk button now share one code path and behave identically; `approveCheckedRows()` was refactored to call the same helper (pure dedup, no behavior change there). The earlier blank-row *guard* in `moveRowToLive()` (skip if row is already blank) stays as defense-in-depth but is no longer the primary fix.

Both fixes are in `docs/backend/Code.gs.js` / `ApprovalWorkflow.gs.js` in this repo only — **not yet confirmed deployed live** as of this writing. Standard deploy: paste both files into the live Apps Script editor, Deploy > Manage Deployments > Edit > New version > Deploy.

## Update 2026-07-29 (same day, later) — submitted reflections showing invisible white text

Reported live: reflection text is present in the sheet but rendered in white font, invisible against the (presumably white/default) cell background. Not caused by anything in this repo's mirrored code (no `setFontColor` calls existed anywhere in `doPost()`/`moveRowToLive()` before this fix) — the likely cause is the same shape of bug as the historical checkbox gap: the one-time "🎨 Apply Formatting" menu action (in the NOT-reproduced `formatOneTab()`) only ever styled whatever row range existed when it was last run, and/or a row inherits stale formatting left behind by a previously approved-and-deleted row at that same position (`deleteRow` shifts rows up but doesn't reset formatting to match new content).

**Fixed in repo, two parts:**
1. `Code.gs.js` `doPost()` now calls `.setFontColor('#000000')` on every newly-written row, right after `setValues()` — same "self-format on every write, don't rely on a one-time manual pass" philosophy as the existing checkbox-insertion fix. Deliberately only touches font color, not background — doesn't risk stripping any intentional background/status color-coding from the unseen `formatOneTab()`.
2. New one-time utility `fixInvisibleText()` added to `ApprovalWorkflow.gs.js` — run once from the Apps Script editor's function dropdown to force black text across every EXISTING data row on all 8 tabs (fixes rows already sitting there with invisible text, e.g. reflections submitted before the doPost fix was live). Menu-callable-utility pattern matches existing `sweepApproved()`.

**Still needs manual action:** paste both files into the live Apps Script project, redeploy, then run `fixInvisibleText()` once to repair anything already invisible in the sheet.

## Update 2026-07-30 — approving 2+ entries back-to-back duplicates the second one in Live

Reported live: approve entry 1, it's fine; approve entry 2 right after, it ends up duplicated in the Live tab. Root cause reasoning couldn't be pinned to one exact mechanism (a genuine race between two rapid clicks racing the LockService lock, a leftover duplicate `onEdit` trigger from before the original 2026-07-14 dedup fix was fully cleaned up live per its own instructions, or something else) — rather than keep chasing the precise trigger, went with a structural fix: `moveRowToLive()` used to append to Live unconditionally every time it ran, with no check for whether that row's `id` was already there. **An earlier version of this backend had exactly this check** — `liveRowHasId_()`, referenced in this project's own 2026-07-13 bug-tracking notes ("moveApprovedRow_ now has an idempotency guard...") — but it did not survive the 2026-07-14 rewrite of `ApprovalWorkflow.gs.js` into its current header-driven form. Re-added as `liveRowHasId_()` + a guard in `moveRowToLive()`: refuses to append a row whose `id` is already present in Live, just cleans up the stale Pending row instead. Makes double-processing of the same row harmless no matter what causes it.

**Worth checking live, if this keeps happening:** open Extensions > Apps Script > Triggers (clock icon in the sidebar) and confirm there's exactly ONE `approvalOnEdit` installable trigger — a leftover duplicate trigger from an old deployment would explain double-processing directly. This repo's `setupApprovalTrigger()` deletes prior `approvalOnEdit` triggers before adding a new one, but only if it's actually re-run after a redeploy.

## Ground-truth ledger (2026-07-28)

| Item | Status | Confidence |
|---|---|---|
| doPost() writing past the info block (Notes/Resources/QA approve broken) | Fixed in repo | High — root cause fully traced by reading both `Code.gs.js` and `ApprovalWorkflow.gs.js` together; INFO_START_OFFSET boundary matches symptom exactly. **Not yet deployed live** — needs manual paste + redeploy. |
| Health handler missing `sheets`/`normalizedHeaders` (location-gate always false) | Fixed in repo | High — confirmed by direct code comparison between what `services/api.ts` expects and what the mirrored health handler returned. **Not yet deployed live.** |
| ShareView resource-tab forced location | Fixed in repo | Solid — pure frontend, `npm run check` passing (typecheck + 22 tests + build). |
| Reflections last-approval race | Diagnosed + defensive guard added | Medium — mechanism is plausible and consistent with the reported symptom, but not independently reproduced against the live sheet; full fix deferred pending the rest of the live script. |
