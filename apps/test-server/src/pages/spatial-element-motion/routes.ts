export type SpatialElementMotionRoute = {
  path: string
  label: string
  description: string
}

export const spatialElementMotionRoutes: SpatialElementMotionRoute[] = [
  {
    path: '/spatial-element-motion/fade-in-entrance',
    label: 'Fade-In Entrance',
    description:
      'autoStart entrance with translate.z + opacity (whitelist only).',
  },
  {
    path: '/spatial-element-motion/scale-expand',
    label: 'Scale Expand + Reset',
    description:
      'Manual transform.scale 0.6→1.0; reset restores the from snapshot.',
  },
  {
    path: '/spatial-element-motion/opacity-fade',
    label: 'Opacity Fade + Suppression',
    description:
      'Opacity 1→0.2 with pause/resume + suppression interference test.',
  },
  {
    path: '/spatial-element-motion/property-takeover',
    label: 'Property Takeover',
    description:
      'Switch between translate and opacity takeover demos under one page entry.',
  },
  {
    path: '/spatial-element-motion/combined-delay',
    label: 'Combined + Delay',
    description:
      'translate.y + scale + opacity together with 500ms start delay.',
  },
  {
    path: '/spatial-element-motion/playback-rate',
    label: 'Playback Rate (2×)',
    description:
      'rotate.z 0→360 + opacity at 2× speed (2s anim completes in ~1s).',
  },
  {
    path: '/spatial-element-motion/rotate-3d',
    label: '3D Rotate',
    description: 'transform.rotate.x/y/z 0→180 with pause/resume controls.',
  },
  {
    path: '/spatial-element-motion/transform-translate',
    label: 'Transform Translate',
    description:
      'translate (0,0,0)→(100,50,-80) over 2s; covers play re-entry, reset/stop/finish.',
  },
  {
    path: '/spatial-element-motion/reverse-loop',
    label: 'Reverse Loop',
    description:
      'loop: { reverse: true } ping-pong on translate.x with toggle control.',
  },
  {
    path: '/spatial-element-motion/capability-check',
    label: 'Capability Detection',
    description:
      "supports('useAnimation') runtime probe for the renamed motion hook.",
  },
  {
    path: '/spatial-element-motion/play-state',
    label: 'PlayState Inspector',
    description:
      'Verify playState transitions across idle/queued/running/paused/finished.',
  },
  {
    path: '/spatial-element-motion/perf-comparison',
    label: 'Perf Comparison',
    description:
      'JS-driven (rAF) vs declarative (useAnimation) side-by-side FPS benchmark.',
  },
  {
    path: '/spatial-element-motion/loop-animation',
    label: 'Loop Animation',
    description:
      'Choose JS-driven or declarative mode, loop animation continuously until stopped.',
  },
  {
    path: '/spatial-element-motion/nested-animation',
    label: 'Nested Animation',
    description:
      'Independent animations on nested enable-xr divs (parent/child/grandchild).',
  },
  {
    path: '/spatial-element-motion/reality-container',
    label: 'Reality Container Timeline',
    description:
      'Timeline keyframes on <Reality xr-animation> with opacity and 3D transform.',
  },
  {
    path: '/spatial-element-motion/static-model-container',
    label: 'Static Model Container',
    description:
      'Timeline keyframes on <Model xr-animation> for monitor snap-back comparison.',
  },
]
