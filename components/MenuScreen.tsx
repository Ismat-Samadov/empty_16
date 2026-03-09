'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Difficulty } from '@/lib/checkers/types';

interface MenuScreenProps {
  playerScore: number;
  aiScore: number;
  highScore: number;
  soundEnabled: boolean;
  onStart: (difficulty: Difficulty) => void;
  onSoundToggle: () => void;
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: 'easy',   label: 'Easy',   desc: 'Random-ish AI, good for learning', color: 'emerald' },
  { id: 'medium', label: 'Medium', desc: 'Balanced challenge',                color: 'yellow'  },
  { id: 'hard',   label: 'Hard',   desc: 'Deep search, plays to win',         color: 'rose'    },
];

/** Main menu / splash screen */
export default function MenuScreen({
  playerScore,
  aiScore,
  highScore,
  soundEnabled,
  onStart,
  onSoundToggle,
}: MenuScreenProps) {
  const [selected, setSelected] = useState<Difficulty>('medium');

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 py-8 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Logo / title */}
      <motion.div
        className="text-center"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Decorative board icon */}
        <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-[0_0_40px_10px_rgba(139,92,246,0.4)]">
          <span className="text-4xl select-none" aria-hidden>♛</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 drop-shadow-lg">
          Checkers
        </h1>
        <p className="mt-2 text-white/40 text-sm tracking-widest uppercase">Neon Edition</p>
      </motion.div>

      {/* Session & high scores */}
      {(playerScore > 0 || aiScore > 0) && (
        <motion.div
          className="glass-card px-6 py-3 rounded-2xl flex gap-6 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest">You</p>
            <p className="text-2xl font-bold text-rose-400">{playerScore}</p>
          </div>
          <div className="border-l border-white/10" />
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest">AI</p>
            <p className="text-2xl font-bold text-cyan-400">{aiScore}</p>
          </div>
          {highScore > 0 && (
            <>
              <div className="border-l border-white/10" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest">Best</p>
                <p className="text-2xl font-bold text-yellow-400">{highScore}</p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Difficulty picker */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-xs text-white/40 uppercase tracking-widest text-center mb-3">
          Select Difficulty
        </p>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={[
                'flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-200',
                selected === d.id
                  ? d.color === 'emerald'
                    ? 'border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                    : d.color === 'yellow'
                    ? 'border-yellow-500/60 bg-yellow-500/15 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
                    : 'border-rose-500/60 bg-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              <div>
                <p className={[
                  'font-semibold text-sm',
                  selected === d.id
                    ? d.color === 'emerald' ? 'text-emerald-400' : d.color === 'yellow' ? 'text-yellow-400' : 'text-rose-400'
                    : 'text-white/80',
                ].join(' ')}>
                  {d.label}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{d.desc}</p>
              </div>
              {selected === d.id && (
                <motion.span
                  layoutId="checkmark"
                  className="text-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Start button */}
      <motion.button
        onClick={() => onStart(selected)}
        className="neon-btn px-10 py-3 rounded-full text-lg font-bold"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        Play Now
      </motion.button>

      {/* Sound toggle */}
      <motion.button
        onClick={onSoundToggle}
        className="text-white/40 hover:text-white/70 text-sm transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
      </motion.button>

      {/* How to play */}
      <motion.div
        className="glass-card max-w-sm w-full rounded-2xl p-4 text-xs text-white/40 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <p className="text-white/60 font-semibold mb-2">How to Play</p>
        <p>🖱 Click a red piece, then click a highlighted square to move.</p>
        <p>🏃 You must jump if a capture is available.</p>
        <p>👑 Reach the far row to become a King (can move backwards).</p>
        <p>📱 Touch-friendly — tap pieces and squares on mobile.</p>
      </motion.div>
    </motion.div>
  );
}
