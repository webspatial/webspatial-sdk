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
    description: 'Manual play, stop, reset, finish, and api.set controls.',
  },
  {
    path: '/entity-animation/reverse-loop',
    label: 'Reverse Loop',
    description: 'Percentage timeline rotation with reverse loop controls.',
  },
  {
    path: '/entity-animation/cancel-sync',
    label: 'Stop and Sync State',
    description: 'Sync React state with the native-confirmed stop pose.',
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
  {
    path: '/entity-animation/binding-ownership',
    label: 'Binding and Ownership',
    description:
      'Verify unbind takeover and reject one animation bound to two Entities.',
  },
  {
    path: '/entity-animation/config-replacement',
    label: 'In-place Config Update',
    description:
      'Retarget the current binding, refresh callbacks, and start a new lifecycle on remount.',
  },
  {
    path: '/entity-animation/isolation-cleanup',
    label: 'Isolation and Cleanup',
    description: 'Run, stop, and destroy two independent Entity animations.',
  },
]
