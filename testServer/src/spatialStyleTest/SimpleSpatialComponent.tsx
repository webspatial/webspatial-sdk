import { useState } from 'react'
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }
  const style = isPrimary
    ? {
        // '--xr-back': 60,
        transformOrigin: 'left top',
        // transform: 'rotate3d(0, 0, 1, 30deg)   ',
        transform: 'scaleX(1.5) rotate3d(0, 0, 1, 30deg)  ',

        // transform: 'rotate3d(1, 0, 0, 30deg) ',
        // rotate3d(1, 0, 0, 30deg)

        color: 'blue',
      }
    : {
        '--xr-back': 160,
        color: 'red',
      }

  const style2 = {
    // '--xr-back': 60,
    transformOrigin: 'left top',
    transform: 'rotate3d(0, 0, 1, 30deg) scaleX(3) ',
    // transform: 'scaleX(3) rotate3d(0, 0, 1, 30deg)',

    // transform: 'rotate3d(1, 0, 0, 30deg) ',
    // rotate3d(1, 0, 0, 30deg)

    color: 'red',
  }

  return (
    <div>
      <div enable-xr style={style} onClick={onClick}>
        {' '}
        SimpleSpatialComponent{' '}
      </div>
      <div>what happed!!</div>
      <div enable-xr style={style2} onClick={onClick}>
        {' '}
        SimpleSpatialComponent{' '}
      </div>
    </div>
  )
}
