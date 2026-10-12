import { describe, expect, expectTypeOf, test } from 'vitest'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
} from '../../index'
import type { SpatialEntity } from '../../index'
// @ts-expect-error Entity transform update type was removed from the package entry.
import type { EntityTransformUpdate } from '../../index'
// @ts-expect-error Entity motion frame authoring type is not exported from the package entry.
import type { EntityMotionFrame } from '../../index'
// @ts-expect-error Entity motion patch type is not exported from the package entry.
import type { EntityMotionPatch } from '../../index'
// @ts-expect-error Entity motion timeline type is not exported from the package entry.
import type { EntityMotionTimeline } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimateTransformResult } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimatedPropsInternal } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimationApi } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimationConfig } from '../../index'
// @ts-expect-error Canonical Entity motion payloads are internal-only.
import type { EntityMotionTimelinePayload } from '../../index'
// @ts-expect-error Entity animation construction options are internal-only.
import type { EntityAnimationObjectOptions } from '../../index'
// @ts-expect-error EntityAnimationObject is an internal Core implementation.
import type { EntityAnimationObject as PublicEntityAnimationObject } from '../../index'
// @ts-expect-error Entity motion validation is an internal Core implementation.
import type { validateEntityMotionConfig as PublicValidateEntityMotionConfig } from '../../index'
import * as publicApi from '../../index'

type EntityAnimationObject = Awaited<
  ReturnType<SpatialEntity['createAnimation']>
>

// @ts-expect-error SpatialEntity no longer exposes the legacy animation entry.
type LegacyAnimateTransform = SpatialEntity['animateTransform']

describe('public Entity motion API', () => {
  test('exports authoring and playback types from the package entry', () => {
    expectTypeOf<EntityMotionConfig>().toBeObject()
    expectTypeOf<EntityMotionProps>().toBeObject()
    expectTypeOf<EntityPlaybackApi>().toBeObject()
    expectTypeOf<ReturnType<SpatialEntity['createAnimation']>>().toEqualTypeOf<
      Promise<EntityAnimationObject>
    >()
  })

  test('keeps canonical normalization helpers off the package entry', () => {
    expect(publicApi).not.toHaveProperty('validateEntityMotionConfig')
    expect(publicApi).not.toHaveProperty('validateEntityTransformUpdate')
    expect(publicApi).not.toHaveProperty('EntityAnimationObject')
    expect(publicApi).not.toHaveProperty('normalizeEntityMotionConfig')
    expect(publicApi).not.toHaveProperty('serializeEntityMotionTimeline')
    expect(publicApi).not.toHaveProperty('createEntityAnimationObject')
  })
})

void (undefined as unknown as EntityMotionTimelinePayload)
void (undefined as unknown as EntityAnimationObjectOptions)
void (undefined as unknown as PublicEntityAnimationObject)
void (undefined as unknown as PublicValidateEntityMotionConfig)
void (undefined as unknown as LegacyAnimateTransform)
void (undefined as unknown as AnimateTransformResult)
void (undefined as unknown as AnimatedPropsInternal)
void (undefined as unknown as AnimationApi)
void (undefined as unknown as AnimationConfig)
void (undefined as unknown as EntityMotionFrame)
void (undefined as unknown as EntityMotionPatch)
void (undefined as unknown as EntityMotionTimeline)
