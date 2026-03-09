/**
 * ai.ts — Minimax AI with alpha-beta pruning for Checkers.
 *
 * Difficulty levels:
 *   easy   → depth 2, 60 % random move selection
 *   medium → depth 4, always picks best
 *   hard   → depth 6, always picks best
 */

import { Board, Difficulty, Move, Player } from './types';
import { applyMove, checkGameOver, getValidMoves, BOARD_SIZE } from './rules';

// ─── Static evaluation ───────────────────────────────────────────────────────

/**
 * Scores the board from the AI's perspective.
 * Positive → good for AI.  Negative → good for player.
 */
function evaluate(board: Board): number {
  let score = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      // Material: king = 3×man
      let value = piece.type === 'king' ? 3 : 1;

      // Advance bonus for men (encourages promotion)
      if (piece.type === 'man') {
        if (piece.player === 'ai') value += (row / BOARD_SIZE) * 0.3;
        else value += ((BOARD_SIZE - 1 - row) / BOARD_SIZE) * 0.3;
      }

      // Center control
      const distFromCenter = Math.abs(col - 3.5) + Math.abs(row - 3.5);
      value += Math.max(0, (4 - distFromCenter) * 0.05);

      // Edge penalty (easier to trap)
      if (col === 0 || col === BOARD_SIZE - 1) value -= 0.1;

      if (piece.player === 'ai') score += value;
      else score -= value;
    }
  }

  return score;
}

// ─── Minimax ─────────────────────────────────────────────────────────────────

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const result = checkGameOver(board);
  if (result === 'ai_won') return 1000 + depth;
  if (result === 'player_won') return -1000 - depth;
  if (result === 'draw') return 0;
  if (depth === 0) return evaluate(board);

  const player: Player = maximizing ? 'ai' : 'player';
  const moves = getValidMoves(board, player);

  if (moves.length === 0) return maximizing ? -1000 - depth : 1000 + depth;

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const child = applyMove(board, move);
      const val = minimax(child, depth - 1, alpha, beta, false);
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break; // β cut-off
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const child = applyMove(board, move);
      const val = minimax(child, depth - 1, alpha, beta, true);
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break; // α cut-off
    }
    return best;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Returns the best move for the AI, or null if no moves exist */
export function getBestMove(board: Board, difficulty: Difficulty): Move | null {
  const moves = getValidMoves(board, 'ai');
  if (moves.length === 0) return null;

  // Easy: mostly random
  if (difficulty === 'easy') {
    if (Math.random() < 0.6) return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;

  // Shuffle for variety when multiple moves tie on score
  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  let bestMove = shuffled[0];
  let bestScore = -Infinity;

  for (const move of shuffled) {
    const child = applyMove(board, move);
    const score = minimax(child, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
