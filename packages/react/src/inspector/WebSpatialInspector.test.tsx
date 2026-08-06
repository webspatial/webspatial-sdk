import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSpatialInspector } from './WebSpatialInspector'

const mocks = vi.hoisted(() => ({
  inspect: vi.fn(),
}))

vi.mock('../ornament', () => ({
  Ornament: ({ children }: { children: ReactNode }) => (
    <div data-testid="ornament">{children}</div>
  ),
}))

vi.mock('../utils/getSession', () => ({
  getSession: () => ({
    getSpatialScene: () => ({
      inspect: mocks.inspect,
    }),
  }),
}))

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

function scenePayload(width = 320) {
  return {
    id: 'scene-1',
    children: {
      div: {
        id: 'native-div-1',
        name: 'Card',
        type: 'Spatialized2DElement',
        width,
        height: 180,
        depth: 24,
        backOffset: 8,
        opacity: 1,
        visible: true,
        zIndex: 0,
      },
    },
    ornaments: {},
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(inResolve => {
    resolve = inResolve
  })
  return { promise, resolve }
}

describe('WebSpatialInspector', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    mocks.inspect.mockReset()
    mocks.inspect.mockResolvedValue(scenePayload())
  })

  afterEach(() => {
    cleanup()
    document.title = ''
    document
      .querySelectorAll('[data-webspatial-inspector-highlight]')
      .forEach(element => element.remove())
    vi.unstubAllGlobals()
  })

  it('renders the normalized native scene tree inside an Ornament', async () => {
    render(<WebSpatialInspector />)

    expect(await screen.findByText('WebSpatial Inspector')).toBeDefined()
    expect(await screen.findByText('Card')).toBeDefined()
    expect(document.title).toBe('WebSpatial Inspector')
    expect(mocks.inspect).toHaveBeenCalledTimes(1)

    await new Promise(resolve => window.setTimeout(resolve, 180))
    expect(mocks.inspect).toHaveBeenCalledTimes(1)
  })

  it('refreshes once when WebSpatial state changes', async () => {
    render(<WebSpatialInspector />)
    expect(await screen.findByText('Card')).toBeDefined()
    expect(mocks.inspect).toHaveBeenCalledTimes(1)

    document.dispatchEvent(new CustomEvent('webspatialinspectchange'))
    document.dispatchEvent(new CustomEvent('webspatialinspectchange'))

    await waitFor(() => {
      expect(mocks.inspect).toHaveBeenCalledTimes(2)
    })
  })

  it('runs a pending refresh after an in-flight inspect completes', async () => {
    const firstInspect = deferred<ReturnType<typeof scenePayload>>()
    mocks.inspect
      .mockReturnValueOnce(firstInspect.promise)
      .mockResolvedValue(scenePayload(640))

    render(<WebSpatialInspector />)
    await waitFor(() => expect(mocks.inspect).toHaveBeenCalledTimes(1))

    document.dispatchEvent(new Event('webspatialinspectchange'))
    await new Promise(resolve => window.setTimeout(resolve, 160))
    expect(mocks.inspect).toHaveBeenCalledTimes(1)

    firstInspect.resolve(scenePayload())
    await waitFor(() => expect(mocks.inspect).toHaveBeenCalledTimes(2))
  })

  it('links a selected native node to its DOM placeholder and applies supported edits', async () => {
    const placeholder = document.createElement('div')
    placeholder.setAttribute('data-spatial-id', 'root_container')
    const sync = deferred<void>()
    const syncSpatializedElement = vi.fn(() => sync.promise)
    Object.assign(placeholder, {
      __innerSpatializedElement: () => ({ id: 'native-div-1' }),
      __syncSpatializedElement: syncSpatializedElement,
    })
    document.body.appendChild(placeholder)
    mocks.inspect
      .mockResolvedValueOnce(scenePayload())
      .mockResolvedValue(scenePayload(480))

    render(<WebSpatialInspector editable />)
    fireEvent.click(await screen.findByText('Card'))

    expect(await screen.findByText('DOM placeholder linked')).toBeDefined()
    expect(
      document.querySelector('[data-webspatial-inspector-highlight]'),
    ).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Width'), {
      target: { value: '480' },
    })
    fireEvent.click(screen.getByText('Apply to page'))

    expect(placeholder.style.width).toBe('480px')
    expect(syncSpatializedElement).toHaveBeenCalledTimes(1)
    expect(mocks.inspect).toHaveBeenCalledTimes(1)

    sync.resolve()
    await waitFor(() => expect(mocks.inspect).toHaveBeenCalledTimes(2))
    expect(
      (screen.getByLabelText('Width') as HTMLInputElement).valueAsNumber,
    ).toBe(480)

    placeholder.remove()
  })

  it('repositions the highlight after surrounding page layout changes', async () => {
    const placeholder = document.createElement('div')
    placeholder.setAttribute('data-spatial-id', 'root_container')
    let left = 12
    placeholder.getBoundingClientRect = () => new DOMRect(left, 20, 100, 50)
    Object.assign(placeholder, {
      __innerSpatializedElement: () => ({ id: 'native-div-1' }),
    })
    document.body.appendChild(placeholder)

    render(<WebSpatialInspector />)
    fireEvent.click(await screen.findByText('Card'))

    const highlight = document.querySelector<HTMLElement>(
      '[data-webspatial-inspector-highlight]',
    )!
    await waitFor(() => expect(highlight.style.left).toBe('12px'))

    left = 84
    const sibling = document.createElement('div')
    document.body.insertBefore(sibling, placeholder)

    await waitFor(() => expect(highlight.style.left).toBe('84px'))

    sibling.remove()
    placeholder.remove()
  })

  it('updates the editor draft when the selected node is refreshed', async () => {
    const placeholder = document.createElement('div')
    placeholder.setAttribute('data-spatial-id', 'root_container')
    Object.assign(placeholder, {
      __innerSpatializedElement: () => ({ id: 'native-div-1' }),
    })
    document.body.appendChild(placeholder)

    mocks.inspect
      .mockResolvedValueOnce(scenePayload())
      .mockResolvedValue(scenePayload(640))

    render(<WebSpatialInspector editable />)
    fireEvent.click(await screen.findByText('Card'))
    expect(
      (screen.getByLabelText('Width') as HTMLInputElement).valueAsNumber,
    ).toBe(320)

    fireEvent.click(screen.getByText('Refresh'))
    await waitFor(() =>
      expect(
        (screen.getByLabelText('Width') as HTMLInputElement).valueAsNumber,
      ).toBe(640),
    )

    placeholder.remove()
  })

  it('renders selected node properties in a stable order', async () => {
    mocks.inspect.mockResolvedValue({
      ...scenePayload(),
      children: {
        div: {
          zIndex: 3,
          width: 320,
          position: { z: 3, x: 1, y: 2 },
          parent: 'scene-1',
          id: 'native-div-1',
          visible: true,
          type: 'Spatialized2DElement',
          name: 'Card',
          height: 180,
        },
      },
    })

    render(<WebSpatialInspector />)
    fireEvent.click(await screen.findByText('Card'))

    const details = screen.getByLabelText('Selected node details').textContent!
    expect(details.indexOf('id')).toBeLessThan(details.indexOf('name'))
    expect(details.indexOf('name')).toBeLessThan(details.indexOf('type'))
    expect(details.indexOf('type')).toBeLessThan(details.indexOf('parent'))
    expect(details.indexOf('width')).toBeLessThan(details.indexOf('height'))
    expect(details.indexOf('height')).toBeLessThan(details.indexOf('zIndex'))
    expect(details).toContain('{"x":1,"y":2,"z":3}')
  })
})
