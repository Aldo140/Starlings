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
- Backend reference/source-of-truth for the Google Apps Script project: `docs/backend/Code.gs.js` + `docs/backend/ApprovalWorkflow.gs.js` (not auto-deployed — must be manually pasted into the Apps Script editor and redeployed). The old single `docs/backend/gas-backend.js` was deleted 2026-07-14 — it had drifted into an aspirational draft that didn't match the real deployed script (real project has two files: Code.gs + ApprovalWorkflow.gs, confirmed by reading the actual pasted source). Don't recreate that mistake — verify against what the user pastes from the live Apps Script editor before writing backend docs.
- Resource category bucketing logic (type vs. map-location priority): `views/ResourcesView.tsx`, `communityBucketResources` — a resource's format (book, video, etc.) now always wins over having a location tag; "Map-Based Resources" bucket is reserved for resources with no recognized format that also carry a location.

## Ground-truth ledger (2026-07-14) — ONLY claim these are fixed with this level of confidence

| Item | Status | Confidence |
|---|---|---|
| Q&A showing only 4 of 5 | Fixed | Solid — pure frontend code (Landing.tsx), tested, committed, pushed |
| Q&A answer auto-formatting (lists/bullets/bylines) | Fixed | Solid — frontend code (QAThread.tsx), covered by tests/formatAnswer.test.ts against real answer text, committed, pushed |
| Glass Castle book under Map-Based Resources | Fixed | Solid — pure frontend bucket-priority fix (ResourcesView.tsx), tested, committed, pushed |
| Duplicate resources on approval | Fixed | High — root cause (Code.gs onEdit + ApprovalWorkflow.gs approvalOnEdit both firing) requires deleting Code.gs's onEdit function live in the Apps Script editor; user's later report of Resources-approve breaking is consistent with them having done this. Not independently re-verifiable by me. |
| Resources Approve checkbox not moving rows (found after the duplicate fix) | Fixed | Confirmed — user explicitly tested and said "okay it works" after the findHeaderCol_ header-driven rewrite |
| Reflections "no option to approve" | Presumed fixed, NOT independently confirmed | Medium — TAB_CONFIG entries for Pending_Reflections/Live_Reflections were given in the same message as the Code.gs onEdit deletion; user's later Resources-breaking report implies they applied that whole message, but they never explicitly re-tested Reflections specifically. Ask before telling Agnes this is 100% done. |
| Reflection photo field (submission side) | Fixed | Aldo confirmed adding the `image_url` header to both `Pending_Reflections` and `Live_Reflections` (pasted sheet contents 2026-07-14 showing the column present). Submission wiring was already correct — this closes the loop. |
| Reflections displayed publicly (incl. photos) | **Built for real — this time explicitly requested by Aldo**, not inferred. See below. | Superseded the "do not build" note below it. Aldo explicitly asked: show approved reflections publicly with proper styling, make the photo field conditional (only for resource types where a photo makes sense), and add a hover/tap info popover teaching users how to get an image link. Built 2026-07-14: `getApprovedReflections()` in api.ts, "What others shared" section in `ResourceCard` (`ResourcesView.tsx`) with a preview-then-expand list, `InfoPopover` component (click-to-toggle + hover, works on both desktop and touch), `supportsReflectionImage()` restricting the photo field to `ResourceType.BOOK / MEME / PUBLICATION`. Still needs the one-line `getReflections` route pasted into the live `Code.gs` (see `docs/backend/Code.gs.js`) before it actually shows data — frontend fails safe (empty list) until then. |
| Duplicate reflection/insight submissions from rapid clicks | Fixed | Root cause of the observed "Love this book, too." x4 duplicate rows: the reflection Submit button had no loading/disable state, unlike every other form on the site. Fixed with an `isSubmittingReflection` guard (button disables + shows spinner) and a ref-based synchronous lock on the Peer Insights reaction buttons. Tested, committed, pushed. |
| Domain starlingsmap.ca DNS/GitHub Pages | **Confirmed fully live** | Verified directly: DNS resolves correctly from Google's public resolver, TLS certificate confirmed valid (`subject: CN=starlingsmap.ca`, issuer Let's Encrypt), and a direct HTTPS request returned the real site HTML with correct asset paths. All 5 recent GitHub Actions deploys succeeded. Not a "should work" — actually independently verified working. |

## History on the public-reflections-display feature — read before touching it again
Agnes's *original* email question was purely about the Google Sheet (where does a photo land, why won't Approve work) — not a request for public display. A public display feature was built once on 2026-07-14 based on a misread of that question, then reverted the same day once Aldo clarified. See [[feedback_scope_from_client_questions]] for that lesson — it still holds for *inferring* scope from a conversation's drift.

Later the same day, Aldo came back and **explicitly** asked for public display (with specific design requirements: proper styling, conditional photo field, hover/tap info popover). That's a real, unambiguous request from the developer, not an inference — it was built for real this time (see ledger above). The lesson isn't "never build this" — it's "don't build it from an inferred reaction; build it when someone actually asks."
