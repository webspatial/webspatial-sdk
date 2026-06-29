/**
 * Versioned capability rows transcribed from the product matrix (`capability-matrix.template.md`).
 * visionOS **WSAppShell/1.5.0** & **1.6.0** & **1.7.0** & **1.8.0**; picoOS **PicoWebApp/0.1.1** & **0.1.2** & **0.2.2** & **0.3.1** — see matrix in OpenSpec / product docs.
 *
 * **picoOS** rows use dedicated builders (alpha2.0 / alpha2.1 subtokens); visionOS rows are separate.
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
 * visionOS **WSAppShell/1.5.0**.
 * Model: only `ready`, `currentSrc`, `entityTransform` among tracked sub-tokens are Y; SpatialRotateEvent:constrainedToAxis Y.
 */
function matrixVision_1_5_0_Flags(): Record<string, boolean> {
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
  // useAnimation not supported until WSAppShell/1.7.0
  flags['useAnimation'] = false
  flags['useAnimation:entity'] = false
  return flags
}

/**
 * visionOS **WSAppShell/1.6.0** — WebSpatial April / playback expansion (see product matrix).
 * Model: `stagemode`, `poster`, `loading`, `currentTime` remain N; rest of tracked Model sub-tokens Y.
 */
function matrixVision_1_6_0_Flags(): Record<string, boolean> {
  const flags = baseTrueFlags()
  for (const t of ['stagemode', 'poster', 'loading', 'currentTime'] as const) {
    flags[`Model:${t}`] = false
  }
  flags['SpatialRotateEvent:constrainedToAxis'] = true
  // useAnimation not supported until WSAppShell/1.7.0
  flags['useAnimation'] = false
  flags['useAnimation:entity'] = false
  return flags
}

/**
 * visionOS **WSAppShell/1.7.0** — entity transform animation support.
 * Inherits from 1.6.0 and enables `useAnimation`.
 */
function matrixVision_1_7_0_Flags(): Record<string, boolean> {
  const flags = matrixVision_1_6_0_Flags()
  flags['useAnimation'] = true
  flags['useAnimation:entity'] = true
  flags['Model:currentTime'] = true
  flags['Model:loading'] = true
  flags['Model:poster'] = true
  return flags
}

/**
 * visionOS **WSAppShell/1.8.0**.
 */
function matrixVision_1_8_0_Flags(): Record<string, boolean> {
  const flags = matrixVision_1_7_0_Flags()
  return flags
}

/**
 * picoOS **PicoWebApp/0.1.1** — alpha2.0 baseline (product matrix).
 * WindowScene / VolumeScene / Material subtokens Y; Model sub-tokens per matrix; **`xrInnerDepth` / `xrOuterDepth` N**.
 */
function matrixPico_0_1_1_Flags(): Record<string, boolean> {
  const flags = matrixVision_1_5_0_Flags()
  flags.xrInnerDepth = false
  flags.xrOuterDepth = false
  return flags
}

/**
 * picoOS **PicoWebApp/0.1.2** — beta2.0 playback expansion (product matrix).
 * **`xrInnerDepth` / `xrOuterDepth` N** (same as 0.1.1).
 */
function matrixPico_0_1_2_Flags(): Record<string, boolean> {
  const flags = matrixVision_1_6_0_Flags()
  flags.xrInnerDepth = false
  flags.xrOuterDepth = false
  flags['Model:currentTime'] = true
  flags['Model:poster'] = true
  return flags
}

/**
 * picoOS **PicoWebApp/0.2.2** — entity transform animation support.
 * Inherits from 0.1.2 and enables `useAnimation`.
 */
function matrixPico_0_2_2_Flags(): Record<string, boolean> {
  const flags = matrixPico_0_1_2_Flags()
  flags['useAnimation'] = true
  flags['useAnimation:entity'] = true
  return flags
}

/**
 * picoOS **PicoWebApp/0.3.1** — beta2.1
 */
function matrixPico_0_3_1_Flags(): Record<string, boolean> {
  const flags = matrixPico_0_2_2_Flags()
  flags['Model:loading'] = true
  return flags
}

function visionOsRow_1_5_0(): CapabilityVersionRow {
  return { version: '1.5.0', flags: matrixVision_1_5_0_Flags() }
}

function visionOsRow_1_6_0(): CapabilityVersionRow {
  return { version: '1.6.0', flags: matrixVision_1_6_0_Flags() }
}

function visionOsRow_1_7_0(): CapabilityVersionRow {
  return { version: '1.7.0', flags: matrixVision_1_7_0_Flags() }
}

/**
 * Build the capability row for visionOS **WSAppShell/1.8.0**.
 */
function visionOsRow_1_8_0(): CapabilityVersionRow {
  return { version: '1.8.0', flags: matrixVision_1_8_0_Flags() }
}

function picoOsRow_0_1_1(): CapabilityVersionRow {
  return { version: '0.1.1', flags: matrixPico_0_1_1_Flags() }
}

// Pico OS 6.0 Beta 2.0
function picoOsRow_0_1_2(): CapabilityVersionRow {
  return { version: '0.1.2', flags: matrixPico_0_1_2_Flags() }
}

function picoOsRow_0_2_2(): CapabilityVersionRow {
  return { version: '0.2.2', flags: matrixPico_0_2_2_Flags() }
}

// Pico OS 6.0 Beta 2.1
function picoOsRow_0_3_1(): CapabilityVersionRow {
  return { version: '0.3.1', flags: matrixPico_0_3_1_Flags() }
}

export const CAPABILITY_TABLE: {
  visionos: CapabilityVersionRow[]
  picoos: CapabilityVersionRow[]
} = {
  visionos: [
    visionOsRow_1_5_0(),
    visionOsRow_1_6_0(),
    visionOsRow_1_7_0(),
    visionOsRow_1_8_0(),
  ],
  picoos: [
    picoOsRow_0_1_1(),
    picoOsRow_0_1_2(),
    picoOsRow_0_2_2(),
    picoOsRow_0_3_1(),
  ],
}
