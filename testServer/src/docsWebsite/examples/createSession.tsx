import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  var [supported, setSupported] = useState(false)
  useEffect(() => {
    // CODESAMPLE_START
    let spatial = new Spatial()
    if (spatial.isSupported()) {
      let session = spatial.requestSession()
      setSupported(true)
    }
    // CODESAMPLE_END
  }, [])
  return (
    <div>
      SpatialSession is {supported ? '' : 'not'} supported in this browser
    </div>
  )
}
showSample(MySample)
