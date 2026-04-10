/**
 * Versioned capability rows transcribed from the product matrix (`capability-matrix.template.md`).
 * **Stub defaults** ship until runtime/product fills Y/N per Shell version — replace rows as the matrix evolves.
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
 * Product matrix **alpha2.1** — shared by visionOS **WSAppShell/1.5.0** and picoOS **PicoWebApp/0.1.1**.
 * Top-level: all Y. Sub-tokens: `Model:source` Y; `stagemode` / `poster` / `loading` / `currentTime` N; rest Y.
 */
function productMatrixAlpha211Flags(): Record<string, boolean> {
  const flags = baseTrueFlags()
  flags['Model:stagemode'] = false
  flags['Model:poster'] = false
  flags['Model:loading'] = false
  flags['Model:currentTime'] = false
  return flags
}

/** visionOS `WSAppShell/<version>` row **1.5.0** — same capability surface as picoOS 0.1.1 (alpha2.1). */
function visionOsRow_1_5_0(): CapabilityVersionRow {
  return { version: '1.5.0', flags: productMatrixAlpha211Flags() }
}

/** picoOS `PicoWebApp/<version>` row **0.1.1** — product matrix alpha2.1 (same flags as visionOS 1.5.0). */
function picoOsRow_0_1_1(): CapabilityVersionRow {
  return { version: '0.1.1', flags: productMatrixAlpha211Flags() }
}

export const CAPABILITY_TABLE: {
  visionos: CapabilityVersionRow[]
  picoos: CapabilityVersionRow[]
} = {
  visionos: [visionOsRow_1_5_0()],
  picoos: [picoOsRow_0_1_1()],
}
