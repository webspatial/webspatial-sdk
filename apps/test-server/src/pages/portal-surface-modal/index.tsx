import { useCallback, useState } from 'react'
import { Modal } from '@douyinfe/semi-ui'
import { PortalSurface, useSpatialPortalContainer } from '@webspatial/react-sdk'

type DemoModalProps = {
  visible: boolean
  source: string
  onClose: () => void
}

type PortalSurfaceOwner = 'main' | 'nested' | null

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '32px',
  color: '#e5e7eb',
  background: 'linear-gradient(135deg, #0f172a 0%, #111827 42%, #1f2937 100%)',
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.45)',
  borderRadius: '8px',
  padding: '10px 14px',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer',
}

const panelStyle: React.CSSProperties = {
  width: 'min(620px, 100%)',
  marginTop: '24px',
  padding: '20px',
  border: '1px solid rgba(148, 163, 184, 0.32)',
  borderRadius: '8px',
  background: 'rgba(15, 23, 42, 0.72)',
}

const floatingParentStyle: React.CSSProperties = {
  ...panelStyle,
  background: 'rgba(17, 94, 89, 0.22)',
  transform: 'translateZ(0)',
  ['--xr-back' as string]: '42px',
  ['--xr-background-material' as string]: 'thick',
}

function PortalModal({ visible, source, onClose }: DemoModalProps) {
  const portalContainer = useSpatialPortalContainer()
  const getPopupContainer = useCallback(
    () => portalContainer ?? document.body,
    [portalContainer],
  )

  return (
    <Modal
      title="PortalSurface Semi Modal"
      visible={visible}
      centered
      motion={false}
      maskClosable
      getPopupContainer={getPopupContainer}
      onCancel={onClose}
      onOk={onClose}
      okText="Close"
      cancelText="Cancel"
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ color: '#374151', lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          Opened from: <strong>{source}</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          The Semi Modal component lives under PortalSurface, while Semi's popup
          container is resolved from useSpatialPortalContainer().
        </p>
      </div>
    </Modal>
  )
}

export default function PortalSurfaceModalPage() {
  const [owner, setOwner] = useState<PortalSurfaceOwner>(null)
  const [source, setSource] = useState('main page')

  const openFrom = (nextOwner: Exclude<PortalSurfaceOwner, null>) => {
    const nextSource = nextOwner === 'main' ? 'main page' : 'nested SpatialDiv'
    setSource(nextSource)
    setOwner(nextOwner)
  }

  const closeModal = () => {
    setOwner(null)
  }

  return (
    <div style={pageStyle}>
      <a href="#" onClick={() => history.go(-1)} style={{ color: '#93c5fd' }}>
        Go Back
      </a>

      <h1 style={{ margin: '20px 0 8px', fontSize: '26px' }}>
        PortalSurface Modal Prototype
      </h1>
      <p style={{ maxWidth: '760px', margin: 0, color: '#cbd5e1' }}>
        This page mounts a fullscreen floating webview with PortalSurface, then
        renders a regular Semi Modal inside it.
      </p>

      <section style={panelStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>
          Main page trigger
        </h2>
        <p style={{ margin: '0 0 16px', color: '#94a3b8' }}>
          The dialog should float as a whole surface and still close through the
          close icon, mask, cancel, or ok action.
        </p>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => openFrom('main')}
        >
          Open PortalSurface Modal
        </button>
      </section>

      <div
        enable-xr
        data-name="portal-surface-modal-owner-parent"
        style={floatingParentStyle}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>
          Nested PortalSurface owner
        </h2>
        <p style={{ margin: '0 0 16px', color: '#bae6fd' }}>
          This case renders PortalSurface from inside a floating SpatialDiv
          subtree. The modal should still open as an app-level raised surface.
        </p>
        <button
          type="button"
          style={{ ...buttonStyle, background: '#0f766e' }}
          onClick={() => openFrom('nested')}
        >
          Open From Nested Surface
        </button>

        {owner === 'nested' ? (
          <PortalSurface zOffset={120} backgroundMaterial="transparent">
            <PortalModal visible={true} source={source} onClose={closeModal} />
          </PortalSurface>
        ) : null}
      </div>

      {owner === 'main' ? (
        <PortalSurface zOffset={120} backgroundMaterial="transparent">
          <PortalModal visible={true} source={source} onClose={closeModal} />
        </PortalSurface>
      ) : null}
    </div>
  )
}
