'use client';

/**
 * page.tsx — Root page; owns the global game state and routes between
 * the menu screen and the active game screen.
 *
 * State lives here (via useGameState) so scores persist across
 * menu ↔ game transitions without any external store.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import MenuScreen from '@/components/MenuScreen';
import GameScreen from '@/components/GameScreen';

export default function Page() {
  const {
    state,
    highScore,
    sound,
    selectPiece,
    makeMove,
    deselect,
    startGame,
    playAgain,
    pauseResume,
    returnToMenu,
  } = useGameState();

  const isInGame =
    state.status === 'playing' ||
    state.status === 'paused' ||
    state.status === 'player_won' ||
    state.status === 'ai_won' ||
    state.status === 'draw';

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* ── Menu ─────────────────────────────────────────────────────── */}
        {!isInGame && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <MenuScreen
              playerScore={state.playerScore}
              aiScore={state.aiScore}
              highScore={highScore}
              soundEnabled={sound.enabled}
              onStart={startGame}
              onSoundToggle={sound.toggle}
            />
          </motion.div>
        )}

        {/* ── Game ─────────────────────────────────────────────────────── */}
        {isInGame && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GameScreen
              board={state.board}
              selectedPiece={state.selectedPiece}
              validMoves={state.validMoves}
              currentPlayer={state.currentPlayer}
              status={state.status}
              isAIThinking={state.isAIThinking}
              difficulty={state.difficulty}
              playerScore={state.playerScore}
              aiScore={state.aiScore}
              highScore={highScore}
              capturedByPlayer={state.capturedByPlayer}
              capturedByAI={state.capturedByAI}
              moveCount={state.moveCount}
              soundEnabled={sound.enabled}
              onSelectPiece={selectPiece}
              onMakeMove={makeMove}
              onDeselect={deselect}
              onPauseResume={pauseResume}
              onSoundToggle={sound.toggle}
              onReturnToMenu={returnToMenu}
              onPlayAgain={playAgain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
