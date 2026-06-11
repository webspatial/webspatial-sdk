export type NoHyphen<Name extends string> = Name extends `${string}-${string}`
  ? never
  : Name

export type SpatialEntityName<Name extends string = string> = NoHyphen<Name>

/** Compile-time error message for hyphenated JSX entity name literals. */
export type SpatialEntityNameLiteral<Name extends string = string> =
  string extends Name
    ? Name
    : Name extends `${string}-${string}`
      ? `Entity names must not include hyphens (-). "${Name}" is invalid. Use camelCase or underscores (_) instead.`
      : Name
