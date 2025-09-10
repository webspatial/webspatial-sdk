import ReactDOM from 'react-dom/client'

import {
  enableDebugTool
} from '@webspatial/react-sdk'
import { useEffect } from 'react'

enableDebugTool()

function App() {
  const initDynamic3D = async () => {
    let container = await callNative('CreateSpatializedDynamic3DElement', JSON.stringify({test:true}))
    if(container.id){
      await callNative('AddSpatializedElementToSpatialScene', JSON.stringify({spatializedElementId:container.id}))

      
      let entity = await createBoxEntity(0.2, 0.1, 0.1, 0.02, "#FF0000")
      if(entity.id){
        await callNative('AddEntityToDynamic3D', JSON.stringify({dynamic3dId:container.id, entityId:entity.id}))
      }

      let entity2 = await createBoxEntity(0.1, 0.2, 0.1, 0.05, "#00FF00")
      if(entity2.id){
        await callNative('AddEntityToEntity', JSON.stringify({parentId:entity.id, childId:entity2.id}))

        let matrix = new DOMMatrix()
        matrix.translateSelf(0, 0.1, 0)
        matrix.rotateAxisAngleSelf(0,0,1,45)
        await callNative('UpdateEntityProperties', JSON.stringify({entityId:entity2.id, transform:matrix.toFloat64Array()}))
      }
    }
  }

  const createBoxEntity = async (width:number, height:number, depth:number, cornerRadius:number, color:string) => {
    let geometryData = {
      type: "BoxGeometry",
      width,
      height,
      depth,
      cornerRadius
    }
    let geometry = await callNative('CreateGeometry', JSON.stringify(geometryData))
    let material = await callNative('CreateUnlitMaterial', JSON.stringify({
      type: "UnlitMaterial",
      color,
    }))
    let component = await callNative('CreateModelComponent', JSON.stringify({
      type: "ModelComponent",
      geometryId: geometry.id,
      materialIds: [material.id],
    }))
    let entity = await callNative('CreateSpatialEntity', JSON.stringify({name:"entity"}))
    await callNative('AddComponentToEntity', JSON.stringify({entityId:entity.id, componentId:component.id}))
    return entity
  }

  const callNative = async (command: string, data: string) => {
    return await window?.webkit?.messageHandlers?.bridge?.postMessage(`${command}::${data}`)
  }

  useEffect(() => {
    initDynamic3D()
  }, [])

  return (
    <>
      <div style={{ width: '100px', height: '100px' }}>
        Start of SpatializedContainer
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
