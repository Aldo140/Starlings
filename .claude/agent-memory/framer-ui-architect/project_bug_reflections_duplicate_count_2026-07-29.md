---
name: project_bug_reflections_duplicate_count_2026-07-29
description: getApprovedReflections() lacked the id-dedup guard getApprovedPosts() already had, so duplicate Live_Reflections rows inflated the per-resource reflection badge count
type: project
---

Reported live 2026-07-29 (chat, terse): "it says 14 but there's not that many" — referring to the reflection-count badge on a resource card in `views/ResourcesView.tsx` (`resourceReflections.length`, rendered at the "What others shared" header, ~line 241).

**Root cause (CONFIRMED, fixed in repo):** `apiService.getApprovedReflections()` in `services/api.ts` filtered junk rows (`resourceId && reflection`, already correct — matches the pattern documented in [[project_client_bugreport_2026-07-28]]'s 2026-07-29 update, 63 raw → 5 real on the live sheet) but, unlike `getApprovedPosts()`, never deduped by `id`. `getApprovedPosts()` has had a `uniquePostsMap` id-dedup pass since commit `3f0d3f1` (2026-06-08) specifically because `moveRowToLive()` has a known race (see [[project_client_bugreport_2026-07-28]] "Update 2026-07-30 — approving 2+ entries back-to-back duplicates the second one in Live") that can append the *same* Live row twice under rapid approval clicks. Reflections never got the equivalent frontend guard, so any resource that had a reflection duplicated by that backend race would count and render it twice (or more) — badge shows the inflated raw count, but the visible list has fewer *distinct* entries once you actually read them, matching the user's "not that many" complaint.

**Fixed:** `getApprovedReflections()` now builds a `globalThis.Map<string, ReflectionItem>` keyed by `id` (same shape as `uniquePostsMap`) and returns `Array.from(map.values())` — last-write-wins, exact same pattern as posts. Pure frontend fix, no backend redeploy needed. Verified with `npm run check` (typecheck + 22 tests + build, all pass).

**Note for later:** this only fixes rows that share the *same* `id` (true Live-sheet duplicates from the `moveRowToLive` race). If `item.id` is missing/blank on a raw row, the code still falls back to `Math.random().toString(36)` per item — such rows would NOT dedupe against each other. Not observed as the actual cause here (real submitted reflections get a real id from `doPost()`), but worth checking first if a *different* duplicate-reflection report ever surfaces after this fix is live.

**Still open:** the `liveRowHasId_()` guard in `docs/backend/ApprovalWorkflow.gs.js` (per [[project_client_bugreport_2026-07-28]]) should stop *new* duplicates going forward, but per that memory it was "not yet confirmed deployed live" as of 2026-07-30 — if it still isn't deployed, new duplicate rows could keep landing in `Live_Reflections` even with this frontend dedup catching them. Frontend dedup is a safety net, not a substitute for the backend fix being live.
