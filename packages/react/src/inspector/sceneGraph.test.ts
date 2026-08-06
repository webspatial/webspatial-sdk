import { describe, expect, it } from 'vitest'
import {
  applySpatialDomStylePatch,
  findSpatialDomBinding,
  normalizeSpatialSceneInspect,
} from './sceneGraph'

describe('normalizeSpatialSceneInspect', () => {
  it('builds one tree from mounted spatial children, Reality entities, and ornaments', () => {
    const snapshot = normalizeSpatialSceneInspect({
      id: 'scene-1',
      children: {
        div: {
          id: 'div-1',
          name: 'Card',
          type: 'Spatialized2DElement',
          children: {
            model: {
              id: 'model-1',
              type: 'SpatializedStatic3DElement',
              modelURL: '/car.usdz',
            },
          },
        },
        reality: {
          id: 'reality-1',
          type: 'SpatializedDynamic3DElement',
          root: {
            id: 'root-1',
            children: {
              entity: {
                id: 'entity-1',
                name: 'Vehicle',
                type: 'SpatialModelEntity',
                position: { x: 1, y: 2, z: 3 },
              },
            },
          },
        },
      },
      ornaments: {
        ornament: {
          id: 'ornament-1',
          type: 'Ornament',
          options: { width: 620, height: 520 },
        },
      },
      spatialObjectList: [
        { id: 'div-1', type: 'Spatialized2DElement' },
        { id: 'asset-1', type: 'SpatialModelResource' },
      ],
    })

    expect(snapshot.root.children.map(node => node.kind)).toEqual([
      'spatial-div',
      'reality',
      'group',
    ])
    expect(snapshot.root.children[0].children[0]).toMatchObject({
      id: 'model-1',
      kind: 'model',
      canHaveDomHost: true,
    })
    expect(snapshot.root.children[1].children[0].children[0]).toMatchObject({
      id: 'entity-1',
      label: 'Vehicle',
      type: 'SpatialModelEntity',
    })
    expect(snapshot.root.children[2].children[0]).toMatchObject({
      id: 'ornament-1',
      kind: 'ornament',
    })
    expect(snapshot.root.children.map(node => node.id)).not.toContain('asset-1')
    expect(snapshot.nodeCount).toBe(7)
  })

  it('accepts Android-style entity child arrays', () => {
    const snapshot = normalizeSpatialSceneInspect({
      children: {
        reality: {
          id: 'reality-1',
          type: 'SpatializedDynamic3DElement',
          root: {
            id: 'root-1',
            children: [{ id: 'entity-1', name: 'Box' }],
          },
        },
      },
    })

    expect(snapshot.root.children[0].children[0].children[0]).toMatchObject({
      id: 'entity-1',
      label: 'Box',
      kind: 'entity',
    })
  })

  it('sorts native dictionaries into a stable tree order', () => {
    const snapshot = normalizeSpatialSceneInspect({
      id: 'scene-1',
      children: {
        zReality: {
          id: 'z-reality',
          type: 'SpatializedDynamic3DElement',
          root: {
            id: 'root',
            children: {
              z: { id: 'z-entity', name: 'zeta' },
              a: { id: 'a-entity', name: 'alpha' },
            },
          },
        },
        aModel: {
          id: 'a-model',
          type: 'SpatializedStatic3DElement',
        },
        bDiv: {
          id: 'b-div',
          name: 'Beta Div',
          type: 'Spatialized2DElement',
        },
        aDiv: {
          id: 'a-div',
          name: 'Alpha Div',
          type: 'Spatialized2DElement',
        },
        upperCaseId: {
          id: 'A',
          name: 'Same',
          type: 'Spatialized2DElement',
        },
        lowerCaseId: {
          id: 'a',
          name: 'Same',
          type: 'Spatialized2DElement',
        },
      },
      ornaments: {
        z: { id: 'z-ornament', type: 'Ornament' },
        a: { id: 'a-ornament', type: 'Ornament' },
      },
      spatialObjectList: [
        { id: 'z-resource', type: 'Texture' },
        { id: 'a-resource', type: 'Geometry' },
      ],
    })

    expect(snapshot.root.children.map(node => node.id)).toEqual([
      'a-div',
      'b-div',
      'A',
      'a',
      'a-model',
      'z-reality',
      'scene-1:ornaments',
    ])
    expect(
      snapshot.root.children
        .find(node => node.id === 'z-reality')
        ?.children[0].children.map(node => node.id),
    ).toEqual(['a-entity', 'z-entity'])
    expect(
      snapshot.root.children
        .find(node => node.id === 'scene-1:ornaments')
        ?.children.map(node => node.id),
    ).toEqual(['a-ornament', 'z-ornament'])
    expect(snapshot.root.children.map(node => node.id)).not.toContain(
      'scene-1:resources',
    )
  })
})

describe('spatial DOM bindings', () => {
  it('matches a native id through the placeholder runtime handle', () => {
    const element = document.createElement('div')
    element.setAttribute('data-spatial-id', 'root_container')
    const syncSpatializedElement = async () => {}
    Object.assign(element, {
      __innerSpatializedElement: () => ({ id: 'native-1' }),
      __syncSpatializedElement: syncSpatializedElement,
    })
    document.body.appendChild(element)

    expect(findSpatialDomBinding('native-1')?.element).toBe(element)
    expect(findSpatialDomBinding('native-1')?.syncSpatializedElement).toBe(
      syncSpatializedElement,
    )
    expect(findSpatialDomBinding('root_container')).toBeNull()

    element.remove()
  })

  it('applies only the supported DOM-backed edit fields', () => {
    const element = document.createElement('div')
    applySpatialDomStylePatch(element, {
      width: 320,
      height: 180,
      opacity: 2,
      visible: false,
      depth: 64,
      backOffset: 12,
      zIndex: 3,
    })

    expect(element.style.width).toBe('320px')
    expect(element.style.height).toBe('180px')
    expect(element.style.opacity).toBe('1')
    expect(element.style.visibility).toBe('hidden')
    expect(element.style.getPropertyValue('--xr-depth')).toBe('64')
    expect(element.style.getPropertyValue('--xr-back')).toBe('12')
    expect(element.style.getPropertyValue('--xr-z-index')).toBe('3')
  })
})
