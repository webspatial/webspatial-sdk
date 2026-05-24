import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('lazy', 'routes/lazy.tsx'),
  route('lazy-gate', 'routes/lazy-gate.tsx'),
  route('eager-ssr', 'routes/eager-ssr.tsx'),
  route('server-ua', 'routes/server-ua.tsx'),
] satisfies RouteConfig
