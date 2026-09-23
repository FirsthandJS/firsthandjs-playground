/**
 * The document the preview runs in.
 *
 * An iframe, with an import map, so that a file in the editor can say
 * `import { signal } from '@firsthandjs/dom'` and mean it. Everything the
 * import map points at was built from this playground's own `node_modules`
 * (`scripts/build-runtime.mjs`), so the version a visitor writes against is
 * the version the page says it is.
 *
 * The iframe is its own document deliberately. Styles a sketch writes cannot
 * reach the playground's own chrome, a layout cannot push it around, and a
 * script that throws takes down the preview rather than the page.
 *
 * It is sandboxed but `allow-same-origin`, which is not the belt-and-braces
 * answer and is the honest one: module scripts are fetched with CORS, and an
 * opaque origin cannot fetch the runtime above from the very site serving it.
 * The alternative is CORS headers on a static host we do not control. What is
 * running in there is the visitor's own code, in their own tab, so the thing
 * the sandbox would protect them from is themselves.
 */
import { RUNTIME_MAP } from './runtime-map';

/** The mount convention, and the one thing a visitor has to know. */
export const CONVENTION = 'export default a component, or call render() yourself';

/**
 * The module that runs inside the preview.
 *
 * Kept out of the document below so that each is one thing: this is the
 * protocol — a theme message, a run message, and what it answers with — and
 * `harness` is the page it is served in.
 */
const BOOTSTRAP = `
      import { render, createComponent } from '@firsthandjs/dom';

      const root = document.getElementById('root');
      let stop = null;
      let current = null;
      /** Which run is in progress, so a late report cannot land on a later one. */
      let run = 0;
      /** Whether this run has already said something went wrong. */
      let broke = false;

      /** A newline, spelled without an escape: this whole script is inside a template literal. */
      const NL = String.fromCharCode(10);

      /**
       * What to put on the strip for one thrown thing.
       *
       * The message alone answers "what" and never "where", and in a playground
       * where is most of the question: the sketch is thirty lines and the line
       * number is the answer. A V8 stack already begins with the name and the
       * message, so where there is one it is used whole, cut to the frames that
       * belong to the sketch rather than to the framework underneath it.
       */
      const describe = (error) => {
        if (!(error instanceof Error)) {
          return String(error);
        }
        const stack = typeof error.stack === 'string' ? error.stack : '';
        const whole = stack.includes(error.message)
          ? stack
          : error.name + ': ' + error.message;
        return whole.split(NL).slice(0, 6).join(NL);
      };

      const fail = (error) => {
        broke = true;
        parent.postMessage({ kind: 'firsthand:error', message: describe(error), run }, '*');
      };

      addEventListener('error', (event) => { fail(event.error ?? event.message); });
      addEventListener('unhandledrejection', (event) => { fail(event.reason); });

      /**
       * An error the sketch reports itself.
       *
       * A \`catch\` that logs is the ordinary way code says something went wrong,
       * and in an iframe the console it reaches is one nobody has open. It still
       * reaches the real console — this adds the strip, it does not replace it.
       */
      const logged = console.error.bind(console);
      console.error = (...parts) => {
        logged(...parts);
        broke = true;
        parent.postMessage(
          {
            kind: 'firsthand:error',
            message: parts.map((part) => (part instanceof Error ? describe(part) : String(part))).join(' '),
            run,
          },
          '*',
        );
      };

      addEventListener('message', async (event) => {
        const data = event.data;
        if (data === null || typeof data !== 'object') {
          return;
        }
        // The playground's own light/dark, handed in so a sketch can follow
        // it: \`document.documentElement.dataset.theme\`, and \`color-scheme\`
        // so that form controls and scrollbars follow without being asked.
        if (data.kind === 'firsthand:theme') {
          document.documentElement.dataset.theme = data.mode;
          document.documentElement.style.colorScheme = data.mode;
          return;
        }
        if (data.kind !== 'firsthand:run') {
          return;
        }
        run += 1;
        broke = false;
        if (stop !== null) {
          stop();
          stop = null;
        }
        root.replaceChildren();
        if (current !== null) {
          URL.revokeObjectURL(current);
        }
        current = URL.createObjectURL(new Blob([data.code], { type: 'text/javascript' }));
        try {
          const module = await import(current);
          const view = module.default;
          if (typeof view === 'function') {
            // A component is a function the compiler marked; calling it as one
            // is what \`<App />\` compiles to, so this is that, by hand.
            stop = render(() => createComponent(view, {}), root);
          }
          // Only when nothing has been reported for this run. A \`console.error\`
          // during the first render is posted before this line is reached, and
          // an unconditional "it ran" would clear it half a frame later.
          if (!broke) {
            parent.postMessage({ kind: 'firsthand:ran', run }, '*');
          }
        } catch (error) {
          fail(error);
        }
      });

      parent.postMessage({ kind: 'firsthand:ready' }, '*');
`;

export function harness(): string {
  const imports = JSON.stringify({ imports: RUNTIME_MAP }, null, 2);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script type="importmap">${imports}</script>
    <style>
      html, body { margin: 0; min-height: 100%; }
      body { font: 16px/1.5 ui-sans-serif, system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${BOOTSTRAP}</script>
  </body>
</html>`;
}
