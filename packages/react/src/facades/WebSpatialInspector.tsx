'use client'

import type { ComponentType } from 'react'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { WebSpatialRuntime } from '../webSpatialRuntime'
import { warnBootForgotten } from './shared/warnBootForgotten'
import type { WebSpatialInspectorProps } from '../inspector'

export type { WebSpatialInspectorProps }

export function WebSpatialInspector(
  props: WebSpatialInspectorProps,
): React.ReactElement | null {
  const ready = useSpatialReady()

  if (!WebSpatialRuntime.supports('Ornament')) {
    return null
  }

  if (!ready) {
    warnBootForgotten('WebSpatialInspector')
    return null
  }

  const RealWebSpatialInspector = requireSpatialImpl()
    .WebSpatialInspector as ComponentType<WebSpatialInspectorProps>
  return <RealWebSpatialInspector {...props} />
}

WebSpatialInspector.displayName = 'WebSpatialInspector'
