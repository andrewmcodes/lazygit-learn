import { useState, useEffect, useMemo, useRef } from "react";
import {
  sageDark,
  grassDark,
  blueDark,
  amberDark,
  violetDark,
  crimsonDark,
  jadeDark,
  orangeDark,
  cyanDark,
} from "@radix-ui/colors";

// ── Color tokens (Radix dark scales) ──────────────────────────────────────────
// Step semantics we lean on (per Radix docs):
//   1  app bg          2  subtle bg     4  interactive component bg
//   6  subtle border   11 low-contrast text / accent     12 high-contrast text
//
// Per-unit and per-track accent colors use step 11 — the "low-contrast text"
// step works as both readable accent text on dark surfaces and as a base for
// the `${color}+alphaHex` overlay pattern used throughout the UI.

const ACCENT = {
  grass: grassDark.grass11,
  blue: blueDark.blue11,
  amber: amberDark.amber11,
  violet: violetDark.violet11,
  crimson: crimsonDark.crimson11,
  jade: jadeDark.jade11,
  orange: orangeDark.orange11,
  cyan: cyanDark.cyan11,
};

// ── Tracks ────────────────────────────────────────────────────────────────────
// Each track is a self-contained curriculum: an app or TUI plus its units.
// Adding a track also requires its `units` array to have exactly NODES.length
// entries — the unit map uses a fixed node layout per track.

const TRACKS = [
  {
    id: "lazygit",
    name: "lazygit",
    tagline: "the git TUI",
    emoji: "🔀",
    color: ACCENT.grass,
    description: "Navigate, stage, commit, branch, and rebase from the terminal.",
    units: [
      {
        id: "nav",
        title: "Navigation",
        emoji: "🧭",
        color: ACCENT.grass,
        description: "Move around the lazygit interface like a pro",
        shortcuts: [
          { display: "j", action: "Move selection down" },
          { display: "k", action: "Move selection up" },
          { display: "h", action: "Switch to previous panel" },
          { display: "l", action: "Switch to next panel" },
          { display: "[", action: "Switch to previous tab" },
          { display: "]", action: "Switch to next tab" },
          { display: "q", action: "Quit lazygit" },
          { display: "?", action: "Open keybindings help" },
        ],
      },
      {
        id: "files",
        title: "Staging Files",
        emoji: "📂",
        color: ACCENT.blue,
        description: "Stage, commit, discard, and stash from the files panel",
        shortcuts: [
          { display: "SPACE", action: "Stage or unstage file" },
          { display: "a", action: "Stage or unstage all files" },
          { display: "e", action: "Open file in editor" },
          { display: "c", action: "Commit staged files" },
          { display: "d", action: "Open discard menu" },
          { display: "D", action: "Open working-tree reset menu" },
          { display: "s", action: "Stash all changes" },
          { display: "S", action: "Stash with options" },
        ],
      },
      {
        id: "commits",
        title: "Commits",
        emoji: "💾",
        color: ACCENT.amber,
        description: "Inspect and rewrite commit history",
        shortcuts: [
          { display: "SPACE", action: "Checkout this commit" },
          { display: "A", action: "Amend with staged changes" },
          { display: "r", action: "Reword commit message" },
          { display: "g", action: "Reset to this commit" },
          { display: "z", action: "Undo last git command (via reflog)" },
          { display: "ctrl+o", action: "Copy commit hash to clipboard" },
        ],
      },
      {
        id: "branches",
        title: "Branches",
        emoji: "🌿",
        color: ACCENT.violet,
        description: "Create, switch, merge, and delete branches",
        shortcuts: [
          { display: "n", action: "Create new branch" },
          { display: "SPACE", action: "Checkout this branch" },
          { display: "M", action: "Merge into current branch" },
          { display: "r", action: "Rebase onto this branch" },
          { display: "d", action: "Delete this branch" },
          { display: "f", action: "Fast-forward branch from its upstream" },
        ],
      },
      {
        id: "remotes",
        title: "Remote Ops",
        emoji: "☁️",
        color: ACCENT.crimson,
        description: "Push, pull, fetch, and manage remotes",
        shortcuts: [
          { display: "P", action: "Push to remote" },
          { display: "p", action: "Pull from remote" },
          { display: "f", action: "Fetch all remotes" },
          { display: "n", action: "Add new remote" },
          { display: "d", action: "Remove remote" },
        ],
      },
      {
        id: "stash",
        title: "Stash",
        emoji: "📦",
        color: ACCENT.jade,
        description: "Apply, pop, drop, and branch off stash entries (stash panel)",
        shortcuts: [
          { display: "SPACE", action: "Apply stash entry" },
          { display: "g", action: "Pop stash (apply and drop)" },
          { display: "d", action: "Drop stash entry" },
          { display: "n", action: "Create branch from stash" },
          { display: "r", action: "Rename stash entry" },
        ],
      },
      {
        id: "advanced",
        title: "Advanced",
        emoji: "⚡",
        color: ACCENT.orange,
        description: "Interactive rebase and power moves",
        shortcuts: [
          { display: "i", action: "Start interactive rebase" },
          { display: "R", action: "Refresh git state" },
          { display: "@", action: "Open command log" },
          { display: "+", action: "Next screen mode (normal → half → full)" },
          { display: "_", action: "Previous screen mode" },
        ],
      },
    ],
  },
  {
    id: "tmux",
    name: "tmux",
    tagline: "the terminal multiplexer",
    emoji: "🪟",
    color: ACCENT.cyan,
    description: "Sessions, windows, panes, copy-mode — drilled into muscle memory.",
    units: [
      {
        id: "sessions",
        title: "Sessions",
        emoji: "🪟",
        color: ACCENT.cyan,
        description: "Create, attach, and switch tmux sessions",
        shortcuts: [
          { display: "tmux new", action: "Start a new tmux session" },
          { display: "tmux a", action: "Attach to last detached session" },
          { display: "tmux ls", action: "List existing sessions" },
          { display: "prefix d", action: "Detach from the current session" },
          { display: "prefix s", action: "Show session picker" },
          { display: "prefix $", action: "Rename the current session" },
        ],
      },
      {
        id: "windows",
        title: "Windows",
        emoji: "🗂️",
        color: ACCENT.blue,
        description: "Open, close, and move between windows",
        shortcuts: [
          { display: "prefix c", action: "Create a new window" },
          { display: "prefix n", action: "Switch to the next window" },
          { display: "prefix p", action: "Switch to the previous window" },
          { display: "prefix w", action: "Show the window picker" },
          { display: "prefix ,", action: "Rename the current window" },
          { display: "prefix &", action: "Kill the current window" },
        ],
      },
      {
        id: "panes",
        title: "Panes",
        emoji: "🔲",
        color: ACCENT.amber,
        description: "Split, close, and zoom panes",
        shortcuts: [
          { display: "prefix %", action: "Split pane left and right" },
          { display: 'prefix "', action: "Split pane top and bottom" },
          { display: "prefix x", action: "Kill the current pane" },
          { display: "prefix z", action: "Toggle pane zoom" },
          { display: "prefix !", action: "Break pane into a new window" },
          { display: "prefix space", action: "Cycle pane layouts" },
        ],
      },
      {
        id: "pane-nav",
        title: "Pane Nav",
        emoji: "🧭",
        color: ACCENT.violet,
        description: "Move focus between panes",
        shortcuts: [
          { display: "prefix ←", action: "Focus the pane to the left" },
          { display: "prefix →", action: "Focus the pane to the right" },
          { display: "prefix ↑", action: "Focus the pane above" },
          { display: "prefix ↓", action: "Focus the pane below" },
          { display: "prefix o", action: "Cycle to the next pane" },
          { display: "prefix ;", action: "Toggle to the last active pane" },
          { display: "prefix q", action: "Show pane numbers" },
        ],
      },
      {
        id: "resize",
        title: "Resize",
        emoji: "📐",
        color: ACCENT.crimson,
        description: "Adjust pane sizes and layouts",
        shortcuts: [
          { display: "prefix M-←", action: "Resize pane left by 5 cells" },
          { display: "prefix M-→", action: "Resize pane right by 5 cells" },
          { display: "prefix M-↑", action: "Resize pane up by 5 cells" },
          { display: "prefix M-↓", action: "Resize pane down by 5 cells" },
          { display: "prefix M-1", action: "Apply even-horizontal layout" },
          { display: "prefix M-2", action: "Apply even-vertical layout" },
        ],
      },
      {
        id: "copy-mode",
        title: "Copy Mode",
        emoji: "📋",
        color: ACCENT.jade,
        description: "Scroll, select, and yank text (selection bindings assume vi mode)",
        shortcuts: [
          { display: "prefix [", action: "Enter copy mode" },
          { display: "prefix ]", action: "Paste from the buffer" },
          { display: "space", action: "Start selection (vi mode)" },
          { display: "enter", action: "Copy the selection (vi mode)" },
          { display: "q", action: "Exit copy mode" },
          { display: "prefix =", action: "Choose a buffer to paste" },
        ],
      },
      {
        id: "power",
        title: "Power Moves",
        emoji: "⚡",
        color: ACCENT.orange,
        description: "Help, command prompt, and reload",
        shortcuts: [
          { display: "prefix ?", action: "Show all key bindings" },
          { display: "prefix :", action: "Open the tmux command prompt" },
          { display: "prefix t", action: "Show the big-clock display" },
          { display: "prefix r", action: "Reload tmux config (custom binding)" },
          { display: "prefix .", action: "Move window to a new index" },
        ],
      },
    ],
  },
];

// Per-track distractor pools — keep questions inside their own track so a tmux
// question is never answered with a lazygit action.
const TRACK_POOLS = Object.fromEntries(
  TRACKS.map((t) => [
    t.id,
    {
      actions: [...new Set(t.units.flatMap((u) => u.shortcuts.map((s) => s.action)))],
      keys: [...new Set(t.units.flatMap((u) => u.shortcuts.map((s) => s.display)))],
    },
  ]),
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrongs(correct, pool, n) {
  return shuffle(pool.filter((x) => x !== correct)).slice(0, n);
}

function generateQuestions(track, unit) {
  const pool = TRACK_POOLS[track.id];
  return shuffle(unit.shortcuts)
    .slice(0, 5)
    .map((sc) => {
      if (Math.random() < 0.5) {
        return {
          type: "key_to_action",
          key: sc.display,
          correctAnswer: sc.action,
          options: shuffle([sc.action, ...getWrongs(sc.action, pool.actions, 3)]),
        };
      } else {
        return {
          type: "action_to_key",
          action: sc.action,
          correctAnswer: sc.display,
          options: shuffle([sc.display, ...getWrongs(sc.display, pool.keys, 3)]),
        };
      }
    });
}

// ── Path layout ───────────────────────────────────────────────────────────────
const NODES = [
  { x: 190, y: 72 },
  { x: 292, y: 192 },
  { x: 190, y: 312 },
  { x: 88, y: 432 },
  { x: 190, y: 552 },
  { x: 292, y: 672 },
  { x: 190, y: 792 },
];
const NR = 38;
const CW = 380;
const CH = 860;

// ── Theme ─────────────────────────────────────────────────────────────────────
// Chrome neutrals come from sageDark (green-tinted gray that harmonises with
// the brand grass accent). Brand text/headings use grassDark for the minty-
// green vibe that's been part of the look since v1.
const T = {
  bg: sageDark.sage1, // app background
  surface: sageDark.sage2, // subtle surface
  border: sageDark.sage6, // subtle non-interactive border
  text: grassDark.grass12, // high-contrast text (mint-green)
  muted: sageDark.sage11, // low-contrast text
  green: grassDark.grass11, // brand accent (mascot glow, wordmark, XP)
  subtle: sageDark.sage4, // subtle interactive component bg / divider
  ok: jadeDark.jade11, // correct-answer feedback
  err: crimsonDark.crimson11, // wrong-answer feedback
  okBg: jadeDark.jade3, // correct-answer button bg
  errBg: crimsonDark.crimson3, // wrong-answer button bg
  okBorder: jadeDark.jade8, // correct-answer button border
  errBorder: crimsonDark.crimson8, // wrong-answer button border
};

// ── Persistence ───────────────────────────────────────────────────────────────
// Single-key, schema-versioned. Bump the version if the prog shape changes in
// a non-backwards-compatible way; the loader will silently start fresh.
const STORAGE_KEY = "keypeck:v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.totalXp === "number" && typeof parsed.prog === "object") {
      return parsed;
    }
  } catch {
    // localStorage unavailable (private mode), quota exceeded, or malformed JSON.
  }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage disabled — fail silently.
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("tracks");
  const [prog, setProg] = useState(() => loadState()?.prog ?? {}); // { trackId: { unitId: stars } }
  const [totalXp, setTotalXp] = useState(() => loadState()?.totalXp ?? 0);
  const [track, setTrack] = useState(null);
  const [unit, setUnit] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [lives, setLives] = useState(3);
  const [chosen, setChosen] = useState(null);
  const [lessonXp, setLessonXp] = useState(0);
  const [result, setResult] = useState(null);
  const [mapSel, setMapSel] = useState(null);
  const advanceTimer = useRef(null);
  const sheetStartRef = useRef(null);
  const sheetOpenerRef = useRef(null);
  const viewHeadingRef = useRef(null);
  const isInitialMount = useRef(true);

  // Persist progress + XP to localStorage whenever they change. Loaded values
  // are written back on first mount; that's a harmless no-op.
  useEffect(() => {
    saveState({ prog, totalXp });
  }, [prog, totalXp]);

  // Update the document title and shift focus to the view's <h1> on every
  // view change, so SR + browser-tab users always know where they are and
  // keyboard focus doesn't get stranded on an unmounted control.
  useEffect(() => {
    const title =
      view === "tracks"
        ? "keypeck"
        : view === "map" && track
          ? `keypeck — ${track.name}`
          : view === "lesson" && track && unit
            ? `keypeck — ${track.name} · ${unit.title}`
            : view === "result"
              ? "keypeck — Lesson complete"
              : "keypeck";
    document.title = title;
    // Skip the focus shift on first mount — let the browser's normal
    // page-load announcement run uninterrupted.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const r = requestAnimationFrame(() => viewHeadingRef.current?.focus());
    return () => cancelAnimationFrame(r);
  }, [view, track, unit]);

  // Clear any pending auto-advance timer when leaving the lesson view, so
  // the user can't get yanked from the map back to a result screen for a
  // lesson they abandoned by hitting ✕.
  useEffect(() => {
    if (view !== "lesson" && advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, [view]);

  // Fonts are loaded directly from index.html now — no runtime injection.

  // Bottom-sheet (dialog) focus management. Escape-to-close lives in the
  // global keydown handler below so all keyboard nav is in one place.
  useEffect(() => {
    if (mapSel) {
      sheetOpenerRef.current = document.activeElement;
      const r = requestAnimationFrame(() => sheetStartRef.current?.focus());
      return () => cancelAnimationFrame(r);
    } else if (sheetOpenerRef.current && view === "map") {
      sheetOpenerRef.current.focus?.();
      sheetOpenerRef.current = null;
    }
  }, [mapSel, view]);

  const trackProg = track ? prog[track.id] || {} : {};
  const isUnlocked = (i) => i === 0 || (track && (trackProg[track.units[i - 1].id] || 0) >= 1);

  const trackStats = useMemo(
    () =>
      Object.fromEntries(
        TRACKS.map((t) => {
          const tp = prog[t.id] || {};
          const done = t.units.filter((u) => (tp[u.id] || 0) > 0).length;
          const stars = t.units.reduce((sum, u) => sum + (tp[u.id] || 0), 0);
          return [t.id, { done, total: t.units.length, stars }];
        }),
      ),
    [prog],
  );

  const openTrack = (t) => {
    setTrack(t);
    setMapSel(null);
    setView("map");
  };

  const startLesson = (u) => {
    setUnit(u);
    setQuestions(generateQuestions(track, u));
    setQi(0);
    setLives(3);
    setChosen(null);
    setLessonXp(0);
    setResult(null);
    setMapSel(null);
    setView("lesson");
  };

  const advance = (ok, newLives, newXp) => {
    advanceTimer.current = null;
    const last = qi + 1 >= questions.length;
    const dead = !ok && newLives <= 0;
    if (last || dead) {
      const stars = dead ? 0 : newLives === 3 ? 3 : 2;
      if (stars > 0) {
        setProg((p) => {
          const tp = p[track.id] || {};
          return { ...p, [track.id]: { ...tp, [unit.id]: Math.max(tp[unit.id] || 0, stars) } };
        });
        setTotalXp((x) => x + newXp);
      }
      setResult({ stars, xp: newXp, failed: dead });
      setView("result");
    } else {
      setQi((i) => i + 1);
      setChosen(null);
    }
  };

  const answer = (opt) => {
    if (chosen !== null) return;
    const q = questions[qi];
    const ok = opt === q.correctAnswer;
    setChosen(opt);
    const newLives = ok ? lives : lives - 1;
    const newXp = lessonXp + (ok ? 10 : 0);
    if (!ok) setLives(newLives);
    setLessonXp(newXp);

    // Correct answers auto-advance (fast, rewarding flow). Wrong answers wait
    // for an explicit Continue press so the user can read the correct answer
    // at their own pace — also satisfies WCAG 2.2.1 (no fixed-duration UI).
    if (ok) {
      advanceTimer.current = setTimeout(() => advance(true, newLives, newXp), 1100);
    }
  };

  // Used by the Continue button on a wrong answer AND by Enter/Space
  // shortcut on a correct answer (which lets you skip the 1.1s reward delay).
  const proceed = () => {
    if (chosen === null) return;
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    const ok = chosen === questions[qi].correctAnswer;
    advance(ok, lives, lessonXp);
  };

  // Global keyboard navigation. The whole app is a keyboard-shortcut trainer,
  // so it should obviously be playable from the keyboard.
  //   Lesson:  1–4 → pick option · Enter/Space → advance · Esc → exit
  //   Map:     Esc → close sheet, or back to tracks if no sheet open
  //   Result:  Enter/Space/Esc → back to map
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (view === "lesson") {
        const q = questions[qi];
        if (!q) return;
        if (chosen === null && /^[1-9]$/.test(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < q.options.length) {
            e.preventDefault();
            answer(q.options[idx]);
          }
        } else if (chosen !== null && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          proceed();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setView("map");
        }
      } else if (view === "map") {
        if (e.key === "Escape") {
          e.preventDefault();
          if (mapSel) {
            setMapSel(null);
          } else {
            setView("tracks");
            setTrack(null);
          }
        }
      } else if (view === "result") {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          setMapSel(null);
          setView("map");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, chosen, qi, questions, mapSel, lives, lessonXp]);

  // ── TRACKS (home) ─────────────────────────────────────────────────────────
  if (view === "tracks") {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "'Outfit', sans-serif", color: T.text }}>
        <style>{`
          .track-card:hover { transform: translateY(-2px); }
          .track-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${T.bg}; }
          ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: "32px 24px 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          <img
            src="/mascot.png"
            alt=""
            aria-hidden="true"
            width="84"
            height="84"
            style={{
              width: 84,
              height: 84,
              objectFit: "contain",
              filter: `drop-shadow(0 0 14px ${T.green}40)`,
              marginBottom: 14,
            }}
          />
          <h1
            ref={viewHeadingRef}
            tabIndex={-1}
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: 44,
              color: T.green,
              letterSpacing: 4,
              lineHeight: 1,
              fontWeight: "normal",
              margin: 0,
              outline: "none",
            }}
          >
            KEYPECK
          </h1>
          <p
            style={{
              fontSize: 13,
              color: T.text,
              marginTop: 14,
              lineHeight: 1.5,
              maxWidth: 440,
            }}
          >
            A fierce hoodie-wearing eagle that drills you on the keyboard shortcuts of the tools you actually use — VS
            Code, Vim, tmux, and more.
          </p>
          <div
            style={{
              fontSize: 10,
              color: T.text,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 18,
            }}
          >
            Pick a track to start
          </div>
        </div>

        {/* Track cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "24px 20px 60px",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          {TRACKS.map((t) => {
            const stats = trackStats[t.id];
            const started = stats.done > 0;
            return (
              <button
                key={t.id}
                className="track-card"
                onClick={() => openTrack(t)}
                aria-label={`Open ${t.name} (${t.tagline}), ${stats.done} of ${stats.total} units done`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  textAlign: "left",
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: 18,
                  background: started ? `${t.color}10` : T.surface,
                  border: `2px solid ${started ? `${t.color}80` : T.border}`,
                  color: T.text,
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: started ? `0 0 28px ${t.color}20` : "none",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: `${t.color}1a`,
                    border: `2px solid ${t.color}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  {t.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "'VT323', monospace",
                        fontSize: 24,
                        color: t.color,
                        letterSpacing: 2,
                        lineHeight: 1,
                      }}
                    >
                      {t.name.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                      {t.tagline}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: T.text, opacity: 0.85, marginTop: 5, lineHeight: 1.45 }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 11, color: T.text, marginTop: 8, letterSpacing: 0.5 }}>
                    {stats.done}/{stats.total} units · {stats.stars} ⭐
                  </div>
                </div>
                <div style={{ fontSize: 22, color: t.color, flexShrink: 0 }}>→</div>
              </button>
            );
          })}
        </div>

        {/* Footer XP */}
        {totalXp > 0 && (
          <div
            style={{
              textAlign: "center",
              paddingBottom: 32,
              fontFamily: "'VT323', monospace",
              fontSize: 18,
              color: T.muted,
              letterSpacing: 1,
            }}
          >
            Total XP: {totalXp}
          </div>
        )}
      </main>
    );
  }

  // ── MAP ───────────────────────────────────────────────────────────────────
  if (view === "map") {
    // The map's path layout is fixed at NODES.length nodes — slice defensively
    // so a track with extra units doesn't index past the end of NODES.
    const units = track.units.slice(0, NODES.length);
    return (
      <main
        style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "'Outfit', sans-serif", color: T.text }}
        onClick={() => setMapSel(null)}
      >
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0%,100% { box-shadow: 0 0 16px var(--gc); } 50% { box-shadow: 0 0 32px var(--gc); } }
          .node-btn:not(:disabled):hover { transform: scale(1.07) !important; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${T.bg}; }
          ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        `}</style>

        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: T.bg + "ee",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${T.border}`,
            padding: "13px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setView("tracks");
                setTrack(null);
                setMapSel(null);
              }}
              aria-label="Back to tracks"
              style={{
                background: "none",
                border: "none",
                color: T.muted,
                fontSize: 22,
                cursor: "pointer",
                padding: "2px 6px",
                lineHeight: 1,
              }}
            >
              ←
            </button>
            <img
              src="/mascot.png"
              alt=""
              aria-hidden="true"
              width="44"
              height="44"
              style={{
                width: 44,
                height: 44,
                objectFit: "contain",
                filter: `drop-shadow(0 0 8px ${track.color}55)`,
                flexShrink: 0,
              }}
            />
            <div>
              <h1
                ref={viewHeadingRef}
                tabIndex={-1}
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: 27,
                  color: track.color,
                  letterSpacing: 3,
                  lineHeight: 1.1,
                  fontWeight: "normal",
                  margin: 0,
                  outline: "none",
                }}
              >
                {track.name.toUpperCase()}
              </h1>
              <div style={{ fontSize: 10, color: T.text, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {track.tagline}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: T.green }}>{totalXp}</div>
              <div style={{ fontSize: 9, color: T.text, textTransform: "uppercase", letterSpacing: 1 }}>xp</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: ACCENT.amber }}>
                {Object.values(trackProg).filter((v) => v > 0).length}/{units.length}
              </div>
              <div style={{ fontSize: 9, color: T.text, textTransform: "uppercase", letterSpacing: 1 }}>done</div>
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 100px", overflowX: "hidden" }}>
          <div style={{ position: "relative", width: CW, height: CH, flexShrink: 0 }}>
            {/* SVG path lines */}
            <svg width={CW} height={CH} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
              <defs>
                {units.map((u) => (
                  <filter key={u.id} id={`glow-${u.id}`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>
              {NODES.slice(0, -1).map((n, i) => {
                const nx = NODES[i + 1];
                const un = isUnlocked(i + 1);
                const done = (trackProg[units[i].id] || 0) > 0;
                return (
                  <line
                    key={i}
                    x1={n.x}
                    y1={n.y}
                    x2={nx.x}
                    y2={nx.y}
                    stroke={done ? units[i].color + "50" : un ? sageDark.sage7 : sageDark.sage3}
                    strokeWidth={done ? "3" : "2.5"}
                    strokeDasharray="8 6"
                  />
                );
              })}
            </svg>

            {/* Unit nodes */}
            {units.map((u, i) => {
              const { x, y } = NODES[i];
              const stars = trackProg[u.id] || 0;
              const un = isUnlocked(i);
              const done = stars > 0;
              const sel = mapSel?.id === u.id;

              const lockedLabel = un ? "" : ", locked";
              const doneLabel = done ? `, ${stars} of 3 stars` : "";
              return (
                <div key={u.id}>
                  {/* Circle */}
                  <button
                    className="node-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapSel(sel ? null : u);
                    }}
                    disabled={!un}
                    aria-label={`${u.title}${doneLabel}${lockedLabel}`}
                    aria-pressed={sel}
                    style={{
                      "--gc": u.color + "60",
                      position: "absolute",
                      left: x - NR,
                      top: y - NR,
                      width: NR * 2,
                      height: NR * 2,
                      borderRadius: "50%",
                      background: sel ? u.color + "28" : done ? u.color + "16" : un ? sageDark.sage3 : sageDark.sage2,
                      border: `3px solid ${sel ? u.color : done ? u.color + "bb" : un ? sageDark.sage7 : sageDark.sage4}`,
                      cursor: un ? "pointer" : "default",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: sel ? `0 0 32px ${u.color}70` : done ? `0 0 18px ${u.color}35` : "none",
                      opacity: un ? 1 : 0.28,
                      transition: "all 0.18s ease",
                      zIndex: 2,
                      padding: 0,
                      fontFamily: "'Outfit', sans-serif",
                      color: T.text,
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 21, lineHeight: 1 }}>
                      {un ? u.emoji : "🔒"}
                    </span>
                    <span aria-hidden="true" style={{ display: "flex", gap: 3, marginTop: 4 }}>
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: s <= stars ? u.color : T.subtle,
                            transition: "background 0.3s",
                            display: "block",
                          }}
                        />
                      ))}
                    </span>
                  </button>

                  {/* Label below node */}
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      top: y + NR + 5,
                      transform: "translateX(-50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                      width: 84,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: un ? (done ? u.color + "cc" : T.text) : T.muted,
                        letterSpacing: 0.3,
                        lineHeight: 1.3,
                      }}
                    >
                      {u.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom sheet (dialog) */}
        {mapSel && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-sheet-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              background: T.surface,
              border: `1px solid ${mapSel.color}50`,
              borderRadius: "22px 22px 0 0",
              padding: "24px 24px 28px",
              boxShadow: `0 -12px 48px ${mapSel.color}25, 0 -2px 0 ${mapSel.color}30`,
              animation: "slideUp 0.22s ease",
            }}
          >
            {/* Pull handle */}
            <div
              aria-hidden="true"
              style={{ width: 36, height: 4, background: mapSel.color + "40", borderRadius: 2, margin: "0 auto 20px" }}
            />

            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  flexShrink: 0,
                  background: mapSel.color + "18",
                  border: `2px solid ${mapSel.color}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                }}
              >
                {mapSel.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <h2
                  id="map-sheet-title"
                  style={{ fontSize: 17, fontWeight: 800, color: mapSel.color, lineHeight: 1.2, margin: 0 }}
                >
                  {mapSel.title}
                </h2>
                <div style={{ fontSize: 12, color: T.text, marginTop: 3, lineHeight: 1.4 }}>{mapSel.description}</div>
              </div>
              {(trackProg[mapSel.id] || 0) > 0 && (
                <div
                  aria-label={`${trackProg[mapSel.id]} of 3 stars earned`}
                  style={{ fontFamily: "'VT323', monospace", fontSize: 20, letterSpacing: 1 }}
                >
                  <span aria-hidden="true">{"⭐".repeat(trackProg[mapSel.id])}</span>
                </div>
              )}
            </div>

            {/* Key chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
              {mapSel.shortcuts.map((sc) => (
                <span
                  key={sc.display}
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: 15,
                    background: mapSel.color + "12",
                    border: `1px solid ${mapSel.color}45`,
                    borderRadius: 7,
                    padding: "2px 9px",
                    color: mapSel.color,
                  }}
                >
                  {sc.display}
                </span>
              ))}
            </div>

            <div style={{ fontSize: 12, color: T.text, marginBottom: 18 }}>
              {mapSel.shortcuts.length} shortcuts ·{" "}
              {(trackProg[mapSel.id] || 0) > 0 ? "Practice to improve your score" : "5 quick questions"}
            </div>

            <button
              ref={sheetStartRef}
              onClick={() => startLesson(mapSel)}
              style={{
                width: "100%",
                padding: 15,
                borderRadius: 13,
                background: mapSel.color + "18",
                border: `2px solid ${mapSel.color}`,
                color: mapSel.color,
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                transition: "all 0.15s",
              }}
            >
              {(trackProg[mapSel.id] || 0) > 0 ? "Practice Again →" : "Start Lesson →"}
            </button>
          </div>
        )}
      </main>
    );
  }

  // ── LESSON ────────────────────────────────────────────────────────────────
  if (view === "lesson") {
    const q = questions[qi];
    const pct = (qi / questions.length) * 100;
    const isKey = q.type === "action_to_key";

    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: T.bg,
          fontFamily: "'Outfit', sans-serif",
          color: T.text,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{`
          .opt-btn { transition: all 0.15s ease !important; }
          .opt-btn:not(:disabled):hover { transform: translateY(-1px); border-color: ${sageDark.sage7} !important; background: ${sageDark.sage3} !important; }
        `}</style>

        {/* Top bar */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setView("map")}
            aria-label="Exit lesson"
            style={{
              background: "none",
              border: "none",
              color: T.muted,
              fontSize: 18,
              cursor: "pointer",
              padding: "4px 6px",
              lineHeight: 1,
              borderRadius: 6,
            }}
          >
            ✕
          </button>
          <div
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuenow={qi + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            style={{ flex: 1, height: 7, borderRadius: 4, background: T.subtle, overflow: "hidden" }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${unit.color}bb, ${unit.color})`,
                borderRadius: 4,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            aria-live="polite"
            aria-label={`${lives} ${lives === 1 ? "life" : "lives"} remaining`}
            style={{ display: "flex", gap: 4 }}
          >
            {[1, 2, 3].map((l) => (
              <span
                key={l}
                aria-hidden="true"
                style={{ fontSize: 17, opacity: l <= lives ? 1 : 0.14, transition: "opacity 0.35s" }}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>

        {/* Question body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "28px 20px 16px",
            maxWidth: 480,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Unit chip — also the page heading */}
          <h1
            ref={viewHeadingRef}
            tabIndex={-1}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: unit.color,
              textTransform: "uppercase",
              letterSpacing: 2,
              background: unit.color + "14",
              border: `1px solid ${unit.color}40`,
              borderRadius: 20,
              padding: "4px 13px",
              margin: "0 0 30px 0",
              outline: "none",
            }}
          >
            <span aria-hidden="true">{unit.emoji} </span>
            {track.name} · {unit.title}
          </h1>

          {/* Prompt — aria-live so SR users hear the new question after qi advances */}
          {q.type === "key_to_action" ? (
            <div
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Question ${qi + 1} of ${questions.length}: what does the key ${q.key} do?`}
              style={{ textAlign: "center", marginBottom: 30, width: "100%" }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: T.muted,
                  fontWeight: 600,
                  marginBottom: 18,
                  letterSpacing: 0.5,
                }}
              >
                WHAT DOES THIS KEY DO?
              </div>
              <div
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: 62,
                  color: unit.color,
                  background: unit.color + "0e",
                  border: `2px solid ${unit.color}55`,
                  borderRadius: 14,
                  padding: "8px 44px",
                  boxShadow: `0 0 28px ${unit.color}22, inset 0 0 20px ${unit.color}08`,
                  display: "inline-block",
                  minWidth: 90,
                  textAlign: "center",
                }}
              >
                {q.key}
              </div>
            </div>
          ) : (
            <div
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Question ${qi + 1} of ${questions.length}: which key do you press to ${q.action}?`}
              style={{ textAlign: "center", marginBottom: 30, width: "100%" }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: T.muted,
                  fontWeight: 600,
                  marginBottom: 14,
                  letterSpacing: 0.5,
                }}
              >
                WHICH KEY DO YOU PRESS TO…
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: T.text,
                  lineHeight: 1.4,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                {q.action}
              </div>
            </div>
          )}

          {/* Options */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 9 }}>
            {q.options.map((opt, idx) => {
              const isSel = chosen === opt;
              const isCorrect = opt === q.correctAnswer;
              const revealed = chosen !== null;
              let bg = T.surface,
                border = T.subtle,
                col = T.text;
              if (revealed) {
                if (isCorrect) {
                  bg = T.okBg;
                  border = T.okBorder;
                  col = T.ok;
                } else if (isSel) {
                  bg = T.errBg;
                  border = T.errBorder;
                  col = T.err;
                } else {
                  col = T.muted;
                }
              }
              return (
                <button
                  key={opt}
                  className="opt-btn"
                  onClick={() => answer(opt)}
                  disabled={revealed}
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: 12,
                    padding: isKey ? "12px 16px" : "14px 16px",
                    color: col,
                    fontFamily: isKey ? "'VT323', monospace" : "'Outfit', sans-serif",
                    fontSize: isKey ? 26 : 15,
                    cursor: revealed ? "default" : "pointer",
                    textAlign: isKey ? "center" : "left",
                    fontWeight: isKey ? 400 : 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                  }}
                >
                  {!revealed && (
                    <kbd
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        minWidth: 22,
                        height: 22,
                        padding: "0 6px",
                        borderRadius: 5,
                        border: `1px solid ${T.border}`,
                        background: T.bg,
                        color: T.muted,
                        fontFamily: "'VT323', monospace",
                        fontSize: 14,
                        lineHeight: "20px",
                        textAlign: "center",
                        fontWeight: 400,
                      }}
                    >
                      {idx + 1}
                    </kbd>
                  )}
                  {revealed && isCorrect && <span style={{ flexShrink: 0 }}>✓</span>}
                  {revealed && isSel && !isCorrect && <span style={{ flexShrink: 0 }}>✗</span>}
                  <span style={{ flex: 1, textAlign: isKey ? "center" : "left" }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          <div role="status" aria-live="polite" aria-atomic="true" style={{ marginTop: 22, textAlign: "center" }}>
            {chosen !== null && chosen === q.correctAnswer && (
              <div style={{ color: T.ok, fontWeight: 800, fontSize: 16, minHeight: 48 }}>🎉 Correct!</div>
            )}
            {chosen !== null && chosen !== q.correctAnswer && (
              <div>
                <div style={{ color: T.err, fontWeight: 800, fontSize: 15 }}>✗ Not quite</div>
                <div style={{ color: T.text, fontSize: 13, marginTop: 5 }}>
                  Answer:{" "}
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: T.ok }}>{q.correctAnswer}</span>
                </div>
                <button
                  onClick={proceed}
                  autoFocus
                  style={{
                    marginTop: 18,
                    padding: "12px 28px",
                    borderRadius: 12,
                    background: T.errBg,
                    border: `2px solid ${T.errBorder}`,
                    color: T.err,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom status */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: unit.color }}>+{lessonXp} XP</span>
          <span style={{ fontSize: 12, color: T.text }}>
            {qi + 1} / {questions.length}
          </span>
        </div>
      </main>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (view === "result") {
    const { stars, xp, failed } = result;
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: T.bg,
          fontFamily: "'Outfit', sans-serif",
          color: T.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <style>{`@keyframes starPop { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 70% { transform: scale(1.2) rotate(4deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }`}</style>

        {failed ? (
          <>
            <div aria-hidden="true" style={{ fontSize: 72, marginBottom: 16 }}>
              💀
            </div>
            <h1
              ref={viewHeadingRef}
              tabIndex={-1}
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: 38,
                color: T.err,
                letterSpacing: 3,
                fontWeight: "normal",
                margin: 0,
                outline: "none",
              }}
            >
              OUT OF LIVES
            </h1>
            <div style={{ color: T.text, fontSize: 13, marginTop: 8 }}>Every expert was once a beginner</div>
          </>
        ) : (
          <>
            <h1
              ref={viewHeadingRef}
              tabIndex={-1}
              style={{
                fontSize: 11,
                color: unit.color,
                textTransform: "uppercase",
                letterSpacing: 3,
                fontWeight: 700,
                margin: "0 0 22px 0",
                outline: "none",
              }}
            >
              <span aria-hidden="true">{unit.emoji} </span>
              {track.name} · Lesson Complete
            </h1>

            <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 50,
                    opacity: s <= stars ? 1 : 0.1,
                    filter: s <= stars ? "none" : "grayscale(1)",
                    animation: s <= stars ? `starPop 0.4s ease ${s * 0.12}s both` : "none",
                    display: "inline-block",
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>

            <div style={{ fontFamily: "'VT323', monospace", fontSize: 44, color: unit.color, lineHeight: 1 }}>
              +{xp} XP
            </div>
            <div style={{ color: T.text, fontSize: 13, marginTop: 6 }}>
              {stars === 3 ? "Perfect — zero mistakes!" : stars === 2 ? "Solid run!" : "Keep practicing!"}
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: "'VT323', monospace",
                fontSize: 16,
                color: T.muted,
                letterSpacing: 1,
              }}
            >
              Total XP: {totalXp}
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 260,
            marginTop: 36,
          }}
        >
          <button
            onClick={() => {
              setMapSel(null);
              setView("map");
            }}
            style={{
              padding: 15,
              borderRadius: 13,
              background: failed ? T.errBg : unit.color + "1a",
              border: `2px solid ${failed ? T.errBorder : unit.color}`,
              color: failed ? T.err : unit.color,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            {failed ? "← Back to Map" : "Continue →"}
          </button>

          <button
            onClick={() => startLesson(unit)}
            style={{
              padding: 12,
              borderRadius: 13,
              background: "transparent",
              border: `1px solid ${T.subtle}`,
              color: T.muted,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Practice again ↺
          </button>
        </div>
      </main>
    );
  }

  return null;
}
