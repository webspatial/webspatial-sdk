import React, { useCallback } from 'react'
import { expect } from 'chai'
import { useSpatialDivMotion } from '@webspatial/react-sdk'
import { render, unmount } from './render'
import { AsyncPromise } from '../../utils/AsyncPromise'

async function waitMS(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function readTranslateX(child: { transform?: { translation?: number[] } }) {
  const t = child?.transform?.translation
  return t?.[0] ?? 0
}

/** Canonical multi-track motion (matches OpenSpec acceptance). */
function MultiTrackMotionPanel() {
  const bindPromiseRef = React.useRef<AsyncPromise<boolean> | null>(null)

  const { style, motion } = useSpatialDivMotion({
    duration: 5,
    autoStart: true,
    tracks: [
      {
        property: 'transform.translate.x',
        keyframes: [
          { at: 0, value: 0 },
          { at: 5, value: 100 },
        ],
        easing: 'linear',
      },
      {
        property: 'opacity',
        keyframes: [
          { at: 3, value: 0 },
          { at: 5, value: 1 },
        ],
        easing: 'easeOut',
      },
    ],
  })

  const refFC = useCallback((node: HTMLDivElement | null) => {
    if (node && bindPromiseRef.current) {
      bindPromiseRef.current.resolve(true)
    }
  }, [])

  React.useEffect(() => {
    bindPromiseRef.current = new AsyncPromise<boolean>()
  }, [])

  return (
    <div
      enable-xr
      motion={motion}
      ref={refFC}
      style={{
        width: 280,
        height: 160,
        '--xr-back': 80,
        background: '#1e3a5f',
        ...style,
      }}
    >
      spatial-div-motion e2e
    </div>
  )
}

describe('SpatialDiv motion (Plan B)', function () {
  this.timeout(1000 * 60 * 5)

  this.afterEach(() => {
    unmount()
  })

  it('canonical multi-track translate.x advances on native timeline', async function () {
    render(<MultiTrackMotionPanel />)

    await waitMS(800)

    const sceneEarly = await window.inspectCurrentSpatialScene()
    const childrenEarly = Object.values(sceneEarly.children)
    expect(childrenEarly.length).to.be.greaterThan(0)
    const xEarly = readTranslateX(childrenEarly[0] as any)

    await waitMS(2000)

    const sceneLater = await window.inspectCurrentSpatialScene()
    const childrenLater = Object.values(sceneLater.children)
    const xLater = readTranslateX(childrenLater[0] as any)

    expect(xLater).to.be.greaterThan(xEarly + 5)
  })
})
