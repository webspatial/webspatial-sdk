import React from 'react'
import type { SpatialMaterialType } from '@webspatial/core-sdk'
import { UnlitMaterial, UnlitMaterialProps } from './UnlitMaterial'
import { PBRMaterial, PBRMaterialProps } from './PBRMaterial'

type MaterialPropsByType = {
  unlit: UnlitMaterialProps
  pbr: PBRMaterialProps
}

export type MaterialProps = {
  [K in SpatialMaterialType]: { type: K } & MaterialPropsByType[K]
}[SpatialMaterialType]

export const Material: React.FC<MaterialProps> = props => {
  switch (props.type) {
    case 'unlit': {
      const { type, ...rest } = props
      return <UnlitMaterial {...rest} />
    }
    case 'pbr': {
      const { type, ...rest } = props
      return <PBRMaterial {...rest} />
    }
  }
}
