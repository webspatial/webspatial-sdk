import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SpatializedContainerContext } from './context/SpatializedContainerContext'
import { SpatialID } from './SpatialID'
import {
  TransformVisibilityTaskContainer,
  initCSSParserDivContainer,
  resolveProbeIntrinsicTag,
} from './TransformVisibilityTaskContainer'

describe('resolveProbeIntrinsicTag', () => {
  it('returns the intrinsic tag string when component is a string', () => {
    expect(resolveProbeIntrinsicTag('h1')).toBe('h1')
    expect(resolveProbeIntrinsicTag('section')).toBe('section')
  })

  it('falls back to div for function or exotic component types', () => {
    function Custom() {
      return null
    }
    expect(resolveProbeIntrinsicTag(Custom)).toBe('div')
    expect(resolveProbeIntrinsicTag(undefined)).toBe('div')
  })
})

describe('TransformVisibilityTaskContainer probe tag', () => {
  let originalMutationObserver: typeof MutationObserver

  beforeEach(() => {
    originalMutationObserver = globalThis.MutationObserver
    globalThis.MutationObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(public callback: (mutations: unknown[]) => void) {}
    } as unknown as typeof MutationObserver
    initCSSParserDivContainer()
  })

  afterEach(() => {
    globalThis.MutationObserver = originalMutationObserver
    document
      .querySelectorAll('[data-id="css-parser-div-container"]')
      .forEach(el => el.remove())
  })

  function renderProbe(
    props: React.ComponentProps<typeof TransformVisibilityTaskContainer>,
  ) {
    const updateSpatialTransformVisibility = vi.fn()
    const spatializedContainerObject = {
      updateSpatialTransformVisibility,
    }
    return render(
      <SpatializedContainerContext.Provider
        value={spatializedContainerObject as never}
      >
        <TransformVisibilityTaskContainer {...props} />
      </SpatializedContainerContext.Provider>,
    )
  }

  it('portals a div probe by default', () => {
    renderProbe({
      [SpatialID]: 'tv-div',
      className: 'c',
    } as never)

    const parserHost = document.querySelector(
      '[data-id="css-parser-div-container"]',
    )!
    const probe = parserHost.querySelector(`[${SpatialID}="tv-div"]`)
    expect(probe?.tagName).toBe('DIV')
  })

  it('portals an h1 probe when component is h1', () => {
    renderProbe({
      [SpatialID]: 'tv-h1',
      component: 'h1',
      className: 'basicTransform',
    } as never)

    const parserHost = document.querySelector(
      '[data-id="css-parser-div-container"]',
    )!
    const probe = parserHost.querySelector(
      `h1[${SpatialID}="tv-h1"]`,
    ) as HTMLHeadingElement
    expect(probe).toBeTruthy()
    expect(probe.className).toBe('basicTransform')
  })

  it('applies tag selectors from document stylesheets to the probe', () => {
    const style = document.createElement('style')
    style.textContent = `
      h1.basicTransform {
        transform: translateZ(120px) rotateZ(30deg);
      }
    `
    document.head.appendChild(style)

    renderProbe({
      [SpatialID]: 'tv-h1-css',
      component: 'h1',
      className: 'basicTransform',
    } as never)

    const probe = document.querySelector(
      `h1[${SpatialID}="tv-h1-css"]`,
    ) as HTMLHeadingElement
    const computed = getComputedStyle(probe)
    expect(computed.transform).not.toBe('none')
    expect(computed.transform).toContain('rotateZ')
    expect(computed.transform).toContain('translateZ')

    style.remove()
  })
})
