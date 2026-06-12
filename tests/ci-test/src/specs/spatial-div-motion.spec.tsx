import React, { useCallback } from 'react'
import { expect } from 'chai'
import { useAnimation } from '@webspatial/react-sdk'
import { render, unmount } from './render'
import { AsyncPromise } from '../../utils/AsyncPromise'

async function waitMS(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function readTranslateX(child: { transform?: { translation?: number[] } }) {
  const t = child?.transform?.translation
  return t?.[0] ?? 0
}

/** Canonical timeline authoring motion (matches Phase 10 acceptance). */
function TimelinePercentMotionPanel() {
  const bindPromiseRef = React.useRef<AsyncPromise<boolean> | null>(null)

  const [motion, , style] = useAnimation({
    duration: 4,
    autoStart: true,
    timingFunction: 'easeInOut',
    timeline: {
      '0%': {
        opacity: 0,
        transform: { translate: { x: 0 } },
      },
      '50%': {
        opacity: 0.6,
        transform: { translate: { x: 100 } },
        timingFunction: 'easeOut',
      },
      '100%': {
        opacity: 1,
        transform: { translate: { x: 200 } },
      },
    },
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
      xr-animation={motion}
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

  it('timeline authoring applies timingFunction on native timeline', async function () {
    render(<TimelinePercentMotionPanel />)

    await waitMS(1000)

    const sceneEarly = await window.inspectCurrentSpatialScene()
    const childrenEarly = Object.values(sceneEarly.children)
    expect(childrenEarly.length).to.be.greaterThan(0)
    const childEarly = childrenEarly[0] as any
    const xEarly = readTranslateX(childEarly)
    const opacityEarly = childEarly.material?.opacity ?? 0

    await waitMS(1200)

    const sceneLater = await window.inspectCurrentSpatialScene()
    const childrenLater = Object.values(sceneLater.children)
    const childLater = childrenLater[0] as any
    const xLater = readTranslateX(childLater)

    expect(xEarly).to.be.greaterThan(80)
    expect(xEarly).to.be.lessThan(95)
    expect(opacityEarly).to.be.greaterThan(0.45)
    expect(xLater).to.be.greaterThan(xEarly)
  })
})
