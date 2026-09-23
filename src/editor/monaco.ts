/**
 * Monaco, set up once: TypeScript, JSX, and the Firsthand types.
 *
 * Three things are worth knowing here.
 *
 * `jsx: Preserve` — the editor must not transform anything. What compiles the
 * markup is the framework's own compiler, in `preview/compile.ts`; TypeScript
 * here is for types and for nothing else.
 *
 * The declarations are the real ones, copied out of `node_modules` at build
 * time under the paths they already have. That is what makes "every Firsthand
 * package is installed" true of autocompletion and not only of the preview.
 *
 * And the workers are imported as modules rather than loaded from a CDN, so
 * the playground works offline and cannot be broken by somebody else's uptime.
 */
// The editor, and one language.
//
// `monaco-editor`'s own entry bundles every language it has ever supported —
// Solidity, PowerQuery, FreeMarker — and this playground writes TSX. The API
// entry plus two contributions is the same editor with the other sixty
// languages left out, and it is most of the download.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as typescript from 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
// The types for the line above. `monaco.contribution` ships none of its own,
// and a type-only import is erased, so this costs nothing in the bundle.
import type { typescript as TypeScriptApi } from 'monaco-editor/esm/vs/editor/editor.main.js';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import declarations from '../generated/types.json';
import { PALETTE, type Mode } from '../state/theme';
import { themeColors } from './theme-colors';

let prepared = false;

export function setupMonaco(): typeof monaco {
  if (prepared) {
    return monaco;
  }
  prepared = true;

  globalThis.MonacoEnvironment = {
    getWorker(_id: string, label: string) {
      return label === 'typescript' || label === 'javascript' ? new tsWorker() : new editorWorker();
    },
  };

  const api = typescript as unknown as typeof TypeScriptApi;
  const ts = api.typescriptDefaults;
  ts.setCompilerOptions({
    target: api.ScriptTarget.ESNext,
    module: api.ModuleKind.ESNext,
    moduleResolution: api.ModuleResolutionKind.NodeJs,
    jsx: api.JsxEmit.Preserve,
    allowNonTsExtensions: true,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    lib: ['es2022', 'dom'],
  });
  // Nothing suppressed. The declarations below are the real ones, under the
  // paths they have in `node_modules`, so `@firsthandjs/…` resolves here the
  // way it does in a project — and an import that cannot be resolved is worth
  // a red line, because the preview will not resolve it either.
  ts.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });

  for (const [path, contents] of Object.entries(declarations as Record<string, string>)) {
    ts.addExtraLib(contents, path);
  }

  // Handles for the end-to-end tests, which ask the language service for
  // completions the way a keystroke does. `monaco.languages.typescript` is
  // not one of them: the trimmed entry does not attach it.
  Object.assign(globalThis, { __monaco: monaco, __ts: api });

  defineThemes();
  return monaco;
}

/** Two themes of our own, so the editor belongs to the page around it. */
function defineThemes(): void {
  const build = (name: Mode) => {
    const palette = PALETTE[name];
    monaco.editor.defineTheme(`firsthand-${name}`, {
      base: name === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: palette.dim.replace('#', ''), fontStyle: 'italic' },
        { token: 'keyword', foreground: palette.accent.replace('#', '') },
        { token: 'string', foreground: name === 'dark' ? '9fd0ff' : '116699' },
      ],
      // Every value here must be hex; see `theme-colors.ts` for why.
      colors: themeColors(name),
    });
  };
  build('dark');
  build('light');
}
