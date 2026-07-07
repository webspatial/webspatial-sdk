'use client'

import React, { CSSProperties } from 'react'

import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'
import type { PortalSurfaceProps } from '../PortalSurface.types'

function normalizeSpatialLength(value: number | string | undefined): string {
  if (value == null) return '100px'
  return typeof value === 'number' ? `${value}px` : value
}

export function PortalSurface({
  children,
  zOffset,
  backgroundMaterial = 'transparent',
}: PortalSurfaceProps) {
  const ready = useSpatialReady()
  if (ready) {
    const Real = requireSpatialImpl().PortalSurface
    return (
      <Real zOffset={zOffset} backgroundMaterial={backgroundMaterial}>
        {children}
      </Real>
    )
  }

  warnBootForgotten('PortalSurface')

  const mergedStyle = {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    background: 'transparent',
    '--xr-back': normalizeSpatialLength(zOffset),
    '--xr-background-material': backgroundMaterial,
  } as CSSProperties

  return (
    <div
      data-webspatial-portal-surface-fallback=""
      className="webspatial-portal-surface"
      style={mergedStyle}
    >
      {children}
    </div>
  )
}

PortalSurface.displayName = 'PortalSurface'

export type { PortalSurfaceProps } from '../PortalSurface.types'
