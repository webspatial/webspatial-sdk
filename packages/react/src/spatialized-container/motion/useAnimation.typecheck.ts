import type { SpatializedMotionConfig } from './useAnimation'
import type { SpatializedPlaybackApi } from '@webspatial/core-sdk'

const validSegment: SpatializedMotionConfig = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 1,
}

const validTimeline: SpatializedMotionConfig = {
  duration: 1,
  timeline: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
}

const validTracks: SpatializedMotionConfig = {
  duration: 1,
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

// @ts-expect-error timeline and to are mutually exclusive
const badTimelineTo: SpatializedMotionConfig = {
  duration: 1,
  timeline: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  to: { opacity: 1 },
}

// @ts-expect-error timeline and from are mutually exclusive
const badTimelineFrom: SpatializedMotionConfig = {
  duration: 1,
  timeline: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  from: { opacity: 0 },
}

// @ts-expect-error tracks and timeline are mutually exclusive
const badTracksTimeline: SpatializedMotionConfig = {
  duration: 1,
  tracks: [
    {
      property: 'opacity',
      keyframes: [{ at: 0, value: 0 }],
    },
  ],
  timeline: {
    '100%': { opacity: 1 },
  },
}

// @ts-expect-error tracks and to are mutually exclusive
const badTracksTo: SpatializedMotionConfig = {
  duration: 1,
  tracks: [
    {
      property: 'opacity',
      keyframes: [{ at: 0, value: 0 }],
    },
  ],
  to: { opacity: 1 },
}

void validSegment
void validTimeline
void validTracks
void badTimelineTo
void badTimelineFrom
void badTracksTimeline
void badTracksTo

declare const playbackApi: SpatializedPlaybackApi

playbackApi.pause()
playbackApi.resume()

// @ts-expect-error pause does not accept keys or partial selectors
playbackApi.pause(['opacity'])
// @ts-expect-error resume does not accept keys or partial selectors
playbackApi.resume(['transform'])
