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
│       ├── blogN.html      # Individual blog pages (blog2–blog5 + blog1 drafted)
│       ├── blogTemplate.html
│       └── content/        # Drop .docx or .pages files here — loaded at runtime
│           └── blogN.docx / blogN.pages
└── scripts/
    ├── blog-sort.js        # Tag filtering + sort dropdown logic for blogs.html
    └── blog-loader.js      # Runtime loader: .docx → mammoth, .pages → JSZip PDF extract
```

## Blog system

**Listing page (`blogs.html`):** Each `<article class="blog-entry">` has a `data-tags` attribute (comma-separated) and visible `.tag` chips. `blog-sort.js` handles both tag filtering (pill buttons) and the sort dropdown.

**Individual blog pages:** Each sets `window.BLOG_NAME = 'filename_without_extension'` before loading `blog-loader.js`. The loader tries `content/<BLOG_NAME>.docx` first (rendered to HTML via mammoth.js CDN), then `content/<BLOG_NAME>.pages` (unzipped via JSZip CDN, `QuickLook/Preview.pdf` embedded). Both CDN scripts must be loaded before `blog-loader.js`.

**Adding a new blog:**
1. Copy `blogTemplate.html`, set `BLOG_NAME`, title, date, tags.
2. Add a matching `<article>` entry in `blogs.html` with `data-tags`.
3. Drop the `.docx` or `.pages` file into `pages/blogs/content/`.

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
