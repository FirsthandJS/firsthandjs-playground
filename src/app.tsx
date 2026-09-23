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
import { Chrome } from './ui/chrome';
import { Tabs } from './ui/tabs';
import { createFiles, type Files } from './state/files';
import { PALETTE, mode } from './state/theme';
import { AVAILABLE } from './preview/runtime-map';
import { Frame, GlobalStyle, Pane, PaneHead, PaneTitle, Panes, Spacer } from './ui/theme.styled';

/** The left pane: the tab bar, and the file it has open. */
const Source = component<{ readonly files: Files }>((props) => (
  <Pane>
    <PaneHead>
      <Tabs files={props.files} />
    </PaneHead>
    <Editor
      file={props.files.open()}
      onEdit={(source: string) => {
        props.files.edit(props.files.openId.value, source);
      }}
    />
  </Pane>
));

/** The right pane: the page that file makes, and what is available to it. */
const Running = component<{ readonly files: Files }>((props) => (
  <Pane>
    <PaneHead>
      <PaneTitle>preview</PaneTitle>
      <Spacer />
      <PaneTitle title={AVAILABLE.join('  ')}>{String(AVAILABLE.length)} packages ready</PaneTitle>
    </PaneHead>
    <Preview source={props.files.open().source} name={props.files.open().name} />
  </Pane>
));

export const App = component(() => {
  const theme = signal(PALETTE[mode.value]);
  provide(ThemeContext, theme);

  const files = createFiles();

  return () => (
    <Frame>
      <GlobalStyle />
      <Chrome
        onToggle={() => {
          // The one place where the mode becomes the palette everything else
          // reads. The signal is what the styled components are subscribed to.
          theme.value = PALETTE[mode.value];
        }}
      />
      <Panes>
        <Source files={files} />
        <Running files={files} />
      </Panes>
    </Frame>
  );
});
