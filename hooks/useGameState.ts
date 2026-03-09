'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Board, Difficulty, GameStatus, Move, Piece, Position } from '@/lib/checkers/types';
import {
  applyMove,
  checkGameOver,
  createInitialBoard,
  getValidMovesForPiece,
} from '@/lib/checkers/rules';
import { getBestMove } from '@/lib/checkers/ai';
import { useLocalStorage } from './useLocalStorage';
import { useSound } from './useSound';

// ─── State shape ─────────────────────────────────────────────────────────────

interface State {
  board: Board;
  currentPlayer: 'player' | 'ai';
  selectedPiece: Position | null;
  validMoves: Move[];
  status: GameStatus;
  difficulty: Difficulty;
  playerScore: number;
  aiScore: number;
  capturedByPlayer: number;
  capturedByAI: number;
  moveCount: number;
  isAIThinking: boolean;
  promotedThisTurn: boolean; // true if last move resulted in a promotion
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'START_GAME'; difficulty: Difficulty }
  | { type: 'SELECT_PIECE'; piece: Piece }
  | { type: 'DESELECT' }
  | { type: 'MAKE_MOVE'; move: Move }
  | { type: 'AI_MOVE_START' }
  | { type: 'AI_MOVE_DONE'; board: Board; captures: number; promoted: boolean }
  | { type: 'GAME_OVER'; result: 'player_won' | 'ai_won' | 'draw' }
  | { type: 'PAUSE_RESUME' }
  | { type: 'RETURN_TO_MENU' }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initialState(): State {
  return {
    board: createInitialBoard(),
    currentPlayer: 'player',
    selectedPiece: null,
    validMoves: [],
    status: 'menu',
    difficulty: 'medium',
    playerScore: 0,
    aiScore: 0,
    capturedByPlayer: 0,
    capturedByAI: 0,
    moveCount: 0,
    isAIThinking: false,
    promotedThisTurn: false,
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...initialState(),
        difficulty: action.difficulty,
        playerScore: state.playerScore,
        aiScore: state.aiScore,
        status: 'playing',
      };
    }

    case 'SELECT_PIECE': {
      const moves = getValidMovesForPiece(state.board, action.piece);
      return {
        ...state,
        selectedPiece: { row: action.piece.row, col: action.piece.col },
        validMoves: moves,
      };
    }

    case 'DESELECT': {
      return { ...state, selectedPiece: null, validMoves: [] };
    }

    case 'MAKE_MOVE': {
      const { move } = action;
      const newBoard = applyMove(state.board, move);

      // Detect king promotion on this move
      const movedPiece = newBoard[move.to.row][move.to.col];
      const promoted =
        !!movedPiece &&
        movedPiece.type === 'king' &&
        state.board[move.from.row][move.from.col]?.type === 'man';

      return {
        ...state,
        board: newBoard,
        currentPlayer: 'ai',
        selectedPiece: null,
        validMoves: [],
        moveCount: state.moveCount + 1,
        capturedByPlayer: state.capturedByPlayer + move.captures.length,
        isAIThinking: true,
        promotedThisTurn: promoted,
      };
    }

    case 'AI_MOVE_START': {
      return { ...state, isAIThinking: true };
    }

    case 'AI_MOVE_DONE': {
      return {
        ...state,
        board: action.board,
        currentPlayer: 'player',
        isAIThinking: false,
        moveCount: state.moveCount + 1,
        capturedByAI: state.capturedByAI + action.captures,
        promotedThisTurn: action.promoted,
      };
    }

    case 'GAME_OVER': {
      const playerWon = action.result === 'player_won';
      const aiWon = action.result === 'ai_won';
      return {
        ...state,
        status: action.result,
        playerScore: state.playerScore + (playerWon ? 1 : 0),
        aiScore: state.aiScore + (aiWon ? 1 : 0),
        isAIThinking: false,
      };
    }

    case 'PAUSE_RESUME': {
      return {
        ...state,
        status: state.status === 'paused' ? 'playing' : 'paused',
      };
    }

    case 'RETURN_TO_MENU': {
      return { ...initialState(), playerScore: state.playerScore, aiScore: state.aiScore };
    }

    case 'SET_DIFFICULTY': {
      return { ...state, difficulty: action.difficulty };
    }

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [highScore, setHighScore] = useLocalStorage<number>('checkers-highscore', 0);
  const sound = useSound();

  // Track whether an AI move is in-flight to avoid double-dispatching
  const aiPendingRef = useRef(false);

  // ─── Player interactions ──────────────────────────────────────────────────

  const selectPiece = useCallback(
    (piece: Piece) => {
      if (state.status !== 'playing' || state.currentPlayer !== 'player') return;
      if (piece.player !== 'player') return;
      sound.playSelect();
      dispatch({ type: 'SELECT_PIECE', piece });
    },
    [state.status, state.currentPlayer, sound],
  );

  const makeMove = useCallback(
    (move: Move) => {
      if (state.status !== 'playing' || state.currentPlayer !== 'player') return;
      if (move.isJump) sound.playCapture(); else sound.playMove();
      dispatch({ type: 'MAKE_MOVE', move });
    },
    [state.status, state.currentPlayer, sound],
  );

  const deselect = useCallback(() => {
    dispatch({ type: 'DESELECT' });
  }, []);

  const startGame = useCallback(
    (difficulty: Difficulty) => {
      sound.playClick();
      dispatch({ type: 'START_GAME', difficulty });
    },
    [sound],
  );

  /** Restart with the same difficulty after a game ends */
  const playAgain = useCallback(() => {
    sound.playClick();
    dispatch({ type: 'START_GAME', difficulty: state.difficulty });
  }, [sound, state.difficulty]);

  const pauseResume = useCallback(() => {
    sound.playClick();
    dispatch({ type: 'PAUSE_RESUME' });
  }, [sound]);

  const returnToMenu = useCallback(() => {
    sound.playClick();
    dispatch({ type: 'RETURN_TO_MENU' });
  }, [sound]);

  const setDifficulty = useCallback(
    (difficulty: Difficulty) => {
      dispatch({ type: 'SET_DIFFICULTY', difficulty });
    },
    [],
  );

  // ─── King promotion sound ─────────────────────────────────────────────────

  useEffect(() => {
    if (state.promotedThisTurn) sound.playKing();
  }, [state.promotedThisTurn, sound]);

  // ─── AI move (runs after player's move) ──────────────────────────────────

  useEffect(() => {
    if (
      state.status !== 'playing' ||
      state.currentPlayer !== 'ai' ||
      state.isAIThinking === false ||
      aiPendingRef.current
    ) return;

    // Check game-over before AI moves
    const beforeResult = checkGameOver(state.board);
    if (beforeResult) {
      dispatch({ type: 'GAME_OVER', result: beforeResult });
      return;
    }

    aiPendingRef.current = true;

    const delay = state.difficulty === 'hard' ? 800 : state.difficulty === 'medium' ? 600 : 400;

    const timer = setTimeout(() => {
      const move = getBestMove(state.board, state.difficulty);

      if (!move) {
        // AI has no moves → player wins
        dispatch({ type: 'GAME_OVER', result: 'player_won' });
        aiPendingRef.current = false;
        return;
      }

      const newBoard = applyMove(state.board, move);

      // Detect promotion
      const movedPiece = newBoard[move.to.row][move.to.col];
      const promoted =
        !!movedPiece &&
        movedPiece.type === 'king' &&
        state.board[move.from.row][move.from.col]?.type === 'man';

      if (move.isJump) sound.playCapture(); else sound.playMove();

      dispatch({
        type: 'AI_MOVE_DONE',
        board: newBoard,
        captures: move.captures.length,
        promoted,
      });

      // Check game-over after AI move
      const afterResult = checkGameOver(newBoard);
      if (afterResult) {
        dispatch({ type: 'GAME_OVER', result: afterResult });
      }

      aiPendingRef.current = false;
    }, delay);

    return () => {
      clearTimeout(timer);
      aiPendingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPlayer, state.isAIThinking, state.status]);

  // ─── Win / lose sound + high score ───────────────────────────────────────

  useEffect(() => {
    if (state.status === 'player_won') {
      sound.playWin();
      if (state.playerScore + 1 > highScore) setHighScore(state.playerScore + 1);
    } else if (state.status === 'ai_won') {
      sound.playLose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return {
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
    setDifficulty,
  };
}
