import { styled } from '@firsthandjs/styled';

export const Top = styled.header`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1.25rem;
`;

export const Mark = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  font-weight: 620;
  letter-spacing: -0.01em;
`;

export const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${(props) => props.theme.accent};
  box-shadow: 0 0 14px ${(props) => props.theme.accent};
`;

export const Sub = styled.span`
  color: ${(props) => props.theme.dim};
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.02em;
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
`;

export const Link = styled.a`
  padding: 0.4rem 0.75rem;
  border: 1px solid ${(props) => props.theme.panelEdge};
  border-radius: 999px;
  color: ${(props) => props.theme.dim};
  font-size: 12.5px;
  text-decoration: none;

  &:hover {
    border-color: ${(props) => props.theme.accent};
    color: ${(props) => props.theme.accent};
  }
`;

export const Switch = styled.button`
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 30px;
  border: 1px solid ${(props) => props.theme.panelEdge};
  border-radius: 999px;
  background: transparent;
  color: ${(props) => props.theme.dim};
  font-size: 14px;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.accent};
    color: ${(props) => props.theme.accent};
  }
`;
