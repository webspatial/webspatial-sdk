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
      onClick={() => {
        setPrimary(!primary)
      }}
    >
      OuterDiv
      <div enable-xr style={styleInner}>
        Inner Div!!
      </div>
      <div enable-xr style={styleInner2}>
        Inner Div 2!!
      </div>
    </div>
  )
}
