import { useState, type CSSProperties } from 'react'
import {
  CompareLabel,
  ControlRow,
  OpacityLabel,
  OpacityRange,
  OpacityValue,
  PageSection,
  PlainSpatialShell,
  SectionHeading,
  SectionNote,
  StyledSpatialBox,
  StyledSpatialBoxCssVar,
  ToggleButton,
} from './shared'

export function StyledSpatialChildSection() {
  const [hidden, setHidden] = useState(false)
  const [opacity, setOpacity] = useState(1)

  return (
    <PageSection>
      <SectionHeading>
        2. Styled child inside plain enable-xr shell
      </SectionHeading>
      <SectionNote>
        Expected: visual changes mostly as CSS inside the portal webview only.
        Same A/B opacity comparison as section 1 (SC prop vs CSS variable).
        Green border = B. Compare with section 1 on device.
      </SectionNote>
      <ControlRow>
        <ToggleButton type="button" onClick={() => setHidden(v => !v)}>
          {hidden ? 'Show' : 'Hide'}
        </ToggleButton>
        <OpacityLabel>
          Opacity
          <OpacityRange
            min={0}
            max={100}
            step={1}
            value={Math.round(opacity * 100)}
            onChange={e => setOpacity(Number(e.target.value) / 100)}
          />
          <OpacityValue>{opacity.toFixed(2)}</OpacityValue>
        </OpacityLabel>
      </ControlRow>
      <PlainSpatialShell
        enable-xr
        data-name="Plain shell (enable-xr)"
        style={{ '--xr-back': 100 } as CSSProperties}
      >
        <CompareLabel>A — SC prop ($opacity)</CompareLabel>
        <StyledSpatialBox $hidden={hidden} $opacity={opacity}>
          Child A — opacity from styled prop
        </StyledSpatialBox>
        <CompareLabel>B — CSS variable (--spatial-opacity)</CompareLabel>
        <StyledSpatialBoxCssVar
          $hidden={hidden}
          style={{ '--spatial-opacity': opacity } as CSSProperties}
        >
          Child B — opacity from CSS variable
        </StyledSpatialBoxCssVar>
      </PlainSpatialShell>
    </PageSection>
  )
}
