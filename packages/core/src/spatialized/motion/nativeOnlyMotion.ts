/** Log once when motion is invoked without native playback (Static3D / Dynamic3D). */
export function warnNativeOnlyMotion(
  controllerName: string,
  token: string,
): void {
  console.warn(
    `[${controllerName}] Declarative motion requires native runtime (supports('useSpatializedMotion', ['${token}'])). Web playback is not supported for this element kind.`,
  )
}
