import React from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AttachmentEntity } from './AttachmentEntity'
import { RealityContext } from '../context/RealityContext'
import { ParentContext } from '../context/ParentContext'

function makeWindowProxy() {
  const document =
    window.document.implementation.createHTMLDocument('attachment')
  return { document } as unknown as WindowProxy
}

describe('AttachmentEntity', () => {
  it('creates and updates with entity-like transforms and meter dimensions', async () => {
    const update = vi.fn()
    const destroy = vi.fn()
    const container = document.createElement('div')
    const session = {
      createAttachmentEntity: vi.fn(async () => ({
        update,
        destroy,
        getWindowProxy: () => makeWindowProxy(),
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

    const initialPosition = { x: 1, y: 2, z: 3 }
    const initialRotation = { x: 10, y: 20, z: 30 }
    const initialScale = { x: 1, y: 1, z: 1 }

    const view = render(
      <RealityContext.Provider value={ctx}>
        <ParentContext.Provider value={parent}>
          <AttachmentEntity
            attachment="panel"
            position={initialPosition}
            rotation={initialRotation}
            scale={initialScale}
            width={0.4}
            height={0.2}
          />
        </ParentContext.Provider>
      </RealityContext.Provider>,
    )

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
})
