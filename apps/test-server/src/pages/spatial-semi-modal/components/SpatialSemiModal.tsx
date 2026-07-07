import { Modal } from '@douyinfe/semi-ui'
import type { ComponentProps, CSSProperties } from 'react'
import { SpatialSemiModalLayer } from './SpatialSemiModalPanel'

export {
  SpatialSemiModalLayer,
  SpatialSemiModalPanel,
} from './SpatialSemiModalPanel'

type SemiModalProps = ComponentProps<typeof Modal>

type SemiModalCommandOpener = (config: SemiModalProps) => {
  destroy: () => void
  update: (config: SemiModalProps) => void
}

type SpatialSemiModalMethod =
  | 'confirm'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

export type SpatialSemiModalProps = Omit<
  SemiModalProps,
  'getPopupContainer' | 'modalRender'
> & {
  layerName?: string
  maskEnableXr?: boolean
  maskName?: string
  panelName?: string
  panelStyle?: CSSProperties
  modalRender?: SemiModalProps['modalRender']
}

export type SpatialSemiModalCommandConfig = SpatialSemiModalProps

export type SpatialSemiModalCommandHandle = {
  destroy: () => void
  update: (config: SpatialSemiModalCommandConfig) => void
}

const spatialSemiModalMethodCounters: Record<SpatialSemiModalMethod, number> = {
  confirm: 0,
  info: 0,
  success: 0,
  warning: 0,
  error: 0,
}

function nextSpatialSemiModalId(method: SpatialSemiModalMethod) {
  spatialSemiModalMethodCounters[method] += 1
  return `spatial-semi-modal-${method}-${spatialSemiModalMethodCounters[method]}`
}

export function createSpatialSemiModalConfig(
  {
    layerName,
    panelName,
    panelStyle,
    modalRender,
    mask = true,
    maskClosable = true,
    maskEnableXr,
    maskName,
    maskStyle,
    onCancel,
    centered = true,
    motion = false,
    ...modalProps
  }: SpatialSemiModalCommandConfig,
  fallbackName: string,
): SemiModalProps {
  return {
    ...modalProps,
    centered,
    getPopupContainer: () => document.body,
    mask: false,
    modalRender: modal => (
      <SpatialSemiModalLayer
        layerName={layerName ?? `${fallbackName}-layer`}
        mask={mask}
        maskClosable={maskClosable}
        maskEnableXr={maskEnableXr}
        maskName={maskName ?? `${fallbackName}-mask`}
        maskStyle={maskStyle}
        onMaskPointerDown={event => onCancel?.(event)}
        panelName={panelName ?? `${fallbackName}-panel`}
        panelStyle={panelStyle}
      >
        {modalRender ? modalRender(modal) : modal}
      </SpatialSemiModalLayer>
    ),
    motion,
    onCancel,
  }
}

function createSpatialSemiModalCommand(
  opener: SemiModalCommandOpener,
  method: SpatialSemiModalMethod,
  config: SpatialSemiModalCommandConfig,
): SpatialSemiModalCommandHandle {
  const fallbackName = nextSpatialSemiModalId(method)
  const defaultLayerName = config.layerName ?? `${fallbackName}-layer`
  const defaultMaskName = config.maskName ?? `${fallbackName}-mask`
  const defaultPanelName = config.panelName ?? `${fallbackName}-panel`
  const wrapConfig = (nextConfig: SpatialSemiModalCommandConfig) =>
    createSpatialSemiModalConfig(
      {
        ...nextConfig,
        layerName: nextConfig.layerName ?? defaultLayerName,
        maskName: nextConfig.maskName ?? defaultMaskName,
        panelName: nextConfig.panelName ?? defaultPanelName,
      },
      fallbackName,
    )
  const handle = opener(wrapConfig(config))

  return {
    destroy: handle.destroy,
    update(nextConfig) {
      handle.update(wrapConfig(nextConfig))
    },
  }
}

const semiModalCommandOpeners: Record<
  SpatialSemiModalMethod,
  SemiModalCommandOpener
> = {
  confirm: Modal.confirm as SemiModalCommandOpener,
  info: Modal.info,
  success: Modal.success,
  warning: Modal.warning,
  error: Modal.error,
}

export const SpatialSemiModalApi = {
  create: createSpatialSemiModalCommand,
  confirm(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand(
      semiModalCommandOpeners.confirm,
      'confirm',
      config,
    )
  },
  info(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand(
      semiModalCommandOpeners.info,
      'info',
      config,
    )
  },
  success(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand(
      semiModalCommandOpeners.success,
      'success',
      config,
    )
  },
  warning(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand(
      semiModalCommandOpeners.warning,
      'warning',
      config,
    )
  },
  error(config: SpatialSemiModalCommandConfig) {
    return createSpatialSemiModalCommand(
      semiModalCommandOpeners.error,
      'error',
      config,
    )
  },
}

export function SpatialSemiModal({
  layerName,
  panelName,
  panelStyle,
  modalRender,
  mask = true,
  maskClosable = true,
  maskEnableXr,
  maskName,
  maskStyle,
  onCancel,
  centered = true,
  motion = false,
  ...modalProps
}: SpatialSemiModalProps) {
  return (
    <Modal
      {...modalProps}
      centered={centered}
      getPopupContainer={() => document.body}
      mask={false}
      modalRender={modal => (
        <SpatialSemiModalLayer
          layerName={layerName}
          mask={mask}
          maskClosable={maskClosable}
          maskEnableXr={maskEnableXr}
          maskName={maskName}
          maskStyle={maskStyle}
          onMaskPointerDown={event => onCancel?.(event)}
          panelName={panelName}
          panelStyle={panelStyle}
        >
          {modalRender ? modalRender(modal) : modal}
        </SpatialSemiModalLayer>
      )}
      motion={motion}
      onCancel={onCancel}
    />
  )
}
