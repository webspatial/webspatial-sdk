export function embedPlaceholderHostProps<T extends Record<string, unknown>>(
  component: unknown,
  restProps: T,
): T {
  if (component !== 'embed') {
    return restProps
  }
  // Blink does not layout <embed> without src or type. Model `src` must stay
  // on SpatializedContent / JSB, not on the plugin host.
  const {
    src: _src,
    type: _type,
    ...rest
  } = restProps as T & {
    src?: unknown
    type?: unknown
  }
  return { ...rest, src: '' } as T
}
