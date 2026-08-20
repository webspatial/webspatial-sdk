'use client'

import type { ComponentType } from 'react'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { WebSpatialRuntime } from '../webSpatialRuntime'
import { warnBootForgotten } from './shared/warnBootForgotten'
import type { OrnamentProps } from '../ornament'

export type { OrnamentProps }

export function Ornament(props: OrnamentProps): React.ReactElement | null {
  const ready = useSpatialReady()

  if (!WebSpatialRuntime.supports('Ornament')) {
    return null
  }

  if (!ready) {
    warnBootForgotten('Ornament')
    return null
  }

  const RealOrnament = requireSpatialImpl()
    .Ornament as ComponentType<OrnamentProps>
  return <RealOrnament {...props} />
}

Ornament.displayName = 'Ornament'
