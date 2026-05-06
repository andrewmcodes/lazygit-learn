import { useState, useEffect } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const UNITS = [
  {
    id: "nav", title: "Navigation", emoji: "🧭", color: "#4ade80",
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
    id: "files", title: "Staging Files", emoji: "📂", color: "#60a5fa",
    description: "Stage, unstage, diff, and commit files",
    shortcuts: [
      { display: "SPACE", action: "Stage or unstage file" },
      { display: "a", action: "Stage or unstage all files" },
      { display: "d", action: "View file diff" },
      { display: "e", action: "Open file in editor" },
      { display: "c", action: "Commit staged files" },
      { display: "D", action: "Reset file changes" },
    ],
  },
  {
    id: "commits", title: "Commits", emoji: "💾", color: "#fbbf24",
    description: "Inspect and rewrite commit history",
    shortcuts: [
      { display: "SPACE", action: "Checkout this commit" },
      { display: "A", action: "Amend with staged changes" },
      { display: "r", action: "Reword commit message" },
      { display: "g", action: "Reset to this commit" },
      { display: "ctrl+z", action: "Undo last commit" },
      { display: "C", action: "Copy commit SHA" },
    ],
  },
  {
    id: "branches", title: "Branches", emoji: "🌿", color: "#a78bfa",
    description: "Create, switch, merge, and delete branches",
    shortcuts: [
      { display: "n", action: "Create new branch" },
      { display: "SPACE", action: "Checkout this branch" },
      { display: "M", action: "Merge into current branch" },
      { display: "r", action: "Rebase onto this branch" },
      { display: "d", action: "Delete this branch" },
      { display: "f", action: "Fetch this branch" },
    ],
  },
  {
    id: "remotes", title: "Remote Ops", emoji: "☁️", color: "#fb7185",
    description: "Push, pull, fetch, and manage remotes",
    shortcuts: [
      { display: "p", action: "Push to remote" },
      { display: "P", action: "Pull from remote" },
      { display: "f", action: "Fetch all remotes" },
      { display: "n", action: "Add new remote" },
      { display: "d", action: "Remove remote" },
    ],
  },
  {
    id: "stash", title: "Stash", emoji: "📦", color: "#34d399",
    description: "Save and restore work in progress",
    shortcuts: [
      { display: "s", action: "Stash all changes" },
      { display: "S", action: "Stash with options" },
      { display: "SPACE", action: "Apply stash entry" },
      { display: "d", action: "Drop stash entry" },
      { display: "p", action: "Pop stash (apply & drop)" },
    ],
  },
  {
    id: "advanced", title: "Advanced", emoji: "⚡", color: "#f97316",
    description: "Interactive rebase and power moves",
    shortcuts: [
      { display: "i", action: "Start interactive rebase" },
      { display: "ctrl+r", action: "Force refresh" },
      { display: "@", action: "Open command log" },
      { display: "+", action: "Expand panel" },
      { display: "-", action: "Collapse panel" },
    ],
  },
];

const ALL_ACTIONS = [...new Set(UNITS.flatMap((u) => u.shortcuts.map((s) => s.action)))];
const ALL_KEYS = [...new Set(UNITS.flatMap((u) => u.shortcuts.map((s) => s.display)))];

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

function generateQuestions(unit) {
  return shuffle(unit.shortcuts)
    .slice(0, 5)
    .map((sc, i) => {
      if (Math.random() < 0.5) {
        return {
          type: "key_to_action",
          key: sc.display,
          correctAnswer: sc.action,
          options: shuffle([sc.action, ...getWrongs(sc.action, ALL_ACTIONS, 3)]),
        };
      } else {
        return {
          type: "action_to_key",
          action: sc.action,
          correctAnswer: sc.display,
          options: shuffle([sc.display, ...getWrongs(sc.display, ALL_KEYS, 3)]),
        };
      }
    });
}

// ── Path layout ───────────────────────────────────────────────────────────────
const NODES = [
  { x: 190, y: 72 },
  { x: 292, y: 192 },
  { x: 190, y: 312 },
  { x: 88,  y: 432 },
  { x: 190, y: 552 },
  { x: 292, y: 672 },
  { x: 190, y: 792 },
];
const NR = 38;
const CW = 380;
const CH = 860;

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg:      "#070b08",
  surface: "#0c1510",
  border:  "#142018",
  text:    "#b4ecbe",
  muted:   "#3b6045",
  green:   "#3dff1a",
  dimG:    "#132018",
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,     setView]     = useState("map");
  const [prog,     setProg]     = useState({});
  const [totalXp,  setTotalXp]  = useState(0);
  const [unit,     setUnit]     = useState(null);
  const [questions,setQuestions]= useState([]);
  const [qi,       setQi]       = useState(0);
  const [lives,    setLives]    = useState(3);
  const [chosen,   setChosen]   = useState(null);
  const [lessonXp, setLessonXp] = useState(0);
  const [result,   setResult]   = useState(null);
  const [mapSel,   setMapSel]   = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=VT323&family=Outfit:wght@400;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const isUnlocked = (i) => i === 0 || (prog[UNITS[i - 1].id] || 0) >= 1;

  const startLesson = (u) => {
    setUnit(u);
    setQuestions(generateQuestions(u));
    setQi(0); setLives(3); setChosen(null); setLessonXp(0); setResult(null);
    setMapSel(null);
    setView("lesson");
  };

  const answer = (opt) => {
    if (chosen !== null) return;
    const q = questions[qi];
    const ok = opt === q.correctAnswer;
    setChosen(opt);
    const newLives = ok ? lives : lives - 1;
    const newXp    = lessonXp + (ok ? 10 : 0);
    if (!ok) setLives(newLives);
    setLessonXp(newXp);

    setTimeout(() => {
      const last = qi + 1 >= questions.length;
      const dead = !ok && newLives <= 0;
      if (last || dead) {
        const stars = dead ? 0 : newLives === 3 ? 3 : newLives >= 1 ? 2 : 1;
        if (stars > 0) {
          setProg((p) => ({ ...p, [unit.id]: Math.max(p[unit.id] || 0, stars) }));
          setTotalXp((x) => x + newXp);
        }
        setResult({ stars, xp: newXp, failed: dead });
        setView("result");
      } else {
        setQi((i) => i + 1);
        setChosen(null);
      }
    }, 1400);
  };

  // ── MAP ───────────────────────────────────────────────────────────────────
  if (view === "map") {
    return (
      <div
        style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "'Outfit', sans-serif", color: T.text }}
        onClick={() => setMapSel(null)}
      >
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0%,100% { box-shadow: 0 0 16px var(--gc); } 50% { box-shadow: 0 0 32px var(--gc); } }
          .node-btn:hover { transform: scale(1.07) !important; }
          .opt-btn:not(:disabled):hover { border-color: #2a5a35 !important; background: #0d1c12 !important; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #080b09; }
          ::-webkit-scrollbar-thumb { background: #1a3a20; border-radius: 2px; }
        `}</style>

        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "#070b08ee", backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${T.border}`,
          padding: "13px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: "27px", color: T.green, letterSpacing: "3px", lineHeight: 1.1 }}>
              LAZYGIT.LEARN
            </div>
            <div style={{ fontSize: "10px", color: T.muted, letterSpacing: "1.5px", textTransform: "uppercase" }}>
              keyboard shortcut mastery
            </div>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: "22px", color: T.green }}>{totalXp}</div>
              <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "1px" }}>xp</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: "22px", color: "#fbbf24" }}>
                {Object.values(prog).filter((v) => v > 0).length}/{UNITS.length}
              </div>
              <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "1px" }}>done</div>
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 100px", overflowX: "hidden" }}>
          <div style={{ position: "relative", width: CW, height: CH, flexShrink: 0 }}>

            {/* SVG path lines */}
            <svg width={CW} height={CH} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
              <defs>
                {UNITS.map((u) => (
                  <filter key={u.id} id={`glow-${u.id}`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                ))}
              </defs>
              {NODES.slice(0, -1).map((n, i) => {
                const nx = NODES[i + 1];
                const un = isUnlocked(i + 1);
                const done = (prog[UNITS[i].id] || 0) > 0;
                return (
                  <line key={i}
                    x1={n.x} y1={n.y} x2={nx.x} y2={nx.y}
                    stroke={done ? UNITS[i].color + "50" : un ? "#163025" : "#0d150e"}
                    strokeWidth={done ? "3" : "2.5"}
                    strokeDasharray="8 6"
                  />
                );
              })}
            </svg>

            {/* Unit nodes */}
            {UNITS.map((u, i) => {
              const { x, y } = NODES[i];
              const stars = prog[u.id] || 0;
              const un    = isUnlocked(i);
              const done  = stars > 0;
              const sel   = mapSel?.id === u.id;

              return (
                <div key={u.id}>
                  {/* Circle */}
                  <div
                    className="node-btn"
                    onClick={(e) => { e.stopPropagation(); un && setMapSel(sel ? null : u); }}
                    style={{
                      "--gc": u.color + "60",
                      position: "absolute", left: x - NR, top: y - NR,
                      width: NR * 2, height: NR * 2, borderRadius: "50%",
                      background: sel
                        ? u.color + "28"
                        : done ? u.color + "16" : un ? "#0b1a10" : "#090c09",
                      border: `3px solid ${sel ? u.color : done ? u.color + "bb" : un ? "#1a3521" : "#0e160f"}`,
                      cursor: un ? "pointer" : "default",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: sel
                        ? `0 0 32px ${u.color}70`
                        : done ? `0 0 18px ${u.color}35` : "none",
                      opacity: un ? 1 : 0.28,
                      transition: "all 0.18s ease",
                      zIndex: 2,
                    }}
                  >
                    <div style={{ fontSize: "21px", lineHeight: 1 }}>{un ? u.emoji : "🔒"}</div>
                    <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                      {[1,2,3].map((s) => (
                        <div key={s} style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: s <= stars ? u.color : T.dimG,
                          transition: "background 0.3s",
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Label below node */}
                  <div style={{
                    position: "absolute",
                    left: x, top: y + NR + 5,
                    transform: "translateX(-50%)",
                    textAlign: "center", pointerEvents: "none", width: 84,
                  }}>
                    <div style={{
                      fontSize: "10.5px", fontWeight: 700,
                      color: un ? (done ? u.color + "cc" : T.text) : T.muted,
                      letterSpacing: "0.3px", lineHeight: 1.3,
                    }}>
                      {u.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom sheet */}
        {mapSel && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
              background: "#0c1810",
              border: `1px solid ${mapSel.color}50`,
              borderRadius: "22px 22px 0 0",
              padding: "24px 24px 28px",
              boxShadow: `0 -12px 48px ${mapSel.color}25, 0 -2px 0 ${mapSel.color}30`,
              animation: "slideUp 0.22s ease",
            }}
          >
            {/* Pull handle */}
            <div style={{ width: 36, height: 4, background: mapSel.color + "40", borderRadius: 2, margin: "0 auto 20px" }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "14px", flexShrink: 0,
                background: mapSel.color + "18", border: `2px solid ${mapSel.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
              }}>
                {mapSel.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: 800, color: mapSel.color, lineHeight: 1.2 }}>
                  {mapSel.title}
                </div>
                <div style={{ fontSize: "12px", color: T.muted, marginTop: "3px", lineHeight: 1.4 }}>
                  {mapSel.description}
                </div>
              </div>
              {(prog[mapSel.id] || 0) > 0 && (
                <div style={{ fontFamily: "'VT323', monospace", fontSize: "20px", letterSpacing: "1px" }}>
                  {"⭐".repeat(prog[mapSel.id])}
                </div>
              )}
            </div>

            {/* Key chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "20px" }}>
              {mapSel.shortcuts.map((sc) => (
                <span key={sc.display} style={{
                  fontFamily: "'VT323', monospace", fontSize: "15px",
                  background: mapSel.color + "12", border: `1px solid ${mapSel.color}45`,
                  borderRadius: "7px", padding: "2px 9px", color: mapSel.color,
                }}>
                  {sc.display}
                </span>
              ))}
            </div>

            <div style={{ fontSize: "12px", color: T.muted, marginBottom: "18px" }}>
              {mapSel.shortcuts.length} shortcuts · {(prog[mapSel.id] || 0) > 0 ? "Practice to improve your score" : "5 quick questions"}
            </div>

            <button
              onClick={() => startLesson(mapSel)}
              style={{
                width: "100%", padding: "15px",
                borderRadius: "13px",
                background: mapSel.color + "18",
                border: `2px solid ${mapSel.color}`,
                color: mapSel.color,
                fontSize: "15px", fontWeight: 800, cursor: "pointer",
                letterSpacing: "1.5px", textTransform: "uppercase",
                transition: "all 0.15s",
              }}
            >
              {(prog[mapSel.id] || 0) > 0 ? "Practice Again →" : "Start Lesson →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── LESSON ────────────────────────────────────────────────────────────────
  if (view === "lesson") {
    const q   = questions[qi];
    const pct = (qi / questions.length) * 100;
    const isKey = q.type === "action_to_key";

    return (
      <div style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "'Outfit', sans-serif", color: T.text, display: "flex", flexDirection: "column" }}>
        <style>{`
          .opt-btn:not(:disabled):hover { transform: translateY(-1px); }
          .opt-btn { transition: all 0.15s ease !important; }
        `}</style>

        {/* Top bar */}
        <div style={{
          padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <button onClick={() => setView("map")} style={{
            background: "none", border: "none", color: T.muted,
            fontSize: "18px", cursor: "pointer", padding: "4px 6px", lineHeight: 1,
            borderRadius: "6px",
          }}>✕</button>
          <div style={{ flex: 1, height: "7px", borderRadius: "4px", background: T.dimG, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, ${unit.color}bb, ${unit.color})`,
              borderRadius: "4px", transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3].map((l) => (
              <span key={l} style={{ fontSize: "17px", opacity: l <= lives ? 1 : 0.14, transition: "opacity 0.35s" }}>❤️</span>
            ))}
          </div>
        </div>

        {/* Question body */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "28px 20px 16px", maxWidth: "480px", margin: "0 auto",
          width: "100%", boxSizing: "border-box",
        }}>
          {/* Unit chip */}
          <div style={{
            fontSize: "11px", fontWeight: 700, color: unit.color,
            textTransform: "uppercase", letterSpacing: "2px",
            background: unit.color + "14", border: `1px solid ${unit.color}40`,
            borderRadius: "20px", padding: "4px 13px", marginBottom: "30px",
          }}>
            {unit.emoji} {unit.title}
          </div>

          {/* Prompt */}
          {q.type === "key_to_action" ? (
            <div style={{ textAlign: "center", marginBottom: "30px", width: "100%" }}>
              <div style={{ fontSize: "13px", color: T.muted, fontWeight: 600, marginBottom: "18px", letterSpacing: "0.5px" }}>
                WHAT DOES THIS KEY DO?
              </div>
              <div style={{
                fontFamily: "'VT323', monospace", fontSize: "62px",
                color: unit.color,
                background: unit.color + "0e",
                border: `2px solid ${unit.color}55`,
                borderRadius: "14px", padding: "8px 44px",
                boxShadow: `0 0 28px ${unit.color}22, inset 0 0 20px ${unit.color}08`,
                display: "inline-block", minWidth: "90px", textAlign: "center",
              }}>
                {q.key}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", marginBottom: "30px", width: "100%" }}>
              <div style={{ fontSize: "13px", color: T.muted, fontWeight: 600, marginBottom: "14px", letterSpacing: "0.5px" }}>
                WHICH KEY DO YOU PRESS TO…
              </div>
              <div style={{
                fontSize: "20px", fontWeight: 700, color: T.text,
                lineHeight: 1.4, padding: "0 8px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px", padding: "16px 20px",
              }}>
                {q.action}
              </div>
            </div>
          )}

          {/* Options */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "9px" }}>
            {q.options.map((opt) => {
              const isSel = chosen === opt;
              const isCorrect = opt === q.correctAnswer;
              const revealed = chosen !== null;
              let bg = T.surface, border = T.dimG, col = T.text;
              if (revealed) {
                if (isCorrect)        { bg = "#0b2814"; border = "#22c55e"; col = "#4ade80"; }
                else if (isSel)       { bg = "#28090a"; border = "#ef4444"; col = "#f87171"; }
                else                  { col = T.muted; }
              }
              return (
                <button key={opt} className="opt-btn" onClick={() => answer(opt)} disabled={revealed} style={{
                  background: bg, border: `2px solid ${border}`, borderRadius: "12px",
                  padding: isKey ? "12px 16px" : "14px 16px",
                  color: col,
                  fontFamily: isKey ? "'VT323', monospace" : "'Outfit', sans-serif",
                  fontSize: isKey ? "26px" : "15px",
                  cursor: revealed ? "default" : "pointer",
                  textAlign: isKey ? "center" : "left",
                  fontWeight: isKey ? 400 : 600,
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%",
                }}>
                  {revealed && isCorrect && <span style={{ flexShrink: 0 }}>✓</span>}
                  {revealed && isSel && !isCorrect && <span style={{ flexShrink: 0 }}>✗</span>}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {chosen !== null && (
            <div style={{ marginTop: "22px", textAlign: "center", minHeight: "48px" }}>
              {chosen === q.correctAnswer ? (
                <div style={{ color: "#4ade80", fontWeight: 800, fontSize: "16px" }}>🎉 Correct!</div>
              ) : (
                <div>
                  <div style={{ color: "#f87171", fontWeight: 800, fontSize: "15px" }}>✗ Not quite</div>
                  <div style={{ color: T.muted, fontSize: "12.5px", marginTop: "5px" }}>
                    Answer:{" "}
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: "18px", color: "#4ade80" }}>
                      {q.correctAnswer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom status */}
        <div style={{
          padding: "12px 24px", borderTop: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: "18px", color: unit.color }}>
            +{lessonXp} XP
          </span>
          <span style={{ fontSize: "12px", color: T.muted }}>
            {qi + 1} / {questions.length}
          </span>
        </div>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (view === "result") {
    const { stars, xp, failed } = result;
    return (
      <div style={{
        minHeight: "100vh", backgroundColor: T.bg, fontFamily: "'Outfit', sans-serif", color: T.text,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", textAlign: "center",
      }}>
        <style>{`@keyframes starPop { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 70% { transform: scale(1.2) rotate(4deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }`}</style>

        {failed ? (
          <>
            <div style={{ fontSize: "72px", marginBottom: "16px" }}>💀</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: "38px", color: "#f87171", letterSpacing: "3px" }}>
              OUT OF LIVES
            </div>
            <div style={{ color: T.muted, fontSize: "13px", marginTop: "8px" }}>
              Every expert was once a beginner
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: "11px", color: unit.color, textTransform: "uppercase",
              letterSpacing: "3px", marginBottom: "22px", fontWeight: 700,
            }}>
              {unit.emoji} Lesson Complete
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
              {[1, 2, 3].map((s) => (
                <span key={s} style={{
                  fontSize: "50px",
                  opacity: s <= stars ? 1 : 0.1,
                  filter: s <= stars ? "none" : "grayscale(1)",
                  animation: s <= stars ? `starPop 0.4s ease ${s * 0.12}s both` : "none",
                  display: "inline-block",
                }}>
                  ⭐
                </span>
              ))}
            </div>

            <div style={{ fontFamily: "'VT323', monospace", fontSize: "44px", color: unit.color, lineHeight: 1 }}>
              +{xp} XP
            </div>
            <div style={{ color: T.muted, fontSize: "13px", marginTop: "6px" }}>
              {stars === 3 ? "Perfect — zero mistakes!" : stars === 2 ? "Solid run!" : "Keep practicing!"}
            </div>
            <div style={{
              marginTop: "12px", fontFamily: "'VT323', monospace", fontSize: "16px",
              color: T.muted, letterSpacing: "1px",
            }}>
              Total XP: {totalXp}
            </div>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "260px", marginTop: "36px" }}>
          <button
            onClick={() => { setMapSel(null); setView("map"); }}
            style={{
              padding: "15px", borderRadius: "13px",
              background: failed ? "#200a0a" : unit.color + "1a",
              border: `2px solid ${failed ? "#ef4444" : unit.color}`,
              color: failed ? "#f87171" : unit.color,
              fontSize: "15px", fontWeight: 800, cursor: "pointer",
              letterSpacing: "1px",
            }}
          >
            {failed ? "← Back to Map" : "Continue →"}
          </button>

          <button
            onClick={() => startLesson(unit)}
            style={{
              padding: "12px", borderRadius: "13px",
              background: "transparent", border: `1px solid ${T.dimG}`,
              color: T.muted, fontSize: "14px", cursor: "pointer",
            }}
          >
            Practice again ↺
          </button>
        </div>
      </div>
    );
  }

  return null;
}
