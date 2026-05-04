import React from 'react'
import { UnlitMaterial, UnlitMaterialProps } from './UnlitMaterial'
import { PBRMaterial, PBRMaterialProps } from './PBRMaterial'

export type MaterialProps =
  | ({ type: 'unlit' } & UnlitMaterialProps)
  | ({ type: 'pbr' } & PBRMaterialProps)

export const Material: React.FC<MaterialProps> = props => {
  if (props.type === 'unlit') {
    const { type, ...rest } = props
    return <UnlitMaterial {...rest} />
  }
  if (props.type === 'pbr') {
    const { type, ...rest } = props
    return <PBRMaterial {...rest} />
  }
  return null
}
