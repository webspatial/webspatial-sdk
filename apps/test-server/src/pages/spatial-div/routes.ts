export type SpatialDivRoute = {
  path: string
  label: string
  description: string
}

export const spatialDivRoutes: SpatialDivRoute[] = [
  {
    path: '/spatial-div/layout',
    label: 'Layout and updates',
    description:
      'Parent resize, sibling insertion, column change, and ancestor class reflow.',
  },
  {
    path: '/spatial-div/styles',
    label: 'Styles and inheritance',
    description: 'Ancestor selectors and inherited custom properties.',
  },
  {
    path: '/spatial-div/dynamic-stylesheets',
    label: 'Dynamic stylesheets',
    description:
      'Runtime <style>, CSSOM insertRule (no DOM mutation), and adoptedStyleSheets.',
  },
  {
    path: '/spatial-div/environment-queries',
    label: 'Environment queries',
    description:
      '@media, vw/vh/dvh, rem, @container, color-scheme, html.dark, dir=rtl, @font-face.',
  },
  {
    path: '/spatial-div/transforms',
    label: 'Floating, transforms, nesting',
    description:
      'Parent rotate/translate, --xr-back depth, and nested spatial panels.',
  },
  {
    path: '/spatial-div/clipping',
    label: 'Clipping and rounded corners',
    description:
      'overflow:hidden, border-radius, and clip-path; spatial vs ordinary parent/child.',
  },
  {
    path: '/spatial-div/scroll',
    label: 'Scrolling, fixed, sticky',
    description:
      'Sticky, absolute, and fixed under a transform, plus nested scrollers.',
  },
  {
    path: '/spatial-div/stacking',
    label: 'Stacking and depth order',
    description:
      'CSS z-index vs --xr-back vs --xr-z-index, outside cover, and opacity group.',
  },
  {
    path: '/spatial-div/visibility',
    label: 'Visibility and visual effects',
    description:
      'Parent visibility, opacity 0/.5, display:none, child override, filter, corners.',
  },
  {
    path: '/spatial-div/animation',
    label: 'Animation',
    description:
      'transition, @keyframes, WAAPI el.animate(), rAF, and animation-timeline: scroll().',
  },
  {
    path: '/spatial-div/input',
    label: 'Pointer targeting and capture',
    description:
      'Overlay pass-through, overlapping panels, drag capture, and leave-panel capture.',
  },
  {
    path: '/spatial-div/gestures',
    label: 'Spatial gestures versus web input',
    description:
      'onSpatialTap / onSpatialDrag vs web click on the same enable-xr host.',
  },
  {
    path: '/spatial-div/focus',
    label: 'Focus, keyboard, and editing',
    description:
      'Tab A→B→C→D, IME composition, and contenteditable across spatial panels.',
  },
  {
    path: '/spatial-div/dom-apis',
    label: 'DOM APIs and geometry',
    description:
      'getBoundingClientRect, depth-only measure, elementFromPoint, and observers.',
  },
  {
    path: '/spatial-div/lifecycle',
    label: 'Mount, ready, and cleanup',
    description:
      'onSpatialContentReady, child key remount, and effect instance IDs.',
  },
  {
    path: '/spatial-div/overlays',
    label: 'Overlays and boundaries',
    description:
      'dialog, popover, ownerDocument portal, raw vs JSX shadow/iframe enable-xr.',
  },
  {
    path: '/spatial-div/document-listeners',
    label: 'Document-scoped listeners',
    description:
      'Host document capture of pointermove, wheel, contextmenu, touch, Escape, focusin.',
  },
  {
    path: '/spatial-div/modality',
    label: 'Modality side effects',
    description:
      'body pointer-events:none, overflow lock, inert, and aria-hidden on siblings.',
  },
  {
    path: '/spatial-div/anchored-portals',
    label: 'Anchored portals',
    description:
      'Portal-to-body float from trigger rect, CSS anchor positioning, host autoUpdate.',
  },
]
