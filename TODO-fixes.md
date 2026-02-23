# Fix Plan: APIs, Routing, Swiper, and Lightbox

## 1. Fix Admin API (Vercel Node error)
**Problem**: Vercel tries to run the raw `/api/*.ts` files in Node but encounters ES module import syntax errors because the root `api/` directory is missing compilation config for Vercel's legacy builders, or conflicts with Next.js typescript configuration.
**Solution**: 
Instead of a raw `/api` folder, we will:
1. Remove `output: 'export'` from `next.config.js`. 
2. Move the API files into Next.js App Router Route Handlers (`app/api/login/route.ts`, `app/api/content/route.ts`, etc.). 
3. *Why?* Next.js by default fully statically prerenders all public pages (`/`, `/en`, etc.) at build time even without `output: 'export'` (as long as they don't use dynamic data fetching). This satisfies the "Static at runtime" constraint perfectly, while allowing Next.js built-in Webpack to handle compiling the API routes flawlessly for Vercel Serverless.

## 2. Directory Routing (`/[project]`)
**Problem**: The current app relies on query string `?project=` or hash routing, which is bad for SEO and doesn't match the requested `lisamazzei.com/countrymysteries`.
**Solution**:
1. Create dynamic routes: 
   - `app/[project]/page.tsx`
   - `app/en/[project]/page.tsx`
2. Use `generateStaticParams()` in both to output the static HTML at build time for every project defined in `site.json`.
3. Update `PortfolioUI` to act purely as a view for the currently passed project, removing the frontend state-based section switching and using actual structural `<a>` links.

## 3. Swiper & Preloader Fixes
**Problem**: The `.swiper-lazy-preloader` never disappears. Swiper horizontal scroll lacks drag/drop and keyboard support.
**Solution**:
1. Add `grabCursor: true` and `keyboard: { enabled: true }` to the Swiper configuration to fulfill the input requirements.
2. In the `IntersectionObserver` (or direct image `onLoad`), specifically target the `.swiper-lazy-preloader` sibling of the loaded image and set `display: none` or remove it.

## 4. Lightbox Implementation
**Problem**: Missing image expanding capability.
**Solution**:
1. Implement a custom React `Lightbox` component or use `yet-another-react-lightbox` (very lightweight).
2. It will overlay the screen with the selected image, and allow Left/Right arrows, Esc key, and swiping (if using library) to navigate the project's photos. It will be enabled for every project.

### Verification Command
`npm run build` and then `npm start` locally to verify 1) static pages are generated correctly out of `/` and `/[project]`, and 2) `/api` routes respond without 500 module errors.
