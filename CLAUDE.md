# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page React/Vite app that teaches lazygit keyboard shortcuts in a Duolingo-style format. Static site, no backend, no persistence — every page reload resets state. Deployed to Cloudflare Pages (running on Workers Static Assets) at <https://lazygit-learn.andrewm.codes/>.

## Tooling

Node and pnpm versions are pinned in `.mise.toml` (Node 24, pnpm 10.33.2). If `pnpm` isn't on PATH, use the mise shim at `~/.local/share/mise/shims/pnpm` or run `mise install` first. CI uses the same Node 24 via `actions/setup-node` (see `.github/workflows/ci.yml`).

## Commands

```bash
pnpm dev            # Vite dev server on http://localhost:5173/
pnpm build          # Production build → dist/
pnpm preview        # Serve dist/ locally
pnpm format         # prettier --write .
pnpm format:check   # what CI runs; must pass before merge
```

There are no tests. Prettier config is the shareable `@andrewmcodes/prettier-config` (printWidth 120) wired via the `prettier` field in `package.json`.

## Architecture

Effectively the entire app lives in `src/App.jsx`. It contains:

- **`UNITS`** — the curriculum: an ordered array of units, each with `id`, `title`, `emoji`, `color`, `description`, and an array of `{ display, action }` shortcuts. **Adding/removing a unit also requires updating `NODES`** (the hard-coded x/y positions of the 7 nodes on the map's path layout). The map is laid out in a fixed `CW × CH` SVG canvas, not flowed.
- **`T`** — central theme object (background, surface, border, text, muted, brand green, dim green). Per-unit accent colors live on each unit, not in `T`. When tweaking the palette, change `T` and the unit `color` fields together — they're used in computed strings like `` `${u.color}50` `` (alpha hex suffix), so always use 6-digit hex without alpha.
- **View state machine** — a single `view` state holds `"map" | "lesson" | "result"`. Each branch returns its own JSX tree; there is no router. All state (`view`, `prog`, `totalXp`, current `unit`, `questions`, `qi`, `lives`, etc.) is local `useState` in `App`. Progress (`prog`) is a `{ unitId: stars }` map and is **not persisted** — refresh wipes it.
- **Question generation** (`generateQuestions`) picks 5 random shortcuts from a unit and randomly frames each as either `key_to_action` or `action_to_key`, with three distractors drawn from `ALL_ACTIONS` / `ALL_KEYS` (the deduped pool across every unit).
- **Styling** is inline `style={{ ... }}` throughout, with a small amount of injected `<style>` for keyframes and pseudo-selectors. There is no CSS file.
- **Fonts** (`VT323`, `Outfit`) are loaded at runtime from Google Fonts via a `<link>` injected in a `useEffect` — `index.html` only preconnects.

## Deployment (Cloudflare Workers Static Assets)

Two specific landmines to avoid:

1. **No `_redirects` file.** SPA fallback is configured via `wrangler.jsonc` → `assets.not_found_handling: "single-page-application"`. Adding `/* /index.html 200` to `_redirects` triggers Cloudflare's infinite-loop validator (error 10021) because Workers Static Assets auto-strips `.html` and `/index`, then re-matches the rule.
2. **Asset URLs are absolute paths from `/`.** Anything in `public/` ships verbatim to the site root, and `index.html` references it as `/foo.png`. The brand assets (`mascot.png`, `favicon-*.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`) plus `robots.txt`, `sitemap.xml`, and `site.webmanifest` all live there.

`deploy.sh` is a one-shot bootstrap (creates the GitHub repo, prints Cloudflare Pages setup instructions). It is not used for ongoing deploys — Cloudflare Pages auto-builds from `main`.

## Brand assets

`public/mascot.png` is the source-of-truth owl mascot (transparent PNG). The favicons, apple-touch-icon, PWA manifest icons, and the 1200×630 `og-image.png` are all **derived from it via ImageMagick**. If the mascot is updated, regenerate the rest with `magick` (see git history for the exact pipeline — it composites the mascot on `#070b08` for icons and a gradient for the OG card).

## SEO

Canonical URL is `https://lazygit-learn.andrewm.codes/` and appears in three coordinated places: `index.html` (`<link rel="canonical">`, `og:url`, `twitter:image`/`og:image`, JSON-LD `url`), `public/sitemap.xml` (`<loc>`), and `public/robots.txt` (`Sitemap:`). When changing the domain, update all three.
