export type NoHyphen<Name extends string> = Name extends `${string}-${string}`
  ? never
  : Name

export type SpatialEntityName<Name extends string = string> = NoHyphen<Name>

export function assertValidSpatialEntityName(name: string | undefined): void {
  if (name?.includes('-')) {
    throw new Error(
      `Invalid WebSpatial entity name "${name}". Entity names must not include hyphens (-); use a USD-safe name with camelCase or underscores (_) instead.`,
    )
  }
}
