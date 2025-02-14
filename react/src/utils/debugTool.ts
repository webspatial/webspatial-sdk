import { getSession } from './getSession'

async function getStat() {
  const statsInfo = await getSession()!._getStats()

  return statsInfo
}

function simplifyEntityTree(rootTree: any) {
  const rootEntity = Object.values(rootTree.childEntities)[0]

  function traverseTree(node: any, parent: any, callback: any) {
    callback(node, parent)

    const childrenNodes = Object.values(node.childEntities)
    if (childrenNodes) {
      childrenNodes.forEach(child => {
        traverseTree(child, node, callback)
      })
    }
  }

  let rootNode
  const nodeMap: Record<string, any> = {}
  function visitNode(node: any, parent: any) {
    let newNode = {
      id: node.id,
      name: node.name,
      children: [],
      position: node.position,
      scale: node.scale,
      width: node.components[0].resolutionX,
      height: node.components[0].resolutionY,
      zIndex: node.zIndex,
      visible: node.visible,
      cornerRadius: node.components[0].cornerRadius,
      backgroundMaterial: node.components[0].backgroundMaterial,
      isOpaque: node.components[0].isOpaque,
    }
    nodeMap[node.id] = newNode

    if (!parent) {
      rootNode = newNode
    } else {
      const parentNode = nodeMap[parent.id]
      parentNode.children.push(newNode)
    }
  }

  traverseTree(rootEntity, null, visitNode)
  console.log('rootNode', rootNode)
  return rootNode
}

async function inspectRootWindowContainer(simple?: boolean) {
  const rootWindowContainerInfo =
    await getSession()!._inspectRootWindowContainer()
  console.log(rootWindowContainerInfo)

  if (simple) {
    return simplifyEntityTree(rootWindowContainerInfo)
  }
  return rootWindowContainerInfo
}

export function enableDebugTool() {
  const session = getSession()
  Object.assign(window, {
    session,
    getStat,
    inspectRootWindowContainer,
  })
}
