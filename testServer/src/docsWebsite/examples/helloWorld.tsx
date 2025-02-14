import { SpatialSession } from '@xrsdk/runtime'
import { showSample } from './sampleLoader'

function MySample(_props: { session?: SpatialSession }) {
  return <div className="w-full">Hello world</div>
}
showSample(MySample, false)
