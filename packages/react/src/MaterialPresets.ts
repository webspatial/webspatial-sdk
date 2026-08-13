import { SpatialPBRMaterialOptions } from '@webspatial/core-sdk'

/**
 * JS-only convenience presets for {@link PBRMaterial}. Each entry is a partial
 * set of `PBRMaterial` props that maps a named intent (e.g. metal, matte,
 * glass) to a tuned starting point. Spread a preset into a `<PBRMaterial>` and
 * override individual props as needed:
 *
 * ```tsx
 * <PBRMaterial id="car" {...MaterialPresets.metal} color="#C0C0C0" />
 * ```
 *
 * Presets are not a native concept — adding or tweaking one requires no native
 * rebuild.
 */
export type MaterialPreset = Omit<SpatialPBRMaterialOptions, 'textureId'>

export const MaterialPresets = {
  /** Wood, fabric, paper, concrete */
  matte: {
    metalness: 0,
    roughness: 0.9,
  },
  /** Polished plastic, lacquer */
  glossy: {
    metalness: 0,
    roughness: 0.1,
  },
  /** General plastic surfaces */
  plastic: {
    metalness: 0,
    roughness: 0.6,
  },
  /** Chrome, steel, aluminum */
  metal: {
    metalness: 1,
    roughness: 0.2,
  },
  /** Windows, bottles, lenses */
  glass: {
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.1,
  },
} as const satisfies Record<string, MaterialPreset>
