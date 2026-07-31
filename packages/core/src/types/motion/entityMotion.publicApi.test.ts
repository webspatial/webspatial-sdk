import { describe, expect, expectTypeOf, test } from 'vitest'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityMotionTimeline,
  EntityPlaybackApi,
  EntityTransformUpdate,
} from '../../index'
import { EntityAnimationObject } from '../../index'
import type { SpatialEntity } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimateTransformResult } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimatedPropsInternal } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimationApi } from '../../index'
// @ts-expect-error Legacy Entity animation types are removed from the public API.
import type { AnimationConfig } from '../../index'
// @ts-expect-error Execution signatures are internal React coordination details.
import { getEntityMotionExecutionSignature } from '../../index'
// @ts-expect-error Silent validation is an internal React coordination detail.
import { validateEntityMotionConfigSilently } from '../../index'
// @ts-expect-error Canonical Entity motion payloads are internal-only.
import type { EntityMotionTimelinePayload } from '../../index'
// @ts-expect-error Entity animation construction options are internal-only.
import type { EntityAnimationObjectOptions } from '../../index'
import * as publicApi from '../../index'

// @ts-expect-error SpatialEntity no longer exposes the legacy animation entry.
type LegacyAnimateTransform = SpatialEntity['animateTransform']

describe('public Entity motion API', () => {
  test('exports authoring and playback types from the package entry', () => {
    expectTypeOf<EntityMotionConfig>().toBeObject()
    expectTypeOf<EntityMotionTimeline>().toBeObject()
    expectTypeOf<EntityMotionProps>().toBeObject()
    expectTypeOf<EntityTransformUpdate>().toBeObject()
    expectTypeOf<EntityPlaybackApi>().toBeObject()
    expectTypeOf<
      ConstructorParameters<typeof EntityAnimationObject>
    >().toEqualTypeOf<[id: string]>()
    expectTypeOf<ReturnType<SpatialEntity['createAnimation']>>().toEqualTypeOf<
      Promise<EntityAnimationObject>
    >()
  })

  test('keeps canonical normalization helpers off the package entry', () => {
    expect(publicApi).toHaveProperty('validateEntityMotionConfig')
    expect(publicApi).toHaveProperty('validateEntityTransformUpdate')
    expect(publicApi).not.toHaveProperty('getEntityMotionExecutionSignature')
    expect(publicApi).not.toHaveProperty('validateEntityMotionConfigSilently')
    expect(publicApi).not.toHaveProperty('normalizeEntityMotionConfig')
    expect(publicApi).not.toHaveProperty('serializeEntityMotionTimeline')
    expect(publicApi).not.toHaveProperty('createEntityAnimationObject')
  })
})

void (undefined as unknown as EntityMotionTimelinePayload)
void (undefined as unknown as EntityAnimationObjectOptions)
void (undefined as unknown as LegacyAnimateTransform)
void (undefined as unknown as AnimateTransformResult)
void (undefined as unknown as AnimatedPropsInternal)
void (undefined as unknown as AnimationApi)
void (undefined as unknown as AnimationConfig)
void getEntityMotionExecutionSignature
void validateEntityMotionConfigSilently
