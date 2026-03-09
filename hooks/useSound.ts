'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useSound — generates all sound effects via the Web Audio API.
 * No external audio files are needed.
 */
export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  // Lazily create the AudioContext on first use
  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  /** Play a short tone with the given parameters */
  const playTone = useCallback(
    (
      freq: number,
      type: OscillatorType,
      durationMs: number,
      gainPeak = 0.3,
      freqEnd?: number,
    ) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + durationMs / 1000);
      }

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    },
    [enabled, getCtx],
  );

  // ─── Named sound effects ─────────────────────────────────────────────────

  /** Piece selected */
  const playSelect = useCallback(() => {
    playTone(440, 'sine', 80, 0.2);
  }, [playTone]);

  /** Normal move */
  const playMove = useCallback(() => {
    playTone(330, 'triangle', 120, 0.25, 280);
  }, [playTone]);

  /** Capture / jump */
  const playCapture = useCallback(() => {
    playTone(200, 'sawtooth', 80, 0.2);
    setTimeout(() => playTone(150, 'sawtooth', 80, 0.15), 80);
  }, [playTone]);

  /** King promotion */
  const playKing = useCallback(() => {
    playTone(523, 'sine', 100, 0.25);
    setTimeout(() => playTone(659, 'sine', 100, 0.25), 110);
    setTimeout(() => playTone(784, 'sine', 200, 0.3), 220);
  }, [playTone]);

  /** Win fanfare */
  const playWin = useCallback(() => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 200, 0.3), i * 150));
  }, [playTone]);

  /** Loss sound */
  const playLose = useCallback(() => {
    [400, 300, 200].forEach((f, i) => setTimeout(() => playTone(f, 'sawtooth', 200, 0.2), i * 150));
  }, [playTone]);

  /** Button / UI click */
  const playClick = useCallback(() => {
    playTone(600, 'sine', 60, 0.15);
  }, [playTone]);

  const toggle = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return {
    enabled,
    toggle,
    playSelect,
    playMove,
    playCapture,
    playKing,
    playWin,
    playLose,
    playClick,
  };
}
