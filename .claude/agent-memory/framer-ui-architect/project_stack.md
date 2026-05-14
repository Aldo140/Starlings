---
name: "Project Stack"
description: "Full tech stack for Starlings — framework, styling, animation, routing, data, and deployment"
type: "project"
---

Starlings is a React + Vite + TypeScript single-page application deployed as a static site.

**Framework**: React 18, file extension `.tsx` / `.ts` throughout.
**Routing**: `react-router-dom` v6 with HashRouter (important: routes use `/#/path` format, not `/path`).
**Styling**: Tailwind CSS utility classes. Almost no CSS Modules or styled-components. Global styles are minimal — `index.css` only has `@tailwind` directives and a tiny `html/body/#root` rule. All design tokens live in `index.html` `<style>` block as CSS custom properties.
**Animation**: Framer Motion is the primary animation library. Already installed and heavily used. GSAP is NOT installed — do not add it without justification.
**Icons**: Lucide React (`lucide-react`). Exported from `constants.tsx` as `ICONS` map. A few Lucide icons are also imported directly in views.
**Data**: Google Sheets via a custom `apiService`. Offline queue via localStorage.
**Maps**: Leaflet via CDN script tag in `index.html`.
**Fonts**: Cabinet Grotesk (Fontshare CDN) + Inter (Google Fonts CDN) — both loaded in `index.html`.

**Why:** Understanding the stack prevents installing redundant libraries (GSAP on top of Framer Motion) or breaking the HashRouter with push-state links.
**How to apply:** When adding animation, use Framer Motion first. When adding icons, add to the `ICONS` export in `constants.tsx` and use Lucide. Never use emoji as icons. Check HashRouter compatibility for any new route-dependent logic.
