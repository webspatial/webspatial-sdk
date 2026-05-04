import { SpatialPBRMaterialOptions } from '@webspatial/core-sdk'

/**
 * JS-only convenience presets for {@link PBRMaterial}. Each entry is a partial
 * set of `PBRMaterial` props that maps a named intent (e.g. metal, matte,
 * glass) to a tuned starting point. Spread a preset into a `<PBRMaterial>` and
 * override individual props as needed.
 *
 * Presets are not a native concept — adding or tweaking one requires no native
 * rebuild.
 */
export type MaterialPreset = Omit<SpatialPBRMaterialOptions, 'textureId'>

export const MaterialPresets: Readonly<Record<string, MaterialPreset>> = {
  metal: {
    color: '#cccccc',
    metalness: 1,
    roughness: 0.25,
  },
  brushedMetal: {
    color: '#bfbfbf',
    metalness: 1,
    roughness: 0.55,
  },
  chrome: {
    color: '#ffffff',
    metalness: 1,
    roughness: 0.05,
  },
  gold: {
    color: '#d4af37',
    metalness: 1,
    roughness: 0.2,
  },
  plastic: {
    color: '#ffffff',
    metalness: 0,
    roughness: 0.4,
  },
  matte: {
    color: '#ffffff',
    metalness: 0,
    roughness: 0.95,
  },
  rubber: {
    color: '#1a1a1a',
    metalness: 0,
    roughness: 1,
  },
  glossy: {
    color: '#ffffff',
    metalness: 0,
    roughness: 0.1,
  },
  glass: {
    color: '#ffffff',
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.4,
  },
  emissive: {
    color: '#000000',
    metalness: 0,
    roughness: 1,
    emissiveColor: '#ffffff',
    emissiveIntensity: 1,
  },
}
