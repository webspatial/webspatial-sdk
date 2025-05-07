import { expect, assert } from 'chai'
import { SpatialHelper } from '@webspatial/core-sdk'

const fail = assert.fail

describe('Core API', function () {
  it('SpatialHelper.instance is populated', function () {
    expect(SpatialHelper.instance !== null).to.be.true
  })

  it('setBackgroundStyle', async function () {
    const prevColor = document.documentElement.style.color
    const prevPadding = document.documentElement.style.padding
    document.documentElement.style.color = 'white'
    document.documentElement.style.padding = '50px'

    try {
      await SpatialHelper.instance!.setBackgroundStyle(
        { material: { type: 'translucent' }, cornerRadius: 50 },
        '#00000000',
      )
    } catch (error) {
      fail('setBackgroundStyle failed')
    }

    document.documentElement.style.color = prevColor
    document.documentElement.style.padding = prevPadding
  })

  it('open panel', async function () {
    this.timeout(15000)
    try {
      const page = await SpatialHelper.instance!.navigation.openPanel(
        '/testPage.html',
        { resolution: { width: 100, height: 100 } },
      )
      await new Promise(r => setTimeout(r, 2000))
      await page.windowContainer.close()
    } catch (error) {
      fail('failed')
    }
  })

  it('createShapeEntity', async function () {
    try {
      await SpatialHelper.instance!.shape.createShapeEntity()
    } catch (error) {
      fail('failed')
    }
  })
})
