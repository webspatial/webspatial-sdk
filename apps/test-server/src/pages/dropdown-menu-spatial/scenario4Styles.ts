import type React from 'react'
import {
  dropdownMenuElevatedGeometry,
  dropdownMenuPanelStyle,
} from './menuLayout'
import { panelStyle } from './pageStyles'

/** Flat page panel — no outer enable-xr (plugin host lives on ordinary DOM). */
export const scenario4HostStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: '280px',
}

export const scenario4InnerSurfaceStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
  border: '2px solid rgba(34, 197, 94, 0.45)',
  background: '#ffffff',
  '--xr-back': dropdownMenuElevatedGeometry.back,
  '--xr-depth': dropdownMenuElevatedGeometry.depth,
  '--xr-background-material': dropdownMenuElevatedGeometry.backgroundMaterial,
}

export const scenario4TriggerStyle: React.CSSProperties = {
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

export const scenario4NoteStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 12px',
  border: '1px dashed rgba(148, 163, 184, 0.36)',
  borderRadius: '12px',
  color: '#cbd5e1',
  fontSize: '12px',
  lineHeight: 1.6,
}

export const scenario4SurfaceBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '8px',
  padding: '4px 10px',
  borderRadius: '999px',
  background: 'rgba(34, 197, 94, 0.12)',
  color: '#86efac',
  fontSize: '12px',
}

export const scenario4ShadowContentStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
  position: 'absolute',
  width: 0,
  minWidth: 0,
  height: 0,
  padding: 0,
  opacity: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
}
