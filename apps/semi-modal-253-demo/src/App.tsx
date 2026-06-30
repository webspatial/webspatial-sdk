import { useState } from 'react'
import {
  SpatialSemiModal253,
  SpatialSemiModal253Api,
} from './SpatialSemiModal253'
import './styles.css'

const floatingMaskStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.18)',
  '--xr-background-material': 'thin',
  '--xr-back': '24px',
}

const dialogBodyStyle: React.CSSProperties = {
  color: '#334155',
  fontSize: 14,
  lineHeight: 1.6,
}

export function App() {
  const [mainVisible, setMainVisible] = useState(false)
  const [nestedVisible, setNestedVisible] = useState(false)

  const openConfirm = () => {
    SpatialSemiModal253Api.confirm({
      title: 'Semi 2.53 command confirm',
      content: (
        <div style={dialogBodyStyle}>
          This command dialog is rendered without Semi modalRender.
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      layerName: 'semi-253-command-confirm-layer',
      maskName: 'semi-253-command-confirm-material-mask',
      maskStyle: floatingMaskStyle,
      panelName: 'semi-253-command-confirm-panel',
      style: { margin: 0 },
      bodyStyle: { padding: '18px 24px' },
    })
  }

  const openInfo = () => {
    SpatialSemiModal253Api.info({
      title: 'Semi 2.53 command info',
      content: (
        <div style={dialogBodyStyle}>
          The fallback adapter owns the spatial mask and panel surfaces.
        </div>
      ),
      layerName: 'semi-253-command-info-layer',
      maskName: 'semi-253-command-info-material-mask',
      maskStyle: floatingMaskStyle,
      panelName: 'semi-253-command-info-panel',
      style: { margin: 0 },
      bodyStyle: { padding: '18px 24px' },
    })
  }

  return (
    <main className="page">
      <section className="intro">
        <p className="eyebrow">Semi UI 2.53.2 fallback</p>
        <h1>Semi Modal + Spatial Overlay</h1>
        <p>
          This Vite demo does not use Semi&apos;s modalRender prop. The spatial
          layer is rendered by the app, and Semi Modal portals into that layer
          with getPopupContainer.
        </p>
      </section>

      <section className="panel">
        <h2>Component and command entry points</h2>
        <p>
          The mask is a separate XR surface, so it can use
          <code> --xr-background-material</code> and float in front of the page.
        </p>
        <div className="actions">
          <button onClick={() => setMainVisible(true)}>
            Open Component Modal
          </button>
          <button onClick={openConfirm}>Open Command Confirm</button>
          <button onClick={openInfo}>Open Command Info</button>
        </div>
      </section>

      <SpatialSemiModal253
        title="Semi 2.53 component modal"
        visible={mainVisible}
        onOk={() => setMainVisible(false)}
        onCancel={() => setMainVisible(false)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        layerName="semi-253-component-layer"
        maskEnableXr
        maskName="semi-253-component-material-mask"
        maskStyle={floatingMaskStyle}
        panelName="semi-253-component-panel"
        style={{ margin: 0 }}
        bodyStyle={{ padding: '18px 24px' }}
      >
        <div style={dialogBodyStyle}>
          Semi 2.53 renders into a panel container controlled by the fallback
          adapter.
        </div>
      </SpatialSemiModal253>

      <section
        enable-xr
        data-name="semi-253-floating-parent"
        className="floating-parent"
      >
        <h2>Trigger inside a floating SpatialDiv</h2>
        <p>
          This trigger lives in a floating parent, but the modal layer is still
          mounted at document.body.
        </p>
        <button onClick={() => setNestedVisible(true)}>
          Open Nested Component Modal
        </button>
      </section>

      <SpatialSemiModal253
        title="Nested Semi 2.53 modal"
        visible={nestedVisible}
        onOk={() => setNestedVisible(false)}
        onCancel={() => setNestedVisible(false)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        layerName="semi-253-nested-layer"
        maskEnableXr
        maskName="semi-253-nested-material-mask"
        maskStyle={floatingMaskStyle}
        panelName="semi-253-nested-panel"
        style={{ margin: 0 }}
        bodyStyle={{ padding: '18px 24px' }}
      >
        <div style={dialogBodyStyle}>
          The fullscreen mask is independent from the floating parent surface.
        </div>
      </SpatialSemiModal253>
    </main>
  )
}
