import type { CSSProperties, PointerEvent, ReactNode } from 'react'

const spatialSemiModalLayerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto',
}

const spatialSemiModalMaskStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.52)',
}

const spatialSemiModalPanelStyle: CSSProperties = {
  position: 'relative',
  minWidth: '360px',
  maxWidth: 'min(560px, calc(100vw - 48px))',
  background: 'transparent',
  zIndex: 1,
}

export type SpatialSemiModalLayerProps = {
  children: ReactNode
  layerName?: string
  mask?: boolean
  maskClosable?: boolean
  maskEnableXr?: boolean
  maskName?: string
  maskStyle?: CSSProperties
  onMaskPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  panelName?: string
  panelStyle?: CSSProperties
}

export function SpatialSemiModalLayer({
  children,
  layerName = 'spatial-semi-modal-layer',
  mask = true,
  maskClosable = true,
  maskEnableXr = false,
  maskName = 'spatial-semi-modal-mask',
  maskStyle,
  onMaskPointerDown,
  panelName,
  panelStyle,
}: SpatialSemiModalLayerProps) {
  const maskElementProps = {
    'data-spatial-semi-modal-mask': true,
    'aria-hidden': true,
    style: { ...spatialSemiModalMaskStyle, ...maskStyle },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!maskClosable) return
      onMaskPointerDown?.(event)
    },
  }

  return (
    <div
      enable-xr
      data-xr-overlay
      data-name={layerName}
      style={spatialSemiModalLayerStyle}
    >
      {mask && maskEnableXr ? (
        <div
          enable-xr
          data-xr-overlay
          data-name={maskName}
          {...maskElementProps}
        />
      ) : mask ? (
        <div {...maskElementProps} />
      ) : null}
      <SpatialSemiModalPanel panelName={panelName} style={panelStyle}>
        {children}
      </SpatialSemiModalPanel>
    </div>
  )
}

export type SpatialSemiModalPanelProps = {
  panelName?: string
  children: ReactNode
  style?: CSSProperties
}

export function SpatialSemiModalPanel({
  panelName = 'spatial-semi-modal',
  children,
  style,
}: SpatialSemiModalPanelProps) {
  return (
    <div
      enable-xr
      data-xr-overlay
      data-name={panelName}
      style={{ ...spatialSemiModalPanelStyle, ...style }}
    >
      {children}
    </div>
  )
}
