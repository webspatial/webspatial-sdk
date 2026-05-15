/**
 * Minimal semver compare for capability table rows (`major.minor.patch`).
 * Returns negative if a < b, zero if equal, positive if a > b.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemverParts(a)
  const pb = parseSemverParts(b)
  if (!pa || !pb) {
    return String(a).localeCompare(String(b))
  }
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

function parseSemverParts(v: string): number[] | null {
  const m = /^(\d+)(?:\.(\d+)(?:\.(\d+))?)?/.exec(v.trim())
  if (!m) return null
  const major = Number(m[1])
  const minor = m[2] !== undefined ? Number(m[2]) : 0
  const patch = m[3] !== undefined ? Number(m[3]) : 0
  if ([major, minor, patch].some(n => Number.isNaN(n))) return null
  return [major, minor, patch]
}

export function parseSemverOrNull(v: string): string | null {
  const m = /^(\d+(?:\.\d+){0,2})/.exec(v.trim())
  return m ? m[1] : null
}
