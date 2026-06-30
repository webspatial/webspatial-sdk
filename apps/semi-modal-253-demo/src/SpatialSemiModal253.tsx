import { Modal } from '@douyinfe/semi-ui'
import type { ComponentProps, CSSProperties, PointerEvent } from 'react'
import { useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'

type SemiModalProps = ComponentProps<typeof Modal>

type SpatialModalCommandMethod =
  | 'confirm'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

type SpatialModalEvent = Parameters<NonNullable<SemiModalProps['onCancel']>>[0]

export type SpatialSemiModalLayerProps = {
  layerName?: string
  mask?: boolean
  maskClosable?: boolean
  maskEnableXr?: boolean
  maskName?: string
  maskStyle?: CSSProperties
  onMaskPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  panelName?: string
  panelRef?: (element: HTMLDivElement | null) => void
  panelStyle?: CSSProperties
}

export type SpatialSemiModal253Props = Omit<
  SemiModalProps,
  'getPopupContainer' | 'mask'
> & {
  layerName?: string
  mask?: boolean
  maskEnableXr?: boolean
  maskName?: string
  panelName?: string
  panelStyle?: CSSProperties
}

export type SpatialSemiModalCommandConfig = Omit<
  SpatialSemiModal253Props,
  'visible'
>

export type SpatialSemiModalCommandHandle = {
  destroy: () => void
  update: (config: SpatialSemiModalCommandConfig) => void
}

const layerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto',
  zIndex: 1000,
}

const maskStyleBase: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.52)',
}

const panelStyleBase: CSSProperties = {
  position: 'relative',
  minWidth: '360px',
  maxWidth: 'min(560px, calc(100vw - 48px))',
  minHeight: '1px',
  background: 'transparent',
  zIndex: 1,
}

const methodCounters: Record<SpatialModalCommandMethod, number> = {
  confirm: 0,
  info: 0,
  success: 0,
  warning: 0,
  error: 0,
}

function nextCommandName(method: SpatialModalCommandMethod) {
  methodCounters[method] += 1
  return `semi-253-spatial-${method}-${methodCounters[method]}`
}

export function SpatialSemiModalLayer({
  layerName = 'semi-253-spatial-modal-layer',
  mask = true,
  maskClosable = true,
  maskEnableXr = false,
  maskName = 'semi-253-spatial-modal-mask',
  maskStyle,
  onMaskPointerDown,
  panelName = 'semi-253-spatial-modal-panel',
  panelRef,
  panelStyle,
}: SpatialSemiModalLayerProps) {
  const maskProps = {
    'data-spatial-modal-mask': true,
    'aria-hidden': true,
    style: { ...maskStyleBase, ...maskStyle },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!maskClosable) return
      onMaskPointerDown?.(event)
    },
  }

  return (
    <div enable-xr data-xr-overlay data-name={layerName} style={layerStyle}>
      {mask && maskEnableXr ? (
        <div enable-xr data-xr-overlay data-name={maskName} {...maskProps} />
      ) : mask ? (
        <div {...maskProps} />
      ) : null}
      <div
        ref={panelRef}
        enable-xr
        data-xr-overlay
        data-name={panelName}
        style={{ ...panelStyleBase, ...panelStyle }}
      />
    </div>
  )
}

export function SpatialSemiModal253({
  visible,
  layerName,
  mask = true,
  maskClosable = true,
  maskEnableXr = false,
  maskName,
  maskStyle,
  onCancel,
  panelName,
  panelStyle,
  motion = false,
  ...modalProps
}: SpatialSemiModal253Props) {
  const [panelElement, setPanelElement] = useState<HTMLDivElement | null>(null)

  if (!visible) return null

  return (
    <>
      <SpatialSemiModalLayer
        layerName={layerName}
        mask={mask}
        maskClosable={maskClosable}
        maskEnableXr={maskEnableXr}
        maskName={maskName}
        maskStyle={maskStyle}
        onMaskPointerDown={event => onCancel?.(event)}
        panelName={panelName}
        panelRef={setPanelElement}
        panelStyle={panelStyle}
      />
      {panelElement ? (
        <Modal
          {...modalProps}
          visible
          getPopupContainer={() => panelElement}
          mask={false}
          motion={motion}
          onCancel={onCancel}
        />
      ) : null}
    </>
  )
}

export function createSpatialSemiModalCommandConfig(
  method: SpatialModalCommandMethod,
  config: SpatialSemiModalCommandConfig,
  fallbackName: string,
): SpatialSemiModalCommandConfig {
  const isConfirm = method === 'confirm'

  return {
    okText: 'OK',
    hasCancel: isConfirm,
    ...config,
    layerName: config.layerName ?? `${fallbackName}-layer`,
    mask: config.mask ?? true,
    maskEnableXr: config.maskEnableXr ?? true,
    maskName: config.maskName ?? `${fallbackName}-mask`,
    panelName: config.panelName ?? `${fallbackName}-panel`,
  }
}

function createSpatialSemiModalCommand(
  method: SpatialModalCommandMethod,
  config: SpatialSemiModalCommandConfig,
): SpatialSemiModalCommandHandle {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const root = createRoot(host)
  const fallbackName = nextCommandName(method)
  const initialConfig = createSpatialSemiModalCommandConfig(
    method,
    config,
    fallbackName,
  )
  const defaultLayerName = initialConfig.layerName
  const defaultMaskName = initialConfig.maskName
  const defaultPanelName = initialConfig.panelName
  let currentConfig = initialConfig

  const destroy = () => {
    root.unmount()
    host.remove()
  }

  const render = () => {
    const onCancel = (event: SpatialModalEvent) => {
      void Promise.resolve(currentConfig.onCancel?.(event)).finally(destroy)
    }
    const onOk = (event: SpatialModalEvent) => {
      void Promise.resolve(currentConfig.onOk?.(event)).finally(destroy)
    }

    root.render(
      <SpatialSemiModal253
        {...currentConfig}
        visible
        onCancel={onCancel}
        onOk={onOk}
      />,
    )
  }

  render()

  return {
    destroy,
    update(nextConfig) {
      currentConfig = createSpatialSemiModalCommandConfig(
        method,
        {
          ...nextConfig,
          layerName: nextConfig.layerName ?? defaultLayerName,
          maskName: nextConfig.maskName ?? defaultMaskName,
          panelName: nextConfig.panelName ?? defaultPanelName,
        },
        fallbackName,
      )
      render()
    },
  }
}

export const SpatialSemiModal253Api = {
  confirm(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand('confirm', config)
  },
  info(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand('info', config)
  },
  success(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand('success', config)
  },
  warning(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand('warning', config)
  },
  error(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand('error', config)
  },
}
