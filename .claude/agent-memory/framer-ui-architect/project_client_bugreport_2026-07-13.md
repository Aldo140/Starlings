---
name: project_client_bugreport_2026-07-13
description: Agnes Chen (client) reported 4 bugs on 2026-07-13 via email; root causes, fixes applied, and what's still outside-repo
type: project
---

Client (Agnes Chen, agneschen@starlings.ca) emailed Aldo on 2026-07-13 with 4 issues after the map edits shipped. Domain preference decided in the same thread: **starlingsmap.ca**.

**Why this matters:** these are real production bugs affecting the live moderation workflow (Google Sheet + Apps Script backend at `docs/backend/gas-backend.js`), not cosmetic issues — Agnes actively moderates submissions through the sheet, so a broken approval flow blocks her from publishing content.

## Issue 1 — Duplicate resources when approving
**Root cause:** the project's Apps Script setup has two separate `onEdit`-style handlers reacting to the same checkbox click (this file's `onEdit`, likely plus a legacy `ApprovalWorkflow.gs` and/or a duplicate installable "On edit" trigger registered under Extensions > Apps Script > Triggers). Both move the row → duplicate in `Live_Resources`.
**Fixed in repo:** `gas-backend.js` `onEdit` is now checkbox-aware (reacts to the "Approve" column, not just literal "APPROVED" text in the status column) and `moveApprovedRow_` now has an idempotency guard (`liveRowHasId_`) that refuses to insert a row whose `id` already exists live — so even a double-fire can't duplicate data going forward.
**Still needs manual action (outside repo, Aldo must do this in the live Apps Script project):** open Extensions > Apps Script, find any other file/function also named `onEdit`, delete or rename it; check the Triggers (clock icon) sidebar and delete any extra installable "On edit" trigger. The updated `gas-backend.js` must be pasted in as the sole backend file and redeployed as a new version (see instructions block at top of the file).
**One-time cleanup:** `repairWorkbookData()` in the same file already de-dupes existing `Live_Resources` rows — run it once from the Apps Script editor to clean up what's already duplicated.

## Issue 2 — Reflections: "says false, no option to approve"
**Root cause:** `Pending_Reflections` rows are inserted at row 2 (`writePendingSubmission_`), directly under the header row, which has no checkbox formatting to inherit — so the "Approve" column rendered as plain FALSE text with nothing clickable. Separately, the old `onEdit` only reacted to the literal `status` column, never to the `Approve` checkbox, so reflections had no working approval path at all (unlike Resources, which presumably has separate legacy checkbox-wiring — see Issue 1).
**Fixed in repo:** `ensureApproveCheckboxes_()` applies real checkbox data validation to the whole Approve column and is called both from `setup()` and every time a new row is inserted. `onEdit` now generically handles the "Approve" checkbox → sets status to APPROVED → moves the row, for any `Pending_` sheet that has both columns (Resources, QA, Reflections, Stories).
**Needs:** run `setup()` once after redeploying, per the instructions block.

## Issue 3 — "Photo added on a reflection, where does it go?"
**Root cause:** there was no `image_url` column on `Pending_Reflections`/`Live_Reflections` at all, and — more importantly — **approved reflections are never fetched or displayed anywhere on the live site.** There's no `getReflections` action in `doGet`, no frontend call to read `Live_Reflections`. Reflections are currently a write-only moderation record, not a public feature.
**Fixed in repo (partial):** added an `image_url` column to both reflection sheets, and a "Add a photo link (optional)" URL input in the reflection form (`ResourcesView.tsx` `ResourceCard`) wired through `apiService.submitReflection`. This is a paste-a-URL field, not a file-upload widget — there's no image hosting service (Cloudinary/S3/etc.) wired into this project yet.
**Open product decision, not yet built:** whether approved reflections (text + photo) should actually be displayed publicly on the resource card as peer testimonials. This touches the site's youth-safety/anonymity posture (see crisis banner + moderation-first design elsewhere in the app), so it needs an explicit decision from Agnes before building a public display, not just quiet implementation.

## Issue 4 — Q&A: "5 questions in the sheet, only 4 showing"
**Root cause:** `views/Landing.tsx` had a hardcoded `approvedQA.slice(0, 4)` capping the rendered list at 4 items, while the count badge next to "Answered by the community" correctly showed `approvedQA.length` (5) — hence the visible mismatch.
**Fixed in repo:** removed the `.slice(0, 4)` cap; all approved Q&A items now render.

## Related code pointers
- Backend reference/source-of-truth for the Google Apps Script project: `docs/backend/gas-backend.js` (not auto-deployed — must be manually pasted into the Apps Script editor and redeployed).
- Resource category bucketing logic (type vs. map-location priority): `views/ResourcesView.tsx`, `communityBucketResources` — a resource's format (book, video, etc.) now always wins over having a location tag; "Map-Based Resources" bucket is reserved for resources with no recognized format that also carry a location.
