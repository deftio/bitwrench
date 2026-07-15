# Bitwrench Blog

Published narrative posts (GitHub Pages). Separate from the authoritative docs site in `pages/`.

| Path | Role |
|------|------|
| `blog/` | Blog site (this folder) — movable as a unit |
| `pages/` | Product docs (Learn / Examples / Server / API) |
| `docs/` | Source material for clone / agents |

**Public URLs** (repo root is the GH Pages root):

- Blog home: `/blog/` or `/blog/index.html`
- Article 1: `/blog/esp32-self-hosted-ui.html`

**Plumbing:** pages reuse Bitwrench + shared chrome CSS from `pages/site.js`, but use **blog-local nav** (`blog-nav.js`) so docs IA does not absorb blog posts.

**To move later:** copy `blog/` (and optionally vendor or keep linking `pages/site.js` / `dist/` / `images/`). Update `BW_ROOT` in each HTML if asset paths change.
