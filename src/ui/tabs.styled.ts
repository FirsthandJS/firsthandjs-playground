import { styled } from '@firsthandjs/styled';

export const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Tab = styled.button<{ $open?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex: 0 0 auto;
  max-width: 14rem;
  padding: 0.38rem 0.5rem 0.38rem 0.7rem;
  border: 1px solid ${(props) => (props.$open === true ? props.theme.panelEdge : 'transparent')};
  border-radius: 9px;
  background: ${(props) => (props.$open === true ? props.theme.accentSoft : 'transparent')};
  color: ${(props) => (props.$open === true ? props.theme.ink : props.theme.dim)};
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: ${(props) => props.theme.ink};
  }
`;

export const TabName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Close = styled.span`
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 5px;
  color: ${(props) => props.theme.dim};
  font-size: 13px;
  line-height: 1;

  &:hover {
    background: ${(props) => props.theme.danger};
    color: ${(props) => props.theme.panel};
  }
`;

export const Add = styled.button`
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border: 1px dashed ${(props) => props.theme.panelEdge};
  border-radius: 8px;
  background: transparent;
  color: ${(props) => props.theme.dim};
  font: inherit;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.accent};
    color: ${(props) => props.theme.accent};
  }
`;

export const Naming = styled.input`
  flex: 0 0 auto;
  width: 11rem;
  padding: 0.38rem 0.6rem;
  border: 1px solid ${(props) => props.theme.accent};
  border-radius: 9px;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.ink};
  font: inherit;
  font-size: 12.5px;
  outline: none;
`;
