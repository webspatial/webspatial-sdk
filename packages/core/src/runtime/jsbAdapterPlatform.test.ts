import { describe, expect, test } from 'vitest'
import { resolveJsbAdapterPlatform } from './jsbAdapterPlatform'

describe('resolveJsbAdapterPlatform', () => {
  test('Puppeteer UA maps to puppeteer', () => {
    expect(
      resolveJsbAdapterPlatform(
        'Mozilla/5.0 Puppeteer Chrome/120 WSAppShell/1.5.0 WebSpatial/1.5.0',
      ),
    ).toBe('puppeteer')
  })

  test('PicoWebApp with WebSpatial > 0.0.1 maps to picoos', () => {
    expect(
      resolveJsbAdapterPlatform(
        'Mozilla/5.0 PicoWebApp/0.1.1 WebSpatial/1.5.0',
      ),
    ).toBe('picoos')
  })

  test('Linux without Pico pico branch maps to visionos', () => {
    expect(
      resolveJsbAdapterPlatform(
        'Mozilla/5.0 (X11; Linux x86_64) WSAppShell/1.5.0 WebSpatial/1.5.0',
      ),
    ).toBe('visionos')
  })

  test('Mac visionOS-class UA maps to visionos', () => {
    expect(
      resolveJsbAdapterPlatform(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) WSAppShell/1.5.0 WebSpatial/1.5.0',
      ),
    ).toBe('visionos')
  })
})
