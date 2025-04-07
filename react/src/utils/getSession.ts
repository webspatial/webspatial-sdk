import type { Spatial, SpatialSession } from '@webspatial/core-sdk'

export interface GetSessionShape {
  getSession: () => SpatialSession | null
  spatial: Spatial | null
}

const implementation: GetSessionShape = __WEB__
  ? require('./getSession.web')
  : require('./getSession.avp')

export const getSession = implementation.getSession
export const spatial = implementation.spatial
