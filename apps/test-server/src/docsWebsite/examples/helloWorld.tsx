import { SpatialSession } from '@webspatial/core-sdk'
import { showSample } from './sampleLoader'

function MySample(_props: { session?: SpatialSession }) {
  return <div className="w-full">Hello world</div>
}
showSample(MySample, false)
