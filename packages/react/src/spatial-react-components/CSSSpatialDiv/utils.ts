export function extractAndRemoveCustomProperties(
  cssText: string,
  properties: string[],
) {
  if (!cssText) {
    return { extractedValues: {}, filteredCssText: '' }
  }

  const extractedValues: Record<string, string> = {}
  const rules = cssText.split(';')

  const filteredRules = rules.filter(rule => {
    const [key, value] = rule.split(':').map(part => part.trim())
    if (properties.includes(key)) {
      extractedValues[key] = value
      return false
    }
    return true
  })

  const filteredCssText = filteredRules.join(';').trim()
  return { extractedValues, filteredCssText }
}

export function splitCSSText(cssText: string) {
  const rules = cssText.split(';')
  const filteredRules = rules.filter(rule => rule.trim() !== '')
  return filteredRules
}

export function joinToCSSText(cssKV: Record<string, string>) {
  const rules = Object.entries(cssKV).map(([key, value]) => `${key}: ${value}`)
  return rules.join(';')
}
