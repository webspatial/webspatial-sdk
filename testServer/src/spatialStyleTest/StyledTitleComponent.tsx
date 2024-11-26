import { useState } from 'react'
import styled from 'styled-components'

export const StyledTitle = styled.h1<{ $primary?: boolean }>`
  font-size: 1.5em;
  text-align: center;
  position: absolute;
  bottom: ${props => (props.$primary ? '-120px' : '-150px')};
  color: ${props => (props.$primary ? 'blue' : 'red')};
  --xr-back: ${props => (props.$primary ? 6 : 12)};
  background: #fff;
`

export const StyledTitle2 = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: #bf4f74;
  back: 123;
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
    <div className="flex flex-col relative">
      <div onClick={onToggleHelloworld}> toggle helloworld </div>
      {showText && <div> helloworld </div>}

      <StyledTitle enable-xr onClick={onClick} $primary={isPrimary}>
        {' '}
        this is style component{' '}
      </StyledTitle>
    </div>
  )
}
