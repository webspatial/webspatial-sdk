// Minimal ambient type so AndroidPlatform.ts compiles in non-Android envs
declare global {
  interface Window {
    SpatialId?: unknown // keep optional & unknown to avoid leaking shape
  }
}
export {}
