/**
 * WebSpatial public-API snapshot extractor.
 *
 * Produces one normalized, deterministic JSON object describing the full
 * documented surface of the SDK — not just JS exports:
 *
 *   - exports:      built .d.ts of @webspatial/react-sdk public entry points
 *                   (".", "./eager", "./spatial", "./jsx-runtime")
 *   - css:          --xr-* custom properties declared in the TypeScript type
 *                   augmentations, their runtime initial values from the
 *                   injected default stylesheet, and the type stubs our own
 *                   test apps use
 *   - jsx:          enable-xr / xr-animation attributes and onSpatial* events
 *                   from the JSX namespace augmentation
 *   - manifest:     flattened packages/cli/src/schema.json, plus the xr_*
 *                   manifest keys actually read by the web runtime and by the
 *                   CLI builder
 *   - docsCoverage: whether each public API name is mentioned in the in-repo
 *                   docs corpus (docs/**, package READMEs)
 *   - consistency:  cross-source mismatches (a property declared in types but
 *                   given no initial value, a manifest key the schema declares
 *                   but the runtime never reads, ...)
 *
 * Everything here is a structured read of files the repo already maintains.
 * The output must be deterministic across machines: no timestamps, no
 * absolute paths, stable sort order everywhere.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ts = require('typescript')

const repoRoot = path.resolve(__dirname, '..', '..')
const reactPkgDir = path.join(repoRoot, 'packages', 'react')

// Public entry points snapshotted from the built .d.ts. "./experimental" is
// deliberately excluded: it is the documented escape hatch for APIs whose
// names may still change, so it carries no stability contract to snapshot.
const PUBLIC_ENTRIES = ['.', './eager', './spatial', './jsx-runtime']

const CSS_SOURCES = {
  'sdk:xr-css-extension': 'packages/react/src/jsx/xr-css-extension.ts',
  'sdk:jsx-namespace': 'packages/react/src/jsx/jsx-namespace.ts',
  'stub:ci-test': 'tests/ci-test/types/webspatial.d.ts',
  'stub:autoTest': 'tests/autoTest/types/webspatial.d.ts',
}

const DEFAULT_STYLESHEET_SOURCE =
  'packages/react/src/spatialized-container/StandardSpatializedContainer.tsx'
const JSX_NAMESPACE_SOURCE = 'packages/react/src/jsx/jsx-namespace.ts'
const MANIFEST_SCHEMA_SOURCE = 'packages/cli/src/schema.json'
const RUNTIME_MANIFEST_SOURCES = ['packages/core/src/scene-polyfill.ts']
const CLI_MANIFEST_SOURCE_DIR = 'packages/cli/src'
const DOCS_CORPUS = [
  'docs',
  'README.md',
  'packages/react/README.md',
  'packages/core/README.md',
  'packages/cli/README.md',
]

const MAX_TYPE_TEXT = 600

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8')
}

function sortObject(obj) {
  const out = {}
  for (const key of Object.keys(obj).sort()) out[key] = obj[key]
  return out
}

/**
 * Type strings must stay stable across machines and unrelated rebuilds:
 *  - `import("/abs/path/dist/Model-DO5ps8NA")` leaks the checkout path and a
 *    content hash tsup stamps into chunk filenames; keep only the bare module
 *    basename.
 *  - very large structural types are truncated to a prefix + digest so a
 *    change is still detected without storing kilobytes per entry.
 */
function normalizeTypeText(text) {
  let t = text
    .replace(/import\("([^"]+)"\)/g, (_, p) => {
      let base = path.basename(p).replace(/\.d\.ts$/, '')
      base = base.replace(/-[A-Za-z0-9_-]{8}$/, '')
      return `import("${base}")`
    })
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length > MAX_TYPE_TEXT) {
    const digest = crypto
      .createHash('sha256')
      .update(t)
      .digest('hex')
      .slice(0, 12)
    t = `${t.slice(0, MAX_TYPE_TEXT)}… <truncated sha256:${digest}>`
  }
  return t
}

// ---------------------------------------------------------------------------
// exports — built .d.ts of the public entry points
// ---------------------------------------------------------------------------

function resolveEntryDtsFiles() {
  const pkg = JSON.parse(read('packages/react/package.json'))
  const files = {}
  for (const entry of PUBLIC_ENTRIES) {
    const exp = pkg.exports?.[entry]
    const typesRel = typeof exp === 'object' ? exp.types : undefined
    if (!typesRel) {
      throw new Error(
        `packages/react/package.json has no "types" for export "${entry}"`,
      )
    }
    const abs = path.join(reactPkgDir, typesRel)
    if (!fs.existsSync(abs)) {
      throw new Error(
        `Missing built declarations: ${path.relative(repoRoot, abs)}\n` +
          `Build first: pnpm --filter @webspatial/core-sdk build && pnpm --filter @webspatial/react-sdk build`,
      )
    }
    files[entry] = abs
  }
  return files
}

function symbolKinds(symbol) {
  const kinds = new Set()
  for (const decl of symbol.declarations ?? []) {
    switch (decl.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        kinds.add('class')
        break
      case ts.SyntaxKind.InterfaceDeclaration:
        kinds.add('interface')
        break
      case ts.SyntaxKind.TypeAliasDeclaration:
        kinds.add('type')
        break
      case ts.SyntaxKind.EnumDeclaration:
        kinds.add('enum')
        break
      case ts.SyntaxKind.FunctionDeclaration:
        kinds.add('function')
        break
      case ts.SyntaxKind.VariableDeclaration:
        kinds.add('const')
        break
      case ts.SyntaxKind.ModuleDeclaration:
        kinds.add('namespace')
        break
    }
  }
  return [...kinds].sort()
}

function describeExport(checker, symbol) {
  const decl = symbol.declarations?.[0]
  const kinds = symbolKinds(symbol)
  const out = { kind: kinds.join('+') || 'unknown' }

  const isValue =
    (symbol.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Function)) !== 0
  if (isValue && decl) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, decl)
    const callSignatures = type.getCallSignatures()
    if (callSignatures.length > 0 && !kinds.includes('class')) {
      out.signatures = callSignatures
        .map(sig =>
          normalizeTypeText(
            checker.signatureToString(
              sig,
              decl,
              ts.TypeFormatFlags.NoTruncation,
            ),
          ),
        )
        .sort()
    } else {
      out.type = normalizeTypeText(
        checker.typeToString(type, decl, ts.TypeFormatFlags.NoTruncation),
      )
    }
  }

  // Interfaces and classes get per-member detail so a single renamed prop is
  // reported as that prop, not as an opaque "type changed". Type aliases are
  // rendered as their expanded target instead — enumerating properties of an
  // aliased string union would list String.prototype members, whose internal
  // well-known-symbol names (`__@iterator@<id>`) are nondeterministic.
  if (
    (symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.Class)) !== 0 &&
    decl
  ) {
    const declared = checker.getDeclaredTypeOfSymbol(symbol)
    const members = {}
    for (const prop of declared.getProperties()) {
      const name = prop.getName()
      if (name.startsWith('__@')) continue
      const propDecl = prop.declarations?.[0] ?? decl
      const propType = checker.getTypeOfSymbolAtLocation(prop, propDecl)
      const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0
      members[name] =
        (optional ? '?: ' : ': ') +
        normalizeTypeText(
          checker.typeToString(
            propType,
            propDecl,
            ts.TypeFormatFlags.NoTruncation,
          ),
        )
    }
    out.members = sortObject(members)
  } else if ((symbol.flags & ts.SymbolFlags.TypeAlias) !== 0 && decl) {
    const declared = checker.getDeclaredTypeOfSymbol(symbol)
    out.type = normalizeTypeText(
      checker.typeToString(
        declared,
        decl,
        ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias,
      ),
    )
  }

  if (symbol.flags & ts.SymbolFlags.Enum) {
    const members = {}
    for (const d of symbol.declarations ?? []) {
      if (!ts.isEnumDeclaration(d)) continue
      for (const m of d.members) {
        const name = m.name.getText(d.getSourceFile())
        const value = checker.getConstantValue(m)
        members[name] = value === undefined ? '' : String(value)
      }
    }
    out.members = sortObject(members)
  }

  return out
}

function extractExports() {
  const entryFiles = resolveEntryDtsFiles()
  const program = ts.createProgram(Object.values(entryFiles), {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    strict: true,
    jsx: ts.JsxEmit.ReactJSX,
  })
  const checker = program.getTypeChecker()

  const out = {}
  for (const [entry, file] of Object.entries(entryFiles)) {
    const sourceFile = program.getSourceFile(file)
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile)
    const entryOut = {}
    if (moduleSymbol) {
      for (const exp of checker.getExportsOfModule(moduleSymbol)) {
        let symbol = exp
        if (symbol.flags & ts.SymbolFlags.Alias) {
          try {
            symbol = checker.getAliasedSymbol(symbol)
          } catch {
            /* keep the alias symbol */
          }
        }
        entryOut[exp.name] = describeExport(checker, symbol)
      }
    }
    out[entry] = sortObject(entryOut)
  }
  return out
}

// ---------------------------------------------------------------------------
// css — declared custom properties, initial values, test stubs
// ---------------------------------------------------------------------------

function parseSource(rel) {
  return ts.createSourceFile(rel, read(rel), ts.ScriptTarget.Latest, true)
}

/**
 * Collect `--xr-*` (and `enableXr`) property declarations from every
 * `CSSStyleDeclaration` interface and every `CSSProperties` interface inside a
 * `declare module 'react'` block in the given file.
 */
function extractCssDeclarations(rel) {
  const sf = parseSource(rel)
  const out = { CSSStyleDeclaration: {}, 'react.CSSProperties': {} }

  function visit(node, inReactModule) {
    if (ts.isModuleDeclaration(node)) {
      const isReact =
        ts.isStringLiteral(node.name) && node.name.text === 'react'
      ts.forEachChild(node, child => visit(child, inReactModule || isReact))
      return
    }
    if (ts.isInterfaceDeclaration(node)) {
      const ifaceName = node.name.text
      let bucket
      if (ifaceName === 'CSSStyleDeclaration') bucket = out.CSSStyleDeclaration
      else if (ifaceName === 'CSSProperties' && inReactModule)
        bucket = out['react.CSSProperties']
      if (bucket) {
        for (const member of node.members) {
          if (!ts.isPropertySignature(member) || !member.name) continue
          const name = ts.isStringLiteral(member.name)
            ? member.name.text
            : member.name.getText(sf)
          if (!name.startsWith('--xr-') && name !== 'enableXr') continue
          const typeText = member.type ? member.type.getText(sf) : 'unknown'
          bucket[name] =
            (member.questionToken ? '?: ' : ': ') + normalizeTypeText(typeText)
        }
      }
    }
    ts.forEachChild(node, child => visit(child, inReactModule))
  }
  visit(sf, false)
  return {
    CSSStyleDeclaration: sortObject(out.CSSStyleDeclaration),
    'react.CSSProperties': sortObject(out['react.CSSProperties']),
  }
}

/** Initial values from the default stylesheet the SDK injects at runtime. */
function extractCssInitialValues() {
  const src = read(DEFAULT_STYLESHEET_SOURCE)
  const templateMatch = src.match(/SPATIAL_DEFAULT_STYLE_CSS = `([\s\S]*?)`/)
  if (!templateMatch) {
    throw new Error(
      `Could not find SPATIAL_DEFAULT_STYLE_CSS template literal in ${DEFAULT_STYLESHEET_SOURCE}`,
    )
  }
  const out = {}
  const re = /(--xr-[a-z0-9-]+)\s*:\s*([^;\n]+)/g
  let m
  while ((m = re.exec(templateMatch[1]))) out[m[1]] = m[2].trim()
  return sortObject(out)
}

function extractCss() {
  const declarations = {}
  for (const [label, rel] of Object.entries(CSS_SOURCES)) {
    declarations[label] = extractCssDeclarations(rel)
  }
  return {
    declarations: sortObject(declarations),
    initialValues: extractCssInitialValues(),
  }
}

// ---------------------------------------------------------------------------
// jsx — enable-xr, xr-animation, onSpatial* events
// ---------------------------------------------------------------------------

function extractJsx() {
  const sf = parseSource(JSX_NAMESPACE_SOURCE)
  const attributes = {}
  const events = {}

  function visit(node) {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'BaseSpatialIntrinsic' &&
      ts.isTypeLiteralNode(node.type)
    ) {
      for (const member of node.type.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue
        const name = ts.isStringLiteral(member.name)
          ? member.name.text
          : member.name.getText(sf)
        const typeText =
          (member.questionToken ? '?: ' : ': ') +
          normalizeTypeText(member.type ? member.type.getText(sf) : 'unknown')
        if (name.startsWith('onSpatial')) events[name] = typeText
        else attributes[name] = typeText
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  // Element-conditional extras, e.g. `K extends 'div' ? { onSpatialContentReady... }`
  const elementSpecific = {}
  const src = read(JSX_NAMESPACE_SOURCE)
  const condRe = /K extends '(\w+)'\s*\?\s*\{([^}]*)\}/g
  let m
  while ((m = condRe.exec(src))) {
    const el = m[1]
    const memberRe = /([A-Za-z_$][\w$]*)(\?)?:\s*([^\n;{}]+)/g
    const members = {}
    let mm
    while ((mm = memberRe.exec(m[2]))) {
      members[mm[1]] = (mm[2] ? '?: ' : ': ') + normalizeTypeText(mm[3].trim())
    }
    elementSpecific[el] = sortObject(members)
  }

  return {
    attributes: sortObject(attributes),
    events: sortObject(events),
    elementSpecific: sortObject(elementSpecific),
  }
}

// ---------------------------------------------------------------------------
// manifest — builder schema, runtime reads, CLI reads
// ---------------------------------------------------------------------------

function flattenSchema(schema, prefix, requiredIn, out) {
  const props = schema.properties ?? {}
  for (const [key, value] of Object.entries(props)) {
    const p = prefix ? `${prefix}.${key}` : key
    const entry = {}
    if (value.enum) {
      entry.type = 'enum'
      entry.values = [...value.enum].sort()
    } else if (value.type) {
      entry.type = Array.isArray(value.type) ? value.type.join('|') : value.type
    }
    if ((requiredIn ?? []).includes(key)) entry.required = true
    out[p] = entry
    if (value.properties) flattenSchema(value, p, value.required, out)
    if (value.items?.properties) {
      flattenSchema(value.items, `${p}[]`, value.items.required, out)
    }
  }
  return out
}

function extractManifest() {
  const schema = JSON.parse(read(MANIFEST_SCHEMA_SOURCE))
  const flat = flattenSchema(schema, '', schema.required, {})

  // xr_* keys the shipped web runtime actually reads off the PWA manifest.
  const runtimeKeys = new Set()
  for (const rel of RUNTIME_MANIFEST_SOURCES) {
    const src = read(rel)
    for (const m of src.matchAll(/manifest\??\.(xr_\w+)/g))
      runtimeKeys.add(m[1])
  }

  // xr_* keys the CLI builder reads off the manifest at build time.
  const cliKeys = new Set()
  const cliDir = path.join(repoRoot, CLI_MANIFEST_SOURCE_DIR)
  const stack = [cliDir]
  while (stack.length) {
    const dir = stack.pop()
    for (const name of fs.readdirSync(dir).sort()) {
      const abs = path.join(dir, name)
      const stat = fs.statSync(abs)
      if (stat.isDirectory()) {
        if (name !== 'assets' && name !== 'node_modules') stack.push(abs)
      } else if (/\.(ts|js)$/.test(name)) {
        const src = fs.readFileSync(abs, 'utf8')
        for (const m of src.matchAll(
          /(?:manifest|manifestJson)\??\.(xr_\w+)/g,
        )) {
          cliKeys.add(m[1])
        }
      }
    }
  }

  return {
    schema: sortObject(flat),
    runtimeReadsXrKeys: [...runtimeKeys].sort(),
    cliReadsXrKeys: [...cliKeys].sort(),
  }
}

// ---------------------------------------------------------------------------
// docsCoverage — is each public API name mentioned in the in-repo docs?
// ---------------------------------------------------------------------------

function collectDocsCorpus() {
  const chunks = []
  const walk = abs => {
    if (!fs.existsSync(abs)) return
    const stat = fs.statSync(abs)
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(abs).sort()) walk(path.join(abs, name))
    } else if (abs.endsWith('.md')) {
      chunks.push(fs.readFileSync(abs, 'utf8'))
    }
  }
  for (const rel of DOCS_CORPUS) walk(path.join(repoRoot, rel))
  return chunks.join('\n')
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractDocsCoverage(exportsSnapshot, css, jsx, manifest) {
  const corpus = collectDocsCorpus()
  const mentioned = name => {
    if (name.startsWith('--')) return corpus.includes(name)
    return new RegExp(`\\b${escapeRegExp(name)}\\b`).test(corpus)
  }

  const out = {}
  for (const name of Object.keys(exportsSnapshot['.'] ?? {})) {
    out[`export:${name}`] = mentioned(name)
  }
  for (const prop of Object.keys(
    css.declarations['sdk:xr-css-extension'].CSSStyleDeclaration,
  )) {
    out[`css:${prop}`] = mentioned(prop)
  }
  for (const name of [
    ...Object.keys(jsx.attributes),
    ...Object.keys(jsx.events),
  ]) {
    out[`jsx:${name}`] = mentioned(name)
  }
  const topLevelXr = Object.keys(manifest.schema).filter(
    k => k.startsWith('xr_') && !k.includes('.'),
  )
  for (const key of new Set([
    ...topLevelXr,
    ...manifest.runtimeReadsXrKeys,
    ...manifest.cliReadsXrKeys,
  ])) {
    out[`manifest:${key}`] = mentioned(key)
  }
  return sortObject(out)
}

// ---------------------------------------------------------------------------
// consistency — cross-checks between the sources of truth
// ---------------------------------------------------------------------------

function extractConsistency(css, manifest) {
  const findings = {}

  const sdkStyleDecl =
    css.declarations['sdk:xr-css-extension'].CSSStyleDeclaration
  const sdkReactProps =
    css.declarations['sdk:jsx-namespace']['react.CSSProperties']
  const customProps = Object.keys(sdkStyleDecl).filter(p =>
    p.startsWith('--xr-'),
  )

  // Every declared custom property must have a runtime initial value in the
  // injected default stylesheet, and vice versa.
  for (const prop of customProps) {
    if (!(prop in css.initialValues)) {
      findings[`css-no-initial-value:${prop}`] =
        `${prop} is declared in the SDK types (jsx/xr-css-extension.ts) but has no initial value in the injected default stylesheet (StandardSpatializedContainer.tsx)`
    }
  }
  for (const prop of Object.keys(css.initialValues)) {
    if (!(prop in sdkStyleDecl)) {
      findings[`css-initial-value-undeclared:${prop}`] =
        `${prop} has an initial value in the injected default stylesheet but is not declared in the SDK types (jsx/xr-css-extension.ts)`
    }
  }

  // The two SDK-side declarations (CSSStyleDeclaration global vs the react
  // CSSProperties augmentation) must agree with each other.
  for (const prop of Object.keys(sdkStyleDecl)) {
    if (!(prop in sdkReactProps)) {
      findings[`css-react-augmentation-missing:${prop}`] =
        `${prop} is declared on CSSStyleDeclaration (xr-css-extension.ts) but missing from the react CSSProperties augmentation (jsx-namespace.ts)`
    }
  }
  for (const prop of Object.keys(sdkReactProps)) {
    if (!(prop in sdkStyleDecl)) {
      findings[`css-style-declaration-missing:${prop}`] =
        `${prop} is declared in the react CSSProperties augmentation (jsx-namespace.ts) but missing from CSSStyleDeclaration (xr-css-extension.ts)`
    }
  }

  // Our own test apps' type stubs must carry the full SDK declaration set.
  for (const stub of ['stub:ci-test', 'stub:autoTest']) {
    const stubDecl = css.declarations[stub]['react.CSSProperties']
    const stubFile = CSS_SOURCES[stub]
    for (const prop of Object.keys(sdkReactProps)) {
      if (!(prop in stubDecl)) {
        findings[`css-test-stub-missing:${stub}:${prop}`] =
          `${prop} is declared in the SDK types but missing from the test-app type stub ${stubFile}`
      }
    }
  }

  // Manifest xr_* keys: the builder schema, the CLI reads, and the web
  // runtime reads must describe the same key set.
  const schemaXrKeys = Object.keys(manifest.schema).filter(
    k => k.startsWith('xr_') && !k.includes('.'),
  )
  for (const key of manifest.runtimeReadsXrKeys) {
    if (!schemaXrKeys.includes(key)) {
      findings[`manifest-runtime-key-not-in-schema:${key}`] =
        `The web runtime (packages/core/src/scene-polyfill.ts) reads manifest key "${key}" but packages/cli/src/schema.json does not declare it`
    }
  }
  for (const key of schemaXrKeys) {
    if (!manifest.runtimeReadsXrKeys.includes(key)) {
      findings[`manifest-schema-key-not-read-by-runtime:${key}`] =
        `packages/cli/src/schema.json declares manifest key "${key}" but the web runtime (packages/core/src/scene-polyfill.ts) never reads it`
    }
  }
  for (const key of manifest.cliReadsXrKeys) {
    if (!schemaXrKeys.includes(key)) {
      findings[`manifest-cli-key-not-in-schema:${key}`] =
        `The CLI builder reads manifest key "${key}" but packages/cli/src/schema.json does not declare it`
    }
  }

  return sortObject(findings)
}

// ---------------------------------------------------------------------------

function extractSnapshot() {
  const exportsSnapshot = extractExports()
  const css = extractCss()
  const jsx = extractJsx()
  const manifest = extractManifest()
  const docsCoverage = extractDocsCoverage(exportsSnapshot, css, jsx, manifest)
  const consistency = extractConsistency(css, manifest)
  return {
    _comment:
      'Generated by tools/api-snapshot — do not edit by hand. Regenerate with: pnpm run api:snapshot',
    formatVersion: 1,
    exports: exportsSnapshot,
    css,
    jsx,
    manifest,
    docsCoverage,
    consistency,
  }
}

module.exports = { extractSnapshot, repoRoot }
