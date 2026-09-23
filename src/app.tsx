/**
 * The playground: a file on the left, the page it makes on the right.
 *
 * Written in Firsthand, compiled by Firsthand, previewing Firsthand. The
 * application you are reading is the same kind of thing as the sketch in the
 * editor, which is the point of building it this way rather than in something
 * else.
 */
import { component, provide, signal } from '@firsthandjs/dom';
import { ThemeContext } from '@firsthandjs/styled';
import { Editor } from './editor/editor';
import { Preview } from './preview/preview';
import { Tabs } from './ui/tabs';
import { createFiles } from './state/files';
import { PALETTE, mode, toggle } from './state/theme';
import { AVAILABLE } from './preview/runtime-map';
import { Frame, GlobalStyle, Pane, PaneHead, PaneTitle, Panes, Spacer } from './ui/theme.styled';
import { Actions, Dot, Link, Mark, Sub, Switch, Top } from './ui/chrome.styled';

export const App = component(() => {
  const theme = signal(PALETTE[mode.value]);
  provide(ThemeContext, theme);

  // One place where the mode becomes the palette everything else reads.
  const follow = (): void => {
    theme.value = PALETTE[mode.value];
  };

  const files = createFiles();

  return () => (
    <Frame>
      <GlobalStyle />
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
            onClick={() => {
              toggle();
              follow();
            }}
          >
            {mode.value === 'dark' ? '☾' : '☀'}
          </Switch>
        </Actions>
      </Top>

      <Panes>
        <Pane>
          <PaneHead>
            <Tabs files={files} />
          </PaneHead>
          <Editor
            file={files.open()}
            onEdit={(source: string) => {
              files.edit(files.openId.value, source);
            }}
          />
        </Pane>

        <Pane>
          <PaneHead>
            <PaneTitle>preview</PaneTitle>
            <Spacer />
            <PaneTitle title={AVAILABLE.join('  ')}>
              {String(AVAILABLE.length)} packages ready
            </PaneTitle>
          </PaneHead>
          <Preview source={files.open().source} name={files.open().name} />
        </Pane>
      </Panes>
    </Frame>
  );
});
