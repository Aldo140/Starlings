# Starlings Support Map — Staff Guide

**Spreadsheet link:** https://docs.google.com/spreadsheets/d/18Vzy15shBjz0u3ei0n_eLSmMONplb66rC5XvDLyExXM/edit

This guide explains how the Google Sheets system works, what each tab does, and how to moderate submissions day-to-day. No coding knowledge is required.

---

## How the System Works (Overview)

When a young person submits a note, question, or resource through the Starlings website, it arrives in a **Pending** tab in this spreadsheet. It sits there until a staff member reviews it. Once you change the `status` cell to `APPROVED`, the row automatically moves to the matching **Live** tab — and the website picks it up within a few minutes.

Nothing goes public without human approval.

---

## Spreadsheet Tabs

### Pending tabs — incoming submissions

| Tab | What lands here |
|-----|----------------|
| `Pending_Stories` | Anonymous notes of hope submitted from the map view |
| `Pending_Resources` | Resources recommended by community members |
| `Pending_QA` | Questions submitted from the landing page Q&A section |
| `Pending_Reflections` | Short personal reflections on existing resources |

### Live tabs — what the website shows

| Tab | What the website reads |
|-----|----------------------|
| `Live_Stories` | Notes shown as map pins |
| `Live_Resources` | Resources shown in the Resources section |
| `Live_QA` | Q&A pairs shown in the landing page (question + answer both needed) |
| `Live_Reflections` | Approved reflections attached to resources |

### Other tabs

| Tab | Purpose |
|-----|---------|
| `Flagged_Words` | Live word list checked on every submission — edit column A to update |

---

## Moderating a Submission — Step by Step

1. **Open the spreadsheet** at the link above.
2. **Go to the relevant Pending tab** (e.g., `Pending_Stories`).
3. **Read the submission** in the row. Key columns:
   - `content` or `message` — what the person wrote
   - `flagged` — `TRUE` if the system auto-flagged it for a crisis keyword
   - `timestamp` — when it was submitted
4. **Decide:**
   - **Approve:** Click the cell in column C (`status`) and type `APPROVED` (all caps). Press Enter.
   - **Edit first, then approve:** You can edit the `content` cell to correct errors or remove identifying details, then change `status` to `APPROVED`.
   - **Reject:** Leave the row as-is, or delete the row if it's spam/harmful.
5. Once you type `APPROVED`, the row automatically moves to the matching Live tab within seconds. **You don't need to copy/paste it yourself.**

> **Tip:** The status column is column C in all Pending tabs. If it doesn't move automatically, check that you're editing a Pending tab (not a Live one) and that the Apps Script is still deployed (see Troubleshooting below).

---

## Q&A Moderation (Special Case)

Q&A is a two-step process:

1. A young person submits a **question** via the landing page. It arrives in `Pending_QA` with an empty `answer` column.
2. A staff member writes the **answer** directly in the `answer` cell.
3. Once you've written the answer, change `status` to `APPROVED`.
4. The row moves to `Live_QA`. The website only shows Q&A pairs where **both question and answer are present**.

Questions without answers will never appear publicly, even if approved.

---

## Crisis-Flagged Submissions

Submissions are automatically checked for crisis language (words like "suicide", "self harm", "kill myself", "overdose"). If any are found:

- The `flagged` column shows `TRUE`
- The website also showed the person a safety resources screen before submitting

**What to do with a flagged submission:**
- Read it carefully. Many flagged posts are not in acute crisis — someone processing feelings, not in immediate danger.
- Use your clinical/safeguarding judgment.
- If the post is safe to publish (e.g., "I've been through hard times and survived"), you can approve it after editing if needed.
- If it indicates acute risk, **do not approve it** — and consider whether follow-up is needed per your safeguarding protocol.
- If it's unclear, escalate to your supervisor before approving.

The website also has a server-side backstop — even if something slips past frontend checks, the backend will re-flag it and mark it accordingly.

---

## Resource Reactions (Peer Insights)

Resources in `Live_Resources` have three reaction counters:

| Column | Triggered when someone clicks |
|--------|-------------------------------|
| `helpful_count` | "This helped me" |
| `supportive_count` | "I felt supported" |
| `exploring_count` | "I'm exploring this" |

These increment automatically when users interact with resources. You don't need to manage them. They're visible in the spreadsheet so you can see which resources resonate most with the community.

---

## Adding Q&A Answers Directly to Live_QA

If you want to update an answer on a published Q&A pair (e.g., the original answer needs improving), you can edit the `answer` column directly in `Live_QA`. Changes appear on the website within a few minutes (after the frontend cache refreshes).

---

## Adding Resources Directly (Staff-Curated)

You can add a resource directly to `Live_Resources` without going through the submission form:

1. Go to `Live_Resources`
2. Copy the last row's structure as a template
3. Fill in: `title`, `url`, `description`, `type` (WEBSITE / VIDEO / BOOK / PODCAST / APP / OTHER), `category`
4. Make sure `status` = `APPROVED` and `id` is unique (you can use a short slug like `headspace_app`)

The website will pick it up within a few minutes.

---

## Flagged_Words Tab — How to Use It

The `Flagged_Words` tab is **active**. The website reads it on every page load and checks every submission against it.

**To add a new term:**
1. Go to the `Flagged_Words` tab
2. Find the next empty row in column A
3. Type the word or phrase (e.g. `meet up irl`)
4. Press Enter — no other steps needed

The website caches the list for **30 minutes**. After adding a term, it will be live within half an hour.

**Format rules:**
- One word or phrase per cell, column A only
- No headers — terms start at row 1
- Case-insensitive — `Meet Up IRL` and `meet up irl` both match the same thing
- Matching is substring-based — `score some` will flag "can you score some drugs" automatically

**What happens when a term matches:**
The submission is flagged for staff review (same as the hardcoded crisis keywords) — it is **not** auto-rejected. Everything still goes to a human moderator.

**Note:** The website also has a built-in layer of hardcoded regex patterns (phone numbers, emails, URLs, core crisis keywords) that run regardless of this sheet. The sheet is an additional layer on top of those.

---

## Cache Refresh

The website caches data for **5 minutes** to reduce load on the spreadsheet. After approving a submission, it may take up to 5 minutes to appear live on the site. You can verify it moved to the correct `Live_*` tab immediately — if it's there, it will show up within the cache window.

---

## Troubleshooting

**The row didn't move after I typed APPROVED:**
- Make sure you're editing a `Pending_*` tab, not a `Live_*` tab
- Make sure the status is in column C (third column)
- Make sure you typed exactly `APPROVED` (all caps, no spaces)
- The Apps Script `onEdit` trigger runs on cell edit, not on save — it should fire immediately when you press Enter

**I accidentally approved something — can I undo it?**
- The row moved to the `Live_*` tab. Find it there and delete the row to remove it from the site.
- If you need to put it back in `Pending_*` for re-review, cut and paste the row.

**I can't see a Pending tab:**
- All tabs must exist in the spreadsheet. If one is missing, create a new tab with the exact name (case-sensitive).
- The Apps Script will error with a "Sheet not found" message if tabs are missing.

**The website isn't showing new submissions:**
- Check that the row is in the `Live_*` tab (not `Pending_*`)
- Wait up to 5 minutes for the cache to clear
- Do a hard-refresh in the browser (Ctrl+Shift+R / Cmd+Shift+R)

---

## Contact

For technical issues with the Apps Script or spreadsheet setup, contact the development team with:
- A screenshot of the error (if any)
- The tab name and row number you were editing
- What you expected to happen vs. what happened
