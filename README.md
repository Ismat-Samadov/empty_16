# ♛ Checkers — Neon Edition

A polished, full-stack browser **Checkers** game built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. Features a neon/glassmorphism aesthetic, a minimax AI with three difficulty tiers, smooth Framer Motion animations, Web Audio sound effects, and full mobile touch support.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Full Checkers ruleset** | Forced captures, multi-jump chains, king promotion |
| **AI opponent** | Minimax + alpha-beta pruning — Easy / Medium / Hard |
| **Three difficulty levels** | Easy (random-ish), Medium (depth 4), Hard (depth 6) |
| **Smooth animations** | Framer Motion on pieces, overlays, and UI transitions |
| **Sound effects** | Web Audio API — moves, captures, king, win/lose |
| **Sound toggle** | On/off, preserved in UI |
| **Pause / Resume** | Overlay with blur; keyboard shortcut `P` |
| **Win / lose / draw** | Animated end screen with stats |
| **High score** | Persisted in `localStorage` |
| **Responsive** | Mobile-first, fits any screen without horizontal scroll |
| **Touch controls** | Tap pieces and squares — no special gesture needed |
| **Neon theme** | Dark glassmorphism + violet / cyan / rose neon palette |

---

## 🕹 Controls

### Mouse / Keyboard
| Action | Control |
|---|---|
| Select piece | Click a red piece |
| Move / jump | Click a highlighted square |
| Deselect | Click elsewhere |
| Pause / Resume | `P` key or Pause button |
| Back to menu | `Esc` key or Menu button |

### Mobile / Touch
Tap any red piece to select it, then tap a highlighted square (green = move, pulsing = jump) to make your move.

---

## 🤖 AI Difficulty

| Level | Search depth | Behaviour |
|---|---|---|
| **Easy** | 2 | 60 % random move, occasionally plays well |
| **Medium** | 4 | Solid positional play |
| **Hard** | 6 | Deep look-ahead, alpha-beta pruning |

---

## 🛠 Tech Stack

- **[Next.js 15](https://nextjs.org/)** — App Router, TypeScript strict mode
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** — physics-based animations
- **Web Audio API** — procedural sound effects (no audio files)
- **localStorage** — high score persistence

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone <repo-url>
cd checkers

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

Requires **Node.js ≥ 18**.

---

## ☁️ Deploy to Vercel

The project is zero-config for Vercel.

```bash
# Option A — Vercel CLI
npx vercel

# Option B — GitHub integration
# Push to GitHub → Import on vercel.com → Deploy
```

No environment variables or special build settings are needed.

---

## 📁 Project Structure

```
checkers/
├── app/
│   ├── globals.css        # Global styles, CSS variables, utility classes
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Entry point — owns game state, routes screens
├── components/
│   ├── Board.tsx          # 8×8 interactive board grid
│   ├── GamePiece.tsx      # Animated piece (man / king)
│   ├── GameScreen.tsx     # In-game view (board + score + controls)
│   ├── MenuScreen.tsx     # Main menu with difficulty picker
│   ├── EndScreen.tsx      # Win / lose / draw overlay
│   ├── ScorePanel.tsx     # Live score and stats display
│   └── GameControls.tsx   # Pause, sound, menu buttons
├── hooks/
│   ├── useGameState.ts    # Central game state (useReducer + side-effects)
│   ├── useSound.ts        # Web Audio API sound effects
│   └── useLocalStorage.ts # Typed localStorage hook
├── lib/
│   └── checkers/
│       ├── types.ts       # Shared TypeScript types
│       ├── rules.ts       # Game rules, move generation, board helpers
│       └── ai.ts          # Minimax AI with alpha-beta pruning
└── public/
    └── favicon.svg        # SVG king-piece favicon
```

---

## 📜 Rules Implemented

- **8 × 8 board** — dark squares only
- **Forced capture**: if any jump is available you must take it
- **Multi-jump**: the same piece continues jumping until no further capture exists (the entire chain is a single move)
- **King promotion**: reaching the opponent's back row promotes a man to a king (can move in all four diagonal directions)
- **Win conditions**: opponent has no pieces _or_ no legal moves

---

## License

MIT
