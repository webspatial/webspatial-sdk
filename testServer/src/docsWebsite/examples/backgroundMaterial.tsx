import { SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  var [toggle, setToggle] = useState(true)
  useEffect(() => {
    if (props.session) {
      // JS API used here
      props.session
        .getCurrentWindowComponent()
        .setStyle({ transparentEffect: toggle, glassEffect: toggle })
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
