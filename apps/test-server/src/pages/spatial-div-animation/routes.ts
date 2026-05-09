export type SpatialDivAnimationRoute = {
  path: string
  label: string
  description: string
}

export const spatialDivAnimationRoutes: SpatialDivAnimationRoute[] = [
  {
    path: '/spatial-div-animation/fade-in-entrance',
    label: 'Fade-In Entrance',
    description: 'autoStart, back offset + opacity with easeOut entrance.',
  },
  {
    path: '/spatial-div-animation/size-expand',
    label: 'Size Expand + Cancel',
    description: 'Manual width/height expand with cancel restoring state.',
  },
  {
    path: '/spatial-div-animation/opacity-fade',
    label: 'Opacity Fade',
    description: 'Opacity 1→0.2 with pause/resume controls.',
  },
  {
    path: '/spatial-div-animation/combined-delay',
    label: 'Combined + Delay',
    description: 'Multiple properties with 500ms start delay.',
  },
  {
    path: '/spatial-div-animation/playback-rate',
    label: 'Playback Rate (2×)',
    description: '2× speed animation completing a 2s anim in ~1s.',
  },
]
