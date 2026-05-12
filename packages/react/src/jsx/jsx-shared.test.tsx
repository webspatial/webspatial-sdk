import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { Model, Reality } from '../facades'
import {
  __resetWithSpatialized2DElementContainerCacheForTests,
  withSpatialized2DElementContainer,
} from '../facades/withSpatialized2DElementContainer'
import {
  __resetWithSpatialMonitorCacheForTests,
  withSpatialMonitor,
} from '../facades/withSpatialMonitor'
import { __resetBootForgottenWarningForTests } from '../facades/shared/warnBootForgotten'
import { __resetBootStateForTests } from '../runtime/boot'
import { __resetSpatialBridgeForTests } from '../runtime/bridge'
import {
  createElement as sdkCreateElement,
  jsx,
  jsxDEV,
  jsxs,
  replaceToSpatialPrimitiveType,
} from './jsx-shared'

function setPlainWebUserAgent(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
  })
}

describe('jsx-shared: replaceToSpatialPrimitiveType + JSX call sites', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    __resetBootForgottenWarningForTests()
    __resetWithSpatialized2DElementContainerCacheForTests()
    __resetWithSpatialMonitorCacheForTests()
    setPlainWebUserAgent()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // The native HTML <model> element is part of a future spec and not
    // recognized by jsdom / React's intrinsic table; the Model facade
    // bypass path keeps `type === Model` untouched, but a few SSR tests
    // exercise renderToString through the Model facade fallback which can
    // surface React's "unknown tag" warning. Suppress to keep test output
    // clean — the DOM contract is still asserted explicitly.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    __resetBootForgottenWarningForTests()
    __resetWithSpatialized2DElementContainerCacheForTests()
    __resetWithSpatialMonitorCacheForTests()
  })

  describe('marker isolation — each marker independently triggers strip + facade wrap', () => {
    it('enable-xr attribute → withSpatialized2DElementContainer wrap and prop is stripped', () => {
      const props: Record<string, any> = { 'enable-xr': true, id: 'a' }
      const result = replaceToSpatialPrimitiveType('div', props)

      expect(result).toBe(withSpatialized2DElementContainer('div'))
      expect('enable-xr' in props).toBe(false)
      expect(props.id).toBe('a')
    })

    it('enable-xr-monitor attribute → withSpatialMonitor wrap and prop is stripped', () => {
      const props: Record<string, any> = {
        'enable-xr-monitor': true,
        id: 'b',
      }
      const result = replaceToSpatialPrimitiveType('section', props)

      expect(result).toBe(withSpatialMonitor('section'))
      expect('enable-xr-monitor' in props).toBe(false)
      expect(props.id).toBe('b')
    })

    it('props.style.enableXr → withSpatialized2DElementContainer wrap and key is stripped via spread-clone (original ref unchanged)', () => {
      const styleRef: React.CSSProperties & { enableXr?: boolean } = {
        color: 'red',
        enableXr: true,
      }
      const props: Record<string, any> = { style: styleRef }
      const result = replaceToSpatialPrimitiveType('div', props)

      expect(result).toBe(withSpatialized2DElementContainer('div'))
      // New ref on props
      expect(props.style).not.toBe(styleRef)
      expect('enableXr' in (props.style as object)).toBe(false)
      expect(props.style).toEqual({ color: 'red' })
      // Original user-supplied ref MUST be unchanged
      expect(styleRef).toEqual({ color: 'red', enableXr: true })
      expect('enableXr' in styleRef).toBe(true)
    })

    it('props.style.enableXr survives Object.freeze on the user-supplied style ref', () => {
      const frozenStyle = Object.freeze({
        color: 'blue',
        enableXr: true,
      }) as React.CSSProperties & { enableXr?: boolean }
      const props: Record<string, any> = { style: frozenStyle }

      expect(() => replaceToSpatialPrimitiveType('div', props)).not.toThrow()
      expect(props.style).not.toBe(frozenStyle)
      expect('enableXr' in (props.style as object)).toBe(false)
      // The frozen original MUST remain bit-for-bit intact.
      expect(Object.isFrozen(frozenStyle)).toBe(true)
      expect(frozenStyle).toEqual({ color: 'blue', enableXr: true })
    })

    it('className __enableXr__ token → withSpatialized2DElementContainer wrap; token removed; ordering preserved', () => {
      const props: Record<string, any> = {
        className: 'a __enableXr__ b c',
      }
      const result = replaceToSpatialPrimitiveType('div', props)

      expect(result).toBe(withSpatialized2DElementContainer('div'))
      expect(props.className).toBe('a b c')
    })

    it('className: stripped token collapses its delimiter; surrounding tokens keep ordering (matches legacy split-by-space behavior)', () => {
      const props: Record<string, any> = {
        className: ' __enableXr__ a b ',
      }
      replaceToSpatialPrimitiveType('div', props)
      // `' __enableXr__ a b '`.split(' ') → ['', '__enableXr__', 'a', 'b', ''];
      // filter removes the token, join(' ') → ' a b '. This matches the
      // legacy implementation's behavior (single-space delimiter, no
      // multi-space preservation around the removed token).
      expect(props.className).toBe(' a b ')
    })

    it('className substring match (NOT a token boundary) does NOT trigger wrap or strip', () => {
      const props: Record<string, any> = { className: '__enableXr__suffix' }
      const result = replaceToSpatialPrimitiveType('div', props)

      expect(result).toBe('div')
      expect(props.className).toBe('__enableXr__suffix')
    })

    it('HTML-style props.class is NOT recognized as a marker source (per spec)', () => {
      const props: Record<string, any> = { class: '__enableXr__' }
      const result = replaceToSpatialPrimitiveType('div', props)

      expect(result).toBe('div')
      expect(props.class).toBe('__enableXr__')
      expect('className' in props).toBe(false)
    })
  })

  describe('Model type bypasses strip and wrap', () => {
    it('returns Model unchanged when type === Model', () => {
      const props: Record<string, any> = {
        'enable-xr': true,
        style: { enableXr: true, color: 'red' },
        className: '__enableXr__ extra',
      }
      const result = replaceToSpatialPrimitiveType(Model as any, props)

      expect(result).toBe(Model)
      expect(props['enable-xr']).toBe(true)
      expect(props.style.enableXr).toBe(true)
      expect(props.className).toBe('__enableXr__ extra')
    })
  })

  describe('combined markers — all stripped, single wrap by priority', () => {
    it('strips enable-xr, enable-xr-monitor, style.enableXr, and className __enableXr__ in one pass', () => {
      const styleRef = { color: 'red', enableXr: true }
      const props: Record<string, any> = {
        'enable-xr': true,
        'enable-xr-monitor': true,
        style: styleRef,
        className: 'pre __enableXr__ post',
      }
      const result = replaceToSpatialPrimitiveType('div', props)

      // Priority: enable-xr wins → wrap with withSpatialized2DElementContainer
      expect(result).toBe(withSpatialized2DElementContainer('div'))

      expect('enable-xr' in props).toBe(false)
      expect('enable-xr-monitor' in props).toBe(false)
      expect((props.style as object) === styleRef).toBe(false)
      expect('enableXr' in (props.style as object)).toBe(false)
      expect(props.className).toBe('pre post')
      // Original user style ref MUST be unchanged.
      expect(styleRef).toEqual({ color: 'red', enableXr: true })
    })

    it('without enable-xr but with enable-xr-monitor only, wraps with withSpatialMonitor', () => {
      const props: Record<string, any> = {
        'enable-xr-monitor': true,
        style: { enableXr: true },
        className: '__enableXr__',
      }
      const result = replaceToSpatialPrimitiveType('article', props)

      expect(result).toBe(withSpatialMonitor('article'))
      // All other markers still get stripped even though the monitor branch won wrap.
      expect('enable-xr-monitor' in props).toBe(false)
      expect('enableXr' in (props.style as object)).toBe(false)
      expect(props.className).toBe('')
    })
  })

  describe('no marker present → no-op (per "No marker present is a no-op" Scenario)', () => {
    it('returns the original type and does not clone props.style nor split className', () => {
      const styleRef = { color: 'red' }
      const props: Record<string, any> = {
        id: 'x',
        style: styleRef,
        className: 'a b c',
      }
      const result = replaceToSpatialPrimitiveType('div', props)

      expect(result).toBe('div')
      // style ref preserved (no clone).
      expect(props.style).toBe(styleRef)
      // className identity preserved (no split / join).
      expect(props.className).toBe('a b c')
      expect(props.id).toBe('x')
    })

    it('non-object props (null) returns the type without mutation', () => {
      const result = replaceToSpatialPrimitiveType('div', null)
      expect(result).toBe('div')
    })

    it('non-object props (undefined) returns the type without mutation', () => {
      const result = replaceToSpatialPrimitiveType('div', undefined)
      expect(result).toBe('div')
    })
  })

  describe('all JSX call sites (jsx / jsxs / jsxDEV / createElement) route through replaceToSpatialPrimitiveType', () => {
    it('jsx forwards the wrapped type and stripped props to react/jsx-runtime', () => {
      const props: Record<string, any> = { 'enable-xr': true, id: 'jsx-id' }
      const el = jsx('div', props, undefined) as React.ReactElement

      expect(React.isValidElement(el)).toBe(true)
      expect(el.type).toBe(withSpatialized2DElementContainer('div'))
      expect('enable-xr' in el.props).toBe(false)
      expect(el.props.id).toBe('jsx-id')
    })

    it('jsxs forwards the wrapped type and stripped props to react/jsx-runtime', () => {
      const props: Record<string, any> = {
        'enable-xr-monitor': true,
        children: [
          React.createElement('span', { key: '1' }, 'one'),
          React.createElement('span', { key: '2' }, 'two'),
        ],
      }
      const el = jsxs('section', props, undefined) as React.ReactElement

      expect(React.isValidElement(el)).toBe(true)
      expect(el.type).toBe(withSpatialMonitor('section'))
      expect('enable-xr-monitor' in el.props).toBe(false)
    })

    it('jsxDEV forwards the wrapped type and stripped props to react/jsx-dev-runtime', () => {
      const props: Record<string, any> = {
        style: { enableXr: true, color: 'red' },
      }
      const el = jsxDEV(
        'div',
        props,
        undefined as unknown as React.Key,
        false,
        undefined,
        undefined,
      ) as React.ReactElement

      expect(React.isValidElement(el)).toBe(true)
      expect(el.type).toBe(withSpatialized2DElementContainer('div'))
      expect('enableXr' in (el.props.style as object)).toBe(false)
      expect((el.props.style as { color: string }).color).toBe('red')
    })

    it('createElement (deprecated) also routes through replaceToSpatialPrimitiveType', () => {
      const props: Record<string, any> = { className: '__enableXr__ keep' }
      const el = sdkCreateElement(
        'div' as any,
        props as any,
      ) as React.ReactElement

      expect(React.isValidElement(el)).toBe(true)
      expect(el.type).toBe(withSpatialized2DElementContainer('div'))
      expect(el.props.className).toBe('keep')
    })
  })

  describe('SSR — strip + wrap behave identically to client-side rendering', () => {
    it('renderToString produces HTML free of WebSpatial-only markers', () => {
      // We construct the tree via the SDK jsx call site directly to
      // exercise the same code path the bundled JSX transform feeds.
      const jsxProps: Record<string, any> = {
        'enable-xr': true,
        style: { enableXr: true, color: 'red' },
        className: 'a __enableXr__ b',
        children: 'hello',
      }
      const html = renderToString(
        jsx('div', jsxProps, 'k') as React.ReactElement,
      )

      expect(html).not.toContain('enable-xr')
      expect(html).not.toContain('enableXr')
      expect(html).not.toContain('__enableXr__')
      // Color style and remaining class tokens survive.
      expect(html).toContain('color:red')
      expect(html).toContain('class="a b"')
      expect(html).toContain('hello')
    })

    it('renderToString through the SDK createElement matches the JSX path', () => {
      const styleRef = { color: 'blue', enableXr: true }
      const props: Record<string, any> = {
        style: styleRef,
        className: '__enableXr__',
      }
      const html = renderToString(
        sdkCreateElement(
          'span' as any,
          props as any,
          'world',
        ) as React.ReactElement,
      )

      expect(html).not.toContain('enableXr')
      expect(html).not.toContain('__enableXr__')
      // Spec: original style ref MUST NOT be mutated, even after SSR.
      expect(styleRef.enableXr).toBe(true)
    })
  })

  describe('createElement export carries the @deprecated JSDoc annotation', () => {
    it('the named export is still callable and returns a valid React element (v1 behavior unchanged)', () => {
      // The deprecation JSDoc lives in the source. We verify the function is
      // still callable + returns a valid React element so downstream
      // consumers using the classic `"jsx": "react"` + `jsxFactory:
      // createElement` transform keep working in v1.
      const el = sdkCreateElement('div' as any, { id: 'survives-v1' } as any)
      expect(React.isValidElement(el)).toBe(true)
    })
  })

  describe('Reality type bypasses strip and wrap', () => {
    it('does not rewrite Reality into a 2D spatialized container when enable-xr is present', () => {
      const props: Record<string, any> = { 'enable-xr': true }
      const result = replaceToSpatialPrimitiveType(Reality, props)

      expect(result).toBe(Reality)
      expect(props).toHaveProperty('enable-xr', true)
    })

    it('strips enable-xr before SpatializedContainer forwards props to its host element', () => {
      const { getByTestId } = render(
        React.createElement(Reality, {
          'enable-xr': true,
          'data-testid': 'reality-host',
        } as React.ComponentProps<typeof Reality> & { 'data-testid': string }),
      )

      expect(getByTestId('reality-host').getAttribute('enable-xr')).toBeNull()
    })
  })
})
