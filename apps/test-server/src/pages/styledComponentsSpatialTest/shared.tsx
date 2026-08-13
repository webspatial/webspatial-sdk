import styled from 'styled-components'

export const PageSection = styled.section`
  margin-bottom: 28px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(18, 20, 30, 0.72);
  color: #f8fafc;
`

export const SectionHeading = styled.h2`
  margin: 0 0 8px;
  font-size: 1.125rem;
  font-weight: 600;
`

export const SectionNote = styled.p`
  margin: 0 0 12px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #94a3b8;
`

export const ToggleButton = styled.button`
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

export const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin: 8px 0 12px;
`

export const OpacityLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;
  color: #cbd5e1;
  cursor: pointer;
`

export const OpacityRange = styled.input.attrs({ type: 'range' })`
  width: 160px;
  accent-color: #38bdf8;
  cursor: pointer;
`

export const OpacityValue = styled.span`
  min-width: 2.5rem;
  font-variant-numeric: tabular-nums;
  color: #f8fafc;
`

export const CompareLabel = styled.span`
  display: block;
  margin: 12px 8px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #38bdf8;
`

/** Opacity via transient prop — styled-components emits new rules/classes as opacity changes. */
export const StyledSpatialBox = styled.div<{
  $hidden?: boolean
  $opacity: number
}>`
  visibility: ${props => (props.$hidden ? 'hidden' : 'visible')};
  opacity: ${props => props.$opacity};
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

/**
 * Opacity via CSS variable — stable styled class; only inline --spatial-opacity updates.
 * Use for A/B against StyledSpatialBox when testing portal head-sync flicker.
 */
export const StyledSpatialBoxCssVar = styled.div<{
  $hidden?: boolean
}>`
  visibility: ${props => (props.$hidden ? 'hidden' : 'visible')};
  opacity: var(--spatial-opacity, 1);
  position: relative;
  margin: 8px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #a7f3d0;
  color: #0f172a;
  background: #ecfdf5;
  transform: ${props => (props.$hidden ? 'rotate(45deg)' : 'none')};
  --xr-back: ${props => (props.$hidden ? '24' : '100')};
`

export const PlainSpatialShell = styled.div`
  position: relative;
  margin: 8px;
  padding: 4px;
  border-radius: 10px;
  border: 1px dashed #64748b;
  min-width: 280px;
  min-height: 88px;
`
