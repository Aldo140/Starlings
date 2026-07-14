---
name: feedback_scope_from_client_questions
description: When ground-truthing a client's question, re-read their literal original wording before inferring scope from how the conversation with the developer drifted
type: feedback
---

Don't let a conversation's own momentum with the developer (Aldo) expand the scope of what the actual client (Agnes) asked. Re-read her literal original email wording as the source of truth for intent, not the developer's paraphrase or reaction several turns later.

**What happened (2026-07-14):** Agnes's email asked where a reflection's photo lands in the spreadsheet, and why the Approve checkbox didn't work — a purely internal, spreadsheet-side question. While explaining the technical gap to Aldo, I described it as "reflections are never shown publicly" (true, but incidental context). Aldo reacted with frustration ("we should fix this wtf, this does not make sense"), and I took that as a request to build a public-facing reflections display feature — a real, non-trivial feature (new API route, new UI section, new types) that nobody had actually asked for. It had to be built, then fully reverted once Aldo clarified Agnes's real question.

**Why:** Developer reactions mid-conversation are responses to *my explanation*, not necessarily new requirements from the client. A developer expressing surprise or frustration at a technical gap I surfaced is not the same as them commissioning a feature to close that gap. The client's original words are the ground truth for what's actually wanted; everything downstream is interpretation and can drift.

**How to apply:** When a task originates from a specific client email/message (not a live conversation with the client), keep it available in context and check the literal question against any planned work before writing code — but the actual literal check that would have prevented this: sheet questions from a non-technical client asking "where does X go" are almost always asking "where does X physically live in the data I look at," not "should X be public." Ask a clarifying question before building anything beyond what was literally asked, especially for a youth-safety site where over-building public-facing features has real privacy/anonymity stakes (see [[project_client_bugreport_2026-07-13]]).
