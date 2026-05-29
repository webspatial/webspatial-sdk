export type SpatialDivAnimationRoute = {
  path: string
  label: string
  description: string
}

export const spatialDivAnimationRoutes: SpatialDivAnimationRoute[] = [
  {
    path: '/spatial-div-animation/fade-in-entrance',
    label: 'Fade-In Entrance',
    description:
      'autoStart entrance with translate.z + opacity (whitelist only).',
  },
  {
    path: '/spatial-div-animation/scale-expand',
    label: 'Scale Expand + Cancel',
    description:
      'Manual transform.scale 0.6→1.0; cancel restores the from snapshot.',
  },
  {
    path: '/spatial-div-animation/opacity-fade',
    label: 'Opacity Fade + Suppression',
    description:
      'Opacity 1→0.2 with pause/resume + suppression interference test.',
  },
  {
    path: '/spatial-div-animation/combined-delay',
    label: 'Combined + Delay',
    description:
      'translate.y + scale + opacity together with 500ms start delay.',
  },
  {
    path: '/spatial-div-animation/playback-rate',
    label: 'Playback Rate (2×)',
    description:
      'rotate.z 0→360 + opacity at 2× speed (2s anim completes in ~1s).',
  },
  {
    path: '/spatial-div-animation/rotate-3d',
    label: '3D Rotate',
    description: 'transform.rotate.x/y/z 0→180 with pause/resume controls.',
  },
  {
    path: '/spatial-div-animation/transform-translate',
    label: 'Transform Translate',
    description:
      'translate (0,0,0)→(100,10,100) over 2s; covers reset/play re-entry.',
  },
  {
    path: '/spatial-div-animation/reverse-loop',
    label: 'Reverse Loop',
    description:
      'loop: { reverse: true } ping-pong on translate.x with toggle control.',
  },
  {
    path: '/spatial-div-animation/capability-check',
    label: 'Capability Detection',
    description: "supports('useAnimation', ['element']) runtime probe.",
  },
  {
    path: '/spatial-div-animation/play-state',
    label: 'PlayState Inspector',
    description:
      'Verify playState transitions across idle/queued/running/paused/finished.',
  },
  {
    path: '/spatial-div-animation/perf-comparison',
    label: 'Perf Comparison',
    description:
      'JS-driven (rAF) vs declarative (useAnimation) side-by-side FPS benchmark.',
  },
  {
    path: '/spatial-div-animation/loop-animation',
    label: 'Loop Animation',
    description:
      'Choose JS-driven or declarative mode, loop animation continuously until stopped.',
  },
  {
    path: '/spatial-div-animation/nested-animation',
    label: 'Nested Animation',
    description:
      'Independent animations on nested enable-xr divs (parent/child/grandchild).',
  },
]
