'use client';

import { motion } from 'framer-motion';
import { Piece } from '@/lib/checkers/types';

interface GamePieceProps {
  piece: Piece;
  isSelected: boolean;
  onClick: () => void;
  isInteractive: boolean;
}

/**
 * Renders a single checker piece — either a man (circle) or a king (crowned circle).
 * Framer-motion handles scale/glow animations.
 */
export default function GamePiece({ piece, isSelected, onClick, isInteractive }: GamePieceProps) {
  const isPlayer = piece.player === 'player';

  return (
    <motion.button
      aria-label={`${piece.player} ${piece.type}`}
      onClick={onClick}
      disabled={!isInteractive}
      className="absolute inset-1 rounded-full focus:outline-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isSelected ? 1.15 : 1,
        opacity: 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={isInteractive ? { scale: 1.08 } : {}}
      whileTap={isInteractive ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Outer glow ring */}
      <span
        className={[
          'absolute inset-0 rounded-full',
          isSelected
            ? 'ring-4 ring-offset-1 ring-offset-transparent animate-pulse'
            : '',
          isSelected && isPlayer
            ? 'ring-yellow-400'
            : isSelected
            ? 'ring-yellow-300'
            : '',
        ].join(' ')}
      />

      {/* Piece body */}
      <span
        className={[
          'absolute inset-0 rounded-full flex items-center justify-center',
          isPlayer
            ? 'bg-gradient-to-br from-rose-400 to-rose-700 shadow-[0_0_12px_2px_rgba(244,63,94,0.7)]'
            : 'bg-gradient-to-br from-cyan-400 to-cyan-700 shadow-[0_0_12px_2px_rgba(34,211,238,0.7)]',
          isSelected
            ? 'brightness-125'
            : 'hover:brightness-110',
        ].join(' ')}
      >
        {/* Inner shine */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1/2 h-1/4 rounded-full bg-white/30 blur-[1px]" />

        {/* King crown icon */}
        {piece.type === 'king' && (
          <motion.span
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            className="relative z-10 text-[0.65em] leading-none select-none drop-shadow-sm"
            aria-hidden
          >
            ♛
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
