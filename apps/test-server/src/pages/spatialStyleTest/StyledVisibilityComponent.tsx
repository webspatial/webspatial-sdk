import { useState } from 'react'
import styled from 'styled-components'
import React from 'react'

const Panel = styled.div`
  margin: 12px 0;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(18, 20, 30, 0.72);
  color: #f8fafc;
`

const Title = styled.div`
  margin-bottom: 8px;
  font-weight: 600;
`

const Host = styled.div<{ $hidden?: boolean; $dimmed?: boolean }>`
  visibility: ${props => (props.$hidden ? 'hidden' : 'visible')};
  opacity: ${props => (props.$dimmed ? 0.3 : 1)};
  position: relative;
  margin: 8px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  background: #f8fafc;
  transform: ${props => (props.$hidden ? 'rotate(45deg)' : 'none')};
  --xr-back: ${props => (props.$hidden ? '24' : '100')};
`

const ToggleButton = styled.button`
  margin: 8px 8px 8px 0;
  padding: 7px 14px;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #e2e8f0;
  background: #1e293b;
  cursor: pointer;

  &:hover {
    background: #334155;
  }
`

export function StyledVisibilityComponent() {
  const [hidden, setHidden] = useState(false)
  const [dimmed, setDimmed] = useState(false)
  return (
    <Panel>
      <Title>Styled-components visibility on host</Title>
      <ToggleButton onClick={() => setHidden(v => !v)}>
        {hidden ? 'Show' : 'Hide'}
      </ToggleButton>
      <ToggleButton onClick={() => setDimmed(v => !v)}>
        {dimmed ? 'Opacity 1' : 'Opacity 0.3'}
      </ToggleButton>
      <Host enable-xr $hidden={hidden} $dimmed={dimmed}>
        <div>Portaled content should follow host visibility via class</div>
      </Host>
    </Panel>
  )
}
