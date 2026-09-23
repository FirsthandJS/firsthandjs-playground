/**
 * What a visitor sees before they have written anything.
 *
 * The sketch itself lives in `weather.demo.tsx` and is read as text rather
 * than kept in a string here: a real file, with highlighting, formatting and
 * a diff when it changes. It is excluded from `tsconfig.json`, because it is
 * compiled by the playground rather than by the build — which is the whole
 * point of it.
 *
 * Short enough to read in one go, and it uses the four things that make this
 * framework what it is: a setup that runs once, signals the markup reads
 * directly, a component that is a function rather than a re-render, and
 * styling that is CSS with props reaching into it.
 */
import source from './weather.demo.tsx?raw';

export const WEATHER = source;
