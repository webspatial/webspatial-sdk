import type React from 'react'

export const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px',
  color: '#e5e7eb',
  background: '#0f172a',
}

export const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '8px',
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.74)',
}

export const floatingParentStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: '260px',
  outline: '2px dashed rgba(248, 113, 113, 0.55)',
  outlineOffset: '-2px',
  '--xr-back': 120,
  '--xr-depth': 80,
  '--xr-background-material': 'thin',
}

export const headingStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '16px',
}

export const descriptionStyle: React.CSSProperties = {
  margin: '0 0 16px',
  color: '#94a3b8',
  fontSize: '13px',
}

export const noteStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 12px',
  border: '1px dashed rgba(148, 163, 184, 0.36)',
  borderRadius: '12px',
  color: '#cbd5e1',
  fontSize: '12px',
  lineHeight: 1.6,
}

export const triggerStyle: React.CSSProperties = {
  display: 'inline-flex',
  minWidth: '180px',
  height: '44px',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

export const dialogTextStyle: React.CSSProperties = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: 1.6,
}

export const floatingMaskStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.18)',
  '--xr-background-material': 'thin',
  '--xr-back': '24px',
}
