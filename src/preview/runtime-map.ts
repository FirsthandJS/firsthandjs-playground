/**
 * What `@firsthandjs/…` means inside the preview.
 *
 * The names a sketch may import, each pointing at a file built from this
 * playground's own `node_modules`. `@firsthandjs/dom/internal` is in the list
 * because compiled markup imports it: a visitor never writes that name, and
 * every compiled file does.
 *
 * The URLs are absolute because the preview is an `srcdoc` document, which has
 * no base of its own to resolve a relative one against.
 */
const NAMES = {
  '@firsthandjs/core': 'core.js',
  '@firsthandjs/dom': 'dom.js',
  '@firsthandjs/dom/internal': 'dom-internal.js',
  '@firsthandjs/data': 'data.js',
  '@firsthandjs/styled': 'styled.js',
  '@firsthandjs/router': 'router.js',
  '@firsthandjs/i18n': 'i18n.js',
  '@firsthandjs/deep': 'deep.js',
} as const;

const base = new URL(`${import.meta.env.BASE_URL}runtime/`, location.href);

export const RUNTIME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(NAMES).map(([name, file]) => [name, new URL(file, base).href]),
);

/** The packages a visitor can import, for the panel that says so. */
export const AVAILABLE: readonly string[] = Object.keys(NAMES).filter(
  (name) => !name.endsWith('/internal'),
);
