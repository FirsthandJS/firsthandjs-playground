/**
 * The look: one palette, two modes, and the surfaces built from them.
 *
 * Futuristic here means restraint — one accent, a lot of dark glass, hairline
 * borders and type that is not shouting. Nothing animates that does not have
 * to, because a tool that moves while you are reading it is a toy.
 */
import { styled, createGlobalStyle } from '@firsthandjs/styled';

export const GlobalStyle = createGlobalStyle`
  :root { color-scheme: ${(props) => (props.theme.name === 'dark' ? 'dark' : 'light')}; }

  * { box-sizing: border-box; }

  html, body, #root { height: 100%; }

  body {
    margin: 0;
    background: ${(props) => props.theme.bg};
    background-image: ${(props) => props.theme.glow};
    color: ${(props) => props.theme.ink};
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::selection { background: ${(props) => props.theme.accentSoft}; }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.panelEdge};
    border-radius: 999px;
  }
`;

export const Frame = styled.div`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
`;

export const Panes = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1px;
  min-height: 0;
  padding: 0 1rem 1rem;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }
`;

export const Pane = styled.section`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: ${(props) => props.theme.panel};
  border: 1px solid ${(props) => props.theme.panelEdge};
  border-radius: 14px;
  overflow: hidden;
`;

export const PaneHead = styled.header`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 42px;
  padding: 0 0.5rem 0 0.75rem;
  border-bottom: 1px solid ${(props) => props.theme.panelEdge};
  background: linear-gradient(${(props) => props.theme.panel}, transparent);
`;

export const PaneTitle = styled.span`
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${(props) => props.theme.dim};
`;

export const Spacer = styled.span`
  flex: 1;
`;
