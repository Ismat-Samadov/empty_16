'use client';

import { Difficulty } from '@/lib/checkers/types';

interface GameControlsProps {
  isPaused: boolean;
  soundEnabled: boolean;
  difficulty: Difficulty;
  onPauseResume: () => void;
  onSoundToggle: () => void;
  onReturnToMenu: () => void;
}

/** In-game control buttons: Pause, Sound, Back to Menu */
export default function GameControls({
  isPaused,
  soundEnabled,
  onPauseResume,
  onSoundToggle,
  onReturnToMenu,
}: GameControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <ControlBtn onClick={onPauseResume} title={isPaused ? 'Resume' : 'Pause'}>
        {isPaused ? '▶' : '⏸'}
        <span className="hidden sm:inline ml-1">{isPaused ? 'Resume' : 'Pause'}</span>
      </ControlBtn>

      <ControlBtn onClick={onSoundToggle} title={soundEnabled ? 'Mute' : 'Unmute'}>
        {soundEnabled ? '🔊' : '🔇'}
        <span className="hidden sm:inline ml-1">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
      </ControlBtn>

      <ControlBtn onClick={onReturnToMenu} title="Back to Menu" variant="danger">
        ↩ <span className="hidden sm:inline ml-1">Menu</span>
      </ControlBtn>
    </div>
  );
}

interface BtnProps {
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}

function ControlBtn({ onClick, title, variant = 'default', children }: BtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        'flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
        'border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
        variant === 'danger'
          ? 'border-rose-500/40 text-rose-400 hover:bg-rose-500/20 focus:ring-rose-500'
          : 'border-white/10 text-white/70 hover:bg-white/10 focus:ring-white/30',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
