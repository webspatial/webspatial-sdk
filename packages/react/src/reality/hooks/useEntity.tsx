import { ForwardedRef, useEffect, useRef, useState } from 'react'
import { SpatialEntity } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import type {
  EntityMotionAnimation,
  EntityMotionBindingInternal,
} from './EntityMotionBinding'
import {
  EntityRefShape,
  EntityRef,
  useEntityEvent,
  useEntityId,
  useEntityRef,
  useEntityTransform,
  useForceUpdate,
} from '../hooks'

type UseEntityOptions = {
  createEntity: (signal: AbortSignal) => Promise<SpatialEntity>
  recreateKey?: string
} & EntityProps &
  EntityEventHandler & { ref: ForwardedRef<EntityRefShape> }

export const useEntity = ({
  ref,
  id,
  position,
  rotation,
  scale,
  enableInput,
  animation,
  onSpatialTap,
  onSpatialDragStart,
  onSpatialDrag,
  onSpatialDragEnd,
  onSpatialRotate,
  onSpatialRotateEnd,
  onSpatialMagnify,
  onSpatialMagnifyEnd,
  createEntity,
  recreateKey,
}: UseEntityOptions) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const instanceRef = useRef<EntityRef>(new EntityRef(null, ctx))

  const forceUpdate = useForceUpdate()
  const [bindingError, setBindingError] = useState<Error | null>(null)

  // Track the current animation prop for bind/unbind
  const prevAnimationRef = useRef<EntityMotionAnimation | undefined>(undefined)

  useEffect(() => {
    if (!ctx) return

    const controller = new AbortController()

    const init = async () => {
      try {
        const ent = await createEntity(controller.signal)
        if (!ent) return
        if (controller.signal.aborted) {
          ent.destroy()
          return
        }
        // Apply transform before adding to scene so it never flashes at default scale
        await ent.updateTransform({ position, rotation, scale })
        if (controller.signal.aborted) {
          ent.destroy()
          return
        }
        const result = parent
          ? await parent.addEntity(ent)
          : await ctx.reality.addEntity(ent)
        if (controller.signal.aborted) {
          ent.destroy()
          return
        }
        if (!result.success) {
          throw new Error(
            parent ? 'parent.addEntity failed' : 'ctx.reality.addEntity failed',
          )
        }

        instanceRef.current?.updateEntity(ent)
        forceUpdate()
      } catch (error) {
        console.error('useEntity init ~ error:', error)
      }
    }

    init()

    return () => {
      controller.abort()
      // Unbind animation on cleanup
      if (prevAnimationRef.current) {
        ;(
          prevAnimationRef.current as unknown as EntityMotionBindingInternal
        ).__unbind()
        prevAnimationRef.current = undefined
      }
      instanceRef.current?.destroy()
    }
  }, [ctx, parent, recreateKey])

  const entity = instanceRef.current.entity

  // Handle animation prop changes after initial mount
  useEffect(() => {
    if (!entity) return

    const prevAnimation = prevAnimationRef.current

    if (prevAnimation === animation) return

    // Unbind old animation
    if (prevAnimation) {
      ;(prevAnimation as unknown as EntityMotionBindingInternal).__unbind()
      prevAnimationRef.current = undefined
    }

    // Bind new animation
    if (animation) {
      try {
        ;(animation as unknown as EntityMotionBindingInternal).__bind(entity)
        prevAnimationRef.current = animation
      } catch (error) {
        setBindingError(
          error instanceof Error ? error : new Error(String(error)),
        )
      }
    }
  }, [animation, entity])

  useEntityId({ id, entity: instanceRef.current.entity })
  useEntityTransform(instanceRef.current.entity, {
    position,
    rotation,
    scale,
  })
  useEntityRef(ref, instanceRef.current)

  useEntityEvent({
    instance: instanceRef.current,
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
  })

  useEffect(() => {
    const ent = instanceRef.current.entity
    if (!ent) return
    if (enableInput !== undefined) {
      ent.enableInput = !!enableInput
    }
  }, [instanceRef.current.entity, enableInput])

  if (bindingError) throw bindingError

  return instanceRef.current.entity
}
