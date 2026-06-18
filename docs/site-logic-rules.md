# Starlings Site Logic Rules

This is the practical maintenance reference for how submissions, moderation, flagged words, and Google Sheets routing currently work.

## Data Flow

1. Users submit from the website.
2. The frontend sends a POST to the Google Apps Script web app.
3. Apps Script routes the row into the matching `Pending_*` tab.
4. Staff review the pending row.
5. Staff set `status` in column C to `APPROVED`.
6. Apps Script `onEdit` moves that row into the matching `Live_*` tab.
7. The frontend reads only `Live_*` tabs for public display.

## Current Tabs

Required live/pending tabs:

- `Pending_Stories`
- `Live_Stories`
- `Pending_Resources`
- `Live_Resources`
- `Pending_QA`
- `Live_QA`
- `Flagged_Words`

Current endpoint health check shows these are missing:

- `Pending_Reflections`
- `Live_Reflections`

Reflection submission will fail until those tabs are created or the reflection feature is disabled.

## Flagged Words

There are two safety layers.

Static layer in `constants.tsx`:

- URLs
- Email addresses
- US/Canada phone numbers
- Crisis words and phrases: `suicide`, `kill myself`, `hurt myself`, `end my life`, `die`, `self harm`, `self-harm`, `cut myself`, `overdose`, `OD`

Dynamic layer in `Flagged_Words`:

- The sheet has headers: `Term`, `Category`, `Severity`, `Route To`, `Notes`
- The frontend reads `Term`, `Category`, and `Severity`
- Terms are matched case-insensitively by substring
- The word list is cached in the browser for 30 minutes

Important: severity is stored and sent as metadata, but it does not currently change the blocking behavior. Any dynamic term match makes `hasBannedContent()` return true.

## Can Users Submit Prohibited Words?

Map notes from `ShareView`:

- UI checks the note text before submission.
- Any static pattern or dynamic `Flagged_Words` term opens the safety modal and stops the submit.
- If frontend checks are bypassed, `submitPost()` can still send the row with `flagged: true`.
- Apps Script also flags crisis terms server-side.

Landing-page Q&A:

- UI checks the question before submission.
- Any static pattern or dynamic `Flagged_Words` term opens the safety modal and stops the submit.
- `submitQuestion()` also sends `flagged_severity` and `flagged_category` if it is called directly and detects a match.
- Q&A now verifies the Apps Script backend target before showing success.

Resource recommendations from `ShareView`:

- UI checks title, description, and author before submission.
- The resource URL itself is not included in the banned-word check in this flow.

Resource submissions from `AddResourceView`:

- No banned-word check currently runs here.
- A resource with a flagged term can be submitted from this route.
- Apps Script only server-flags crisis terms from the raw payload; it does not check the dynamic `Flagged_Words` tab.

Resource reflections:

- UI/API checks the reflection text.
- Any flagged match blocks submission and asks the user to revise.
- This feature currently needs `Pending_Reflections` and `Live_Reflections` tabs to exist.

## Backend Rules

Apps Script routes by `action`:

- `addStory` -> `Pending_Stories`
- `addResource` -> `Pending_Resources`
- `addQA` -> `Pending_QA`
- `addReflection` -> `Pending_Reflections`
- `incrementInsight` -> updates counters in `Live_Resources`

Apps Script normalizes headers before writing rows. This protects against decorated headers such as `id Pending_QA - Peer Question...`; the first word is used as the real column key.

Apps Script replaces these fields:

- `id` -> generated UUID
- `timestamp` -> current server timestamp
- `status` -> `PENDING`
- `flagged` -> server-calculated flag
- `Approve` -> `false`

New pending submissions are inserted at row 2, directly under the header row. They are not appended to the bottom, because the workbook has staff guidance/dashboard content below the active moderation table.

## Public Display Rules

Stories:

- Public map reads from `Live_Stories`.
- Pending rows are never public.

Resources:

- Public resources read from `Live_Resources`.
- Seed resources are added in frontend if not already present.
- Reaction counters are `helpful_count`, `supportive_count`, and `exploring_count`.
- A community resource appears in the `Map-Based Resources` category only when
  it has a city and valid `lat`/`lng` values.
- The Support Map reads both `Live_Stories` and `Live_Resources`, but includes
  only coordinate-bearing resources from `Live_Resources`.
- Legacy `[RESOURCE ...]` rows in `Live_Stories` are excluded from the map.
- Resources recommended from the map require a location. Resources recommended
  from the Resources page are global by default and use an explicit map-based
  opt-in before location can be entered.
- Public API responses must never include `submitter_email`, `qualifications`,
  moderation flags, approval controls, or other staff-only fields.

## Workbook Privacy

- The Google workbook must be restricted to named moderator accounts.
- Do not publish the workbook or enable “Anyone with the link.”
- The website reads public content through the Apps Script endpoint; it does not
  require the spreadsheet itself to be public.
- `Pending_Resources.submitter_email` is personally identifiable information.

Q&A:

- Public Q&A reads from `Live_QA`.
- A Q&A only displays if both `question` and `answer` are present.
- Approved questions with blank answers stay hidden.

## Maintenance Rules

- Keep the Apps Script deployment on the same deployment ID used by `services/api.ts`.
- After editing Apps Script, deploy a new version; saving code is not enough.
- Verify deployment with `?action=health`.
- After deploying the location-resource backend update, `backendVersion` should
  be `2026-06-18-location-based-resources`.
- Keep `Pending_QA` headers as: `id`, `timestamp`, `status`, `question`, `answer`, `flagged`, `Approve`.
- Keep `Live_QA` headers as: `id`, `timestamp`, `status`, `question`, `answer`, `flagged`.
- If using reflections, create `Pending_Reflections` and `Live_Reflections`.
- Update `Flagged_Words` terms in the `Term` column, starting on row 2.
- Remember that frontend caches flagged words for 30 minutes and public content for 5 minutes.
