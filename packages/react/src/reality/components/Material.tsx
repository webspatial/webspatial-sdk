import React from 'react'
import { UnlitMaterial, UnlitMaterialProps } from './UnlitMaterial'

export type MaterialProps = { type: 'unlit' } & UnlitMaterialProps

export const Material: React.FC<MaterialProps> = props => {
  if (props.type === 'unlit') {
    const { type, ...rest } = props
    return <UnlitMaterial {...rest} />
  }
  return null
}
