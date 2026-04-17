import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { componentDocgenConfig } from './component-docs.config.mjs'

const FRAMEWORK_PROP_NAMES = new Set([
  'enable-xr',
  'sizingMode',
  'spatializedContent',
  'createSpatializedElement',
  'getExtraSpatializedElementProperties',
  'spatialEventOptions',
  'enableInput',
  'position',
  'rotation',
  'scale',
  'materials',
  'src',
  'autoPlay',
  'loop',
  'attachment',
  'recreateKey',
])

const FRAMEWORK_EVENT_NAMES = new Set([
  'onSpatialTap',
  'onSpatialDragStart',
  'onSpatialDrag',
  'onSpatialDragEnd',
  'onSpatialRotate',
  'onSpatialRotateEnd',
  'onSpatialMagnify',
  'onSpatialMagnifyEnd',
])

const scriptDir = path.dirname(new URL(import.meta.url).pathname)
const packageRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(packageRoot, '..', '..')
const tsconfigPath = path.resolve(packageRoot, 'tsconfig.json')

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/')
}

function normalizeDocgenType(typeInfo) {
  if (!typeInfo) return ''
  if (typeof typeInfo === 'string') return typeInfo
  if (typeof typeInfo.raw === 'string') return typeInfo.raw
  if (typeof typeInfo.name === 'string') {
    if (Array.isArray(typeInfo.value)) {
      return `${typeInfo.name}<${typeInfo.value.join(' | ')}>`
    }
    return typeInfo.name
  }
  return ''
}

function normalizeTagEntry(tag) {
  if (!tag) return null
  if (typeof tag === 'string') {
    return {
      name: 'unknown',
      text: tag,
    }
  }

  const name = typeof tag.name === 'string' ? tag.name : 'unknown'
  const textValue =
    typeof tag.text === 'string'
      ? tag.text
      : typeof tag.description === 'string'
        ? tag.description
        : Array.isArray(tag.description)
          ? tag.description
              .map(entry =>
                typeof entry === 'string' ? entry : (entry?.value ?? ''),
              )
              .join(' ')
          : ''

  return {
    name,
    text: textValue.trim(),
  }
}

function isEventProp(prop) {
  return /^on[A-Z]/.test(prop.name)
}

function isAriaProp(prop) {
  return prop.name.startsWith('aria-')
}

export function isFrameworkProp(prop) {
  if (FRAMEWORK_PROP_NAMES.has(prop.name)) return true
  if (FRAMEWORK_EVENT_NAMES.has(prop.name)) return true

  const sourceFile = prop.source?.file ?? ''
  return (
    sourceFile.startsWith('packages/react/src/reality/') ||
    sourceFile.startsWith('packages/react/src/spatialized-container/') ||
    sourceFile === 'packages/react/src/Model.tsx'
  )
}

function classifyProps(props) {
  const customProps = []
  const domProps = []
  const ariaProps = []
  const eventProps = []

  for (const prop of props) {
    const frameworkProp = isFrameworkProp(prop)
    const enrichedProp = {
      ...prop,
      isFrameworkProp: frameworkProp,
    }

    if (isAriaProp(prop)) {
      ariaProps.push(enrichedProp)
      continue
    }

    if (isEventProp(prop)) {
      eventProps.push(enrichedProp)
      continue
    }

    if (frameworkProp) {
      customProps.push(enrichedProp)
      continue
    }

    domProps.push(enrichedProp)
  }

  const sortByFrameworkThenName = (a, b) => {
    if (a.isFrameworkProp !== b.isFrameworkProp) {
      return a.isFrameworkProp ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  }

  customProps.sort(sortByFrameworkThenName)
  domProps.sort(sortByFrameworkThenName)
  ariaProps.sort((a, b) => a.name.localeCompare(b.name))
  eventProps.sort((a, b) => {
    if (a.isFrameworkProp !== b.isFrameworkProp) {
      return a.isFrameworkProp ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  return {
    customProps,
    domProps,
    ariaProps,
    eventProps,
  }
}

function getTagText(tag) {
  const text = ts.displayPartsToString(tag.text ?? [])
  return text.trim()
}

function extractDisplayName(sourceFile, componentName) {
  let displayName = null

  const visit = node => {
    if (
      ts.isExpressionStatement(node) &&
      ts.isBinaryExpression(node.expression) &&
      node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      const left = node.expression.left
      const right = node.expression.right

      if (
        ts.isPropertyAccessExpression(left) &&
        left.expression.getText(sourceFile) === componentName &&
        left.name.getText(sourceFile) === 'displayName' &&
        ts.isStringLiteral(right)
      ) {
        displayName = right.text
      }
    }

    ts.forEachChild(node, visit)
  }

  ts.forEachChild(sourceFile, visit)
  return displayName
}

function getSourceInfo(sourceFile, node) {
  const start = node.getStart(sourceFile)
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(start)
  return {
    file: toPosix(path.relative(repoRoot, sourceFile.fileName)),
    line: line + 1,
    column: character + 1,
  }
}

function findExportedTypeNode(sourceFile, typeName) {
  for (const statement of sourceFile.statements) {
    if (
      (ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement)) &&
      statement.name.text === typeName
    ) {
      const modifiers = ts.canHaveModifiers(statement)
        ? (ts.getModifiers(statement) ?? [])
        : []
      const hasExport = modifiers.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword,
      )
      if (hasExport) {
        return statement
      }
    }
  }

  return null
}

function findExportedComponentNode(sourceFile, componentName) {
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === componentName
    ) {
      const modifiers = ts.getModifiers(statement) ?? []
      const hasExport = modifiers.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword,
      )
      if (hasExport) return statement
    }

    if (ts.isVariableStatement(statement)) {
      const modifiers = ts.getModifiers(statement) ?? []
      const hasExport = modifiers.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword,
      )
      if (!hasExport) continue

      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === componentName
        ) {
          return declaration
        }
      }
    }
  }

  return null
}

function extractTsProps(checker, sourceFile, typeNode) {
  const propsType = checker.getTypeAtLocation(typeNode)

  return checker
    .getPropertiesOfType(propsType)
    .map(symbol => {
      const declarations = symbol.declarations ?? []
      if (declarations.length === 0) {
        return null
      }

      const valueDeclaration = symbol.valueDeclaration ?? declarations[0]
      const declarationSource = valueDeclaration.getSourceFile()
      const source = getSourceInfo(declarationSource, valueDeclaration)

      const symbolType = checker.getTypeOfSymbolAtLocation(
        symbol,
        valueDeclaration,
      )
      const isOptional =
        (symbol.getFlags() & ts.SymbolFlags.Optional) ===
        ts.SymbolFlags.Optional

      const jsDocTags = symbol.getJsDocTags().map(tag => ({
        name: tag.name,
        text: getTagText(tag),
      }))

      const deprecatedTag = jsDocTags.find(tag => tag.name === 'deprecated')
      const seeTags = jsDocTags
        .filter(tag => tag.name === 'see')
        .map(tag => tag.text)
      const defaultTag = jsDocTags.find(tag => tag.name === 'default')
      const description = ts
        .displayPartsToString(symbol.getDocumentationComment(checker))
        .trim()

      return {
        name: symbol.getName(),
        required: !isOptional,
        type: checker.typeToString(symbolType),
        description,
        defaultValue: defaultTag?.text || null,
        deprecated: deprecatedTag?.text || null,
        see: seeTags,
        tags: jsDocTags,
        source,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function getReactDocgenModule() {
  try {
    const reactDocgen = await import('react-docgen')
    return reactDocgen
  } catch (_error) {
    return null
  }
}

function getDocgenHandlers(reactDocgen) {
  const handlers = []

  const builtins = reactDocgen.builtinHandlers ?? reactDocgen.handlers ?? {}
  for (const key of [
    'displayNameHandler',
    'descriptionHandler',
    'defaultPropsHandler',
    'propTypeHandler',
    'propDocblockHandler',
    'jsDocHandler',
  ]) {
    if (typeof builtins[key] === 'function') {
      handlers.push(builtins[key])
    }
  }

  return handlers.length > 0 ? handlers : undefined
}

function getDocgenResolver(reactDocgen) {
  const resolvers = reactDocgen.builtinResolvers ?? reactDocgen.resolvers ?? {}

  if (typeof resolvers.findAllExportedComponentDefinitions === 'function') {
    return resolvers.findAllExportedComponentDefinitions
  }

  if (typeof resolvers.findExportedComponentDefinition === 'function') {
    return resolvers.findExportedComponentDefinition
  }

  return undefined
}

function normalizeDocgenPropMeta(propInfo = {}) {
  const tags = []

  if (Array.isArray(propInfo.tags)) {
    for (const tag of propInfo.tags) {
      const normalized = normalizeTagEntry(tag)
      if (normalized) tags.push(normalized)
    }
  }

  if (Array.isArray(propInfo.doclets)) {
    for (const doclet of propInfo.doclets) {
      const normalized = normalizeTagEntry(doclet)
      if (normalized) tags.push(normalized)
    }
  }

  const defaultValue =
    propInfo.defaultValue?.value ??
    propInfo.defaultValue?.computed ??
    propInfo.defaultValue ??
    null

  const deprecatedTag = tags.find(tag => tag.name === 'deprecated')
  const seeTags = tags.filter(tag => tag.name === 'see').map(tag => tag.text)

  return {
    description: (propInfo.description ?? '').trim(),
    type:
      normalizeDocgenType(propInfo.tsType) ||
      normalizeDocgenType(propInfo.type),
    defaultValue:
      typeof defaultValue === 'string' ? defaultValue.trim() : defaultValue,
    deprecated: deprecatedTag?.text ?? null,
    see: seeTags,
    tags,
    required: propInfo.required,
  }
}

async function parseWithReactDocgen(componentConfig) {
  const reactDocgen = await getReactDocgenModule()
  if (!reactDocgen?.parse) {
    return null
  }

  const sourceFilePath = path.resolve(repoRoot, componentConfig.sourceFile)
  const sourceText = fs.readFileSync(sourceFilePath, 'utf8')

  const resolver = getDocgenResolver(reactDocgen)
  const handlers = getDocgenHandlers(reactDocgen)

  let parsedDocs
  try {
    parsedDocs = reactDocgen.parse(sourceText, resolver, handlers, {
      filename: sourceFilePath,
    })
  } catch (_error) {
    return null
  }

  const docsArray = Array.isArray(parsedDocs) ? parsedDocs : [parsedDocs]

  const docForComponent = docsArray.find(doc => {
    const displayName = doc.displayName ?? ''
    return (
      displayName === componentConfig.name ||
      displayName.endsWith(componentConfig.name)
    )
  })

  if (!docForComponent) {
    return null
  }

  const props = docForComponent.props ?? {}
  const propEntries = Object.entries(props).map(([name, info]) => [
    name,
    normalizeDocgenPropMeta(info),
  ])

  return {
    summary: (docForComponent.description ?? '').trim(),
    propMap: Object.fromEntries(propEntries),
  }
}

function mergeTsAndDocgenProps(tsProps, docgenData) {
  if (!docgenData) return tsProps

  return tsProps.map(tsProp => {
    const meta = docgenData.propMap[tsProp.name]
    if (!meta) return tsProp

    return {
      ...tsProp,
      description: meta.description || tsProp.description,
      type: meta.type || tsProp.type,
      defaultValue: meta.defaultValue ?? tsProp.defaultValue,
      deprecated: meta.deprecated ?? tsProp.deprecated,
      see: meta.see?.length ? meta.see : tsProp.see,
      tags: meta.tags?.length ? meta.tags : tsProp.tags,
      required:
        typeof meta.required === 'boolean' ? meta.required : tsProp.required,
    }
  })
}

function toMarkdownTable(props) {
  if (props.length === 0) return '_None._\n'

  const lines = [
    '| Prop | Type | Required | Description | Default | Deprecated |',
    '| --- | --- | --- | --- | --- | --- |',
  ]

  for (const prop of props) {
    const description = (prop.description || '').replace(/\n/g, ' ')
    const type = (prop.type || '').replace(/\|/g, '\\|')
    const defaultValue = String(prop.defaultValue ?? '').replace(/\|/g, '\\|')
    const deprecated = (prop.deprecated || '').replace(/\|/g, '\\|')

    lines.push(
      `| \`${prop.name}\` | \`${type}\` | ${prop.required ? 'yes' : 'no'} | ${description} | ${defaultValue} | ${deprecated} |`,
    )
  }

  return `${lines.join('\n')}\n`
}

function renderDocsMarkdown(docJson) {
  const lines = [
    '# React Component API (Generated)',
    '',
    '> Generated file. Do not edit by hand.',
    '',
  ]

  for (const component of docJson.components) {
    lines.push(`## ${component.displayName || component.name}`)
    lines.push('')
    lines.push(`- Source: \`${component.sourceFile}\``)
    lines.push(`- Props type: \`${component.propsType}\``)
    if (component.refTypeResolved) {
      lines.push(`- Ref type: \`${component.refTypeResolved}\``)
    }
    if (component.summary) {
      lines.push('')
      lines.push(component.summary)
    }
    lines.push('')
    lines.push('### Custom props')
    lines.push('')
    lines.push(toMarkdownTable(component.customProps))

    for (const [sectionTitle, sectionKey] of [
      ['Event props', 'eventProps'],
      ['DOM props', 'domProps'],
      ['ARIA props', 'ariaProps'],
    ]) {
      lines.push(`<details>`)
      lines.push(
        `<summary>${sectionTitle} (${component[sectionKey].length})</summary>`,
      )
      lines.push('')
      lines.push(toMarkdownTable(component[sectionKey]))
      lines.push('</details>')
      lines.push('')
    }
  }

  return `${lines.join('\n')}\n`
}

async function main() {
  const readConfig = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (readConfig.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(readConfig.error.messageText, '\n'),
    )
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    readConfig.config,
    ts.sys,
    packageRoot,
  )

  const componentFiles = componentDocgenConfig.components.flatMap(component => {
    const paths = [path.resolve(repoRoot, component.sourceFile)]
    if (component.propsSourceFile) {
      paths.push(path.resolve(repoRoot, component.propsSourceFile))
    }
    return paths
  })

  const allRootNames = Array.from(
    new Set([...parsedConfig.fileNames, ...componentFiles]),
  )

  const program = ts.createProgram({
    rootNames: allRootNames,
    options: parsedConfig.options,
  })
  const checker = program.getTypeChecker()

  const components = []

  for (const componentConfig of componentDocgenConfig.components) {
    const absoluteSource = path.resolve(repoRoot, componentConfig.sourceFile)
    const sourceFile = program.getSourceFile(absoluteSource)

    if (!sourceFile) {
      throw new Error(
        `Source file not found in TypeScript program: ${componentConfig.sourceFile}`,
      )
    }

    const propsTypeSourceFile = componentConfig.propsSourceFile
      ? program.getSourceFile(
          path.resolve(repoRoot, componentConfig.propsSourceFile),
        )
      : sourceFile

    if (!propsTypeSourceFile) {
      throw new Error(
        `Props source file not found in TypeScript program: ${componentConfig.propsSourceFile}`,
      )
    }

    const propsTypeNode = findExportedTypeNode(
      propsTypeSourceFile,
      componentConfig.propsType,
    )
    if (!propsTypeNode) {
      throw new Error(
        `Could not find exported type/interface ${componentConfig.propsType} in ${componentConfig.sourceFile}`,
      )
    }

    const refTypeNode = componentConfig.refType
      ? findExportedTypeNode(sourceFile, componentConfig.refType)
      : null

    const componentNode = findExportedComponentNode(
      sourceFile,
      componentConfig.name,
    )
    const componentSummary = componentNode
      ? ts
          .displayPartsToString(
            checker
              .getSymbolAtLocation(componentNode.name ?? componentNode)
              ?.getDocumentationComment(checker) ?? [],
          )
          .trim()
      : ''

    const tsProps = extractTsProps(checker, sourceFile, propsTypeNode)
    const reactDocgenData = await parseWithReactDocgen(componentConfig)
    const mergedProps = mergeTsAndDocgenProps(tsProps, reactDocgenData)
    const categorized = classifyProps(mergedProps)

    components.push({
      name: componentConfig.name,
      displayName:
        extractDisplayName(sourceFile, componentConfig.name) ||
        componentConfig.name,
      sourceFile: componentConfig.sourceFile,
      propsType: componentConfig.propsType,
      refTypeResolved: refTypeNode
        ? checker.typeToString(checker.getTypeAtLocation(refTypeNode))
        : null,
      summary: reactDocgenData?.summary || componentSummary,
      ...categorized,
    })
  }

  const output = {
    schemaVersion: 2,
    generatedBy: 'packages/react/scripts/generate-component-docs.mjs',
    parser: {
      primary: 'react-docgen',
      fallback: 'typescript-checker',
    },
    tsconfigPath: toPosix(path.relative(repoRoot, tsconfigPath)),
    components,
  }

  const outputPath = path.resolve(repoRoot, componentDocgenConfig.outputFile)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

  const markdownPath = path.resolve(
    repoRoot,
    'docs/generated/react-components.md',
  )
  fs.writeFileSync(markdownPath, renderDocsMarkdown(output), 'utf8')

  console.log(
    `Generated component docs: ${toPosix(path.relative(repoRoot, outputPath))}`,
  )
  console.log(
    `Generated component docs markdown: ${toPosix(path.relative(repoRoot, markdownPath))}`,
  )
}

main()
