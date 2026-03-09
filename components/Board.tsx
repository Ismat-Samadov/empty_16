'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Board as BoardType, Move, Piece, Position } from '@/lib/checkers/types';
import GamePiece from './GamePiece';

interface BoardProps {
  board: BoardType;
  selectedPiece: Position | null;
  validMoves: Move[];
  isPlayerTurn: boolean;
  isAIThinking: boolean;
  onSelectPiece: (piece: Piece) => void;
  onMakeMove: (move: Move) => void;
  onDeselect: () => void;
}

/**
 * Renders the 8×8 checkers board.
 *
 * Dark squares ((row+col)%2===1) are playable; light squares are decorative.
 * Valid move targets are shown as neon-green pulsing dots.
 */
export default function Board({
  board,
  selectedPiece,
  validMoves,
  isPlayerTurn,
  isAIThinking,
  onSelectPiece,
  onMakeMove,
  onDeselect,
}: BoardProps) {
  // Build quick lookups
  const validMoveSet = new Set<string>(
    validMoves.map(m => `${m.to.row},${m.to.col}`),
  );
  const moveByDest = new Map<string, Move>();
  for (const m of validMoves) moveByDest.set(`${m.to.row},${m.to.col}`, m);

  function handleCellClick(row: number, col: number) {
    const key = `${row},${col}`;

    // Clicking a valid move destination
    if (moveByDest.has(key)) {
      onMakeMove(moveByDest.get(key)!);
      return;
    }

    // Clicking own piece
    const piece = board[row][col];
    if (piece && piece.player === 'player' && isPlayerTurn) {
      onSelectPiece(piece);
      return;
    }

    // Otherwise deselect
    onDeselect();
  }

  return (
    <div className="relative w-full max-w-[min(90vw,90vh,560px)] aspect-square mx-auto">
      {/* Outer glow frame */}
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-600/40 via-cyan-500/20 to-rose-600/40 blur-md" />

      {/* Board border */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Column labels (a-h) */}
        <div className="grid grid-cols-8 bg-[#0d0d1a]">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex justify-center py-0.5 text-[0.55rem] text-white/30 font-mono">
              {String.fromCharCode(97 + i)}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-8">
          {board.map((rowArr, row) =>
            rowArr.map((piece, col) => {
              const isDark = (row + col) % 2 === 1;
              const isSelected =
                selectedPiece?.row === row && selectedPiece?.col === col;
              const isValidTarget = validMoveSet.has(`${row},${col}`);
              const hasCapture = isValidTarget && moveByDest.get(`${row},${col}`)?.isJump;

              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => isDark && handleCellClick(row, col)}
                  className={[
                    'relative aspect-square',
                    isDark
                      ? isSelected
                        ? 'bg-[#2d1f4e] cursor-pointer'
                        : isValidTarget
                        ? 'bg-[#1a2e1e] cursor-pointer'
                        : 'bg-[#1a1332] cursor-pointer'
                      : 'bg-[#0d0d1a]',
                  ].join(' ')}
                  aria-label={`Square ${String.fromCharCode(97 + col)}${8 - row}`}
                >
                  {/* Row label on first column */}
                  {col === 0 && (
                    <span className="absolute top-0.5 left-0.5 text-[0.45rem] text-white/20 font-mono z-10 leading-none">
                      {8 - row}
                    </span>
                  )}

                  {/* Valid-move indicator */}
                  {isValidTarget && isDark && !piece && (
                    <motion.span
                      className={[
                        'absolute inset-0 m-auto w-1/3 h-1/3 rounded-full',
                        hasCapture
                          ? 'bg-rose-400/70 shadow-[0_0_8px_4px_rgba(251,113,133,0.5)]'
                          : 'bg-emerald-400/70 shadow-[0_0_8px_4px_rgba(52,211,153,0.5)]',
                      ].join(' ')}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}

                  {/* Cell highlight when selected piece can land here on an occupied-looking square */}
                  {isValidTarget && isDark && piece && (
                    <motion.span
                      className="absolute inset-0 rounded bg-rose-500/20"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}

                  {/* Selected cell highlight */}
                  {isSelected && (
                    <motion.span
                      className="absolute inset-0 bg-yellow-400/15 rounded"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  )}

                  {/* Game piece */}
                  <AnimatePresence>
                    {piece && (
                      <GamePiece
                        key={piece.id}
                        piece={piece}
                        isSelected={isSelected}
                        isInteractive={isPlayerTurn && piece.player === 'player'}
                        onClick={() => handleCellClick(row, col)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            }),
          )}
        </div>

        {/* AI thinking overlay */}
        <AnimatePresence>
          {isAIThinking && (
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-cyan-400"
                    animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
