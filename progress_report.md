# Starlings Support Map: Google Sheets Launch Execution Plan

This plan keeps Google Sheets as the working backend for the May review and May 30 soft launch. Firebase remains the later migration path, but the immediate goal is to make the current Google Sheets + Google Apps Script system reliable, reviewable, and clear for Agnes and the Starlings team.

## 1. Current Backend Reality

The app already has a Google Apps Script backend in `services/gas-backend.js`. It is designed around separate moderation tabs:

| Content | User submits to | Moderator approves into | Frontend reads from |
| :--- | :--- | :--- | :--- |
| Map notes | `Pending_Stories` | `Live_Stories` | `getStories` |
| Resource recommendations | `Pending_Resources` | `Live_Resources` | `getResources` |
| Q&A questions | `Pending_QA` | `Live_QA` | `getQA` answered rows |
| Resource reflections | `Pending_Reflections` | `Live_Reflections` | pending moderation |
| Flagged words | `Flagged_Words` | n/a | backend can expose `getFlaggedWords` |

The immediate operational answer for Agnes is:

- Yes, she needs access to the Google Sheet directly to review and approve inputs.
- Q&A submissions currently go to `Pending_QA`.
- Q&A answers can now show publicly when a row in `Live_QA` has both `question` and `answer` filled in.
- Flagged-word popups can be done now without AI. The AI version can come later; for launch, a human-centered crisis modal is safer and more predictable.

## 2. Highest-Priority Problems To Fix

### A. Launch Reliability Bugs

1. Fix the `ShareView` submit button validation bug.
   - Current issue: the button uses `!isFormValid` instead of `!isFormValid()`.
   - Impact: invalid forms can look enabled even though submit is blocked later.

2. Reset regex state before every banned-pattern check.
   - Current issue: some banned regexes use the global flag, so repeated `.test()` calls can skip matches unless `lastIndex` is reset.
   - Impact: flagged words/contact info may be inconsistently detected.

3. Make manual refresh actually bypass cache.
   - Current issue: `MapView` refresh calls `getApprovedPosts()` without `skipCache`.
   - Fix: call `getApprovedPosts(true)`.

4. Remove or isolate the unused `HeroScene3D` dependency risk.
   - Status: done. The unused file was removed so launch builds do not depend on unlisted Three.js packages.

### B. Google Sheets Data Model Fixes

1. Confirm all required sheet tabs exist:
   - `Pending_Stories`
   - `Live_Stories`
   - `Pending_Resources`
   - `Live_Resources`
   - `Pending_QA`
   - `Live_QA`
   - `Pending_Reflections`
   - `Live_Reflections`
   - `Flagged_Words`

2. Confirm headers match app expectations.
   - Stories: `id`, `timestamp`, `status`, `country`, `city`, `lat`, `lng`, `message`, `what_helped`, `alias`, `flagged`
   - Resources: `id`, `timestamp`, `status`, `resource_type`, `title`, `url`, `description`, `alias`, `submitterEmail`, `qualifications`, `category`, `location`, `image_url`, `helpful_count`, `supportive_count`, `exploring_count`
   - Q&A: `id`, `timestamp`, `status`, `question`, `answer`, `flagged`
   - Reflections: `id`, `timestamp`, `status`, `resourceId`, `reflection`, `flagged`
   - Flagged words: column A only, one phrase per row

3. Preserve resource categories from Sheets.
   - Current issue: `getApprovedResources` forces every live Google Sheet resource into `category: 'community'`.
   - Fix: only default to `community` if the sheet row has no category.

4. Add the three requested resources through Sheets or seed data:
   - Kickstand Connect: `https://mykickstand.ca/connect/`
   - Urban Society for Aboriginal Youth: `https://usay.ca/`
   - Roots of Hope LaRonge: `https://www.rootsofhope.ca/`

## 3. Client Feedback Execution Plan

### Phase 1: Before Agnes Sends To Starlings Team

Goal: make the site safe, consistent, and ready for review.

1. Landing page edits
   - Remove: `HEALING STARTS WITH CONNECTION | For Peers, by peers`.
   - Update copy to: `An anonymous space for individuals to share what helps them navigate a parent's or other family member's substance use challenges.`
   - Add an `Ask a Question` button after `Explore the Map`.
   - Move the unanswered questions/Q&A section directly after the hero buttons.
   - Remove the bottom quote: `You aren't defined by the struggles in your family; you are defined by how you care for yourself and others.`

2. Q&A flow
   - Keep question submission into `Pending_QA`.
   - Add a clear internal note for Agnes: submitted questions appear in `Pending_QA`.
   - Decide one of two launch modes:
     - Mode A: public Q&A display reads approved rows from `Live_QA`.
     - Mode B: only collect questions for launch, answer manually outside the website.
   - Recommended for May review: Mode A if time allows, otherwise Mode B with clear wording.

3. Flagged-word popup
   - Replace the current plain error message with a human-centered modal.
   - Trigger it for crisis phrases such as `hurt myself`, `kill myself`, `suicide`, `self harm`, `self-harm`, `overdose`, and contact-info patterns.
   - Modal copy should avoid shame and say something like:
     `Thank you for trusting this space. What you wrote sounds like it may need more immediate support than this map can offer. Starlings is not crisis support, but you deserve care right now.`
   - Include links:
     - `https://www.starlings.ca/community-crisis-lines`
     - Optional direct crisis resources if Agnes confirms which ones to list.
   - Still block submission or route it as flagged, depending on Agnes's preference. Recommended: block crisis content and invite revision, while saving non-crisis flagged submissions as pending with `flagged = true`.

4. Map cleanup
   - Remove generic mock posts from the production map.
   - Keep mock data only for local development or empty-state fallback if explicitly wanted.
   - Make live Google Sheet data the review source of truth.

5. Link audit
   - Verify `Share a Resource`, `Ask a Question`, `Explore Map`, `Recommend`, `Apply to Post`, crisis link, and resource links.
   - Fix any route or external-link mismatches.

### Phase 2: Before May 30 Soft Launch

Goal: make the Google Sheets workflow usable by the team.

1. Prepare Agnes's moderation Sheet
   - Share the Google Sheet with Agnes.
   - Add a short `README` tab inside the Sheet explaining:
     - Where new stories appear.
     - Where new resources appear.
     - Where new questions appear.
     - How to approve by changing `status` to `APPROVED`.
     - What `flagged = TRUE` means.

2. Q&A display, if approved
   - Add `getApprovedQA()` to `api.ts`.
   - Add `Live_QA` rendering on the landing page.
   - Display only rows with question and answer.
   - Keep unanswered approved questions hidden until an answer exists.

3. Resource management
   - Add requested resources to `Live_Resources` or `SEED_RESOURCES`, ideally Sheets.
   - Ensure resource buckets sort alphabetically.
   - Keep peer insight counters backed by `Live_Resources` columns.
   - Optional short reflections now submit to `Pending_Reflections` for moderation.

4. Domain planning
   - Soft launch can continue on the current hosted URL if domain purchase is not ready.
   - If using a custom domain before May 30, plan DNS, Vercel/GitHub Pages configuration, SSL propagation time, and final link testing.

### Phase 3: After Team Review / Before September 1 Main Launch

Goal: polish, broaden safety, and prepare for scale.

1. Incorporate Starlings team suggestions from the May review.
2. Strengthen moderation language and crisis handling.
3. Add privacy-preserving analytics if approved.
4. Decide on AI integration scope:
   - crisis-language detection support
   - resource recommendation assistant
   - moderation triage helper
   - Q&A draft-answer helper
5. Plan Firebase migration:
   - Firestore collections for stories, resources, questions, reactions, reflections
   - admin approval dashboard
   - role-based access
   - audit log

## 4. Google Sheets-First Implementation Notes

Google Sheets can work for launch if we keep the data shape simple:

- Use Sheets for moderation queues and approved live content.
- Avoid complex nested comments for now.
- Keep resource reaction counters as columns.
- Keep Q&A answers as a simple `answer` column.
- Avoid using Sheets as a full social network until Firebase migration.

Recommended minimal tab setup:

### `Pending_Stories` / `Live_Stories`

Headers:

`id, timestamp, status, country, city, lat, lng, message, what_helped, alias, flagged, internal_notes`

### `Pending_Resources` / `Live_Resources`

Headers:

`id, timestamp, status, resource_type, title, url, description, alias, submitterEmail, qualifications, category, location, image_url, helpful_count, supportive_count, exploring_count, flagged, internal_notes`

### `Pending_QA` / `Live_QA`

Headers:

`id, timestamp, status, question, answer, flagged, internal_notes`

### `Pending_Reflections` / `Live_Reflections`

Headers:

`id, timestamp, status, resourceId, reflection, flagged, internal_notes`

### `Flagged_Words`

Headers are optional. Use column A for phrases:

`hurt myself`

`kill myself`

`suicide`

`self harm`

`self-harm`

`overdose`

`phone number`

`email`

## 5. Suggested Reply To Agnes

Hi Agnes,

Thank you for sending the edits. We can keep Google Sheets for the soft launch and make that workflow usable for the Starlings review group.

For your questions:

- Yes, I will make sure you have access to the Google Sheet where submissions come in. Notes, resources, and questions will each have their own pending review tab.
- Q&A submissions currently go into a pending Q&A tab. The answer does not show publicly yet unless we add an approved Q&A display section, which I can include as part of these final edits.
- Yes, we can add a flagged-word popup before the AI integration. For crisis phrases like “hurt myself,” “kill myself,” or “suicide,” the site can show a human-centered support message and link people to crisis resources. That gives us a safer launch version now, and AI can be explored later.

I’ll prioritize the landing page edits, moving the question section up, removing generic map posts, checking links, adding the requested resources, and making the Google Sheet review flow clear before you send it to the Starlings team.

## 6. Immediate Developer Checklist

- [x] Fix `ShareView` submit button validation call.
- [x] Reset banned-pattern regex `lastIndex` before every `.test()`.
- [x] Add crisis/flagged-word modal.
- [x] Move Q&A section directly under hero buttons.
- [x] Add `Ask a Question` hero button.
- [x] Update hero copy.
- [x] Remove landing badge text.
- [x] Remove bottom quote.
- [x] Remove production mock posts from map or gate them to local/dev fallback.
- [x] Make refresh bypass cache.
- [x] Preserve resource categories from Google Sheets.
- [x] Add requested community resources.
- [x] Decide and implement Q&A display mode.
- [x] Wire optional resource reflections to `Pending_Reflections`.
- [x] Audit all key launch links (`Explore Map`, `Ask a Question`, `Share`, `Recommend`, `Apply`, crisis links, and requested resources).
- [x] Update README with Google Sheets moderation instructions.
