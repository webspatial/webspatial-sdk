import { SpatialSession } from '@xrsdk/runtime'
import { showSample } from './sampleLoader'
import { Model } from '@xrsdk/react'

function MySample(_props: { session?: SpatialSession }) {
  return (
    <div className="flex flex-col items-center w-full">
      <Model
        className="w-52 h-52 bg-white bg-opacity-25 rounded-xl"
        onLoad={event => {
          if (event.target.ready) {
            console.log('loaded complete ' + event.target.currentSrc)
          }
        }}
        poster="https://raw.githubusercontent.com/immersive-web/model-element/main/examples/assets/FlightHelmet.png"
      >
        <source
          src="https://raw.githubusercontent.com/immersive-web/model-element/main/examples/assets/FlightHelmet.usdz"
          type="model/vnd.usdz+zip"
        ></source>
        <source
          src="https://raw.githubusercontent.com/BabylonJS/MeshesLibrary/master/flightHelmet.glb"
          type="model/gltf-binary"
        />
      </Model>
    </div>
  )
}
showSample(MySample)
