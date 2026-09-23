# Firsthand Playground

Write [Firsthand](https://github.com/FirsthandJS/firsthand) in the browser: a
file on the left, the page it makes on the right.

**→ [firsthandjs.github.io/firsthandjs-playground](https://firsthandjs.github.io/firsthandjs-playground/)**

Nothing to install, and nothing is sent anywhere — your files live in your
browser's `localStorage` and the compiler runs in the page.

## What it is

- **A real compiler, not a simulation.** `@firsthandjs/compiler/plugin` — the
  same Babel plugin `vite build` uses — registered with `@babel/standalone` and
  run on every keystroke. What you see is what a build of your code would do.
- **Every Firsthand package, already installed.** `@firsthandjs/dom`, `data`,
  `styled`, `router`, `i18n`, `deep` and `core` are served to the preview
  through an import map, built from this project's own `node_modules`. So
  `import { signal } from '@firsthandjs/dom'` simply works.
- **A file is a project.** Each tab is compiled and run on its own; there are
  no imports between them, which is why there is no bundler here.
- **Written in Firsthand.** The playground is the same kind of thing as the
  sketch in the editor — a component tree, signals, and a compiler that turns
  markup into templates.

## The convention

Export a component as the default, and the preview mounts it:

```tsx
import { component, signal } from '@firsthandjs/dom';

export default component(() => {
  const count = signal(0);
  return <button onClick={() => count.value++}>{String(count.value)}</button>;
});
```

Or call `render()` yourself, if you would rather own the mount.

## Running it locally

```sh
npm install
npm run dev
```

`predev` builds two things first: the runtime bundles the preview imports
(`scripts/build-runtime.mjs`) and the `.d.ts` files the editor offers as
completions (`scripts/collect-types.mjs`). Both come from `node_modules`, so
the playground is always exactly as current as its own dependencies.

```sh
npm run build   # static site into dist/
npm test        # the file store and the compiler bridge
npm run check   # types
```

## How the preview works

The preview is an iframe with an import map. Compiled code is posted in as a
blob module, the previous render is disposed, and the DOM is replaced — the
framework is loaded once, not per keystroke.

It is sandboxed with `allow-same-origin`, which is deliberate and worth stating
plainly: module scripts are fetched with CORS, and an opaque origin cannot
fetch the runtime from the very site serving it. What runs in the frame is your
own code, in your own tab.

## Licence

MIT.
