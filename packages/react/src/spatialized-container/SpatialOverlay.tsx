import React, { forwardRef, ReactNode } from 'react'
import { Spatialized2DElementContainer } from './Spatialized2DElementContainer'
import { SpatialOverlayVisibleHost } from './SpatialOverlayVisibleHost'
import { useOverlayRenderMode } from './context/OverlayRenderModeContext'
import { SpatialWindowContext } from './context/SpatialWindowContext'

export type SpatialOverlayProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * Optional lightweight subtree used only for measurement. Use this when the
   * visible subtree contains nested portals or effectful components.
   */
  measureChildren?: ReactNode
}

export const SpatialOverlay = forwardRef<HTMLDivElement, SpatialOverlayProps>(
  function SpatialOverlay({ children, measureChildren, style, ...props }, ref) {
    const mode = useOverlayRenderMode()

    if (mode === 'measure') {
      return (
        <SpatialWindowContext.Provider value={null}>
          <div
            ref={ref}
            style={{
              ...style,
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
            {...props}
          >
            {measureChildren ?? children}
          </div>
        </SpatialWindowContext.Provider>
      )
    }

    return (
      <Spatialized2DElementContainer
        ref={ref as any}
        component={SpatialOverlayVisibleHost}
        overlayPortalMode
        measureChildren={measureChildren}
        style={style}
        {...props}
      >
        {children}
      </Spatialized2DElementContainer>
    )
  },
)
