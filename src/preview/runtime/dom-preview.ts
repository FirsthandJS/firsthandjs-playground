/**
 * `@firsthandjs/dom`, as a sketch in the preview sees it.
 *
 * Everything is the real package. `render` is not: called without a container
 * it mounts into the preview's own root rather than into `document.body`, and
 * it keeps the disposer where the harness can find it.
 *
 * The convention this page offers is "export a component, or call `render()`
 * yourself", and the second half of that used to leak. A sketch's own
 * `render()` went to `document.body`, which is outside the node the harness
 * clears between runs, and its disposer was nobody's — so every edit left the
 * previous version on the page and added the new one underneath it. Three
 * edits, three copies, and no way to get rid of them but a reload.
 *
 * A container passed by the caller is left alone: that is somebody saying
 * where it goes, including the harness itself, and a disposer recorded twice
 * would be called twice.
 */
export * from '@firsthandjs/dom';

import { render as mount, type Dispose, type View } from '@firsthandjs/dom';

declare global {
  /** Set by the harness, one array per run. See `bucket` below. */
  var __firsthandPreviewOwn: Dispose[] | undefined;
}

/**
 * Where a sketch's own mounts are recorded.
 *
 * Read at call time, never captured: the harness swaps in a fresh array for
 * every run, so that what one run mounted can be released without touching
 * what another did. A sketch that renders itself does so while its module is
 * being evaluated — inside the harness's `import` — so the two really do
 * overlap, and a single shared list could not tell them apart.
 */
function bucket(): Dispose[] | undefined {
  return globalThis.__firsthandPreviewOwn;
}

/** The preview's root, or the body if the page has somehow lost it. */
function host(): ParentNode {
  return document.getElementById('root') ?? document.body;
}

export function render(view: () => View, container?: ParentNode | null): Dispose {
  if (container !== undefined && container !== null) {
    return mount(view, container);
  }
  const stop = mount(view, host());
  bucket()?.push(stop);
  return stop;
}
