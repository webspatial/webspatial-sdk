/**
 * Diff two API snapshots and render the reviewer-facing markdown report:
 *
 *   | API | Change | Class | Docs |
 *
 * Classification:
 *   Breaking      — an API or member was removed, or its shape changed
 *   Additive      — a new API or member appeared
 *   Inconsistent  — a cross-source consistency finding appeared/changed
 *   Documentation — only the docs-coverage bit for the API flipped
 */

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Recursive structural diff → flat list of {path, type, oldValue, newValue}. */
function diffValues(oldValue, newValue, pathSegments, out) {
  if (isObject(oldValue) && isObject(newValue)) {
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])
    for (const key of [...keys].sort()) {
      if (key === '_comment') continue
      const p = [...pathSegments, key]
      if (!(key in oldValue)) {
        out.push({ path: p, type: 'added', newValue: newValue[key] })
      } else if (!(key in newValue)) {
        out.push({ path: p, type: 'removed', oldValue: oldValue[key] })
      } else {
        diffValues(oldValue[key], newValue[key], p, out)
      }
    }
    return
  }
  const same = JSON.stringify(oldValue) === JSON.stringify(newValue)
  if (!same) {
    out.push({ path: pathSegments, type: 'changed', oldValue, newValue })
  }
}

function diffSnapshots(baseline, current) {
  const out = []
  diffValues(baseline, current, [], out)
  return out
}

const CHANGE_LABEL = { added: 'Added', removed: 'Removed', changed: 'Changed' }

function short(value) {
  if (value === undefined) return ''
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 80 ? text.slice(0, 77) + '…' : text
}

/**
 * Map one raw diff entry to a report row. `docsCoverage` is the current
 * snapshot's coverage map, used to fill the Docs column for non-docs rows.
 */
function toRow(change, docsCoverage) {
  const [section, ...rest] = change.path
  const changeLabel = CHANGE_LABEL[change.type]
  const docsFor = key =>
    key in docsCoverage ? (docsCoverage[key] ? 'Documented' : 'Missing') : '—'

  switch (section) {
    case 'exports': {
      const [entry, name, ...detail] = rest
      const api = detail.length
        ? `\`${name}\` (${detail.join('.')})`
        : `\`${name}\``
      const cls = change.type === 'added' ? 'Additive' : 'Breaking'
      return {
        api: `${api} — entry \`${entry}\``,
        change: changeLabel,
        cls,
        docs: docsFor(`export:${name}`),
        detail: describeDetail(change),
      }
    }
    case 'css': {
      const [bucket, ...detail] = rest
      const prop = detail[detail.length - 1]
      const where =
        bucket === 'initialValues'
          ? 'default stylesheet initial value'
          : `type declaration (${detail.slice(0, -1).join(' → ')})`
      return {
        api: `\`${prop}\``,
        change: `${changeLabel} — ${where}`,
        cls: change.type === 'added' ? 'Additive' : 'Breaking',
        docs: docsFor(`css:${prop}`),
        detail: describeDetail(change),
      }
    }
    case 'jsx': {
      const [bucket, ...detail] = rest
      const name = detail[detail.length - 1]
      return {
        api: `\`${name}\` (JSX ${bucket})`,
        change: changeLabel,
        cls: change.type === 'added' ? 'Additive' : 'Breaking',
        docs: docsFor(`jsx:${name}`),
        detail: describeDetail(change),
      }
    }
    case 'manifest': {
      const [bucket, ...detail] = rest
      const key = detail.join('.') || bucket
      return {
        api: `\`${key}\` (manifest ${bucket === 'schema' ? 'schema' : bucket})`,
        change: changeLabel,
        cls: change.type === 'added' ? 'Additive' : 'Breaking',
        docs: docsFor(`manifest:${String(key).split('.')[0]}`),
        detail: describeDetail(change),
      }
    }
    case 'docsCoverage': {
      const key = rest.join('.')
      const [, name] = key.split(':')
      return {
        api: `\`${name}\``,
        change:
          change.newValue === true ? 'Now documented' : 'No longer documented',
        cls: 'Documentation',
        docs: change.newValue === true ? 'Updated' : 'Missing',
        detail: '',
      }
    }
    case 'consistency': {
      const message = change.newValue ?? change.oldValue
      const id = rest.join('.')
      const api = `\`${id.split(':').pop()}\``
      return {
        api,
        change:
          change.type === 'removed'
            ? 'Inconsistency resolved'
            : 'Inconsistency detected',
        cls: change.type === 'removed' ? 'Fixed' : 'Inconsistent',
        docs: '—',
        detail: String(message),
      }
    }
    default:
      return {
        api: `\`${change.path.join('.')}\``,
        change: changeLabel,
        cls: '—',
        docs: '—',
        detail: describeDetail(change),
      }
  }
}

function describeDetail(change) {
  if (change.type === 'changed') {
    return `\`${short(change.oldValue)}\` → \`${short(change.newValue)}\``
  }
  const v = change.type === 'added' ? change.newValue : change.oldValue
  return isObject(v) ? '' : `\`${short(v)}\``
}

const CLASS_ORDER = {
  Breaking: 0,
  Inconsistent: 1,
  Additive: 2,
  Documentation: 3,
  Fixed: 4,
  '—': 5,
}

function renderReport(changes, currentSnapshot) {
  const docsCoverage = currentSnapshot.docsCoverage ?? {}
  // A docs-coverage entry appearing or disappearing just mirrors an API being
  // added or removed — those rows already carry a Docs column. Only a real
  // documented↔undocumented flip is worth its own row.
  const reportable = changes.filter(
    c => c.path[0] !== 'docsCoverage' || c.type === 'changed',
  )
  const rows = reportable.map(c => toRow(c, docsCoverage))
  rows.sort(
    (a, b) =>
      (CLASS_ORDER[a.cls] ?? 9) - (CLASS_ORDER[b.cls] ?? 9) ||
      a.api.localeCompare(b.api),
  )

  const lines = []
  lines.push('## WebSpatial public API changes')
  lines.push('')
  if (rows.length === 0) {
    lines.push(
      'No public API changes detected — the snapshot matches the committed baseline.',
    )
    return lines.join('\n')
  }
  const counts = {}
  for (const row of rows) counts[row.cls] = (counts[row.cls] ?? 0) + 1
  lines.push(
    Object.entries(counts)
      .map(([cls, n]) => `**${n}** ${cls.toLowerCase()}`)
      .join(' · '),
  )
  lines.push('')
  lines.push('| API | Change | Class | Docs | Detail |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const row of rows) {
    const cells = [row.api, row.change, row.cls, row.docs, row.detail].map(
      cell => String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' '),
    )
    lines.push(`| ${cells.join(' | ')} |`)
  }
  lines.push('')
  lines.push(
    'This PR changes the public API surface. If the change is intentional, regenerate the baseline with `pnpm run api:snapshot` (after `pnpm --filter @webspatial/core-sdk build && pnpm --filter @webspatial/react-sdk build`) and commit `tools/api-snapshot/api-baseline.json`. Rows classed **Inconsistent** mean two sources of truth in the repo disagree — fix the sources rather than the baseline.',
  )
  return lines.join('\n')
}

module.exports = { diffSnapshots, renderReport }
