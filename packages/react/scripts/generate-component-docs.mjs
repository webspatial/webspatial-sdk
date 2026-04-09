import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { componentDocgenConfig } from './component-docs.config.mjs'

const scriptDir = path.dirname(new URL(import.meta.url).pathname)
const packageRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(packageRoot, '..', '..')
const tsconfigPath = path.resolve(packageRoot, 'tsconfig.json')

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/')
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

function isRepoSourceFile(fileName) {
  const normalized = toPosix(path.resolve(fileName))
  const sourceRoot = toPosix(path.resolve(repoRoot, 'packages/react/src'))
  return normalized.startsWith(sourceRoot)
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

function extractProps(checker, sourceFile, typeNode) {
  const propsType = checker.getTypeAtLocation(typeNode)
  const props = checker
    .getPropertiesOfType(propsType)
    .map(symbol => {
      const declarations = symbol.declarations ?? []
      if (declarations.length === 0) {
        return null
      }
      const valueDeclaration =
        declarations.find(declaration =>
          isRepoSourceFile(declaration.getSourceFile().fileName),
        ) ??
        symbol.valueDeclaration ??
        declarations[0] ??
        typeNode
      const symbolType = checker.getTypeOfSymbolAtLocation(
        symbol,
        valueDeclaration,
      )
      const isOptional =
        (symbol.getFlags() & ts.SymbolFlags.Optional) ===
        ts.SymbolFlags.Optional
      const docs = ts.displayPartsToString(
        symbol.getDocumentationComment(checker),
      )
      const jsDocTags = symbol.getJsDocTags().map(tag => ({
        name: tag.name,
        text: getTagText(tag),
      }))
      const defaultTag = jsDocTags.find(tag => tag.name === 'default')

      return {
        name: symbol.getName(),
        required: !isOptional,
        type: checker.typeToString(symbolType),
        description: docs.trim(),
        defaultValue: defaultTag?.text || null,
        tags: jsDocTags,
        source: getSourceInfo(sourceFile, valueDeclaration),
      }
    })
    .filter(Boolean)
    .filter(prop => isRepoSourceFile(path.resolve(repoRoot, prop.source.file)))
    .sort((a, b) => a.name.localeCompare(b.name))

  return props
}

function main() {
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

  const componentFiles = componentDocgenConfig.components.map(component =>
    path.resolve(repoRoot, component.sourceFile),
  )

  const allRootNames = Array.from(
    new Set([...parsedConfig.fileNames, ...componentFiles]),
  )

  const program = ts.createProgram({
    rootNames: allRootNames,
    options: parsedConfig.options,
  })
  const checker = program.getTypeChecker()

  const components = componentDocgenConfig.components.map(component => {
    const absoluteSource = path.resolve(repoRoot, component.sourceFile)
    const sourceFile = program.getSourceFile(absoluteSource)

    if (!sourceFile) {
      throw new Error(
        `Source file not found in TypeScript program: ${component.sourceFile}`,
      )
    }

    const propsTypeNode = findExportedTypeNode(sourceFile, component.propsType)
    if (!propsTypeNode) {
      throw new Error(
        `Could not find exported type/interface ${component.propsType} in ${component.sourceFile}`,
      )
    }

    const refTypeNode = component.refType
      ? findExportedTypeNode(sourceFile, component.refType)
      : null

    return {
      name: component.name,
      displayName: extractDisplayName(sourceFile, component.name),
      sourceFile: component.sourceFile,
      propsType: component.propsType,
      refType: component.refType ?? null,
      refTypeResolved: refTypeNode
        ? checker.typeToString(checker.getTypeAtLocation(refTypeNode))
        : null,
      props: extractProps(checker, sourceFile, propsTypeNode),
    }
  })

  const output = {
    schemaVersion: 1,
    generatedBy: 'packages/react/scripts/generate-component-docs.mjs',
    tsconfigPath: toPosix(path.relative(repoRoot, tsconfigPath)),
    components,
  }

  const outputPath = path.resolve(repoRoot, componentDocgenConfig.outputFile)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

  console.log(
    `Generated component docs: ${toPosix(path.relative(repoRoot, outputPath))}`,
  )
}

main()
