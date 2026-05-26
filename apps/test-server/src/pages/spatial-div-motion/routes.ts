/** Demo routes for declarative spatialized container motion (Plan B + 3D). */
export const spatializedMotionDemoRoutes = [
  {
    path: '/spatial-div-motion/multi-track',
    label: '2D — Multi-track',
    description: 'translate.x + opacity timeline (Web + native)',
    section: '2d' as const,
  },
  {
    path: '/spatial-div-motion/simple-entrance',
    label: '2D — simple() entrance',
    description: 'opacity + translate.z segment',
    section: '2d' as const,
  },
  {
    path: '/spatial-div-motion/translate-z',
    label: '2D — translate.z',
    description: 'depth axis single track',
    section: '2d' as const,
  },
  {
    path: '/spatial-div-motion/rotate',
    label: '2D — rotate',
    description: 'rotate.y + rotate.z',
    section: '2d' as const,
  },
  {
    path: '/spatial-div-motion/reality-container',
    label: 'Dynamic3D — Reality container',
    description: 'translate.y + rotate.y on <Reality motion> (native only)',
    section: '3d' as const,
  },
] as const
