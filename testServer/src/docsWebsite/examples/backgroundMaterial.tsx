import { SpatialSession } from '@webspatial/core-sdk'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  var [toggle, setToggle] = useState(true)
  useEffect(() => {
    if (props.session) {
      let session = props.session
      // CODESAMPLE_START
      session
        .getCurrentWindowComponent()
        .setStyle({ material: { type: toggle ? 'translucent' : 'none' } })
      // CODESAMPLE_END
    }
  }, [toggle])
  return (
    <div>
      <div
        className="btn"
        onClick={() => {
          setToggle(!toggle)
        }}
      >
        Toggle Background Material
      </div>
    </div>
  )
}
showSample(MySample)
