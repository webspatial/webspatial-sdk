import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import type { Node, Statement, Expression } from '@babel/types'
import { describe, expect, it } from 'vitest'

// Per spatial-lazy-load spec tasks.md §9.6 + the "No observable top-level
// side effects in default-entry modules" + "Module-private pure
// initialization is permitted" Scenarios, every module reachable from the
// default entry's static module graph MUST NOT execute any expression with
// **observable** side effects at module top level.
//
// Observable means visible from outside the module — writes to globals,
// network requests, DOM manipulation, registration of listeners on global
// objects, calls to imported functions whose execution mutates external
// state. Module-private pure initialization (`forwardRef(...)`,
// `createContext(...)`, `new Map()`, `/* @__PURE__ */`-annotated calls,
// etc.) is explicitly permitted because the result is a module-local
// value that vanishes from the consumer bundle when the parent module is
// tree-shaken.
//
// We implement this as an AST scan via @babel/parser (transitive dep of
// @vitejs/plugin-react). Ad-hoc regex would false-positive on every facade
// definition (`forwardRef(...)` looks like a bare call) per the spec
// scenario; AST classification is necessary.

const __dirname = dirname(fileURLToPath(import.meta.url))
const sourceRoot = resolve(__dirname, '..')
const indexEntry = resolve(sourceRoot, 'index.ts')

const PURE_FACTORY_NAMES = new Set([
  'forwardRef',
  'memo',
  'createContext',
  'lazy',
  // tsup ESM banner adds an IIFE that writes to `window.__webspatialsdk__` —
  // that lives in the BUILD output, not in any source module, so it never
  // hits this lint.
])

// `Object.freeze`, `Object.assign`, `Object.create` recognized as pure
// member-factory calls when their first argument is a pure expression. They
// are the canonical "wrap a literal" idioms used by `useMetrics-placeholder`
// and SSR contexts — calling them at top level produces a module-local
// frozen / merged / prototype-derived value with no observable external
// effect, exactly the same as a React factory call.
const PURE_OBJECT_METHODS = new Set(['freeze', 'assign', 'create'])

const PURE_CONSTRUCTOR_NAMES = new Set(['Map', 'Set', 'WeakMap', 'WeakSet'])

// Properties commonly assigned to a forwardRef / function-component result
// for React metadata purposes. `Component.displayName = 'X'` is the
// idiomatic pattern bundlers (esbuild, rollup, webpack) recognize as
// tree-shakable when `Component` is a top-level local: dropping the
// component drops the assignment too. We permit this single, narrow
// pattern; arbitrary `X.y = z` assignments at top level remain rejected.
const COMPONENT_METADATA_KEYS = new Set([
  'displayName',
  'defaultProps',
  'propTypes',
  'contextTypes',
  'childContextTypes',
])

// Modules whose body intentionally registers global listeners or installs
// polyfills MUST NOT be reachable from the default entry. The lint walks
// the static graph and rejects them transitively.
//
// Files explicitly excluded from the walk (because they are NOT part of
// the default-entry static graph and we do not want to traverse them):
const EXCLUDED_PATHS = new Set([
  // Tests, mocks, and the spatial chunk itself are out of scope. The
  // bridge dynamic-imports the spatial chunk; the lint walks ONLY static
  // graphs.
  resolve(sourceRoot, 'spatial/index.ts'),
])

type LintError = {
  file: string
  line: number
  reason: string
  snippet: string
}

function hasPureAnnotation(node: Node): boolean {
  // Babel attaches comments via `leadingComments` on the node OR on the
  // wrapping ExpressionStatement. The `@__PURE__` token can appear on any
  // leading comment.
  const leading = (node.leadingComments ?? []) as Array<{ value: string }>
  return leading.some(c => c.value.includes('@__PURE__'))
}

function isPureExpression(node: Expression | null | undefined): boolean {
  if (!node) return true
  switch (node.type) {
    case 'NumericLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'RegExpLiteral':
    case 'BigIntLiteral':
    case 'DecimalLiteral':
    case 'Identifier':
    case 'ThisExpression':
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'ClassExpression':
      return true
    case 'TemplateLiteral':
      return node.expressions.every(e =>
        e.type.startsWith('TS') ? true : isPureExpression(e as Expression),
      )
    case 'TaggedTemplateExpression':
      // Tagged templates invoke the tag function with side effects in
      // general; allow only when the call carries a /* @__PURE__ */
      // annotation.
      return hasPureAnnotation(node)
    case 'TSAsExpression':
    case 'TSTypeAssertion':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
      return isPureExpression(node.expression)
    case 'ParenthesizedExpression':
      return isPureExpression(node.expression)
    case 'UnaryExpression':
      // `typeof window` / `void 0` / `-1` are pure.
      return isPureExpression(node.argument as Expression)
    case 'ArrayExpression':
      return node.elements.every(el => {
        if (el === null) return true
        if (el.type === 'SpreadElement')
          return isPureExpression(el.argument as Expression)
        return isPureExpression(el as Expression)
      })
    case 'ObjectExpression':
      return node.properties.every(p => {
        if (p.type === 'SpreadElement')
          return isPureExpression(p.argument as Expression)
        if (p.type === 'ObjectProperty')
          return isPureExpression(p.value as Expression)
        if (p.type === 'ObjectMethod') return true
        return false
      })
    case 'NewExpression':
      if (
        node.callee.type === 'Identifier' &&
        PURE_CONSTRUCTOR_NAMES.has(node.callee.name)
      ) {
        return node.arguments.every(a =>
          a.type === 'SpreadElement'
            ? isPureExpression(a.argument as Expression)
            : isPureExpression(a as Expression),
        )
      }
      return hasPureAnnotation(node)
    case 'CallExpression':
    case 'OptionalCallExpression':
      // Whitelisted React factories.
      if (
        node.callee.type === 'Identifier' &&
        PURE_FACTORY_NAMES.has(node.callee.name)
      ) {
        return node.arguments.every(a =>
          a.type === 'SpreadElement'
            ? isPureExpression(a.argument as Expression)
            : isPureExpression(a as Expression),
        )
      }
      // `Object.freeze(...)` / `Object.assign(...)` / `Object.create(...)`
      // recognized as pure member-factory calls when arguments are pure.
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'Object' &&
        node.callee.property.type === 'Identifier' &&
        PURE_OBJECT_METHODS.has(node.callee.property.name)
      ) {
        return node.arguments.every(a =>
          a.type === 'SpreadElement'
            ? isPureExpression(a.argument as Expression)
            : isPureExpression(a as Expression),
        )
      }
      // /* @__PURE__ */ annotation.
      if (hasPureAnnotation(node)) return true
      return false
    case 'BinaryExpression':
      return (
        isPureExpression(node.left as Expression) &&
        isPureExpression(node.right as Expression)
      )
    case 'LogicalExpression':
      return isPureExpression(node.left) && isPureExpression(node.right)
    case 'ConditionalExpression':
      return (
        isPureExpression(node.test) &&
        isPureExpression(node.consequent) &&
        isPureExpression(node.alternate)
      )
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return (
        isPureExpression(node.object as Expression) &&
        (!node.computed || isPureExpression(node.property as Expression))
      )
    case 'SequenceExpression':
      return node.expressions.every(e => isPureExpression(e))
    default:
      return false
  }
}

type ModuleScope = {
  locals: Set<string>
}

function collectTopLevelLocals(stmts: readonly Statement[]): ModuleScope {
  const locals = new Set<string>()
  function recordPattern(node: Node | null): void {
    if (!node) return
    if (node.type === 'Identifier') {
      locals.add(node.name)
      return
    }
    if (node.type === 'ObjectPattern') {
      for (const p of node.properties) {
        if (p.type === 'ObjectProperty') recordPattern(p.value)
        if (p.type === 'RestElement') recordPattern(p.argument)
      }
      return
    }
    if (node.type === 'ArrayPattern') {
      for (const el of node.elements) recordPattern(el)
      return
    }
    if (node.type === 'AssignmentPattern') {
      recordPattern(node.left)
      return
    }
    if (node.type === 'RestElement') {
      recordPattern(node.argument)
      return
    }
  }
  for (const stmt of stmts) {
    let node: Node = stmt
    if (
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportDefaultDeclaration'
    ) {
      if (node.declaration) node = node.declaration as Node
      else continue
    }
    if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations) recordPattern(d.id)
    } else if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'ClassDeclaration' ||
      node.type === 'TSInterfaceDeclaration' ||
      node.type === 'TSTypeAliasDeclaration' ||
      node.type === 'TSEnumDeclaration' ||
      node.type === 'TSDeclareFunction'
    ) {
      if ((node as { id?: { name?: string } }).id?.name) {
        locals.add((node as { id: { name: string } }).id.name)
      }
    }
    if (stmt.type === 'ImportDeclaration') {
      for (const s of stmt.specifiers) {
        if (s.local?.name) locals.add(s.local.name)
      }
    }
  }
  return { locals }
}

function isComponentMetadataAssignment(
  expr: Expression,
  scope: ModuleScope,
): boolean {
  // Permit the standard React metadata-assignment pattern:
  //   <TopLevelLocal>.<displayName|defaultProps|propTypes> = <pure>
  // The LHS object MUST be a top-level local declared in this same module
  // (not an imported value, not a member chain). Modern bundlers
  // recognize this pattern and tree-shake the assignment when the
  // component itself is unused.
  if (expr.type !== 'AssignmentExpression' || expr.operator !== '=') {
    return false
  }
  const target = expr.left
  if (
    target.type !== 'MemberExpression' ||
    target.computed ||
    target.object.type !== 'Identifier' ||
    target.property.type !== 'Identifier'
  ) {
    return false
  }
  if (!scope.locals.has(target.object.name)) return false
  if (!COMPONENT_METADATA_KEYS.has(target.property.name)) return false
  return isPureExpression(expr.right)
}

function classifyTopLevelStatement(
  stmt: Statement,
  fileSource: string,
  scope: ModuleScope,
): { ok: true } | { ok: false; reason: string } {
  switch (stmt.type) {
    case 'ImportDeclaration': {
      // `import 'side-effect-only'` — no specifiers — is the canonical
      // observable side-effect import. Reject.
      if (stmt.specifiers.length === 0) {
        return {
          ok: false,
          reason: `side-effect-only import '${stmt.source.value}'`,
        }
      }
      return { ok: true }
    }
    case 'ExportNamedDeclaration': {
      if (stmt.declaration) {
        return classifyTopLevelStatement(
          stmt.declaration as Statement,
          fileSource,
          scope,
        )
      }
      return { ok: true }
    }
    case 'ExportDefaultDeclaration': {
      const decl = stmt.declaration
      if (
        decl.type === 'FunctionDeclaration' ||
        decl.type === 'ClassDeclaration' ||
        decl.type === 'TSDeclareFunction'
      ) {
        return { ok: true }
      }
      return isPureExpression(decl as Expression)
        ? { ok: true }
        : {
            ok: false,
            reason: `non-pure export default expression (${decl.type})`,
          }
    }
    case 'ExportAllDeclaration':
      return { ok: true }
    case 'VariableDeclaration': {
      for (const declarator of stmt.declarations) {
        if (!isPureExpression(declarator.init)) {
          return {
            ok: false,
            reason: `non-pure initializer for variable (${declarator.id.type === 'Identifier' ? declarator.id.name : '<destructure>'})`,
          }
        }
      }
      return { ok: true }
    }
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
    case 'TSDeclareFunction':
    case 'TSEnumDeclaration':
    case 'TSModuleDeclaration':
    case 'TSImportEqualsDeclaration':
    case 'EmptyStatement':
      return { ok: true }
    case 'ExpressionStatement': {
      const expr = stmt.expression
      // `'use client'` and `'use strict'` directives appear as
      // ExpressionStatement whose expression is a StringLiteral. Babel
      // marks them as `directive: true` on the wrapper but only when they
      // are still in the leading directive prologue. Either way, a top-
      // level string literal alone has no observable side effect — accept.
      if (expr.type === 'StringLiteral') return { ok: true }
      // `/* @__PURE__ */ someCall()` — call result is discarded but the
      // call is guaranteed pure by annotation.
      if (
        (expr.type === 'CallExpression' ||
          expr.type === 'OptionalCallExpression' ||
          expr.type === 'NewExpression') &&
        hasPureAnnotation(expr)
      ) {
        return { ok: true }
      }
      // React component metadata assignment (`Component.displayName = '...'`).
      if (isComponentMetadataAssignment(expr, scope)) {
        return { ok: true }
      }
      return {
        ok: false,
        reason: `bare expression statement (${expr.type})${expr.type === 'CallExpression' && expr.callee.type === 'Identifier' ? ` calling \`${expr.callee.name}()\`` : ''}`,
      }
    }
    case 'IfStatement':
      return { ok: false, reason: `top-level \`if\` statement` }
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
      return { ok: false, reason: `top-level loop` }
    case 'TryStatement':
      return { ok: false, reason: `top-level \`try\` statement` }
    case 'SwitchStatement':
      return { ok: false, reason: `top-level \`switch\` statement` }
    case 'BlockStatement':
      return { ok: false, reason: `top-level block statement` }
    default:
      return { ok: false, reason: `top-level ${stmt.type}` }
  }
}

function lineOf(source: string, offset: number): number {
  let line = 1
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) line += 1
  }
  return line
}

function snippetOf(source: string, start: number, end: number): string {
  const slice = source.slice(start, Math.min(end, start + 200))
  return slice.split('\n')[0].trim()
}

function lintModule(filePath: string): LintError[] {
  const source = readFileSync(filePath, 'utf8')
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    attachComment: true,
  })
  const scope = collectTopLevelLocals(ast.program.body)
  const errors: LintError[] = []
  for (const stmt of ast.program.body) {
    const result = classifyTopLevelStatement(stmt, source, scope)
    if (!result.ok) {
      errors.push({
        file: filePath,
        line: lineOf(source, stmt.start ?? 0),
        reason: result.reason,
        snippet: snippetOf(source, stmt.start ?? 0, stmt.end ?? 0),
      })
    }
  }
  return errors
}

function resolveLocalImport(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null
  const base = resolve(dirname(fromFile), spec)
  const candidates = [
    base,
    base + '.ts',
    base + '.tsx',
    base + '.js',
    base + '.jsx',
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
    resolve(base, 'index.js'),
  ]
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

function collectStaticGraph(entry: string): string[] {
  const visited = new Set<string>()
  const queue: string[] = [entry]
  while (queue.length > 0) {
    const file = queue.shift()!
    if (visited.has(file)) continue
    if (EXCLUDED_PATHS.has(file)) continue
    visited.add(file)

    const source = readFileSync(file, 'utf8')
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    })

    for (const stmt of ast.program.body) {
      if (stmt.type === 'ImportDeclaration') {
        // Skip type-only imports (`import type { X } from '...'`) and
        // imports whose every specifier is type-only.
        if (stmt.importKind === 'type') continue
        const allTypeOnly =
          stmt.specifiers.length > 0 &&
          stmt.specifiers.every(
            s => s.type === 'ImportSpecifier' && s.importKind === 'type',
          )
        if (allTypeOnly) continue
        const resolved = resolveLocalImport(file, stmt.source.value)
        if (resolved && !EXCLUDED_PATHS.has(resolved)) queue.push(resolved)
      }
      if (
        stmt.type === 'ExportNamedDeclaration' &&
        stmt.source &&
        stmt.exportKind !== 'type'
      ) {
        const allTypeOnly =
          stmt.specifiers.length > 0 &&
          stmt.specifiers.every(
            s => s.type === 'ExportSpecifier' && s.exportKind === 'type',
          )
        if (allTypeOnly) continue
        const resolved = resolveLocalImport(file, stmt.source.value)
        if (resolved && !EXCLUDED_PATHS.has(resolved)) queue.push(resolved)
      }
      if (stmt.type === 'ExportAllDeclaration' && stmt.exportKind !== 'type') {
        const resolved = resolveLocalImport(file, stmt.source.value)
        if (resolved && !EXCLUDED_PATHS.has(resolved)) queue.push(resolved)
      }
    }
  }
  return [...visited]
}

describe('default-entry static graph — top-level side-effect lint (spec tasks.md §9.6)', () => {
  const reachable = collectStaticGraph(indexEntry)

  it('walks at least the default-entry barrel + the runtime / facade modules', () => {
    // Sanity check on the graph walker — if it returned only `index.ts`
    // every file-level lint check below becomes vacuously true.
    expect(reachable.length).toBeGreaterThan(5)
    expect(reachable).toContain(indexEntry)
    expect(
      reachable.some(f => f.endsWith('runtime/bridge.ts')),
      'walker should reach runtime/bridge.ts via the default-entry import chain',
    ).toBe(true)
    expect(
      reachable.some(f => f.endsWith('facades/Model.tsx')),
      'walker should reach facades/Model.tsx via the default-entry import chain',
    ).toBe(true)
  })

  it('does NOT reach src/spatial/index.ts via the static graph (dynamic import only)', () => {
    // The bridge's dynamic `import('../spatial')` MUST be the only way the
    // spatial chunk is reachable from the default entry. A regression that
    // converted that to a static import would surface here.
    expect(
      reachable.some(f => f.endsWith('spatial/index.ts')),
      'spatial chunk MUST NOT be reachable via static `import` / `export` from the default entry',
    ).toBe(false)
  })

  it('every reachable module passes the top-level side-effect lint', () => {
    const allErrors: LintError[] = []
    for (const file of reachable) {
      allErrors.push(...lintModule(file))
    }
    // Format the failure message so a regression prints which module / line
    // / reason violated the lint, not just `expect([]).toEqual(0)`.
    const formatted = allErrors.map(
      e =>
        `  ${e.file.replace(sourceRoot + '/', 'src/')}:${e.line} — ${e.reason}\n    ${e.snippet}`,
    )
    expect(allErrors, formatted.join('\n')).toEqual([])
  })

  it('telemetry: prints the static-graph closure walked (spec §9.9)', () => {
    const relative = reachable
      .map(f =>
        f.startsWith(sourceRoot + '/') ? f.slice(sourceRoot.length + 1) : f,
      )
      .sort()
    // eslint-disable-next-line no-console
    console.log(
      `[side-effect-lint] default-entry static-graph closure (${relative.length} files):\n  ${relative.join('\n  ')}`,
    )
    expect(relative.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Self-test — fixtures for the classifier so a future tweak to the rule
// doesn't silently weaken the contract. These are pure unit tests on the
// AST classifier; they don't touch any real source file.
// ---------------------------------------------------------------------------

describe('default-entry side-effect lint — classifier unit tests', () => {
  function lintSource(source: string): LintError[] {
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      attachComment: true,
    })
    const scope = collectTopLevelLocals(ast.program.body)
    const errors: LintError[] = []
    for (const stmt of ast.program.body) {
      const result = classifyTopLevelStatement(stmt, source, scope)
      if (!result.ok) {
        errors.push({
          file: '<inline>',
          line: lineOf(source, stmt.start ?? 0),
          reason: result.reason,
          snippet: snippetOf(source, stmt.start ?? 0, stmt.end ?? 0),
        })
      }
    }
    return errors
  }

  it('PERMITS forwardRef / memo / createContext / lazy / new Map / new Set / new WeakMap', () => {
    const source = `
import { forwardRef, memo, createContext, lazy } from 'react'
const Component = forwardRef((props, ref) => null)
const Memoized = memo(Component)
const Context = createContext(null)
const LazyComponent = lazy(() => import('./other'))
const cache = new Map()
const subscribers = new Set()
const refs = new WeakMap()
`
    expect(lintSource(source)).toEqual([])
  })

  it('PERMITS /* @__PURE__ */-annotated calls and constructors', () => {
    const source = `
const x = /* @__PURE__ */ someFactory()
const y = /* @__PURE__ */ new SomeClass()
`
    expect(lintSource(source)).toEqual([])
  })

  it('PERMITS const literal / arrow / function / class declarations', () => {
    const source = `
const KEY = 'metric'
const adder = (a, b) => a + b
function helper() { return null }
class Box {}
`
    expect(lintSource(source)).toEqual([])
  })

  it('REJECTS top-level if statement (the existing initPolyfill pattern)', () => {
    const source = `
if (typeof window !== 'undefined') {
  initPolyfill()
}
`
    const errors = lintSource(source)
    expect(errors.length).toBe(1)
    expect(errors[0].reason).toMatch(/top-level `if`/)
  })

  it('REJECTS bare function-call ExpressionStatement', () => {
    const source = `initPolyfill()`
    const errors = lintSource(source)
    expect(errors.length).toBe(1)
    expect(errors[0].reason).toMatch(/bare expression statement/)
  })

  it('REJECTS side-effect-only import (`import "x"`)', () => {
    const source = `import 'some-side-effect-module'`
    const errors = lintSource(source)
    expect(errors.length).toBe(1)
    expect(errors[0].reason).toMatch(/side-effect-only import/)
  })

  it('REJECTS bare new-expression at top level', () => {
    const source = `new Polyfill()`
    const errors = lintSource(source)
    expect(errors.length).toBe(1)
  })
})
