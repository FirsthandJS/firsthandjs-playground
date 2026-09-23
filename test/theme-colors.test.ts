/**
 * The editor's theme colours.
 *
 * There is one assertion worth making about them, and it is not aesthetic.
 * Monaco resolves a theme colour with `Color.fromHex`, which ends in
 * `parseHex(hex) || Color.red` — no throw, no warning, no console line. A value
 * it cannot parse becomes opaque red, and the only place that is visible is a
 * running browser. `editor.selectionBackground` was once `rgba(100, 240, 208,
 * 0.12)` and shipped as a red bar across the selected text for exactly that
 * reason.
 *
 * So: every value is hex, and the two modes describe the same set of keys.
 */
import { describe, expect, it } from 'vitest';
import { HEX, themeColors } from '../src/editor/theme-colors';
import type { Mode } from '../src/state/theme';

const MODES: Mode[] = ['dark', 'light'];

describe('the editor theme', () => {
  it.each(MODES)('gives %s nothing but hex, because the fallback is red', (mode) => {
    const colors = themeColors(mode);
    expect(Object.keys(colors).length).toBeGreaterThan(0);
    for (const [key, value] of Object.entries(colors)) {
      expect(`${key}: ${value}`).toMatch(new RegExp(`: ${HEX.source.slice(1, -1)}$`));
    }
  });

  it('rejects the CSS notation that caused this, so the guard is known to bite', () => {
    expect(HEX.test('rgba(100, 240, 208, 0.12)')).toBe(false);
    expect(HEX.test('teal')).toBe(false);
    expect(HEX.test('var(--accent)')).toBe(false);
    expect(HEX.test('#64f0d024')).toBe(true);
  });

  it('describes both modes with the same keys', () => {
    expect(Object.keys(themeColors('dark')).sort()).toEqual(
      Object.keys(themeColors('light')).sort(),
    );
  });

  it('tints the selection rather than covering it', () => {
    for (const mode of MODES) {
      const selection = themeColors(mode)['editor.selectionBackground'] ?? '';
      // `#rrggbbaa` — an eight-digit value, so there is an alpha at all, and an
      // alpha well under half, so the text keeps its own colour.
      expect(selection).toHaveLength(9);
      expect(parseInt(selection.slice(7), 16)).toBeLessThan(0x80);
    }
  });

  it('leaves the foreground alone, so syntax colours survive a selection', () => {
    for (const mode of MODES) {
      expect(themeColors(mode)).not.toHaveProperty('editor.selectionForeground');
    }
  });
});
