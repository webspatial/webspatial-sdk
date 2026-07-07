import type React from 'react'
import {
  dropdownMenuFloatingGeometry,
  dropdownMenuOverflowTestStyle,
  dropdownMenuPanelStyle,
} from './menuLayout'

export const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px',
  color: '#e5e7eb',
  background: '#0f172a',
}

export const sectionStyle: React.CSSProperties = {
  marginTop: '24px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  alignItems: 'start',
}

export const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '8px',
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.74)',
}

export const spatialPanelStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: '220px',
  '--xr-back': 120,
  '--xr-depth': 80,
  '--xr-background-material': 'thin',
}

export const floatingMenuStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
  '--xr-back': dropdownMenuFloatingGeometry.back,
  '--xr-depth': dropdownMenuFloatingGeometry.depth,
  '--xr-background-material': dropdownMenuFloatingGeometry.backgroundMaterial,
}

export const scenario3FloatingMenuStyle: React.CSSProperties = {
  ...dropdownMenuOverflowTestStyle,
  '--xr-back': dropdownMenuFloatingGeometry.back,
  '--xr-depth': dropdownMenuFloatingGeometry.depth,
  '--xr-background-material': dropdownMenuFloatingGeometry.backgroundMaterial,
}

/** Short parent panel — only the trigger lives inside; menu overflows below. */
export const scenario3ParentStyle: React.CSSProperties = {
  ...spatialPanelStyle,
  height: '96px',
  minHeight: '96px',
  maxHeight: '96px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: '2px dashed rgba(56, 189, 248, 0.55)',
  outlineOffset: '-2px',
}

export const scenarioHeadingStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '16px',
}

export const scenarioDescriptionStyle: React.CSSProperties = {
  margin: '0 0 16px',
  color: '#94a3b8',
  fontSize: '13px',
}

export const latestLogStyle: React.CSSProperties = {
  marginTop: '12px',
  color: '#cbd5e1',
  fontSize: '12px',
}

export const logPanelStyle: React.CSSProperties = {
  marginTop: '24px',
  minHeight: '88px',
  padding: '14px',
  borderRadius: '8px',
  background: '#020617',
  color: '#e2e8f0',
  whiteSpace: 'pre-wrap',
  fontSize: '12px',
}
