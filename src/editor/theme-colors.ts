/**
 * The colours the editor's theme is made of, and nothing that imports Monaco.
 *
 * They live apart from `monaco.ts` for one reason: Monaco will not tell you
 * when one of them is wrong. `Color.fromHex` ends in `parseHex(hex) ||
 * Color.red`, so a value its hex parser does not understand — an `rgba(…)`
 * string, a named colour, a CSS variable — is not ignored and is not logged.
 * It becomes opaque red, painted over whatever the colour was meant to tint.
 * That is how a selection the page's own accent was written for shipped as a
 * red bar across the text.
 *
 * A module with no Monaco in it can be asserted against cheaply, and
 * `theme-colors.test.ts` asserts the only thing that matters here: every value
 * is hex.
 */
import { PALETTE, type Mode } from '../state/theme';

/**
 * Selection, in hex with alpha.
 *
 * The page's accent at an alpha low enough that the ink on top of it is still
 * the ink. `related` is the other occurrences of the selected word, which
 * Monaco draws on its own and which should sit under, not over, the selection
 * the reader actually made.
 */
const SELECTION = {
  dark: { active: '#64f0d024', inactive: '#64f0d014', related: '#64f0d01a' },
  light: { active: '#0f9e841f', inactive: '#0f9e8412', related: '#0f9e8417' },
} as const;

/** The line under the cursor: a tint of the panel, not a band across it. */
const LINE_HIGHLIGHT = { dark: '#121a2c', light: '#eef3fb' } as const;

/** Every `colors` entry of the `firsthand-<mode>` theme. */
export function themeColors(name: Mode): Record<string, string> {
  const palette = PALETTE[name];
  const selection = SELECTION[name];
  return {
    'editor.background': palette.panel,
    'editor.foreground': palette.ink,
    'editorLineNumber.foreground': palette.dim,
    'editorCursor.foreground': palette.accent,
    'editor.selectionBackground': selection.active,
    'editor.inactiveSelectionBackground': selection.inactive,
    'editor.selectionHighlightBackground': selection.related,
    'editor.wordHighlightBackground': selection.related,
    'editor.wordHighlightStrongBackground': selection.related,
    'editor.lineHighlightBackground': LINE_HIGHLIGHT[name],
    'editorIndentGuide.background1': palette.panelEdge,
  };
}

/** What Monaco's own parser accepts: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`. */
export const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
