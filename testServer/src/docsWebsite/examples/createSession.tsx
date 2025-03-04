import { Spatial, SpatialSession } from '@webspatial/core-sdk'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(_props: { session?: SpatialSession }) {
  var [supported, setSupported] = useState(false)
  var [versionDisplay, setVersionDisplay] = useState('')

  useEffect(() => {
    // CODESAMPLE_START
    let spatial = new Spatial()
    let versionLog =
      'Client version: ' +
      spatial.getClientVersion() +
      ' Native Version: ' +
      spatial.getNativeVersion()
    setVersionDisplay(versionLog)
    if (spatial.isSupported()) {
      setSupported(true)
    }
    // CODESAMPLE_END
  }, [])
  return (
    <div>
      SpatialSession is {supported ? '' : 'not'} supported in this browser
      <h1>{versionDisplay}</h1>
    </div>
  )
}
showSample(MySample)
