'use client'

import type { ComponentType } from 'react'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { WebSpatialRuntime } from '../webSpatialRuntime'
import { BootForgottenDiagnostic } from './shared/BootForgottenDiagnostic'
import type { OrnamentProps } from '../ornament'

export type {
  OrnamentPoint3D,
  OrnamentProps,
  OrnamentVisibility,
} from '../ornament'

export function Ornament(props: OrnamentProps): React.ReactElement | null {
  const ready = useSpatialReady()

  if (!WebSpatialRuntime.supports('Ornament')) {
    return null
  }

  if (!ready) {
    return <BootForgottenDiagnostic componentName="Ornament" />
  }

  const RealOrnament = requireSpatialImpl()
    .Ornament as ComponentType<OrnamentProps>
  return <RealOrnament {...props} />
}

Ornament.displayName = 'Ornament'
