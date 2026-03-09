// ─── Core types for the Checkers game ───────────────────────────────────────

/** Which player owns a piece */
export type Player = 'player' | 'ai';

/** Piece promotion state */
export type PieceType = 'man' | 'king';

/** A position on the 8×8 board */
export interface Position {
  row: number;
  col: number;
}

/** A single piece on the board */
export interface Piece {
  id: string;
  player: Player;
  type: PieceType;
  row: number;
  col: number;
}

/**
 * A complete move (may involve multi-jump captures).
 * `from` → the starting square.
 * `to`   → the final landing square (after all jumps).
 * `captures` → every intermediate square jumped over.
 */
export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isJump: boolean;
}

/** The board is an 8×8 matrix of nullable pieces */
export type Board = (Piece | null)[][];

/** High-level phase of the game */
export type GameStatus =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'player_won'
  | 'ai_won'
  | 'draw';

/** AI difficulty level */
export type Difficulty = 'easy' | 'medium' | 'hard';
