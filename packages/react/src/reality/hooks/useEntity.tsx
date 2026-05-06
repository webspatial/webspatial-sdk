import { ForwardedRef, useEffect, useRef } from 'react'
import { SpatialEntity } from '@webspatial/core-sdk'
import type { AnimatedProps } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
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

  // Track the current animation prop for bind/unbind
  const prevAnimationRef = useRef<AnimatedProps | undefined>(undefined)

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
        if (parent) {
          const result = await parent.addEntity(ent)
          if (!result.success) throw new Error('parent.addEntity failed')
        } else {
          const result = await ctx.reality.addEntity(ent)
          if (!result.success) throw new Error('ctx.reality.addEntity failed')
        }

        instanceRef.current?.updateEntity(ent)

        // Bind animation if present
        if (animation) {
          ;(animation as any).__bind?.(ent)
          prevAnimationRef.current = animation
        }

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
        ;(prevAnimationRef.current as any).__unbind?.()
        prevAnimationRef.current = undefined
      }
      instanceRef.current?.destroy()
    }
  }, [ctx, parent, recreateKey])

  // Handle animation prop changes after initial mount
  useEffect(() => {
    const entity = instanceRef.current.entity
    if (!entity) return

    const prevAnimation = prevAnimationRef.current

    if (prevAnimation === animation) return

    // Unbind old animation
    if (prevAnimation) {
      ;(prevAnimation as any).__unbind?.()
    }

    // Bind new animation
    if (animation) {
      ;(animation as any).__bind?.(entity)
    }

    prevAnimationRef.current = animation
  }, [animation, instanceRef.current.entity])

  useEntityId({ id, entity: instanceRef.current.entity })
  useEntityTransform(instanceRef.current.entity, {
    position,
    rotation,
    scale,
    animation,
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

  return instanceRef.current.entity
}
