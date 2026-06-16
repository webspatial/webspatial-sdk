import type React from 'react'

export const dropdownMenuFloatingGeometry = {
  back: 10,
  depth: 0,
  backgroundMaterial: 'transparent',
} as const

/** Opaque elevated preset for clearer menu panels in the demo UI. */
export const dropdownMenuElevatedGeometry = {
  back: 80,
  depth: 28,
  backgroundMaterial: 'regular',
} as const

/** Shared panel chrome for all dropdown scenarios. */
export const dropdownMenuPanelStyle: React.CSSProperties = {
  width: '240px',
  minWidth: '240px',
  maxWidth: '240px',
  // maxHeight: 'min(360px, 70vh)',
  overflowX: 'hidden',
  overflowY: 'auto',
  padding: '6px',
  boxSizing: 'border-box',
  color: '#111827',
  background: '#ffffff',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: '10px',
  boxShadow:
    '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 16px 40px -8px rgba(15, 23, 42, 0.28)',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '20px',
  zIndex: 9999,
}

/** Scenario 3 overflow smoke — same chrome, no max-height cap on the style object (items define height). */
export const dropdownMenuOverflowTestStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
  maxHeight: 'none',
}

export const dropdownMenuContentStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
}

export const dropdownMenuLabelStyle: React.CSSProperties = {
  display: 'flex',
  height: '32px',
  alignItems: 'center',
  padding: '4px 10px 2px',
  boxSizing: 'border-box',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  lineHeight: '16px',
  textTransform: 'uppercase',
  userSelect: 'none',
}

export const dropdownMenuSeparatorStyle: React.CSSProperties = {
  height: '1px',
  margin: '4px 6px',
  background: '#e2e8f0',
}

export const dropdownMenuItemStyle: React.CSSProperties = {
  display: 'flex',
  height: '36px',
  minHeight: '36px',
  alignItems: 'center',
  padding: '0 10px',
  boxSizing: 'border-box',
  borderRadius: '6px',
  color: '#0f172a',
  fontSize: '14px',
  lineHeight: '18px',
  outline: 'none',
  cursor: 'pointer',
  userSelect: 'none',
}

export function getDropdownMenuItemStyle(
  disabled?: boolean,
): React.CSSProperties {
  return {
    ...dropdownMenuItemStyle,
    color: disabled ? '#94a3b8' : dropdownMenuItemStyle.color,
    cursor: disabled ? 'not-allowed' : dropdownMenuItemStyle.cursor,
  }
}
