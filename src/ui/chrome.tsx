/**
 * The bar across the top: what this is, where to read more, and the switch.
 *
 * Its own component because it is the one part of the page that has nothing
 * to do with files — it would be the same playground without it, and the
 * layout below reads better for not having it inline.
 */
import { component } from '@firsthandjs/dom';
import { mode, toggle } from '../state/theme';
import { Actions, Dot, Link, Mark, Sub, Switch, Top } from './chrome.styled';
import { Spacer } from './theme.styled';

export type ChromeProps = {
  /** Called after the mode changes, so the styled theme can follow it. */
  readonly onToggle: () => void;
};

export const Chrome = component<ChromeProps>((props) => (
  <Top>
    <Mark>
      <Dot />
      Firsthand
      <Sub>playground</Sub>
    </Mark>
    <Spacer />
    <Actions>
      <Link href="https://github.com/FirsthandJS/firsthand" target="_blank" rel="noreferrer">
        the framework
      </Link>
      <Link
        href="https://github.com/FirsthandJS/firsthandjs-playground"
        target="_blank"
        rel="noreferrer"
      >
        source
      </Link>
      <Switch
        type="button"
        title={mode.value === 'dark' ? 'switch to light' : 'switch to dark'}
        aria-label="toggle colour scheme"
        aria-pressed={mode.value === 'light' ? 'true' : 'false'}
        onClick={() => {
          toggle();
          props.onToggle();
        }}
      >
        {mode.value === 'dark' ? '☾' : '☀'}
      </Switch>
    </Actions>
  </Top>
));
