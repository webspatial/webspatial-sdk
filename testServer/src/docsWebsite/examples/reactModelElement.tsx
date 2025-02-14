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
        poster="/src/assets/FlightHelmet.png"
      >
        <source
          src="/src/assets/FlightHelmet.usdz"
          type="model/vnd.usdz+zip"
        ></source>
        <source src="/src/assets/FlightHelmet.glb" type="model/gltf-binary" />
      </Model>
    </div>
  )
}
showSample(MySample)
