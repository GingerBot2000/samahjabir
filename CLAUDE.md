# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

This is a fully static site — no build step, no package manager. Serve from the repo root:

```bash
python3 -m http.server 4444
# then open http://localhost:4444
```

## Architecture

Pure HTML/CSS/JS — no framework, no bundler.

```
samahjabir/
├── index.html              # Home page
├── style.css               # Single global stylesheet (all pages share this)
├── pages/
│   ├── blogs.html          # Blog listing page
│   ├── projects.html
│   ├── contact.html
│   └── blogs/
│       ├── blogN.html      # Individual blog pages
│       ├── content/        # Drop .docx or .pages files here — loaded at runtime
│       │   └── blogN.docx / blogN.pages
│       └── audio/          # Drop .mp3 or .m4a recordings here — loaded at runtime
│           └── blogN.mp3 / blogN.m4a
└── scripts/
    ├── blog-sort.js        # Sort dropdown logic for blogs.html
    ├── blog-loader.js      # Runtime loader: .docx → mammoth, .pages → JSZip PDF extract
    └── blog-audio.js       # Runtime narration player: play/pause, scrub, skip, speed
```

## Blog system

**Listing page (`blogs.html`):** Each `<article class="blog-entry">` lists date, title, and excerpt. `blog-sort.js` handles the sort dropdown (newest/oldest/title A–Z/Z–A).

**Individual blog pages:** Each sets `window.BLOG_NAME = 'filename_without_extension'` before loading `blog-loader.js`. The loader tries `content/<BLOG_NAME>.docx` first (rendered to HTML via mammoth.js CDN), then `content/<BLOG_NAME>.pages` (unzipped via JSZip CDN, `QuickLook/Preview.pdf` embedded). Both CDN scripts must be loaded before `blog-loader.js`.

**Audio narration (optional, per post):** Each post also loads `blog-audio.js`, which looks for `audio/<BLOG_NAME>.mp3`, then `audio/<BLOG_NAME>.m4a` (a HEAD probe, so a missing file just leaves the player bar hidden — no console error, no broken UI). Same naming convention as the docx content: filename stem must match `BLOG_NAME` exactly, including case. To add narration to a post, drop the recording into `pages/blogs/audio/` — no HTML or JS changes needed. The player markup itself (`<section class="audio-bar" data-audio-player>`) must stay a **sibling** of `<article id="blog-content">`, never a child — `blog-loader.js` replaces that article's `innerHTML` wholesale on load, which would wipe anything placed inside it.

To flag a post as having narration on the listing page, add `<span class="blog-entry__audio">` (see any entry in `blogs.html` once one exists) after its `<p>` excerpt — this is a manual flag, not auto-detected, since probing four files just for a listing badge isn't worth the requests.

**Adding a new blog:**
1. Copy an existing page in `pages/blogs/`, set `BLOG_NAME`, title, date.
2. Add a matching `<article>` entry in `blogs.html`.
3. Drop the `.docx` or `.pages` file into `pages/blogs/content/`, and optionally an `.mp3`/`.m4a` into `pages/blogs/audio/`.

Note: `blogTemplate.html` and `blog1.html` in `pages/blogs/` are stale drafts, not linked from anywhere — don't copy from them.

## Colour palette (style.css CSS variables)

| Variable | Value | Used for |
|---|---|---|
| `--sage` | `#7d9168` | Header block background |
| `--plum` | `#7b4878` | Title-line block, active filters, accents |
| `--paper` | `#f0ece2` | Page background |
| `--paper-card` | `#e8e3d6` | Blog cards, dropdowns |
| `--plum-faint` | `#ecdde9` | Hover states |
| `--sage-faint` | `#e4eadb` | Tag chips background |

## Typography

- **Body:** `Jost` (Google Fonts, 300 weight) — loaded via `@import` at top of `style.css`
- **Headings / page titles / blog titles:** `Cormorant Garant` (Google Fonts, italic, 300–500) — applied via `h1–h4` selector and `.nav-title h1`
- Two local decorative fonts (`boxy`, `regular`) are loaded via `@font-face` but not currently assigned to any selector
