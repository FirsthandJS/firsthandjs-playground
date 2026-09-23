/**
 * Dark and light, and the one place that knows which.
 *
 * The value is a signal, so everything that reads it follows — the styled
 * theme, Monaco's own theme, and the preview, which is a document of its own
 * and has to be told. It is also written to the document element, because the
 * page's own background must be right before any of this runs.
 */
import { signal } from '@firsthandjs/dom';

export type Mode = 'dark' | 'light';

const KEY = 'firsthand.playground.theme';

function preferred(): Mode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Storage may be blocked; the system preference is a good second answer.
  }
  return globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const mode = signal<Mode>(preferred());

export function toggle(): void {
  mode.value = mode.value === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset['theme'] = mode.value;
  try {
    localStorage.setItem(KEY, mode.value);
  } catch {
    // Then it is this visit's choice only.
  }
}

document.documentElement.dataset['theme'] = mode.value;

/** The palette each mode is. One object, read through the styled theme. */
export const PALETTE = {
  dark: {
    name: 'dark' as Mode,
    bg: '#070a12',
    panel: '#0d1220',
    panelEdge: '#1b2439',
    ink: '#e8ecf8',
    dim: '#7d89a6',
    accent: '#64f0d0',
    accentSoft: 'rgba(100, 240, 208, 0.12)',
    danger: '#ff7a8a',
    glow: 'radial-gradient(1200px 600px at 15% -10%, rgba(100,240,208,0.10), transparent 60%)',
  },
  light: {
    name: 'light' as Mode,
    bg: '#f6f8fc',
    panel: '#ffffff',
    panelEdge: '#dde4f0',
    ink: '#101626',
    dim: '#5d6880',
    accent: '#0f9e84',
    accentSoft: 'rgba(15, 158, 132, 0.10)',
    danger: '#c53048',
    glow: 'radial-gradient(1200px 600px at 15% -10%, rgba(15,158,132,0.10), transparent 60%)',
  },
} as const;

export type Theme = (typeof PALETTE)['dark'];
