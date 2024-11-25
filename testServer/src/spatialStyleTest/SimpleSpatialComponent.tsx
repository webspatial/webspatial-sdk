import { useState } from 'react'
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }

  const style = isPrimary
    ? {
        '--xr-back': 180,
        width: '200px',
        transform: 'rotate3d(0, 1, 0, -30deg) scale(1.5)',
        color: 'blue',
      }
    : {
        '--xr-back': 10,
        color: 'red',
      }

  const style2 = {
    '--xr-back': 0,
    transformOrigin: 'left top',
    transform: 'rotate3d(0, 1, 0, -30deg)',
    color: 'red',
  }

  return (
    <div className="flex items-center justify-center">
      <div enable-xr style={style} onClick={onClick} debugName="outer">
        Outter SimpleSpatialComponent
        <div enable-xr style={style2} onClick={onClick} debugName="inner">
          Inner SimpleSpatialComponent
        </div>
      </div>
    </div>
  )
}
