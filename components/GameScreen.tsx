'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import Board from './Board';
import ScorePanel from './ScorePanel';
import GameControls from './GameControls';
import EndScreen from './EndScreen';
import { Board as BoardType, Difficulty, GameStatus, Move, Piece, Position } from '@/lib/checkers/types';

// ─── Props (all state injected from page.tsx via useGameState) ───────────────

interface GameScreenProps {
  // Board state
  board: BoardType;
  selectedPiece: Position | null;
  validMoves: Move[];
  currentPlayer: 'player' | 'ai';
  status: GameStatus;
  isAIThinking: boolean;
  difficulty: Difficulty;
  // Scores & stats
  playerScore: number;
  aiScore: number;
  highScore: number;
  capturedByPlayer: number;
  capturedByAI: number;
  moveCount: number;
  // Sound
  soundEnabled: boolean;
  // Actions
  onSelectPiece: (piece: Piece) => void;
  onMakeMove: (move: Move) => void;
  onDeselect: () => void;
  onPauseResume: () => void;
  onSoundToggle: () => void;
  onReturnToMenu: () => void;
  onPlayAgain: () => void;
}

/**
 * GameScreen — purely presentational game view.
 * All state is owned by the parent (page.tsx) via useGameState.
 */
export default function GameScreen({
  board,
  selectedPiece,
  validMoves,
  currentPlayer,
  status,
  isAIThinking,
  difficulty,
  playerScore,
  aiScore,
  highScore,
  capturedByPlayer,
  capturedByAI,
  moveCount,
  soundEnabled,
  onSelectPiece,
  onMakeMove,
  onDeselect,
  onPauseResume,
  onSoundToggle,
  onReturnToMenu,
  onPlayAgain,
}: GameScreenProps) {
  const isPlayerTurn = currentPlayer === 'player' && status === 'playing';

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') onPauseResume();
      if (e.key === 'Escape') onReturnToMenu();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPauseResume, onReturnToMenu]);

  const isNewHighScore =
    status === 'player_won' && playerScore > highScore - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-4 pb-8 px-3 gap-4">
      {/* Header bar */}
      <motion.div
        className="flex items-center justify-between w-full max-w-3xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none" aria-hidden>♛</span>
          <span className="text-white/80 font-bold tracking-tight text-lg">Checkers</span>
          <span className="text-white/30 text-xs uppercase tracking-widest hidden sm:inline">Neon Edition</span>
        </div>
        <GameControls
          isPaused={status === 'paused'}
          soundEnabled={soundEnabled}
          difficulty={difficulty}
          onPauseResume={onPauseResume}
          onSoundToggle={onSoundToggle}
          onReturnToMenu={onReturnToMenu}
        />
      </motion.div>

      {/* Board + score layout */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-4 w-full max-w-3xl">
        <div className="flex-1 w-full">
          <Board
            board={board}
            selectedPiece={selectedPiece}
            validMoves={validMoves}
            isPlayerTurn={isPlayerTurn}
            isAIThinking={isAIThinking}
            onSelectPiece={onSelectPiece}
            onMakeMove={onMakeMove}
            onDeselect={onDeselect}
          />
        </div>

        {/* Score panel */}
        <div className="w-full lg:w-44">
          <ScorePanel
            playerScore={playerScore}
            aiScore={aiScore}
            highScore={highScore}
            capturedByPlayer={capturedByPlayer}
            capturedByAI={capturedByAI}
            moveCount={moveCount}
            difficulty={difficulty}
            isPlayerTurn={isPlayerTurn}
            isAIThinking={isAIThinking}
          />
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-white/20 text-center mt-auto">
        <kbd className="px-1 rounded bg-white/10 text-white/30">P</kbd> pause
        &nbsp;·&nbsp;
        <kbd className="px-1 rounded bg-white/10 text-white/30">Esc</kbd> menu
        &nbsp;·&nbsp;
        Click a red piece, then a green dot to move
      </p>

      {/* ── Overlays ───────────────────────────────────────────────────────── */}

      {/* Pause overlay */}
      <AnimatePresence>
        {status === 'paused' && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card rounded-3xl p-8 flex flex-col items-center gap-5"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
            >
              <span className="text-6xl select-none" aria-hidden>⏸</span>
              <h2 className="text-3xl font-bold text-white">Paused</h2>
              <button
                onClick={onPauseResume}
                className="neon-btn px-8 py-3 rounded-xl font-bold text-lg"
              >
                Resume
              </button>
              <button
                onClick={onReturnToMenu}
                className="text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                ↩ Back to Menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End screen */}
      <AnimatePresence>
        {(status === 'player_won' || status === 'ai_won' || status === 'draw') && (
          <EndScreen
            status={status}
            playerScore={playerScore}
            aiScore={aiScore}
            capturedByPlayer={capturedByPlayer}
            capturedByAI={capturedByAI}
            moveCount={moveCount}
            highScore={highScore}
            isNewHighScore={isNewHighScore}
            onPlayAgain={onPlayAgain}
            onMenu={onReturnToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
