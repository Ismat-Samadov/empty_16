/**
 * rules.ts — Pure game-logic for American Checkers.
 *
 * Rules implemented:
 *  - 8×8 board, dark squares only ((row+col) % 2 === 1)
 *  - Men move forward diagonally; kings move any diagonal direction
 *  - Forced capture: if any jump is available the player MUST jump
 *  - Multi-jump: after a capture the same piece must continue if another
 *    capture is available (the full chain is encoded as one Move)
 *  - King promotion when a man reaches the far row
 */

import { Board, Move, Piece, Player, Position } from './types';

export const BOARD_SIZE = 8;

/** Returns true when (row, col) is inside the 8×8 board */
export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Dark squares are the only playable squares */
export function isPlayable(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

// ─── Board initialisation ────────────────────────────────────────────────────

/** Creates the standard start-of-game board */
export function createInitialBoard(): Board {
  const board: Board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  let id = 0;

  // AI pieces occupy rows 0-2 (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isPlayable(row, col)) {
        board[row][col] = { id: `ai-${id++}`, player: 'ai', type: 'man', row, col };
      }
    }
  }

  // Player pieces occupy rows 5-7 (bottom)
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isPlayable(row, col)) {
        board[row][col] = {
          id: `player-${id++}`,
          player: 'player',
          type: 'man',
          row,
          col,
        };
      }
    }
  }

  return board;
}

// ─── Move generation ─────────────────────────────────────────────────────────

/**
 * Diagonal directions available to a piece.
 * Kings can move in all four directions; men only forward.
 */
function directions(piece: Piece): [number, number][] {
  if (piece.type === 'king') return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.player === 'player' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

/**
 * Recursively generate all complete capture chains starting from `from`.
 * `alreadyCaptured` prevents re-jumping the same piece in one chain.
 */
function getCapturesFrom(
  board: Board,
  piece: Piece,
  from: Position,
  alreadyCaptured: Position[],
): Move[] {
  const results: Move[] = [];

  for (const [dr, dc] of directions(piece)) {
    const midRow = from.row + dr;
    const midCol = from.col + dc;
    const toRow  = from.row + 2 * dr;
    const toCol  = from.col + 2 * dc;

    if (!inBounds(midRow, midCol) || !inBounds(toRow, toCol)) continue;

    const midPiece = board[midRow][midCol];
    const toPiece  = board[toRow][toCol];

    // Already captured in this chain?
    if (alreadyCaptured.some(p => p.row === midRow && p.col === midCol)) continue;
    // Must jump over an opponent's piece to an empty square
    if (!midPiece || midPiece.player === piece.player) continue;
    if (toPiece !== null) continue;

    const newCaptures = [...alreadyCaptured, { row: midRow, col: midCol }];

    // Record this as a valid move (landing at toRow/toCol)
    results.push({
      from: { row: from.row, col: from.col },
      to:   { row: toRow,   col: toCol },
      captures: newCaptures,
      isJump: true,
    });

    // Look for further jumps from the new position (multi-jump)
    const movedPiece: Piece = { ...piece, row: toRow, col: toCol };
    const further = getCapturesFrom(board, movedPiece, { row: toRow, col: toCol }, newCaptures);

    for (const f of further) {
      // Override the final destination to the end of the chain
      results.push({
        from: { row: from.row, col: from.col },
        to:   f.to,
        captures: f.captures,
        isJump: true,
      });
    }
  }

  return results;
}

/** Returns true if `player` has at least one capture available */
export function hasCaptureAvailable(board: Board, player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece || piece.player !== player) continue;
      if (getCapturesFrom(board, piece, { row, col }, []).length > 0) return true;
    }
  }
  return false;
}

/** Returns all valid moves for a specific piece (respecting forced-capture) */
export function getValidMovesForPiece(board: Board, piece: Piece): Move[] {
  const mustCapture = hasCaptureAvailable(board, piece.player);

  if (mustCapture) {
    return getCapturesFrom(board, piece, { row: piece.row, col: piece.col }, []);
  }

  // Simple diagonal steps
  const moves: Move[] = [];
  for (const [dr, dc] of directions(piece)) {
    const toRow = piece.row + dr;
    const toCol = piece.col + dc;
    if (!inBounds(toRow, toCol)) continue;
    if (board[toRow][toCol] !== null) continue;
    moves.push({ from: { row: piece.row, col: piece.col }, to: { row: toRow, col: toCol }, captures: [], isJump: false });
  }
  return moves;
}

/** Returns all valid moves for a player */
export function getValidMoves(board: Board, player: Player): Move[] {
  const mustCapture = hasCaptureAvailable(board, player);
  const moves: Move[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece || piece.player !== player) continue;

      if (mustCapture) {
        moves.push(...getCapturesFrom(board, piece, { row, col }, []));
      } else {
        for (const [dr, dc] of directions(piece)) {
          const toRow = row + dr;
          const toCol = col + dc;
          if (!inBounds(toRow, toCol)) continue;
          if (board[toRow][toCol] !== null) continue;
          moves.push({ from: { row, col }, to: { row: toRow, col: toCol }, captures: [], isJump: false });
        }
      }
    }
  }

  return moves;
}

// ─── Move application ────────────────────────────────────────────────────────

/** Returns a new board with the move applied (immutable) */
export function applyMove(board: Board, move: Move): Board {
  const next: Board = board.map(row => [...row]);

  const piece = next[move.from.row][move.from.col];
  if (!piece) return next;

  // Clear origin
  next[move.from.row][move.from.col] = null;

  // Remove captured pieces
  for (const cap of move.captures) {
    next[cap.row][cap.col] = null;
  }

  // Promote to king if reaching the far row
  const promoted =
    piece.type === 'king' ||
    (piece.player === 'player' && move.to.row === 0) ||
    (piece.player === 'ai' && move.to.row === BOARD_SIZE - 1);

  next[move.to.row][move.to.col] = {
    ...piece,
    row:  move.to.row,
    col:  move.to.col,
    type: promoted ? 'king' : piece.type,
  };

  return next;
}

// ─── Game-over detection ─────────────────────────────────────────────────────

/** Counts remaining pieces per player */
export function countPieces(board: Board): { player: number; ai: number } {
  let player = 0;
  let ai = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell?.player === 'player') player++;
      else if (cell?.player === 'ai') ai++;
    }
  }
  return { player, ai };
}

/** Returns the result if the game has ended, or null if still in progress */
export function checkGameOver(
  board: Board,
): 'player_won' | 'ai_won' | 'draw' | null {
  const { player, ai } = countPieces(board);

  if (ai === 0) return 'player_won';
  if (player === 0) return 'ai_won';

  const playerMoves = getValidMoves(board, 'player').length;
  const aiMoves = getValidMoves(board, 'ai').length;

  if (playerMoves === 0 && aiMoves === 0) return 'draw';
  if (playerMoves === 0) return 'ai_won';
  if (aiMoves === 0) return 'player_won';

  return null;
}
