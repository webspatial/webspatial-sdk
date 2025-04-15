import { SpatialSession } from '@webspatial/core-sdk'
import { showSample } from './sampleLoader'
import { SpatialDiv } from '@webspatial/react-sdk'

function MySample(_props: { session?: SpatialSession }) {
  return (
    <div className="flex flex-col items-center w-full">
      <SpatialDiv
        spatialStyle={{ position: { z: 50 } }}
        style={{
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1.0), rgba(0,0,0,0))',
        }}
      >
        <img src="https://picsum.photos/200/300" />
      </SpatialDiv>
    </div>
  )
}
showSample(MySample)
