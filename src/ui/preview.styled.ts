import { styled } from '@firsthandjs/styled';
import type { Mode } from '../state/theme';

/**
 * Shown or not, as a declaration rather than as a branch.
 *
 * The strip's three pieces are each either there or not, which reads as
 * `{ready ? … : …}` and was written that way. A conditional whose branches are
 * components is the one shape the framework does not yet take down properly —
 * the branch that loses keeps its nodes — so the error box emptied instead of
 * closing and "warming up" stayed over a running preview. Fixed in the
 * compiler; not in the published version this page is built against.
 *
 * Nothing is lost by saying it in CSS. All three are absolutely positioned and
 * cost nothing while hidden, and the strip stops remounting a pill on every
 * keystroke.
 */
type Shown = { $show: boolean };

export const Shell = styled.div`
  position: relative;
  min-height: 0;
  height: 100%;
`;

export const Frame = styled.iframe<{ $mode: Mode }>`
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: ${(props) => (props.$mode === 'dark' ? '#0b0f1a' : '#ffffff')};
`;

export const Status = styled.div<Shown>`
  display: ${(props) => (props.$show ? 'block' : 'none')};
  position: absolute;
  right: 10px;
  bottom: 8px;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${(props) => props.theme.accentSoft};
  color: ${(props) => props.theme.accent};
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  pointer-events: none;
`;

export const Problem = styled.div<Shown>`
  display: ${(props) => (props.$show ? 'block' : 'none')};
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  max-height: 45%;
  overflow: auto;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${(props) => props.theme.danger};
  border-radius: 10px;
  background: ${(props) => props.theme.panel};
  color: ${(props) => props.theme.danger};
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  white-space: pre-wrap;
`;

export const Empty = styled.div<Shown>`
  position: absolute;
  inset: 0;
  display: ${(props) => (props.$show ? 'grid' : 'none')};
  place-items: center;
  color: ${(props) => props.theme.dim};
  font-size: 12.5px;
  letter-spacing: 0.06em;
  pointer-events: none;
`;
