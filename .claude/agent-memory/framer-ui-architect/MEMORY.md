# Framer UI Architect — Memory Index

- [Project Stack](project_stack.md) — React + Vite + TypeScript + Tailwind + Framer Motion; HashRouter; no GSAP
- [Design System Tokens](design_system_tokens.md) — All hex colors, Cabinet Grotesk + Inter fonts, easing curves, radius scale, shadow patterns, texture snippets
- [Care Loop Architecture](care_loop_architecture.md) — Now lives in AboutMap.tsx (moved from Landing.tsx); scroll-pin wiring; CardIllustration; mobile fallback exists
- [Component Conventions](component_conventions.md) — File map, ICONS pattern, animation configs, z-index hierarchy, border/shadow conventions, a11y patterns
- [Animation Placement Feedback](feedback_animation_placement.md) — Animations must define section identity, not decorate it (key user feedback 2026-05-17)
- [Client Bug Report 2026-07-13](project_client_bugreport_2026-07-13.md) — Agnes's 4 bugs (duplicate approvals, reflections approve/photo, QA cap-at-4), root causes + fix status
- [Scope From Client Questions](feedback_scope_from_client_questions.md) — re-read the client's literal wording, not the developer's mid-conversation reaction, before expanding scope (built-then-reverted reflections public display, 2026-07-14)
- [Client Bug Report 2026-07-28](project_client_bugreport_2026-07-28.md) — INFO_START_OFFSET row collision, health handler sheets/normalizedHeaders, doPost field lookup, approvalOnEdit race fix, getApprovedResources missing validity filter (empty Resources cards, fixed 2026-07-29)
- [Reflections Duplicate Count Bug](project_bug_reflections_duplicate_count_2026-07-29.md) — getApprovedReflections lacked id-dedup (posts had it, reflections didn't); fixed by adding same uniquePostsMap-style Map dedup
