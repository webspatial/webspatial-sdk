import { useState } from 'react'
import styled from 'styled-components'
import React from 'react'

const Host = styled.div<{ $hidden?: boolean }>`
  visibility: ${props => (props.$hidden ? 'hidden' : 'visible')};
  --xr-portal-visibility: ${props => (props.$hidden ? 'hidden' : 'visible')};
  position: relative;
  margin: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #eef;
  --xr-back: 24;
`

const ToggleButton = styled.button`
  margin: 8px 0;
  padding: 6px 12px;
  border: 1px solid #999;
  border-radius: 6px;
  background: #fff;
`

export function StyledVisibilityComponent() {
  const [hidden, setHidden] = useState(true)
  return (
    <div>
      <div>Styled-components visibility on host</div>
      <ToggleButton onClick={() => setHidden(v => !v)}>
        {hidden ? 'Show' : 'Hide'}
      </ToggleButton>
      <Host enable-xr $hidden={hidden}>
        <div>Portaled content should follow host visibility via class</div>
      </Host>
    </div>
  )
}
