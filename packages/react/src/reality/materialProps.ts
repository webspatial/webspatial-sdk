import type { ReactNode } from 'react'
import type {
  SpatialPBRMaterialOptions,
  SpatialUnlitMaterialOptions,
} from '@webspatial/core-sdk'

export type UnlitMaterialProps = {
  children?: ReactNode
  id: string
} & SpatialUnlitMaterialOptions

export type PBRMaterialProps = {
  children?: ReactNode
  id: string
} & SpatialPBRMaterialOptions

export type MaterialProps =
  | ({ type: 'unlit' } & UnlitMaterialProps)
  | ({ type: 'pbr' } & PBRMaterialProps)
