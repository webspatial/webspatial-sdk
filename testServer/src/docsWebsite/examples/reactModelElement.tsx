import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'
import { Model } from '@xrsdk/react'

function MySample(props: { session?: SpatialSession }) {
  return (
    <div className="flex flex-col items-center w-full">
      <Model className="w-52 h-52 bg-white bg-opacity-25 rounded-xl">
        <source
          src="/src/assets/FlightHelmet.usdz"
          type="model/vnd.usdz+zip"
        ></source>
      </Model>
    </div>
  )
}
showSample(MySample)
