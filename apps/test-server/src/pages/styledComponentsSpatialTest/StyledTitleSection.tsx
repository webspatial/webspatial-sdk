import { useState } from 'react'
import styled from 'styled-components'
import {
  PageSection,
  SectionHeading,
  SectionNote,
  ToggleButton,
} from './shared'

const StyledTitle = styled.h1<{ $primary?: boolean }>`
  font-size: 1.25em;
  text-align: center;
  position: relative;
  margin: 8px;
  padding: 12px;
  color: ${props => (props.$primary ? '#1d4ed8' : '#b91c1c')};
  --xr-back: ${props => (props.$primary ? 60 : 120)};
  background: #fff;
  border-radius: 8px;
`

export function StyledTitleSection() {
  const [isPrimary, setIsPrimary] = useState(true)

  return (
    <PageSection>
      <SectionHeading>3. Styled title host (color + --xr-back)</SectionHeading>
      <SectionNote>
        Tap the title in spatial runtime to toggle primary color and --xr-back
        on the enable-xr styled host.
      </SectionNote>
      <ToggleButton type="button" onClick={() => setIsPrimary(v => !v)}>
        Toggle primary ({isPrimary ? 'on' : 'off'})
      </ToggleButton>
      <StyledTitle
        enable-xr
        data-name="Styled title (enable-xr)"
        $primary={isPrimary}
        onClick={() => setIsPrimary(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsPrimary(v => !v)
          }
        }}
      >
        Styled spatial title — click to toggle
      </StyledTitle>
    </PageSection>
  )
}
