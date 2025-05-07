// @ts-nocheck
import { useState } from 'react'

export const NestedComponent = () => {
  const [primary, setPrimary] = useState(true)

  const styleOuter = {
    '--xr-back': 121,
    width: '200px',
    height: '78px',

    backgroundColor: 'red',
  }

  const styleInner = {
    backgroundColor: 'blue',
  }

  const styleInner2 = {
    '--xr-back': primary ? 66 : 89,
    backgroundColor: primary ? 'green' : 'grey',
  }

  return (
    <div
      enable-xr
      style={styleOuter}
      debugName="OuterDiv"
      debugShowStandardInstance={false}
      onClick={() => {
        setPrimary(!primary)
      }}
    >
      OuterDiv
      <div
        enable-xr
        style={styleInner}
        debugName="InnerDiv"
        debugShowStandardInstance={false}
      >
        Inner Div!!
      </div>
      <div
        enable-xr
        style={styleInner2}
        debugName="InnerDiv2"
        debugShowStandardInstance={false}
      >
        Inner Div 2!!
      </div>
    </div>
  )
}
