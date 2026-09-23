import { styled } from '@firsthandjs/styled';
import type { Mode } from '../state/theme';

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

export const Status = styled.div`
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

export const Problem = styled.div`
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

export const Empty = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: ${(props) => props.theme.dim};
  font-size: 12.5px;
  letter-spacing: 0.06em;
  pointer-events: none;
`;
