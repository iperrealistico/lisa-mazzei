# lisamazzei.com Next.js Migration

This repository contains the Next.js static export version of the Lisa Mazzei photography portfolio.

## Architecture

The site has been converted from a runtime Javascript/TXT parser into a **Next.js Static Site Generation** project.
- **Content Mode**: All texts, URLs, and image paths are defined in `content/site.json`, generating the static HTML at build time (`/` for Italian, `/en` for English).
- **Directory Routing**: Every project generates a literal static path (`/[project]` and `/en/[project]`). Query parameters are no longer used for core navigation.
- **Lightbox**: Every project gallery is equipped with a fullscreen interactive touch Lightbox natively hooked into the JSON manifest.
- **Admin Panel**: A client-side admin dashboard lives at `/admin`. It uses Vercel Serverless Functions (`/api/`) to securely talk to GitHub and Vercel Blob.
- **Workflow**: Editing content from the Admin Panel updates `site.json` in the GitHub repo directly, triggering a new Vercel deployment which rebuilds the static site.

## Setup & Verification

1. **Install Dependencies**: `npm install`
2. **Local Preview**: Since the API lives in Vercel Functions (`/api`), the easiest local preview is `vercel dev` or simply running `npm run build && npx serve out` to test the static public site.

## Environment Variables (Vercel)

Ensure these are configured in your Vercel Project settings:

- \`ADMIN_PASSWORD\`: The login password for the Admin Panel.
- \`GITHUB_TOKEN\`: A GitHub Personal Access Token (classic: `repo` scope, or fine-grained) to allow the CMS to write to this repository.
- \`GITHUB_REPO\`: The exact repository name (e.g. `username/lisamazzei`).
- \`BLOB_READ_WRITE_TOKEN\`: (Optional) Required only if using Vercel Blob storage.

## Admin Panel

**URL**: `https://<your-domain>/admin`

Login using the `ADMIN_PASSWORD`.

**Capabilities**:
- **Projects**: Drag and drop photos to upload to the repository (or Blob). Reorder projects and photos. Edit Italian and English texts.
- **Settings**: Editable SEO globals (Title, Description, Canonical URL, Keywords) and About Page text (markdown supported).
- **Favicon Tool**: Upload a square `.png` and the system automatically generates `favicon.ico`, `icon.png`, and `apple-icon.png`, injecting them directly into the repo's public folder.
- **Advanced JSON**: A raw editor for power users to alter navigation links or advanced settings.

## Storage Usage Calculations

The Admin Sidebar shows best-effort Storage usage (MB). This is tracked dynamically inside `content/assets-manifest.json`, which logs the recorded byte-size of every asset uploaded through the CMS. Manually deleted files outside the CMS may drift this metric unless the manifest is updated.
