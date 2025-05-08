import { useState } from 'react'

export const SpatialTagComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }

  const style1 = isPrimary
    ? {
        '--xr-back': 60,
        color: 'blue',
      }
    : {
        '--xr-back': 160,
        color: 'red',
      }

  const style2 = isPrimary
    ? {
        '--xr-back': 60,
        enableXr: true,
        color: 'blue',
      }
    : {
        '--xr-back': 160,
        enableXr: true,
        color: 'red',
      }

  const style3 = isPrimary
    ? {
        '--xr-back': 60,
        color: 'blue',
      }
    : {
        '--xr-back': 160,
        color: 'red',
      }

  const styleContainer = {
    width: '500px',
  }

  return (
    <div style={styleContainer}>
      <div enable-xr style={style1} onClick={onClick}>
        SpatialTagComponent with enable-xr
      </div>
      <div style={style2} onClick={onClick}>
        SpatialTagComponent with Inline style: enableXr
      </div>
      <div style={style3} className="__enableXr__" onClick={onClick}>
        SpatialTagComponent with - className: "__enableXr__"
      </div>
    </div>
  )
}
