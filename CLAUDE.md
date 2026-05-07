# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page React/Vite app called **keypeck** that drills users on the keyboard shortcuts of various developer tools (lazygit, tmux, more to come) in a Duolingo-style format. Static site, no backend. Progress (`prog` and `totalXp`) persists in `localStorage` under `keypeck:v1`; bump the version in `STORAGE_KEY` if the schema changes. Currently deployed to Cloudflare Pages (running on Workers Static Assets) at <https://lazygit-learn.andrewm.codes/>; the canonical domain has not yet been migrated to a keypeck-branded URL.

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

- **`TRACKS`** — the curriculum: an ordered array of tracks (one per app/TUI being taught). Each track has `id`, `name`, `tagline`, `emoji`, `color`, `description`, and a `units` array. Each unit has `id`, `title`, `emoji`, `color`, `description`, and `shortcuts: { display, action }[]`. **Each track's `units` array must have exactly `NODES.length` (currently 7) entries** — the unit map uses a fixed node layout shared across tracks.
- **`TRACK_POOLS`** — per-track deduped `{ actions, keys }` distractor pools. Distractors stay inside their own track so a tmux question is never answered with a lazygit action.
- **Color tokens** — all colors come from `@radix-ui/colors` dark scales. Two layers:
  - **`ACCENT`** — per-hue map (`grass`, `blue`, `amber`, `violet`, `crimson`, `jade`, `orange`, `cyan`) of step-11 values, used for track and unit accent colors.
  - **`T`** — chrome theme: chrome neutrals from `sageDark` (sage1 bg, sage2 surface, sage6 border, sage11 muted, sage4 dim), brand text from `grassDark` (grass11 brand, grass12 text), and answer-feedback pairs from `jadeDark`/`crimsonDark` (steps 3/8/11).
  - Accents are used in computed strings like `` `${u.color}50` `` (alpha-hex suffix). Radix solids are 6-digit hex so the suffix trick still works; if you ever want true alpha tokens, use the matching Radix `*A` (alpha) scales instead.
  - Step semantics we lean on: 1 app bg, 2 subtle bg, 4 interactive bg, 6 subtle border, 7 interactive border, 8 strong border / focus, 11 low-contrast text / accent, 12 high-contrast text.
- **View state machine** — a single `view` state holds `"tracks" | "map" | "lesson" | "result"`. `"tracks"` is the home (track picker), `"map"` is the unit map for the selected track, `"lesson"` runs the questions, `"result"` shows scoring. There is no router. All state is local `useState` in `App`. Progress (`prog`) is a `{ trackId: { unitId: stars } }` map; it and `totalXp` are persisted to `localStorage` (`keypeck:v1`) by a `useEffect` in `App`.
- **Keyboard navigation** — a single global `keydown` listener in `App` drives the whole app: `1`–`9` to pick a lesson option, `Enter`/`Space` to advance after answering (also short-circuits the 1.1s correct-answer reward delay), `Esc` to exit a lesson, close the bottom sheet, or go from map back to tracks, and `Enter`/`Space`/`Esc` on the result screen to return to the map. Modifier-held keystrokes are passed through, and the listener bails when an `<input>`/`<textarea>` has focus.
- **Question generation** (`generateQuestions(track, unit)`) picks 5 random shortcuts from a unit and randomly frames each as either `key_to_action` or `action_to_key`, with three distractors drawn from that track's pool.
- **Styling** is inline `style={{ ... }}` throughout, with a small amount of injected `<style>` for keyframes and pseudo-selectors. There is no CSS file.
- **Fonts** (`VT323`, `Outfit`) are loaded at runtime from Google Fonts via a `<link>` injected in a `useEffect` — `index.html` only preconnects.

### Adding a new track

1. Append a new entry to `TRACKS` with exactly 7 units.
2. Pick a track `color` from `ACCENT` (or import a new Radix dark hue's step-11 and add it to `ACCENT`); pick something distinct from existing tracks (lazygit is `ACCENT.grass`, tmux is `ACCENT.cyan`).
3. No layout changes needed — the home screen renders track cards from `TRACKS` automatically and the map reuses the shared `NODES` layout.

### Adding a new color hue

Import the `*Dark` scale from `@radix-ui/colors` and add an entry to the `ACCENT` map at the top of `App.jsx`. Use step 11 for accent values that are read as both text and overlay base.

## Deployment (Cloudflare Workers Static Assets)

Two specific landmines to avoid:

1. **No `_redirects` file.** SPA fallback is configured via `wrangler.jsonc` → `assets.not_found_handling: "single-page-application"`. Adding `/* /index.html 200` to `_redirects` triggers Cloudflare's infinite-loop validator (error 10021) because Workers Static Assets auto-strips `.html` and `/index`, then re-matches the rule.
2. **Asset URLs are absolute paths from `/`.** Anything in `public/` ships verbatim to the site root, and `index.html` references it as `/foo.png`. The brand assets (`mascot.png`, `favicon-*.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`) plus `robots.txt`, `sitemap.xml`, and `site.webmanifest` all live there.

`deploy.sh` is a one-shot bootstrap (creates the GitHub repo, prints Cloudflare Pages setup instructions). It is not used for ongoing deploys — Cloudflare Pages auto-builds from `main`.

## Brand assets

`public/mascot.svg` is the **source of truth** for the mascot — a fierce hoodie-wearing eagle. `public/mascot.png` is a 2048×2048 raster derived from it via `rsvg-convert`. The favicons, apple-touch-icon, PWA manifest icons, and the 1200×630 `og-image.png` are all derived in turn via ImageMagick — composited on `sageDark.sage1` (`#101211`, the brand bg). The full regen pipeline lives in commit history; the OG card uses Arial from `/System/Library/Fonts/Supplemental/` because Homebrew's `magick` build doesn't ship Helvetica. If the mascot SVG is updated, re-render `mascot.png` with `rsvg-convert` first, then re-run the magick pipeline.

## SEO

Canonical URL is currently `https://lazygit-learn.andrewm.codes/` (pre-rename) and appears in three coordinated places: `index.html` (`<link rel="canonical">`, `og:url`, `twitter:image`/`og:image`, JSON-LD `url`), `public/sitemap.xml` (`<loc>`), and `public/robots.txt` (`Sitemap:`). When the domain moves to a keypeck-branded URL, update all three.
