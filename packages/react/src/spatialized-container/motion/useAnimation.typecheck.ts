import type { SpatializedMotionConfig } from './useAnimation'
import type { SpatializedPlaybackApi } from '@webspatial/core-sdk'

// @ts-expect-error canonical tracks are not part of the stable Core type surface
import type { SpatializedMotionTrack } from '@webspatial/core-sdk'

const validSegment: SpatializedMotionConfig = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 1,
}

const validTimeline: SpatializedMotionConfig = {
  duration: 1,
  timeline: {
    from: { opacity: 0 },
    '50%': { opacity: 0.5 },
    to: { opacity: 1 },
  },
}

const validTimelineWithIgnoredTopLevelBoundaries: SpatializedMotionConfig = {
  duration: 1,
  from: { opacity: 0.25 },
  to: { opacity: 0.75 },
  timeline: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
}

// @ts-expect-error top-level segment authoring requires from
const badSegmentWithoutFrom: SpatializedMotionConfig = {
  to: { opacity: 1 },
}

// @ts-expect-error top-level segment authoring requires to
const badSegmentWithoutTo: SpatializedMotionConfig = {
  from: { opacity: 0 },
}

const badTracks: SpatializedMotionConfig = {
  duration: 1,
  // @ts-expect-error tracks are internal and are not public authoring
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { at: 0, value: 0 },
        { at: 1, value: 1 },
      ],
    },
  ],
}

void validSegment
void validTimeline
void validTimelineWithIgnoredTopLevelBoundaries
void badSegmentWithoutFrom
void badSegmentWithoutTo
void badTracks
void (null as SpatializedMotionTrack | null)

declare const playbackApi: SpatializedPlaybackApi

playbackApi.pause()
playbackApi.play()

// @ts-expect-error pause does not accept keys or partial selectors
playbackApi.pause(['opacity'])
// @ts-expect-error resume is replaced by play
playbackApi.resume()
