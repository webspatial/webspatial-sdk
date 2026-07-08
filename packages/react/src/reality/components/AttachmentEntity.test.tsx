import React from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AttachmentEntity } from './AttachmentEntity'
import { RealityContext } from '../context/RealityContext'
import { ParentContext } from '../context/ParentContext'

function makeWindowProxy() {
  const document =
    window.document.implementation.createHTMLDocument('attachment')
  return {
    document,
    getComputedStyle: (el: Element) => window.getComputedStyle(el),
  } as unknown as WindowProxy
}

function setUniformRadius(el: HTMLElement, px: number) {
  const value = `${px}px`
  el.style.width = '200px'
  el.style.height = '100px'
  el.style.borderTopLeftRadius = value
  el.style.borderTopRightRadius = value
  el.style.borderBottomLeftRadius = value
  el.style.borderBottomRightRadius = value
}

function mountAttachmentEntity(
  props: React.ComponentProps<typeof AttachmentEntity>,
  seedRoot?: (body: HTMLElement) => HTMLElement | void,
) {
  const update = vi.fn()
  const destroy = vi.fn()
  const windowProxy = makeWindowProxy()
  const container = windowProxy.document.body
  const seededRoot = seedRoot?.(container)

  const session = {
    createAttachmentEntity: vi.fn(async () => ({
      update,
      destroy,
      getWindowProxy: () => windowProxy,
      getContainer: () => container,
    })),
  }
  const attachmentRegistry = {
    addContainer: vi.fn(),
    removeContainer: vi.fn(),
  }
  const ctx = {
    session,
    reality: { id: 'reality-1' },
    resourceRegistry: {} as any,
    attachmentRegistry,
  } as any
  const parent = { id: 'parent-1' } as any

  const view = render(
    <RealityContext.Provider value={ctx}>
      <ParentContext.Provider value={parent}>
        <AttachmentEntity {...props} />
      </ParentContext.Provider>
    </RealityContext.Provider>,
  )

  return { view, update, session, ctx, parent, seededRoot }
}

describe('AttachmentEntity', () => {
  it('creates and updates with entity-like transforms and meter dimensions', async () => {
    const initialPosition = { x: 1, y: 2, z: 3 }
    const initialRotation = { x: 10, y: 20, z: 30 }
    const initialScale = { x: 1, y: 1, z: 1 }

    const { view, update, session, ctx, parent } = mountAttachmentEntity({
      attachment: 'panel',
      position: initialPosition,
      rotation: initialRotation,
      scale: initialScale,
      width: 0.4,
      height: 0.2,
    })

    await act(async () => {})

    expect(session.createAttachmentEntity).toHaveBeenCalledWith({
      placement: { id: 'parent-1' },
      position: initialPosition,
      rotation: initialRotation,
      scale: initialScale,
      width: 0.4,
      height: 0.2,
      ownerViewId: 'reality-1',
    })

    const nextPosition = { x: 4, y: 5, z: 6 }
    const nextRotation = { x: 0, y: 90, z: 0 }
    const nextScale = { x: 2, y: 2, z: 2 }

    view.rerender(
      <RealityContext.Provider value={ctx}>
        <ParentContext.Provider value={parent}>
          <AttachmentEntity
            attachment="panel"
            position={nextPosition}
            rotation={nextRotation}
            scale={nextScale}
            width={0.5}
            height={0.25}
          />
        </ParentContext.Provider>
      </RealityContext.Provider>,
    )

    expect(update).toHaveBeenLastCalledWith({
      position: nextPosition,
      rotation: nextRotation,
      scale: nextScale,
      width: 0.5,
      height: 0.25,
    })
  })

  it('syncs cornerRadius from root CSS border-radius', async () => {
    const { update } = mountAttachmentEntity(
      { attachment: 'card', width: 0.35, height: 0.2 },
      body => {
        const root = body.ownerDocument.createElement('div')
        setUniformRadius(root, 24)
        body.appendChild(root)
        return root
      },
    )

    await act(async () => {})

    expect(update).toHaveBeenCalledWith({
      cornerRadius: {
        topLeading: 24,
        bottomLeading: 24,
        topTrailing: 24,
        bottomTrailing: 24,
      },
    })
  })

  it('updates cornerRadius when root style changes', async () => {
    const { update, seededRoot } = mountAttachmentEntity(
      { attachment: 'card', width: 0.35, height: 0.2 },
      body => {
        const root = body.ownerDocument.createElement('div')
        setUniformRadius(root, 8)
        body.appendChild(root)
        return root
      },
    )

    await act(async () => {})

    update.mockClear()
    setUniformRadius(seededRoot!, 32)
    await act(async () => {
      await Promise.resolve()
    })

    expect(update).toHaveBeenCalledWith({
      cornerRadius: {
        topLeading: 32,
        bottomLeading: 32,
        topTrailing: 32,
        bottomTrailing: 32,
      },
    })
  })
})
