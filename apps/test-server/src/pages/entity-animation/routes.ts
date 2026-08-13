export type EntityAnimationRoute = {
  path: string
  label: string
  description: string
}

export const entityAnimationRoutes: EntityAnimationRoute[] = [
  {
    path: '/entity-animation/entrance',
    label: 'Entrance Animation',
    description: 'autoStart, delay, and easeOut entrance motion.',
  },
  {
    path: '/entity-animation/manual-trigger',
    label: 'Manual Trigger',
    description: 'Manual play and cancel controls for a single animation.',
  },
  {
    path: '/entity-animation/reverse-loop',
    label: 'Reverse Loop',
    description: 'Reverse loop rotation with pause/play (resume) and cancel.',
  },
  {
    path: '/entity-animation/cancel-sync',
    label: 'Cancel and Sync State',
    description:
      'Sync React state with the cancel restore point to avoid jumps.',
  },
  {
    path: '/entity-animation/capability-check',
    label: 'Capability Detection',
    description: 'Verify runtime support for useEntityAnimation.',
  },
  {
    path: '/entity-animation/reset-loop',
    label: 'Reset Loop',
    description: 'Loop by resetting back to the from state each cycle.',
  },
  {
    path: '/entity-animation/play-state',
    label: 'PlayState Inspector',
    description: 'Verify api.playState transitions across the full lifecycle.',
  },
]
