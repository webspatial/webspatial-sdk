import React, { CSSProperties, useCallback } from 'react'
import { expect } from 'chai'
import { render, unmount } from './render'
import { AsyncPromise } from '../../utils/AsyncPromise'
import {
  getRootSpatialEntityInfo,
  getEntitySpatialWindowComponentInfo,
  parseSIMD3,
} from './runtime-info'

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

  it('should become a spatialdiv when enable-xr is present in div properties', async function () {
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

    const rootSpatialEntityInfo = await getRootSpatialEntityInfo()
    console.log('rootSpatialEntityInfo', rootSpatialEntityInfo)

    expect(rootSpatialEntityInfo).to.be.an('object')
    expect(rootSpatialEntityInfo).to.have.property('childEntities')
    expect(rootSpatialEntityInfo.childEntities).to.be.an('object')
    expect(Object.keys(rootSpatialEntityInfo.childEntities).length).to.equal(1)

    const spatialDivEntity = Object.values(
      rootSpatialEntityInfo.childEntities,
    )[0]

    console.log('spatialDivEntity', spatialDivEntity)

    const spatialWindowComponent =
      getEntitySpatialWindowComponentInfo(spatialDivEntity)
    expect(spatialWindowComponent).to.be.an('object')

    // position.z should be 100
    const position = parseSIMD3(spatialDivEntity.position)
    expect(position.z).to.equal(100)
  })
})
