# keypeck

A fierce hoodie-wearing eagle that drills you on the keyboard shortcuts of the tools you actually use — lazygit, tmux, and more.

A single-page React/Vite app, Duolingo-style. Pick a track, work through the unit map, answer five quick multiple-choice questions per lesson, earn stars and XP. The whole thing is designed to be played from the keyboard — because of course it is.

🌐 **Live:** <https://lazygit-learn.andrewm.codes/>

<p align="center">
  <img src="public/mascot.png" alt="keypeck mascot — a fierce hoodie-wearing eagle holding a laptop and a coffee mug" width="200" />
</p>

## Tracks

- **lazygit** — navigation, staging, commits, branches, remotes, stash, and the screen-mode power moves
- **tmux** — sessions, windows, panes, pane navigation, resizing, copy mode, and the command prompt

Each track is 7 units; each unit is a 5-question quiz drawn from that unit's shortcut pool. Per-track distractor pools mean a tmux question is never answered with a lazygit binding.

## Keyboard navigation

| Where  | Key                       | Does                                              |
| ------ | ------------------------- | ------------------------------------------------- |
| Lesson | `1`–`9`                   | Pick that option                                  |
| Lesson | `Enter` / `Space`         | Advance after answering (skips the reward delay)  |
| Lesson | `Esc`                     | Exit to the unit map                              |
| Map    | `Esc`                     | Close the unit detail sheet, or go back to tracks |
| Result | `Enter` / `Space` / `Esc` | Back to the unit map                              |

Modifier keys (Cmd / Ctrl / Alt) pass through, so all your normal browser shortcuts still work.

## Progress

`prog` (per-track stars) and `totalXp` are persisted to `localStorage` under the schema-versioned key `keypeck:v1`. Refreshing keeps your stars; clearing site data wipes them.

## Local development

Node 24 and pnpm 10 are pinned via [`mise`](https://mise.jdx.dev/). With mise installed:

```bash
mise install
pnpm install
pnpm dev          # http://localhost:5173
```

Other scripts:

```bash
pnpm build         # production build → dist/
pnpm preview       # serve dist/ locally
pnpm format        # prettier --write .
pnpm format:check  # what CI runs
```

There are no tests. CI runs format check + build on every push and PR (`.github/workflows/ci.yml`).

## Project layout

```
src/App.jsx        # the entire app — TRACKS data, view state machine, keyboard handler
public/mascot.svg  # source-of-truth eagle (every icon and the OG card derives from this)
public/_headers    # Cloudflare security + cache headers
wrangler.jsonc     # Cloudflare Workers Static Assets config
CLAUDE.md          # detailed architecture + landmines doc
```

## Adding a track

1. Append a new entry to the `TRACKS` array in `src/App.jsx` with exactly **7 units**.
2. Pick a `color` from the `ACCENT` map (or import a new `*Dark` Radix scale and add an entry — step 11 of any hue is the right value for accent text on dark surfaces).
3. The home screen renders track cards from `TRACKS` automatically; the unit map reuses a fixed `NODES` layout, so the unit count is constrained.

See `CLAUDE.md` for the full conventions (color step semantics, the `${color}+alphaHex` overlay pattern, Cloudflare deploy landmines).

## Tech stack

- React 18 + Vite 6
- [`@radix-ui/colors`](https://www.radix-ui.com/colors) for the entire palette (dark scales — sage for chrome, grass for brand, per-hue for accents)
- Inline `style={{}}` throughout — no CSS files
- Cloudflare Pages (Workers Static Assets) for hosting

## Brand assets

`public/mascot.svg` is the source of truth. The favicons, apple-touch-icon, PWA manifest icons, and the 1200×630 `og-image.png` are all derived from it via `rsvg-convert` + `magick`, composited on `sageDark.sage1` (`#101211`). Update the SVG, then re-run the pipeline (see commit history for the exact commands).

## License

MIT.
