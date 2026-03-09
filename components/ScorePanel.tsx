'use client';

import { motion } from 'framer-motion';
import { Difficulty } from '@/lib/checkers/types';

interface ScorePanelProps {
  playerScore: number;
  aiScore: number;
  highScore: number;
  capturedByPlayer: number;
  capturedByAI: number;
  moveCount: number;
  difficulty: Difficulty;
  isPlayerTurn: boolean;
  isAIThinking: boolean;
}

const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const difficultyColor: Record<Difficulty, string> = {
  easy: 'text-emerald-400',
  medium: 'text-yellow-400',
  hard: 'text-rose-400',
};

/** Score and status panel displayed alongside the board */
export default function ScorePanel({
  playerScore,
  aiScore,
  highScore,
  capturedByPlayer,
  capturedByAI,
  moveCount,
  difficulty,
  isPlayerTurn,
  isAIThinking,
}: ScorePanelProps) {
  return (
    // On mobile: 2-column grid; on lg: single flex column
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 w-full lg:w-44">
      {/* Turn indicator */}
      <div className="glass-card p-3 rounded-xl text-center">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Turn</p>
        <motion.p
          key={isPlayerTurn ? 'player' : 'ai'}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-bold text-sm ${isPlayerTurn ? 'text-rose-400' : 'text-cyan-400'}`}
        >
          {isAIThinking ? '🤖 Thinking…' : isPlayerTurn ? '🧑 Your Turn' : '🤖 AI Turn'}
        </motion.p>
      </div>

      {/* Session scores */}
      <div className="glass-card p-3 rounded-xl">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Score</p>
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-xs text-white/50">You</p>
            <motion.p
              key={playerScore}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-rose-400"
            >
              {playerScore}
            </motion.p>
          </div>
          <span className="text-white/20 text-lg">–</span>
          <div className="text-center flex-1">
            <p className="text-xs text-white/50">AI</p>
            <motion.p
              key={aiScore}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-cyan-400"
            >
              {aiScore}
            </motion.p>
          </div>
        </div>
      </div>

      {/* High score */}
      <div className="glass-card p-3 rounded-xl text-center">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Best</p>
        <p className="text-xl font-bold text-yellow-400">{highScore}</p>
      </div>

      {/* Stats */}
      <div className="glass-card p-3 rounded-xl space-y-1.5">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Stats</p>
        <Stat label="Moves" value={moveCount} />
        <Stat label="You took" value={capturedByPlayer} color="text-rose-400" />
        <Stat label="AI took" value={capturedByAI} color="text-cyan-400" />
        <div className="flex justify-between items-center pt-1 border-t border-white/10">
          <span className="text-xs text-white/40">Level</span>
          <span className={`text-xs font-semibold ${difficultyColor[difficulty]}`}>
            {difficultyLabel[difficulty]}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-white/40">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className={`text-xs font-bold ${color}`}
      >
        {value}
      </motion.span>
    </div>
  );
}
