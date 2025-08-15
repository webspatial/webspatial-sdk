import { Spatial } from '@webspatial/core-sdk'
import { expect, assert } from 'chai'

const fail = assert.fail

const session = new Spatial().requestSession()

describe('Core API', function () {
  it('SpatialHelper.instance is populated', function () {
    expect(session).to.be.true
  })

  it('setBackgroundStyle', async function () {
    const prevColor = document.documentElement.style.color
    const prevPadding = document.documentElement.style.padding
    document.documentElement.style.color = 'white'
    document.documentElement.style.padding = '50px'

    try {
      session?.getSpatialScene().updateSpatialProperties({
        material: 'translucent',
      })
    } catch (error) {
      fail('setBackgroundStyle failed')
    }

    document.documentElement.style.color = prevColor
    document.documentElement.style.padding = prevPadding
  })

  it('open panel', async function () {
    // this.timeout(15000)

    try {
      const windowProxy = window.open('/testPage.html')
      windowProxy?.close()
    } catch (error) {
      fail('failed')
    }
  })
})
