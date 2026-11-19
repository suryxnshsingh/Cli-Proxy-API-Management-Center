import type { ReactNode } from 'react';
import { BorderBeam, type BorderBeamProps } from 'border-beam';
import { motionSeconds } from '@/design-system';
import { useThemeStore } from '@/stores/useThemeStore';
import './Flair.scss';

type FlairVariant = 'card' | 'line' | 'badge';

interface FlairProps {
  children: ReactNode;
  /** `card` circles the whole border, `line` travels along the bottom edge, `badge` suits icons. */
  variant?: FlairVariant;
  /** Pause the animation, for example while the wrapped element is idle or hidden. */
  active?: boolean;
  /** Square corners, for a row inside a list whose own border clips the corners. */
  flush?: boolean;
  className?: string;
}

/** Glow intensity per preset (0-1). Kept low: this is an accent, not a focus indicator. */
const PRESETS: Record<FlairVariant, Pick<BorderBeamProps, 'size' | 'strength' | 'duration'>> = {
  card: { size: 'md', strength: 0.7, duration: motionSeconds('flair-orbit') },
  line: { size: 'line', strength: 0.7, duration: motionSeconds('flair-line') },
  badge: { size: 'sm', strength: 0.6, duration: motionSeconds('flair-orbit') },
};

/**
 * Subtle colourful border beam around a surface. Decorative only: it adds no semantics, and the
 * underlying library stops animating under `prefers-reduced-motion`.
 */
export function Flair({
  children,
  variant = 'card',
  active = true,
  flush = false,
  className,
}: FlairProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  return (
    <BorderBeam
      {...PRESETS[variant]}
      colorVariant="colorful"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      active={active}
      borderRadius={flush ? 0 : undefined}
      className={className ? `flair ${className}` : 'flair'}
    >
      {children}
    </BorderBeam>
  );
}
