# Antigravity Mission Plan - lisamazzei.com Next.js Migration

## 1. Repo Understanding
- **Current State**: The repo contains a single page `index.html` which has hardcoded HTML for different portfolio galleries (`#countrymysteries`, `#narrative`, `#other`, etc.) but also features `.txt` files (`text.txt`, `title.txt`, `projects.txt`) within corresponding directories. The `index.html` loads images lazily using Swiper and IntersectionObserver.
- **Routing**: Currently a single page application with navigation handling URL modifications (e.g. `?project=countrymysteries`).
- **Assets**: Images are located in `<project-name>/img/` directories. CSS is embedded in `index.html`.

## 2. Risk List
- **Visual Parity (HTML/CSS)**: Moving static HTML loops to React/Next.js might inject extra DOM nodes or alter class names. 
  - *Mitigation*: Strictly stick to native `<img>` tags with same classes (`swiper-lazy`, `gallery-img`) rather than relying on Next.js `next/image`. Copy CSS exactly as it appears in `index.html` into a global stylesheet.
- **Swiper & Vanilla JS**: The existing Swiper logic and Vanilla JS intersection observers must be preserved within a React `useEffect` or kept as a separate imported script to run safely.
  - *Mitigation*: Mount a single React component that initializes Swiper identically upon data load.
- **Admin APIs & Next.js Static Export**: Next.js `output: 'export'` normally prohibits `app/api/` usage.
  - *Mitigation*: We will place the Admin backend routes in a standard `api/` directory at the project root which Vercel will treat as pure Serverless Functions outside of the Next.js build.

## 3. Step-by-Step Plan & Checkpoints

### Step 1: Initialize Next.js scaffolding
- Approach: Add `package.json`, `next.config.js` configuring `output: 'export'`, `tsconfig.json`. Setup basic Next.js App router (`app/layout.tsx`, `app/page.tsx`). Global CSS migrated to `app/global.css`.
- Verification command: `npm run build && npx serve out`

### Step 2: Content Migration Utility
- Approach: Write a standalone Node.js script `migrate-content.js` to parse `projects.txt` and all `*/title.txt`, `*/text.txt` into a canonical `content/site.json` and `content/assets-manifest.json`.
- Verification command: `node migrate-content.js` and verify `content/site.json` is generated with correct content.

### Step 3: Implement Static Public Site
- Approach: Build the Next.js frontend to ingest `content/site.json` and generate `/` (Italian) and `/en/` (English) pages. Replicate the vanilla App state, intersection observer, and Swiper initializations in a client component.
- Verification command: `npm run build` and run smoke tests visually or via `curl` against `out/index.html` and `out/en/index.html`.

### Step 4: Add Multilingual & SEO
- Approach: Extend JSON to have `it` and `en` fields for text. Build language switcher in UI, and set up dynamic `[lang]` generation. Include `hreflang` and `canonical` meta headers per page. 
- Verification command: `npm run build && cat out/en/index.html | grep hreflang`

### Step 5: Implement Admin Panel Architecture (APIs)
- Approach: Create Vercel Serverless Functions in `/api/...` (Root). Set up endpoints for `/api/admin/login`, `/api/admin/content`, `/api/admin/assets` to perform GitHub API commits and handle basic token-based auth. 
- Verification command: Start a local api server or test via direct node scripts mocking auth.

### Step 6: Implement Admin UI
- Approach: Create an internal page route `/admin` (non-obvious Next.js route, using purely CSR to not bake secrets). Provide single-field password login. Add UI components to edit JSON and reorder arrays, plus an "Advanced" settings toggle. Add drag & drop for Images. 
- Verification command: `npm run build && npx serve out` and navigate to `/admin` to test UI interactions.

### Step 7: Storage & Cleanup (GitHub & Blob)
- Approach: Implement Github Asset commit and optional Vercel Blob integrations. Add tracking for total usage from `content/assets-manifest.json` calculations. Ensure replacement properly unlinks old files.
- Verification command: Full smoke test: Build site, execute mockup asset replacements and assertions to ensure clean manifest.
