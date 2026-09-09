import React from 'react'
import type { MaterialProps } from '../materialProps'
import { UnlitMaterial } from './UnlitMaterial'
import { PBRMaterial } from './PBRMaterial'

export type { MaterialProps } from '../materialProps'

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
