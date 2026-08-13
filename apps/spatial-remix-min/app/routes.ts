import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('lazy', 'routes/lazy.tsx'),
  route('server-ua', 'routes/server-ua.tsx'),
] satisfies RouteConfig
