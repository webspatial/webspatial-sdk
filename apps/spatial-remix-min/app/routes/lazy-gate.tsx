import { LazySpatialGateDemo } from '../components/LazySpatialGateDemo'

import type { Route } from './+types/lazy-gate'

export function meta({}: Route.MetaArgs) {
  return [
    { title: '/lazy-gate — SpatialBoot gate' },
    {
      name: 'description',
      content:
        'React Router SSR + SpatialBoot gate + @webspatial/react-sdk lazy entry',
    },
  ]
}

export default function LazyGateRoute() {
  return <LazySpatialGateDemo />
}
