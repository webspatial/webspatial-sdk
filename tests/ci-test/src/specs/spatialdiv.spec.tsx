import React, { CSSProperties, useCallback } from 'react'
import { expect } from 'chai'
import { render, unmount } from './render'
import { AsyncPromise } from '../../utils/AsyncPromise'

async function waitMS(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

describe('SpatialDiv', function () {
  this.timeout(1000 * 60 * 5) // 5 minutes

  this.afterEach(() => {
    unmount()
  })

  it.only('should become a spatialdiv when enable-xr is present in div properties', async function () {
    const promise = new AsyncPromise<boolean>()

    function TestComponent() {
      const style: CSSProperties = {
        '--xr-back': '100',
      }

      const refFC = useCallback((ref: HTMLDivElement) => {
        console.log('refFC', ref)
        promise.resolve(true)
      }, [])

      return (
        <div enable-xr style={style} ref={refFC}>
          this is spatial div
        </div>
      )
    }

    render(<TestComponent />)

    const result = await promise.waitFinish()

    expect(result).to.be.true

    // there's a delay in updating the runtime info
    // need to fix it later
    await waitMS(500)

    const spatialSceneInfo = await window.inspectCurrentSpatialScene()
    console.log('dbg spatialSceneInfo', spatialSceneInfo)
    const children = Object.values(spatialSceneInfo.children)

    expect(children.length).to.be.equal(1)
    const firstChild: any = children[0]

    console.log('dbg firstChild', firstChild)

    expect(firstChild.transform.translation[2]).to.equal(100)
  })
})
