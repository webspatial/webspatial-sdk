import { useState } from 'react'
import styled from 'styled-components'

export const StyledTitle = styled.h1<{ $primary?: boolean }>`
  font-size: 1.5em;
  text-align: center;
  position: relative;
  color: ${props => (props.$primary ? 'blue' : 'red')};
  --xr-back: ${props => (props.$primary ? 60 : 120)};
  background: #fff;
`

export const StyledTitleComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }

  const [showText, setShowText] = useState(true)
  const onToggleHelloworld = () => {
    setShowText(v => !v)
  }

  return (
    <div>
      <div onClick={onToggleHelloworld}>toggle helloworld</div>
      {showText && <div>helloworld</div>}

      <StyledTitle enable-xr onClick={onClick} $primary={isPrimary}>
        this is style component
      </StyledTitle>
    </div>
  )
}
