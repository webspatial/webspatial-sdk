import { LazySpatialDemo } from '../components/LazySpatialDemo'

import type { Route } from './+types/lazy'

export function meta({}: Route.MetaArgs) {
  return [
    { title: '/lazy — WebSpatial lazy entry' },
    {
      name: 'description',
      content: 'React Router SSR + @webspatial/react-sdk lazy default entry',
    },
  ]
}

export default function LazyRoute() {
  return <LazySpatialDemo />
}
