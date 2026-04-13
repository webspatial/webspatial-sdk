/**
 * Versioned capability rows transcribed from the product matrix (`capability-matrix.template.md`).
 * visionOS **WSAppShell/1.5.0** & **1.6.0**; picoOS **PicoWebApp/0.1.1** & **0.1.2** — see matrix in OpenSpec / product docs.
 */
import { SUB_TOKENS_BY_NAME, TOP_LEVEL_KEYS } from './keys'

export type CapabilityVersionRow = {
  /** Semver string from `WSAppShell` / `PicoWebApp` (see `review.md` §4). */
  version: string
  /** Top-level keys and `name:subToken` compound keys. */
  flags: Record<string, boolean>
}

function baseTrueFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {}
  for (const k of TOP_LEVEL_KEYS) {
    flags[k] = true
  }
  for (const [name, toks] of Object.entries(SUB_TOKENS_BY_NAME)) {
    for (const t of toks) {
      flags[`${name}:${t}`] = true
    }
  }
  return flags
}

/**
 * visionOS 1.5.0 / picoOS 0.1.1 — alpha2.0 baseline.
 * Model: only `ready`, `currentSrc`, `entityTransform` among tracked sub-tokens are Y; SpatialRotateEvent:constrainedToAxis Y.
 */
function matrixVision_1_5_0_Pico_0_1_1_Flags(): Record<string, boolean> {
  const flags = baseTrueFlags()
  const modelNo = [
    'autoplay',
    'loop',
    'stagemode',
    'poster',
    'loading',
    'source',
    'paused',
    'duration',
    'playbackRate',
    'play',
    'pause',
    'currentTime',
  ] as const
  for (const t of modelNo) {
    flags[`Model:${t}`] = false
  }
  flags['SpatialRotateEvent:constrainedToAxis'] = true
  return flags
}

/**
 * visionOS 1.6.0 / picoOS 0.1.2 — WebSpatial April / alpha2.0 playback expansion.
 * Model: `stagemode`, `poster`, `loading`, `currentTime` remain N; rest of tracked Model sub-tokens Y.
 */
function matrixVision_1_6_0_Pico_0_1_2_Flags(): Record<string, boolean> {
  const flags = baseTrueFlags()
  for (const t of ['stagemode', 'poster', 'loading', 'currentTime'] as const) {
    flags[`Model:${t}`] = false
  }
  flags['SpatialRotateEvent:constrainedToAxis'] = true
  return flags
}

function visionOsRow_1_5_0(): CapabilityVersionRow {
  return { version: '1.5.0', flags: matrixVision_1_5_0_Pico_0_1_1_Flags() }
}

function visionOsRow_1_6_0(): CapabilityVersionRow {
  return { version: '1.6.0', flags: matrixVision_1_6_0_Pico_0_1_2_Flags() }
}

function picoOsRow_0_1_1(): CapabilityVersionRow {
  return { version: '0.1.1', flags: matrixVision_1_5_0_Pico_0_1_1_Flags() }
}

function picoOsRow_0_1_2(): CapabilityVersionRow {
  return { version: '0.1.2', flags: matrixVision_1_6_0_Pico_0_1_2_Flags() }
}

export const CAPABILITY_TABLE: {
  visionos: CapabilityVersionRow[]
  picoos: CapabilityVersionRow[]
} = {
  visionos: [visionOsRow_1_5_0(), visionOsRow_1_6_0()],
  picoos: [picoOsRow_0_1_1(), picoOsRow_0_1_2()],
}
