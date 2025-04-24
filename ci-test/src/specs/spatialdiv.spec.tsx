import React, { CSSProperties, useCallback } from 'react'
import { expect } from 'chai'
import { render, unmount } from './render'
import { AsyncPromise } from '../../utils/AsyncPromise'

describe.only('SpatialDiv', function () {
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
  })
})
