import React from 'react'
import { UnlitMaterial } from './UnlitMaterial'

type UnlitProps = React.ComponentProps<typeof UnlitMaterial>

export type MaterialProps = { type: 'unlit' } & UnlitProps

export const Material: React.FC<MaterialProps> = props => {
  if (props.type === 'unlit') {
    const { type, ...rest } = props
    return <UnlitMaterial {...rest} />
  }
  return null
}
