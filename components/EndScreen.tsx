'use client';

import { motion } from 'framer-motion';
import { GameStatus } from '@/lib/checkers/types';

interface EndScreenProps {
  status: GameStatus;
  playerScore: number;
  aiScore: number;
  capturedByPlayer: number;
  capturedByAI: number;
  moveCount: number;
  highScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
}

const CONFIG = {
  player_won: {
    emoji: '🏆',
    title: 'You Win!',
    sub: 'The crown is yours, champion.',
    color: 'from-yellow-400 via-rose-400 to-violet-500',
    glow: 'rgba(251,191,36,0.4)',
  },
  ai_won: {
    emoji: '🤖',
    title: 'AI Wins',
    sub: 'Better luck next time. Try a lower difficulty!',
    color: 'from-cyan-400 via-blue-500 to-violet-600',
    glow: 'rgba(34,211,238,0.3)',
  },
  draw: {
    emoji: '🤝',
    title: 'Draw!',
    sub: "A perfectly balanced game.",
    color: 'from-slate-400 via-violet-400 to-slate-500',
    glow: 'rgba(148,163,184,0.3)',
  },
};

/** Animated end-of-game overlay */
export default function EndScreen({
  status,
  playerScore,
  aiScore,
  capturedByPlayer,
  capturedByAI,
  moveCount,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onMenu,
}: EndScreenProps) {
  if (status === 'playing' || status === 'paused' || status === 'menu') return null;

  const cfg = CONFIG[status as keyof typeof CONFIG];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMenu} />

      <motion.div
        className="relative glass-card rounded-3xl p-8 flex flex-col items-center gap-5 max-w-sm w-full"
        initial={{ scale: 0.7, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        style={{ boxShadow: `0 0 60px 10px ${cfg.glow}` }}
      >
        {/* Floating emoji */}
        <motion.div
          className="text-7xl"
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          {cfg.emoji}
        </motion.div>

        {/* Title */}
        <div className="text-center">
          <h2
            className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${cfg.color}`}
          >
            {cfg.title}
          </h2>
          <p className="mt-1 text-white/50 text-sm">{cfg.sub}</p>
        </div>

        {/* New high score banner */}
        {isNewHighScore && (
          <motion.div
            className="px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-sm font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            ⭐ New High Score: {highScore}
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="w-full grid grid-cols-3 gap-3 text-center">
          <Stat label="Moves" value={moveCount} />
          <Stat label="You took" value={capturedByPlayer} color="text-rose-400" />
          <Stat label="AI took" value={capturedByAI} color="text-cyan-400" />
        </div>

        {/* Session score */}
        <div className="w-full flex justify-center gap-8">
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-widest">You</p>
            <p className="text-3xl font-bold text-rose-400">{playerScore}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-widest">AI</p>
            <p className="text-3xl font-bold text-cyan-400">{aiScore}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 neon-btn py-3 rounded-xl font-bold text-base"
          >
            Play Again
          </button>
          <button
            onClick={onMenu}
            className="flex-1 py-3 rounded-xl font-bold text-base border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
          >
            Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="glass-card rounded-xl p-2">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
