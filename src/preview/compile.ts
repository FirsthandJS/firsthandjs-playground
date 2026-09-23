/**
 * TSX to JavaScript, in the page, on every keystroke.
 *
 * This is the framework's own compiler — `@firsthandjs/compiler/plugin`, the
 * Babel plugin with nothing around it — registered with `@babel/standalone`.
 * Not a second implementation: what runs here is what `vite build` runs, so
 * the playground cannot quietly disagree with a real project.
 *
 * Order matters. The plugin runs first and sees JSX; the TypeScript preset
 * then strips the annotations. Babel runs plugins before presets, which is
 * exactly the order this needs, and is why the types are still present while
 * the markup is compiled.
 */
import type * as BabelStandalone from '@babel/standalone';
import firsthand from '@firsthandjs/compiler/plugin';

export type Compiled = { readonly code: string } | { readonly error: string };

/**
 * Babel, fetched the first time something is compiled.
 *
 * It is the largest thing this page loads and nothing needs it until there is
 * source to compile, so it is not in the way of the editor appearing. One
 * promise, kept: the plugin may only be registered once.
 */
let babel: Promise<typeof BabelStandalone> | null = null;

function load(): Promise<typeof BabelStandalone> {
  babel ??= import('@babel/standalone').then((module) => {
    // The cast is a types-only gap. Babel hands a plugin its API and its
    // options; `@babel/standalone` types `registerPlugin` as taking a plugin
    // that accepts neither, which every real plugin does.
    module.registerPlugin('firsthand', firsthand as unknown as () => object);
    return module;
  });
  return babel;
}

export async function compile(source: string, filename: string): Promise<Compiled> {
  try {
    const Babel = await load();
    const result = Babel.transform(source, {
      filename,
      babelrc: false,
      configFile: false,
      sourceType: 'module',
      presets: ['typescript'],
      // `syntax-jsx` explicitly. Babel 8 dropped the preset's `isTSX`, and
      // standalone does not read the file name the way the CLI does — without
      // this, `</h1>` is parsed as a regular expression and every sketch is a
      // syntax error.
      plugins: ['syntax-jsx', ['firsthand', { packageName: 'playground' }]],
      // For the debugger, not for the preview: see `annotate`.
      sourceMaps: true,
      sourceFileName: filename,
    });
    return { code: annotate(result?.code ?? '', result?.map, source, filename) };
  } catch (error) {
    return { error: message(error) };
  }
}

/**
 * What to show a person who typed something that will not parse.
 *
 * Babel's message carries the file name and a code frame, and both are noise
 * here: there is one file, and the editor is already showing it.
 */
function message(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/^[^:]*:\s*/, '').split('\n')[0] ?? text;
}

/**
 * What the browser's debugger needs to see a sketch as the sketch.
 *
 * The preview imports each compiled module from a blob URL, because a blob is
 * the only way to `import` a string. That is invisible until someone opens
 * devtools, and then it is two problems. Every recompile mints a new URL, so
 * the Sources tree fills with `blob:http://…/<uuid>` entries and a breakpoint
 * is set on a script that the next keystroke replaces. And what is there to
 * read is the compiler's output — templates, parts and hoisted markup — rather
 * than the TSX that was typed.
 *
 * Two comments fix both. `sourceURL` gives every compile of one file the same
 * name and the same path, so the debugger keeps one entry and puts breakpoints
 * back where they were. `sourceMappingURL` carries the map, with the original
 * source inside it, so what is shown and what is stepped through is the file
 * in the editor.
 *
 * The map is a percent-encoded data URL rather than a base64 one: `btoa`
 * throws on anything outside Latin-1, and the default sketch alone has an em
 * dash, an ellipsis and a degree sign in it.
 */
function annotate(
  code: string,
  map: object | null | undefined,
  source: string,
  filename: string,
): string {
  const lines = [code];
  if (map !== null && map !== undefined) {
    // `sourcesContent` is what lets the debugger show the TSX rather than ask
    // the network for a file that was never served.
    const whole = JSON.stringify({ ...map, sourcesContent: [source] });
    lines.push(
      `//# sourceMappingURL=data:application/json;charset=utf-8,${encodeURIComponent(whole)}`,
    );
  }
  lines.push(`//# sourceURL=firsthand:///${filename}`);
  return lines.join('\n');
}
