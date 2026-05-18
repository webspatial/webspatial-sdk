import React from 'react'
import { render, waitFor, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, describe, it, expect } from 'vitest'

import { withSSRSupported } from './withSSRSupported'

const RealComponent = React.forwardRef<
  HTMLDivElement,
  { style?: React.CSSProperties; className?: string }
>(({ style, className }, ref) => (
  <div data-testid="real" style={style} className={className} ref={ref}>
    Real Component
  </div>
))
RealComponent.displayName = 'RealComponent'

const Wrapped = withSSRSupported(RealComponent)

describe('withSSRSupported', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('SSR: renderToString yields placeholder div (no real subtree)', () => {
    const html = renderToString(
      <Wrapped style={{ color: 'red' }} className="test-class" />,
    )
    expect(html).not.toContain('data-testid')
    expect(html).not.toContain('Real Component')
    expect(html).toContain('test-class')
    expect(html).toContain('color')
  })

  it('CSR (jsdom): first paint renders real component', () => {
    const { getByTestId } = render(<Wrapped />)
    expect(getByTestId('real').textContent).toContain('Real Component')
  })

  it('forwards ref to real inner element on client', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Wrapped ref={ref} />)
    expect(ref.current?.getAttribute('data-testid')).toBe('real')
  })

  it('placeholder preserves style and className on SSR output', () => {
    const style = { color: 'red', fontSize: '16px' }
    const html = renderToString(
      <Wrapped style={style} className="test-class" />,
    )
    expect(html).toContain('test-class')
    expect(html).toContain('red')
    expect(html).toContain('16px')
  })

  it('hydrateRoot: placeholder then swaps to real implementation', async () => {
    const props = {
      style: { color: 'green' } as React.CSSProperties,
      className: 'transition-class',
    }
    const markup = renderToString(<Wrapped {...props} />)
    expect(markup).not.toContain('Real Component')

    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.appendChild(container)

    hydrateRoot(container, <Wrapped {...props} />)

    await waitFor(() => {
      expect(container.querySelector('[data-testid="real"]')).toBeTruthy()
    })
    const real = container.querySelector(
      '[data-testid="real"]',
    ) as HTMLDivElement
    expect(real.textContent).toContain('Real Component')
    expect(real.className).toBe('transition-class')
    expect(real.style.color).toBe('green')
  })

  it('wraps anonymous components', () => {
    const AnonymousComponent = () => <div>Anonymous</div>
    const AnonymousWrapped = withSSRSupported(AnonymousComponent)
    const { getByText } = render(<AnonymousWrapped />)
    expect(getByText('Anonymous')).toBeTruthy()
  })
})
