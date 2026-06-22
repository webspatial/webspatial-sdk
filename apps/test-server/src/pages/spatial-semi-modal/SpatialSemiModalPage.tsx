import { useState } from 'react'
import {
  SpatialSemiModal,
  SpatialSemiModalApi,
} from './components/SpatialSemiModal'
import {
  descriptionStyle,
  dialogTextStyle,
  floatingMaskStyle,
  floatingParentStyle,
  headingStyle,
  noteStyle,
  pageStyle,
  triggerStyle,
} from './pageStyles'

const commandButtonStyle: React.CSSProperties = {
  ...triggerStyle,
  marginTop: '18px',
  marginRight: '12px',
}

export function SpatialSemiModalPage() {
  const [mainVisible, setMainVisible] = useState(false)
  const [nestedVisible, setNestedVisible] = useState(false)

  const openSpatialConfirm = () => {
    SpatialSemiModalApi.confirm({
      title: 'Command spatial confirm',
      content: (
        <div style={dialogTextStyle}>
          This dialog was opened with SpatialSemiModalApi.confirm().
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      layerName: 'spatial-semi-command-confirm-layer',
      maskEnableXr: true,
      maskName: 'spatial-semi-command-confirm-material-mask',
      maskStyle: floatingMaskStyle,
      panelName: 'spatial-semi-command-confirm',
      bodyStyle: { padding: '18px 24px' },
      style: { margin: 0 },
    })
  }

  const openSpatialInfo = () => {
    SpatialSemiModalApi.info({
      title: 'Command spatial info',
      content: (
        <div style={dialogTextStyle}>
          This dialog was opened with SpatialSemiModalApi.info().
        </div>
      ),
      okText: 'Got it',
      layerName: 'spatial-semi-command-info-layer',
      maskEnableXr: true,
      maskName: 'spatial-semi-command-info-material-mask',
      maskStyle: floatingMaskStyle,
      panelName: 'spatial-semi-command-info',
      bodyStyle: { padding: '18px 24px' },
      style: { margin: 0 },
    })
  }

  return (
    <div style={pageStyle}>
      <a href="#" onClick={() => history.go(-1)} style={{ color: '#93c5fd' }}>
        Go Back
      </a>
      <h1 style={{ margin: '20px 0 8px', fontSize: '24px' }}>
        Semi Modal + Spatial Overlay
      </h1>
      <p style={{ maxWidth: '880px', margin: 0, color: '#94a3b8' }}>
        Component and imperative Semi modal entry points share the same spatial
        adapter. The mask and dialog panel render into a fullscreen spatial
        overlay rooted at the page body.
      </p>

      <section style={{ marginTop: '24px' }}>
        <h2 style={headingStyle}>Component and command modal entry points</h2>
        <p style={{ ...descriptionStyle, margin: '0 0 12px' }}>
          The main page dialog uses the component wrapper. Confirm and info use
          the imperative API, matching Semi&apos;s Modal.confirm/Modal.info
          shape.
        </p>

        <div style={noteStyle}>
          The popup is not attached to the nearest SpatialDiv portal container.
          That keeps the mask fullscreen when the trigger lives inside a
          floating parent surface. The material mask is its own XR surface using
          <code> --xr-background-material</code>.
        </div>

        <button
          onClick={() => setMainVisible(true)}
          style={{ ...triggerStyle, marginTop: '18px' }}
        >
          Open Main Page Spatial Semi Modal
        </button>
        <button onClick={openSpatialConfirm} style={commandButtonStyle}>
          Open Spatial Confirm
        </button>
        <button onClick={openSpatialInfo} style={commandButtonStyle}>
          Open Spatial Info
        </button>
      </section>

      <SpatialSemiModal
        title="Main page dialog"
        visible={mainVisible}
        onOk={() => setMainVisible(false)}
        onCancel={() => setMainVisible(false)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        layerName="spatial-semi-main-layer"
        maskEnableXr
        maskName="spatial-semi-main-material-mask"
        maskStyle={floatingMaskStyle}
        panelName="spatial-semi-main-dialog"
        bodyStyle={{ padding: '18px 24px' }}
        style={{ margin: 0 }}
      >
        <div style={dialogTextStyle}>
          This Semi dialog was opened from the main page. Its mask and panel are
          children of the same fullscreen spatial overlay layer.
        </div>
      </SpatialSemiModal>

      <div
        enable-xr
        data-name="Spatial Semi Modal Floating Parent"
        style={{ ...floatingParentStyle, marginTop: '18px' }}
      >
        <h3 style={{ ...headingStyle, fontSize: '18px', marginTop: 0 }}>
          Trigger inside a floating SpatialDiv
        </h3>
        <p style={{ ...descriptionStyle, margin: '0 0 12px' }}>
          The trigger is inside this floating parent surface, but the dialog
          layer is still mounted at the page body so its mask covers the full
          viewport instead of this parent panel only.
        </p>

        <button
          onClick={() => setNestedVisible(true)}
          style={{ ...triggerStyle, marginTop: '12px' }}
        >
          Open Nested Spatial Semi Modal
        </button>
      </div>

      <SpatialSemiModal
        title="Nested spatial dialog"
        visible={nestedVisible}
        onOk={() => setNestedVisible(false)}
        onCancel={() => setNestedVisible(false)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        layerName="spatial-semi-nested-layer"
        maskEnableXr
        maskName="spatial-semi-nested-material-mask"
        maskStyle={floatingMaskStyle}
        panelName="spatial-semi-nested-dialog"
        bodyStyle={{ padding: '18px 24px' }}
        style={{ margin: 0 }}
      >
        <div style={dialogTextStyle}>
          This Semi dialog was triggered inside a SpatialDiv, but the mask is
          not scoped to that parent surface.
        </div>
      </SpatialSemiModal>
    </div>
  )
}
